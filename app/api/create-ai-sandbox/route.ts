import { NextResponse } from 'next/server';
import { Sandbox } from '@vercel/sandbox';
import { appConfig } from '@/config/app.config';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';
import { getSandbox, setSandbox, cleanupStale } from '@/lib/sandbox/registry';

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, '30 d'),
    })
  : null;

async function getUserTier(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single();
  return data?.subscription_status || 'free';
}

export async function POST(request: Request) {
  // Auth — require authenticated user for sandbox isolation
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Rate limiting for free users
  if (ratelimit) {
    const tier = await getUserTier(userId);
    if (tier === 'free') {
      const { success } = await ratelimit.limit(userId);
      if (!success) {
        return NextResponse.json(
          { error: 'Monthly build limit reached. Upgrade to Pro for unlimited builds.' },
          { status: 429 }
        );
      }
    }
  }

  // Log build start
  try {
    const supabase = await createClient();
    let body: any = {};
    try { body = await request.clone().json(); } catch {}
    await supabase.from('project_builds').insert({
      created_by: userId,
      input_url: body.url || null,
      input_prompt: body.prompt || null,
      style: body.style || null,
      model: body.model || null,
      status: 'generating',
    });
  } catch (e) {
    console.error('[create-ai-sandbox] Failed to log build:', e);
  }

  // Get or initialise this user's sandbox entry
  const entry = getSandbox(userId);

  // Check if sandbox creation is already in progress for this user
  if (entry.creationInProgress && entry.creationPromise) {
    console.log(`[create-ai-sandbox] Sandbox creation already in progress for user ${userId}, waiting...`);
    try {
      const existingResult = await entry.creationPromise;
      console.log('[create-ai-sandbox] Returning existing sandbox creation result');
      return NextResponse.json(existingResult);
    } catch (error) {
      console.error('[create-ai-sandbox] Existing sandbox creation failed:', error);
      // Continue with new creation if the existing one failed
    }
  }

  // Check if we already have an active sandbox for this user
  if (entry.sandbox && entry.sandboxData) {
    console.log(`[create-ai-sandbox] Returning existing active sandbox for user ${userId}`);
    return NextResponse.json({
      success: true,
      sandboxId: entry.sandboxData.sandboxId,
      url: entry.sandboxData.url
    });
  }

  // Set the creation flag
  entry.creationInProgress = true;

  // Create the promise that other requests can await
  entry.creationPromise = createSandboxInternal(userId);

  try {
    const result = await entry.creationPromise;
    return NextResponse.json(result);
  } catch (error) {
    console.error('[create-ai-sandbox] Sandbox creation failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create sandbox',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    entry.creationInProgress = false;
    entry.creationPromise = null;
    // Housekeeping: remove stale entries from other users
    cleanupStale();
  }
}

async function createSandboxInternal(userId: string) {
  let sandbox: any = null;
  const entry = getSandbox(userId);

  try {
    console.log(`[create-ai-sandbox] Creating Vercel sandbox for user ${userId}...`);

    // Kill existing sandbox for this user if any
    if (entry.sandbox) {
      console.log('[create-ai-sandbox] Stopping existing sandbox...');
      try {
        await entry.sandbox.stop();
      } catch (e) {
        console.error('Failed to stop existing sandbox:', e);
      }
      entry.sandbox = null;
      entry.sandboxData = null;
    }

    // Clear existing files tracking
    entry.existingFiles.clear();

    // Create Vercel sandbox with flexible authentication
    console.log(`[create-ai-sandbox] Creating Vercel sandbox with ${appConfig.vercelSandbox.timeoutMinutes} minute timeout...`);

    // Prepare sandbox configuration
    const sandboxConfig: any = {
      timeout: appConfig.vercelSandbox.timeoutMs,
      runtime: appConfig.vercelSandbox.runtime,
      ports: [appConfig.vercelSandbox.devPort]
    };

    // Add authentication parameters if using personal access token
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
      console.log('[create-ai-sandbox] Using personal access token authentication');
      sandboxConfig.teamId = process.env.VERCEL_TEAM_ID;
      sandboxConfig.projectId = process.env.VERCEL_PROJECT_ID;
      sandboxConfig.token = process.env.VERCEL_TOKEN;
    } else if (process.env.VERCEL_OIDC_TOKEN) {
      console.log('[create-ai-sandbox] Using OIDC token authentication');
    } else {
      console.log('[create-ai-sandbox] No authentication found - relying on default Vercel authentication');
    }

    // Timeout sandbox creation at 30 seconds
    const creationTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sandbox creation timed out after 30 seconds')), 30_000)
    );
    sandbox = await Promise.race([Sandbox.create(sandboxConfig), creationTimeout]);

    const sandboxId = sandbox.sandboxId;
    console.log(`[create-ai-sandbox] Sandbox created: ${sandboxId}`);

    // Set up a basic Vite React app
    console.log('[create-ai-sandbox] Setting up Vite React app...');

    // First, change to the working directory
    await sandbox.runCommand('pwd');

    // Get the sandbox URL using the correct Vercel Sandbox API
    const sandboxUrl = sandbox.domain(appConfig.vercelSandbox.devPort);

    // Extract the hostname from the sandbox URL for Vite config
    const sandboxHostname = new URL(sandboxUrl).hostname;
    console.log(`[create-ai-sandbox] Sandbox hostname: ${sandboxHostname}`);

    // Create the Vite config content with the proper hostname (using string concatenation)
    const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel Sandbox compatible Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: ${appConfig.vercelSandbox.devPort},
    strictPort: true,
    hmr: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '` + sandboxHostname + `', // Allow the Vercel Sandbox domain
      '.vercel.run', // Allow all Vercel sandbox domains
      '.vercel-sandbox.dev' // Fallback pattern
    ]
  }
})`;

    // Create the project files (now we have the sandbox hostname)
    const projectFiles = [
      {
        path: 'package.json',
        content: Buffer.from(JSON.stringify({
          "name": "sandbox-app",
          "version": "1.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite --host --port 3000",
            "build": "vite build",
            "preview": "vite preview"
          },
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          "devDependencies": {
            "@vitejs/plugin-react": "^4.0.0",
            "vite": "^4.3.9",
            "tailwindcss": "^3.3.0",
            "postcss": "^8.4.31",
            "autoprefixer": "^10.4.16"
          }
        }, null, 2))
      },
      {
        path: 'vite.config.js',
        content: Buffer.from(viteConfigContent)
      },
      {
        path: 'tailwind.config.js',
        content: Buffer.from(`/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`)
      },
      {
        path: 'postcss.config.js',
        content: Buffer.from(`export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`)
      },
      {
        path: 'index.html',
        content: Buffer.from(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`)
      },
      {
        path: 'src/main.jsx',
        content: Buffer.from(`import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`)
      },
      {
        path: 'src/App.jsx',
        content: Buffer.from(`function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Sandbox Ready
        </h1>
        <p className="text-lg text-gray-400">
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App`)
      },
      {
        path: 'src/index.css',
        content: Buffer.from(`@tailwind base;
@tailwind components;
@tailwind utilities;

/* Force Tailwind to load */
@layer base {
  :root {
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}`)
      }
    ];

    // Create directory structure first
    await sandbox.runCommand({
      cmd: 'mkdir',
      args: ['-p', 'src']
    });

    // Write all files
    await sandbox.writeFiles(projectFiles);
    console.log('[create-ai-sandbox] Project files created');

    // Install dependencies
    console.log('[create-ai-sandbox] Installing dependencies...');
    const installResult = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '--loglevel', 'info']
    });
    if (installResult.exitCode === 0) {
      console.log('[create-ai-sandbox] Dependencies installed successfully');
    } else {
      console.log('[create-ai-sandbox] Warning: npm install had issues but continuing...');
    }

    // Start Vite dev server in detached mode
    console.log('[create-ai-sandbox] Starting Vite dev server...');
    const viteProcess = await sandbox.runCommand({
      cmd: 'npm',
      args: ['run', 'dev'],
      detached: true
    });

    console.log('[create-ai-sandbox] Vite dev server started');

    // Wait for Vite to be fully ready
    await new Promise(resolve => setTimeout(resolve, appConfig.vercelSandbox.devServerStartupDelay));

    // Store sandbox in the per-user registry
    setSandbox(userId, {
      sandbox,
      sandboxData: {
        sandboxId,
        url: sandboxUrl,
        viteProcess,
      },
      sandboxState: {
        fileCache: {
          files: {},
          lastSync: Date.now(),
          sandboxId,
        },
        sandbox,
        sandboxData: {
          sandboxId,
          url: sandboxUrl,
        },
      },
    });

    // Track initial files
    const userEntry = getSandbox(userId);
    userEntry.existingFiles.add('src/App.jsx');
    userEntry.existingFiles.add('src/main.jsx');
    userEntry.existingFiles.add('src/index.css');
    userEntry.existingFiles.add('index.html');
    userEntry.existingFiles.add('package.json');
    userEntry.existingFiles.add('vite.config.js');
    userEntry.existingFiles.add('tailwind.config.js');
    userEntry.existingFiles.add('postcss.config.js');

    console.log('[create-ai-sandbox] Sandbox ready at:', sandboxUrl);

    const result = {
      success: true,
      sandboxId,
      url: sandboxUrl,
      message: 'Vercel sandbox created and Vite React app initialized'
    };

    // Update sandboxData with result info
    setSandbox(userId, {
      sandboxData: {
        ...userEntry.sandboxData,
        ...result,
      },
    });

    return result;

  } catch (error) {
    console.error('[create-ai-sandbox] Error:', error);

    // Clean up on error
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch (e) {
        console.error('Failed to stop sandbox on error:', e);
      }
    }

    // Clear user's sandbox state on error
    setSandbox(userId, {
      sandbox: null,
      sandboxData: null,
    });

    throw error; // Throw to be caught by the outer handler
  }
}
