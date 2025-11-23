import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
  var activeSandbox: any; // Legacy Vercel support
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body to get sandboxId
    const { sandboxId } = await request.json().catch(() => ({}));

    console.log('[create-zip] Request received:', { sandboxId });

    // Get provider using the same pattern as apply-ai-code-stream
    let provider = sandboxId
      ? sandboxManager.getProvider(sandboxId)
      : sandboxManager.getActiveProvider();

    // Fallback to global state if not found in manager
    if (!provider) {
      provider = global.activeSandboxProvider;
      console.log('[create-zip] Using global.activeSandboxProvider as fallback');
    }

    // Fallback to legacy Vercel sandbox for backward compatibility
    const legacySandbox = global.activeSandbox;

    if (!provider && !legacySandbox) {
      console.error('[create-zip] No provider found');
      console.error('[create-zip] Debug info:', {
        receivedSandboxId: sandboxId,
        hasActiveSandboxProvider: !!global.activeSandboxProvider,
        hasLegacySandbox: !!global.activeSandbox,
        sandboxManagerInfo: {
          hasGetProvider: typeof sandboxManager.getProvider === 'function',
          hasGetActiveProvider: typeof sandboxManager.getActiveProvider === 'function'
        }
      });

      return NextResponse.json({
        success: false,
        error: 'No active sandbox. Please ensure the sandbox is created before downloading the zip file.'
      }, { status: 400 });
    }

    console.log('[create-zip] Creating project zip...');

    let base64Content: string;
    let fileName: string;

    if (provider) {
      // Use provider pattern (works for both E2B and Vercel)
      const sandboxInfo = provider.getSandboxInfo();
      fileName = sandboxInfo?.provider === 'e2b'
        ? 'e2b-sandbox-project.zip'
        : 'vercel-sandbox-project.zip';

      console.log('[create-zip] Using provider:', sandboxInfo?.provider);

      // Create zip file - provider.runCommand handles both E2B and Vercel
      const zipCommand = `cd /home/user/app && zip -r /tmp/project.zip . -x "node_modules/*" ".git/*" ".next/*" "dist/*" "build/*" "*.log" 2>&1 || cd /vercel/sandbox && zip -r /tmp/project.zip . -x "node_modules/*" ".git/*" ".next/*" "dist/*" "build/*" "*.log" 2>&1`;

      console.log('[create-zip] Running zip command...');
      const zipResult = await provider.runCommand(zipCommand);

      if (!zipResult.success || zipResult.exitCode !== 0) {
        console.error('[create-zip] Zip command failed:', {
          exitCode: zipResult.exitCode,
          stdout: zipResult.stdout,
          stderr: zipResult.stderr
        });
        throw new Error(`Failed to create zip: ${zipResult.stderr || zipResult.stdout}`);
      }

      console.log('[create-zip] Zip file created successfully');

      // Read the zip file and convert to base64
      if (sandboxInfo?.provider === 'e2b') {
        // E2B: Use Python to read binary file as base64
        console.log('[create-zip] Reading zip file with Python (E2B)...');

        // Create a Python script file for better reliability
        const pythonScript = `import base64
import sys
try:
    with open('/tmp/project.zip', 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
        sys.stdout.write(data)
except Exception as e:
    sys.stderr.write(f"Error: {str(e)}")
    sys.exit(1)`;

        // Write Python script to temp file
        await provider.writeFile('/tmp/read_zip.py', pythonScript);

        // Execute the script
        const readResult = await provider.runCommand('python3 /tmp/read_zip.py');

        // Clean up the script
        await provider.runCommand('rm -f /tmp/read_zip.py');

        if (!readResult.success || readResult.exitCode !== 0) {
          console.error('[create-zip] Failed to read zip file:', {
            exitCode: readResult.exitCode,
            stdout: readResult.stdout?.substring(0, 200),
            stderr: readResult.stderr
          });
          throw new Error(`Failed to read zip file: ${readResult.stderr || readResult.stdout}`);
        }

        // The stdout should now be pure base64
        base64Content = readResult.stdout.trim();

        // Validate base64 content
        if (!base64Content || base64Content.length < 100) {
          console.error('[create-zip] Base64 content seems invalid:', {
            length: base64Content?.length,
            preview: base64Content?.substring(0, 50)
          });
          throw new Error('Generated base64 content is invalid or too short');
        }

        console.log('[create-zip] Successfully read zip file as base64:', {
          size: Math.round(base64Content.length * 0.75),
          base64Length: base64Content.length
        });
      } else {
        // Vercel: Use base64 command
        console.log('[create-zip] Reading zip file with base64 (Vercel)...');
        const readCommand = `base64 /tmp/project.zip`;
        const readResult = await provider.runCommand(readCommand);

        if (!readResult.success) {
          throw new Error(`Failed to read zip file: ${readResult.stderr}`);
        }

        base64Content = readResult.stdout.trim();
      }
    } else {
      // Legacy Vercel sandbox support
      fileName = 'vercel-sandbox-project.zip';

      console.log('[create-zip] Using legacy Vercel sandbox');

      const zipResult = await legacySandbox.runCommand({
        cmd: 'bash',
        args: ['-c', `zip -r /tmp/project.zip . -x "node_modules/*" ".git/*" ".next/*" "dist/*" "build/*" "*.log"`]
      });

      if (zipResult.exitCode !== 0) {
        const error = await zipResult.stderr();
        throw new Error(`Failed to create zip: ${error}`);
      }

      const readResult = await legacySandbox.runCommand({
        cmd: 'base64',
        args: ['/tmp/project.zip']
      });

      if (readResult.exitCode !== 0) {
        const error = await readResult.stderr();
        throw new Error(`Failed to read zip file: ${error}`);
      }

      base64Content = (await readResult.stdout()).trim();
    }

    // Create a data URL for download
    const dataUrl = `data:application/zip;base64,${base64Content}`;

    const fileSizeBytes = Math.round(base64Content.length * 0.75);
    const fileSizeKB = Math.round(fileSizeBytes / 1024);
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    console.log(`[create-zip] Created ${fileName} (${fileSizeMB} MB / ${fileSizeKB} KB)`);

    return NextResponse.json({
      success: true,
      dataUrl,
      fileName,
      size: fileSizeBytes,
      message: 'Zip file created successfully'
    });

  } catch (error) {
    console.error('[create-zip] Error:', error);
    console.error('[create-zip] Error stack:', (error as Error).stack);

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}