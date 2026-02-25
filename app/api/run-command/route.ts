import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSandbox } from '@/lib/sandbox/registry';

export async function POST(request: NextRequest) {
  try {
    // Auth check — require authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'Command is required'
      }, { status: 400 });
    }

    // Resolve this user's sandbox from the registry
    const entry = getSandbox(user.id);
    const sandbox = entry.sandbox;

    if (!sandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 400 });
    }

    console.log(`[run-command] Executing for user ${user.id}: ${command}`);

    // Parse command and arguments
    const commandParts = command.trim().split(/\s+/);
    const cmd = commandParts[0];
    const args = commandParts.slice(1);

    // Execute command using Vercel Sandbox
    const result = await sandbox.runCommand({
      cmd,
      args
    });

    // Get output streams
    const stdout = await result.stdout();
    const stderr = await result.stderr();

    const output = [
      stdout ? `STDOUT:\n${stdout}` : '',
      stderr ? `\nSTDERR:\n${stderr}` : '',
      `\nExit code: ${result.exitCode}`
    ].filter(Boolean).join('');

    return NextResponse.json({
      success: true,
      output,
      exitCode: result.exitCode,
      message: result.exitCode === 0 ? 'Command executed successfully' : 'Command completed with non-zero exit code'
    });

  } catch (error) {
    console.error('[run-command] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
