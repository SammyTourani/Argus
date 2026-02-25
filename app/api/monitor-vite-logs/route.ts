import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSandbox } from '@/lib/sandbox/registry';

export async function GET() {
  try {
    // Auth — resolve the current user's sandbox
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = getSandbox(user.id);
    const sandbox = entry.sandbox;

    if (!sandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 400 });
    }

    console.log('[monitor-vite-logs] Checking Vite process logs...');

    const errors: any[] = [];

    // Check if there's an error file from previous runs
    try {
      const catResult = await sandbox.runCommand({
        cmd: 'cat',
        args: ['/tmp/vite-errors.json']
      });

      if (catResult.exitCode === 0) {
        const errorFileContent = await catResult.stdout();
        const data = JSON.parse(errorFileContent);
        errors.push(...(data.errors || []));
      }
    } catch {
      // No error file exists, that's OK
    }

    // Look for any Vite-related log files that might contain errors
    try {
      const findResult = await sandbox.runCommand({
        cmd: 'find',
        args: ['/tmp', '-name', '*vite*', '-type', 'f']
      });

      if (findResult.exitCode === 0) {
        const logFiles = (await findResult.stdout()).split('\n').filter((f: string) => f.trim());

        for (const logFile of logFiles.slice(0, 3)) {
          try {
            const grepResult = await sandbox.runCommand({
              cmd: 'grep',
              args: ['-i', 'failed to resolve import', logFile]
            });

            if (grepResult.exitCode === 0) {
              const errorLines = (await grepResult.stdout()).split('\n').filter((line: string) => line.trim());

              for (const line of errorLines) {
                const importMatch = line.match(/"([^"]+)"/);
                if (importMatch) {
                  const importPath = importMatch[1];

                  if (!importPath.startsWith('.')) {
                    let packageName;
                    if (importPath.startsWith('@')) {
                      const parts = importPath.split('/');
                      packageName = parts.length >= 2 ? parts.slice(0, 2).join('/') : importPath;
                    } else {
                      packageName = importPath.split('/')[0];
                    }

                    const errorObj = {
                      type: "npm-missing",
                      package: packageName,
                      message: `Failed to resolve import "${importPath}"`,
                      file: "Unknown"
                    };

                    if (!errors.some(e => e.package === errorObj.package)) {
                      errors.push(errorObj);
                    }
                  }
                }
              }
            }
          } catch {
            // Skip if grep fails
          }
        }
      }
    } catch {
      // No log files found, that's OK
    }

    // Deduplicate errors by package name
    const uniqueErrors: any[] = [];
    const seenPackages = new Set<string>();

    for (const error of errors) {
      if (error.package && !seenPackages.has(error.package)) {
        seenPackages.add(error.package);
        uniqueErrors.push(error);
      }
    }

    return NextResponse.json({
      success: true,
      hasErrors: uniqueErrors.length > 0,
      errors: uniqueErrors
    });

  } catch (error) {
    console.error('[monitor-vite-logs] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
