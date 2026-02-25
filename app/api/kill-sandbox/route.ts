import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSandbox, removeSandbox } from '@/lib/sandbox/registry';

export async function POST() {
  try {
    // Auth — resolve the current user's sandbox
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const entry = getSandbox(userId);

    console.log(`[kill-sandbox] Stopping active sandbox for user ${userId}...`);

    let sandboxKilled = false;

    // Stop existing provider if any
    if (entry.provider) {
      try {
        await entry.provider.terminate();
        sandboxKilled = true;
        console.log('[kill-sandbox] Provider sandbox stopped successfully');
      } catch (e) {
        console.error('[kill-sandbox] Failed to stop provider sandbox:', e);
      }
    }

    // Stop legacy sandbox if any
    if (entry.sandbox) {
      try {
        if (typeof entry.sandbox.stop === 'function') {
          await entry.sandbox.stop();
        } else if (typeof entry.sandbox.kill === 'function') {
          await entry.sandbox.kill();
        }
        sandboxKilled = true;
        console.log('[kill-sandbox] Legacy sandbox stopped successfully');
      } catch (e) {
        console.error('[kill-sandbox] Failed to stop legacy sandbox:', e);
      }
    }

    // Remove the user's entire registry entry
    removeSandbox(userId);

    return NextResponse.json({
      success: true,
      sandboxKilled,
      message: 'Sandbox cleaned up successfully'
    });

  } catch (error) {
    console.error('[kill-sandbox] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
