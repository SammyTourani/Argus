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

    console.log('[sandbox-logs] Fetching Vite dev server logs...');

    // Check if Vite processes are running
    const psResult = await sandbox.runCommand({
      cmd: 'ps',
      args: ['aux']
    });

    let viteRunning = false;
    const logContent: string[] = [];

    if (psResult.exitCode === 0) {
      const psOutput = await psResult.stdout();
      const viteProcesses = psOutput.split('\n').filter((line: string) =>
        line.toLowerCase().includes('vite') ||
        line.toLowerCase().includes('npm run dev')
      );

      viteRunning = viteProcesses.length > 0;

      if (viteRunning) {
        logContent.push("Vite is running");
        logContent.push(...viteProcesses.slice(0, 3));
      } else {
        logContent.push("Vite process not found");
      }
    }

    // Try to read any recent log files
    try {
      const findResult = await sandbox.runCommand({
        cmd: 'find',
        args: ['/tmp', '-name', '*vite*', '-name', '*.log', '-type', 'f']
      });

      if (findResult.exitCode === 0) {
        const logFiles = (await findResult.stdout()).split('\n').filter((f: string) => f.trim());

        for (const logFile of logFiles.slice(0, 2)) {
          try {
            const catResult = await sandbox.runCommand({
              cmd: 'tail',
              args: ['-n', '10', logFile]
            });

            if (catResult.exitCode === 0) {
              const logFileContent = await catResult.stdout();
              logContent.push(`--- ${logFile} ---`);
              logContent.push(logFileContent);
            }
          } catch {
            // Skip if can't read log file
          }
        }
      }
    } catch {
      // No log files found, that's OK
    }

    return NextResponse.json({
      success: true,
      hasErrors: false,
      logs: logContent,
      status: viteRunning ? 'running' : 'stopped'
    });

  } catch (error) {
    console.error('[sandbox-logs] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
