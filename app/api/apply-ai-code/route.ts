import { NextRequest, NextResponse } from 'next/server';
import { parseMorphEdits, applyMorphEditToFile } from '@/lib/morph-fast-apply';
import { createClient } from '@/lib/supabase/server';
import { getSandbox } from '@/lib/sandbox/registry';
import { parseGeneratedFiles } from '@/lib/ai/parse-files';
import { getConversationState } from '@/lib/conversation/per-user-state';

interface ParsedResponse {
  explanation: string;
  template: string;
  files: Array<{ path: string; content: string }>;
  packages: string[];
  commands: string[];
  structure: string | null;
}

function parseAIResponse(response: string): ParsedResponse {
  const sections = {
    files: [] as Array<{ path: string; content: string }>,
    commands: [] as string[],
    packages: [] as string[],
    structure: null as string | null,
    explanation: '',
    template: ''
  };

  // Use the robust file parser
  sections.files = parseGeneratedFiles(response);

  // Parse commands
  const cmdRegex = /<command>(.*?)<\/command>/g;
  let match;
  while ((match = cmdRegex.exec(response)) !== null) {
    sections.commands.push(match[1].trim());
  }

  // Parse packages - support both <package> and <packages> tags
  const pkgRegex = /<package>(.*?)<\/package>/g;
  while ((match = pkgRegex.exec(response)) !== null) {
    sections.packages.push(match[1].trim());
  }

  // Also parse <packages> tag with multiple packages
  const packagesRegex = /<packages>([\s\S]*?)<\/packages>/;
  const packagesMatch = response.match(packagesRegex);
  if (packagesMatch) {
    const packagesContent = packagesMatch[1].trim();
    const packagesList = packagesContent.split(/[\n,]+/)
      .map(pkg => pkg.trim())
      .filter(pkg => pkg.length > 0);
    sections.packages.push(...packagesList);
  }

  // Parse structure
  const structureMatch = /<structure>([\s\S]*?)<\/structure>/;
  const structResult = response.match(structureMatch);
  if (structResult) {
    sections.structure = structResult[1].trim();
  }

  // Parse explanation
  const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/;
  const explResult = response.match(explanationMatch);
  if (explResult) {
    sections.explanation = explResult[1].trim();
  }

  // Parse template
  const templateMatch = /<template>(.*?)<\/template>/;
  const templResult = response.match(templateMatch);
  if (templResult) {
    sections.template = templResult[1].trim();
  }

  return sections;
}

