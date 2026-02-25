import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { createClient } from '@/lib/supabase/server';
import { getSandbox } from '@/lib/sandbox/registry';

export async function POST(request: NextRequest) {
  try {
    // Auth — resolve the current user's sandbox
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'Command is required'
      }, { status: 400 });
    }

    // Get provider from sandbox manager or per-user registry
    const entry = getSandbox(user.id);
    const provider = sandboxManager.getActiveProvider() || entry.provider;

    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 400 });
    }

    console.log(`[run-command-v2] Executing for user ${user.id}: ${command}`);

    const result = await provider.runCommand(command);

    return NextResponse.json({
      success: result.success,
      output: result.stdout,
      error: result.stderr,
      exitCode: result.exitCode,
      message: result.success ? 'Command executed successfully' : 'Command failed'
    });

  } catch (error) {
    console.error('[run-command-v2] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