export async function POST(request: NextRequest) {
  try {
    // Auth — resolve user's sandbox
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = getSandbox(user.id);

    const { response, isEdit = false, packages = [] } = await request.json();

    if (!response) {
      return NextResponse.json({
        error: 'response is required'
      }, { status: 400 });
    }

    // Parse the AI response
    const parsed = parseAIResponse(response);
    const morphEnabled = Boolean(isEdit && process.env.MORPH_API_KEY);
    const morphEdits = morphEnabled ? parseMorphEdits(response) : [];
    console.log('[apply-ai-code] Morph Fast Apply mode:', morphEnabled);
    if (morphEnabled) {
      console.log('[apply-ai-code] Morph edits found:', morphEdits.length);
    }

    // Get the active sandbox or provider for this user
    const sandbox = entry.sandbox || entry.provider;

    // If no active sandbox, just return parsed results
    if (!sandbox) {
      return NextResponse.json({
        success: true,
        results: {
          filesCreated: parsed.files.map(f => f.path),
          packagesInstalled: parsed.packages,
          commandsExecuted: parsed.commands,
          errors: []
        },
        explanation: parsed.explanation,
        structure: parsed.structure,
        parsedFiles: parsed.files,
        message: `Parsed ${parsed.files.length} files successfully. Create a sandbox to apply them.`
      });
    }

    // Verify sandbox is ready before applying code
    console.log('[apply-ai-code] Verifying sandbox is ready...');

    // For Vercel sandboxes, check if Vite is running
    if (sandbox.constructor?.name === 'VercelProvider' || sandbox.getSandboxInfo?.()?.provider === 'vercel') {
      console.log('[apply-ai-code] Detected Vercel sandbox, checking Vite status...');
      try {
        const checkResult = await sandbox.runCommand('pgrep -f vite');
        if (!checkResult || !checkResult.stdout) {
          console.log('[apply-ai-code] Vite not running, starting it...');
          await sandbox.runCommand('sh -c "cd /vercel/sandbox && nohup npm run dev > /tmp/vite.log 2>&1 &"');
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.log('[apply-ai-code] Vite started, proceeding with code application');
        } else {
          console.log('[apply-ai-code] Vite is already running');
        }
      } catch (e) {
        console.log('[apply-ai-code] Could not check Vite status, proceeding anyway:', e);
      }
    }

    // Apply to active sandbox
    console.log('[apply-ai-code] Applying code to sandbox...');
    console.log('[apply-ai-code] Is edit mode:', isEdit);
    console.log('[apply-ai-code] Files to write:', parsed.files.map(f => f.path));
    console.log('[apply-ai-code] Existing files:', Array.from(entry.existingFiles));
    if (morphEnabled) {
      console.log('[apply-ai-code] Morph Fast Apply enabled');
      if (morphEdits.length > 0) {
        console.log('[apply-ai-code] Parsed Morph edits:', morphEdits.map(e => e.targetFile));
      } else {
        console.log('[apply-ai-code] No <edit> blocks found in response');
      }
    }

    const results = {
      filesCreated: [] as string[],
      filesUpdated: [] as string[],
      packagesInstalled: [] as string[],
      packagesAlreadyInstalled: [] as string[],
      packagesFailed: [] as string[],
      commandsExecuted: [] as string[],
      errors: [] as string[]
    };

    // Combine packages from tool calls and parsed XML tags
    const allPackages = [...packages.filter((pkg: any) => pkg && typeof pkg === 'string'), ...parsed.packages];
    const uniquePackages = [...new Set(allPackages)];

    if (uniquePackages.length > 0) {
      console.log('[apply-ai-code] Installing packages from XML tags and tool calls:', uniquePackages);

      try {
        const installResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/install-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: uniquePackages })
        });

        if (installResponse.ok) {
          const installResult = await installResponse.json();
          console.log('[apply-ai-code] Package installation result:', installResult);

          if (installResult.installed && installResult.installed.length > 0) {
            results.packagesInstalled = installResult.installed;
          }
          if (installResult.failed && installResult.failed.length > 0) {
            results.packagesFailed = installResult.failed;
          }
        }
      } catch (error) {
        console.error('[apply-ai-code] Error installing packages:', error);
      }
    } else {
      // Fallback to detecting packages from code
      console.log('[apply-ai-code] No packages provided, detecting from generated code...');
      console.log('[apply-ai-code] Number of files to scan:', parsed.files.length);

      const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
      const filteredFilesForDetection = parsed.files.filter(file => {
        const fileName = file.path.split('/').pop() || '';
        return !configFiles.includes(fileName);
      });

      const filesForPackageDetection: Record<string, string> = {};
      for (const file of filteredFilesForDetection) {
        filesForPackageDetection[file.path] = file.content;
        if (file.content.includes('heroicons')) {
          console.log(`[apply-ai-code] Found heroicons import in ${file.path}`);
        }
      }

      try {
        console.log('[apply-ai-code] Calling detect-and-install-packages...');
        const packageResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/detect-and-install-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: filesForPackageDetection })
        });

        console.log('[apply-ai-code] Package detection response status:', packageResponse.status);

        if (packageResponse.ok) {
          const packageResult = await packageResponse.json();
          console.log('[apply-ai-code] Package installation result:', JSON.stringify(packageResult, null, 2));

          if (packageResult.packagesInstalled && packageResult.packagesInstalled.length > 0) {
            results.packagesInstalled = packageResult.packagesInstalled;
            console.log(`[apply-ai-code] Installed packages: ${packageResult.packagesInstalled.join(', ')}`);
          }

          if (packageResult.packagesAlreadyInstalled && packageResult.packagesAlreadyInstalled.length > 0) {
            results.packagesAlreadyInstalled = packageResult.packagesAlreadyInstalled;
            console.log(`[apply-ai-code] Already installed: ${packageResult.packagesAlreadyInstalled.join(', ')}`);
          }

          if (packageResult.packagesFailed && packageResult.packagesFailed.length > 0) {
            results.packagesFailed = packageResult.packagesFailed;
            console.error(`[apply-ai-code] Failed to install packages: ${packageResult.packagesFailed.join(', ')}`);
            results.errors.push(`Failed to install packages: ${packageResult.packagesFailed.join(', ')}`);
          }

          // Force Vite restart after package installation
          if (results.packagesInstalled.length > 0) {
            console.log('[apply-ai-code] Packages were installed, forcing Vite restart...');

            try {
              const restartResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/restart-vite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              if (restartResponse.ok) {
                const restartResult = await restartResponse.json();
                console.log('[apply-ai-code] Vite restart result:', restartResult.message);
              } else {
                console.error('[apply-ai-code] Failed to restart Vite:', await restartResponse.text());
              }
            } catch (e) {
              console.error('[apply-ai-code] Error calling restart-vite:', e);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.error('[apply-ai-code] Package detection/installation failed:', await packageResponse.text());
        }
      } catch (error) {
        console.error('[apply-ai-code] Error detecting/installing packages:', error);
      }
    }

    // Attempt Morph Fast Apply for edits before file creation
    const morphUpdatedPaths = new Set<string>();

    if (morphEnabled && morphEdits.length > 0) {
      if (!entry.sandbox) {
        console.warn('[apply-ai-code] Morph edits found but no active sandbox; skipping Morph application');
      } else {
        console.log(`[apply-ai-code] Applying ${morphEdits.length} fast edits via Morph...`);
        for (const edit of morphEdits) {
          try {
            const result = await applyMorphEditToFile({
              sandbox: entry.sandbox,
              targetPath: edit.targetFile,
              instructions: edit.instructions,
              updateSnippet: edit.update
            });

            if (result.success && result.normalizedPath) {
              morphUpdatedPaths.add(result.normalizedPath);
              results.filesUpdated.push(result.normalizedPath);
              console.log('[apply-ai-code] Morph applied to', result.normalizedPath);
            } else {
              const msg = result.error || 'Unknown Morph error';
              console.error('[apply-ai-code] Morph apply failed:', msg);
              results.errors.push(`Morph apply failed for ${edit.targetFile}: ${msg}`);
            }
          } catch (e) {
            console.error('[apply-ai-code] Morph apply exception:', e);
            results.errors.push(`Morph apply exception for ${edit.targetFile}: ${(e as Error).message}`);
          }
        }
      }
    }
    if (morphEnabled && morphEdits.length === 0) {
      console.warn('[apply-ai-code] Morph enabled but no <edit> blocks found; falling back to full-file flow');
    }

    // Filter out config files that shouldn't be created
    const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
    let filteredFiles = parsed.files.filter(file => {
      const fileName = file.path.split('/').pop() || '';
      if (configFiles.includes(fileName)) {
        console.warn(`[apply-ai-code] Skipping config file: ${file.path} - already exists in template`);
        return false;
      }
      return true;
    });

    // Avoid overwriting files already updated by Morph
    if (morphUpdatedPaths.size > 0) {
      filteredFiles = filteredFiles.filter(file => {
        let normalizedPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
        const fileName = normalizedPath.split('/').pop() || '';
        if (!normalizedPath.startsWith('src/') &&
            !normalizedPath.startsWith('public/') &&
            normalizedPath !== 'index.html' &&
            !configFiles.includes(fileName)) {
          normalizedPath = 'src/' + normalizedPath;
        }
        return !morphUpdatedPaths.has(normalizedPath);
      });
    }

    // Create or update files AFTER package installation
    for (const file of filteredFiles) {
      try {
        let normalizedPath = file.path;
        if (normalizedPath.startsWith('/')) {
          normalizedPath = normalizedPath.substring(1);
        }
        if (!normalizedPath.startsWith('src/') &&
            !normalizedPath.startsWith('public/') &&
            normalizedPath !== 'index.html' &&
            normalizedPath !== 'package.json' &&
            normalizedPath !== 'vite.config.js' &&
            normalizedPath !== 'tailwind.config.js' &&
            normalizedPath !== 'postcss.config.js') {
          normalizedPath = 'src/' + normalizedPath;
        }

        const fullPath = `/home/user/app/${normalizedPath}`;
        const isUpdate = entry.existingFiles.has(normalizedPath);

        let fileContent = file.content;
        if (file.path.endsWith('.jsx') || file.path.endsWith('.js') || file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
          fileContent = fileContent.replace(/import\s+['"]\.\/[^'"]+\.css['"];?\s*\n?/g, '');
        }

        if (file.path.endsWith('.css')) {
          fileContent = fileContent.replace(/shadow-3xl/g, 'shadow-2xl');
          fileContent = fileContent.replace(/shadow-4xl/g, 'shadow-2xl');
          fileContent = fileContent.replace(/shadow-5xl/g, 'shadow-2xl');
        }

        console.log(`[apply-ai-code] Writing file: ${fullPath}`);

        try {
          if (sandbox.writeFile) {
            await sandbox.writeFile(file.path, fileContent);
          } else if (sandbox.files?.write) {
            await sandbox.files.write(fullPath, fileContent);
          } else {
            throw new Error('Unsupported sandbox type');
          }
          console.log(`[apply-ai-code] Successfully wrote file: ${fullPath}`);

          if (entry.sandboxState?.fileCache) {
            entry.sandboxState.fileCache.files[normalizedPath] = {
              content: fileContent,
              lastModified: Date.now()
            };
          }

        } catch (writeError) {
          console.error(`[apply-ai-code] File write error:`, writeError);
          throw writeError as Error;
        }

        if (isUpdate) {
          results.filesUpdated.push(normalizedPath);
        } else {
          results.filesCreated.push(normalizedPath);
          entry.existingFiles.add(normalizedPath);
        }
      } catch (error) {
        results.errors.push(`Failed to create ${file.path}: ${(error as Error).message}`);
      }
    }

    // Only create App.jsx if it's not an edit and doesn't exist
    const appFileInParsed = parsed.files.some(f => {
      const normalized = f.path.replace(/^\//, '').replace(/^src\//, '');
      return normalized === 'App.jsx' || normalized === 'App.tsx';
    });

    const appFileExists = entry.existingFiles.has('src/App.jsx') ||
                         entry.existingFiles.has('src/App.tsx') ||
                         entry.existingFiles.has('App.jsx') ||
                         entry.existingFiles.has('App.tsx');

    if (!isEdit && !appFileInParsed && !appFileExists && parsed.files.length > 0) {
      const componentFiles = parsed.files.filter(f =>
        (f.path.endsWith('.jsx') || f.path.endsWith('.tsx')) &&
        f.path.includes('component')
      );

      const imports = componentFiles
        .filter(f => !f.path.includes('App.') && !f.path.includes('main.') && !f.path.includes('index.'))
        .map(f => {
          const pathParts = f.path.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const componentName = fileName.replace(/\.(jsx|tsx)$/, '');
          const importPath = f.path.startsWith('src/')
            ? f.path.replace('src/', './').replace(/\.(jsx|tsx)$/, '')
            : './' + f.path.replace(/\.(jsx|tsx)$/, '');
          return `import ${componentName} from '${importPath}';`;
        })
        .join('\n');

      const mainComponent = componentFiles.find(f => {
        const name = f.path.toLowerCase();
        return name.includes('header') ||
               name.includes('hero') ||
               name.includes('layout') ||
               name.includes('main') ||
               name.includes('home');
      }) || componentFiles[0];

      const mainComponentName = mainComponent
        ? mainComponent.path.split('/').pop()?.replace(/\.(jsx|tsx)$/, '')
        : null;

      const appContent = `import React from 'react';
${imports}

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      ${mainComponentName ? `<${mainComponentName} />` : '<div className="text-center">\n        <h1 className="text-4xl font-bold mb-4">Welcome to your React App</h1>\n        <p className="text-gray-400">Your components have been created but need to be added here.</p>\n      </div>'}
      {/* Generated components: ${componentFiles.map(f => f.path).join(', ')} */}
    </div>
  );
}

export default App;`;

      try {
        if (sandbox.writeFile) {
          await sandbox.writeFile('src/App.jsx', appContent);
        } else if (sandbox.writeFiles) {
          await sandbox.writeFiles([{
            path: 'src/App.jsx',
            content: Buffer.from(appContent)
          }]);
        }

        console.log('Auto-generated: src/App.jsx');
        results.filesCreated.push('src/App.jsx (auto-generated)');
      } catch (error) {
        results.errors.push(`Failed to create App.jsx: ${(error as Error).message}`);
      }

      const indexCssInParsed = parsed.files.some(f => {
        const normalized = f.path.replace(/^\//, '').replace(/^src\//, '');
        return normalized === 'index.css' || f.path === 'src/index.css';
      });

      const indexCssExists = entry.existingFiles.has('src/index.css') ||
                            entry.existingFiles.has('index.css');

      if (!isEdit && !indexCssInParsed && !indexCssExists) {
        try {
          const indexCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;

  color: rgba(255, 255, 255, 0.87);
  background-color: #0a0a0a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}`;

          if (sandbox.writeFile) {
            await sandbox.writeFile('src/index.css', indexCssContent);
          } else if (sandbox.writeFiles) {
            await sandbox.writeFiles([{
              path: 'src/index.css',
              content: Buffer.from(indexCssContent)
            }]);
          }

          console.log('Auto-generated: src/index.css');
          results.filesCreated.push('src/index.css (with Tailwind)');
        } catch (error) {
          console.error('Failed to create index.css:', error);
          results.errors.push('Failed to create index.css with Tailwind');
        }
      }
    }

    // Execute commands
    for (const cmd of parsed.commands) {
      try {
        const commandParts = cmd.trim().split(/\s+/);
        const cmdName = commandParts[0];
        const args = commandParts.slice(1);

        let result;
        if (sandbox.runCommand && typeof sandbox.runCommand === 'function') {
          const testResult = await sandbox.runCommand(cmd);
          if (testResult && typeof testResult === 'object' && 'stdout' in testResult) {
            result = testResult;
          } else {
            result = await sandbox.runCommand({
              cmd: cmdName,
              args
            });
          }
        }

        console.log(`Executed: ${cmd}`);

        let stdout = '';
        let stderr = '';

        if (result) {
          if (typeof result.stdout === 'string') {
            stdout = result.stdout;
            stderr = result.stderr || '';
          } else if (typeof result.stdout === 'function') {
            stdout = await result.stdout();
            stderr = await result.stderr();
          }
        }

        if (stdout) console.log(stdout);
        if (stderr) console.log(`Errors: ${stderr}`);

        results.commandsExecuted.push(cmd);
      } catch (error) {
        results.errors.push(`Failed to execute ${cmd}: ${(error as Error).message}`);
      }
    }

    // Check for missing imports in App.jsx
    const missingImports: string[] = [];
    const appFile = parsed.files.find(f =>
      f.path === 'src/App.jsx' || f.path === 'App.jsx'
    );

    if (appFile) {
      const importRegex = /import\s+(?:\w+|\{[^}]+\})\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      const appImports: string[] = [];

      while ((match = importRegex.exec(appFile.content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          appImports.push(importPath);
        }
      }

      for (const imp of appImports) {
        if (imp.endsWith('.css')) continue;

        const basePath = imp.replace('./', 'src/');
        const possiblePaths = [
          basePath + '.jsx',
          basePath + '.js',
          basePath + '/index.jsx',
          basePath + '/index.js'
        ];

        const fileExists = parsed.files.some(f =>
          possiblePaths.some(path => f.path === path)
        );

        if (!fileExists) {
          missingImports.push(imp);
        }
      }
    }

    // Prepare response
    const responseData: any = {
      success: true,
      results,
      explanation: parsed.explanation,
      structure: parsed.structure,
      message: `Applied ${results.filesCreated.length} files successfully`
    };

    // Handle missing imports automatically
    if (missingImports.length > 0) {
      console.warn('[apply-ai-code] Missing imports detected:', missingImports);

      try {
        console.log('[apply-ai-code] Auto-generating missing components...');

        const autoCompleteResponse = await fetch(
          `${request.nextUrl.origin}/api/auto-complete-components`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              missingImports,
              model: 'claude-sonnet-4-20250514'
            })
          }
        );

        const autoCompleteData = await autoCompleteResponse.json();

        if (autoCompleteData.success) {
          responseData.autoCompleted = true;
          responseData.autoCompletedComponents = autoCompleteData.components;
          responseData.message = `Applied ${results.filesCreated.length} files + auto-generated ${autoCompleteData.files} missing components`;

          results.filesCreated.push(...autoCompleteData.components);
        } else {
          responseData.warning = `Missing ${missingImports.length} imported components: ${missingImports.join(', ')}`;
          responseData.missingImports = missingImports;
        }
      } catch (error) {
        console.error('[apply-ai-code] Auto-complete failed:', error);
        responseData.warning = `Missing ${missingImports.length} imported components: ${missingImports.join(', ')}`;
        responseData.missingImports = missingImports;
      }
    }

    // Track applied files in per-user conversation state
    if (results.filesCreated.length > 0) {
      const convState = getConversationState(user.id);
      const messages = convState.context.messages;
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          lastMessage.metadata = {
            ...lastMessage.metadata,
            editedFiles: results.filesCreated
          };
        }
      }

      if (convState.context.projectEvolution) {
        convState.context.projectEvolution.majorChanges.push({
          timestamp: Date.now(),
          description: parsed.explanation || 'Code applied',
          filesAffected: results.filesCreated
        });
      }

      convState.lastUpdated = Date.now();

      console.log('[apply-ai-code] Updated conversation state with applied files:', results.filesCreated);
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Apply AI code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse AI code' },
      { status: 500 }
    );
  }
}
