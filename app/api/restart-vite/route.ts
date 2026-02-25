import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSandbox } from '@/lib/sandbox/registry';

const RESTART_COOLDOWN_MS = 5000; // 5 second cooldown between restarts

// Per-user restart state (module-scoped, not global)
const restartState = new Map<string, { lastRestart: number; inProgress: boolean }>();

export async function POST() {
  try {
    // Auth — resolve the current user's sandbox
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = getSandbox(user.id);
    const provider = entry.sandbox || entry.provider;

    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 400 });
    }

    // Get or create per-user restart state
    let userState = restartState.get(user.id);
    if (!userState) {
      userState = { lastRestart: 0, inProgress: false };
      restartState.set(user.id, userState);
    }

    // Check if restart is already in progress
    if (userState.inProgress) {
      console.log('[restart-vite] Vite restart already in progress, skipping...');
      return NextResponse.json({
        success: true,
        message: 'Vite restart already in progress'
      });
    }

    // Check cooldown
    const now = Date.now();
    if (userState.lastRestart && (now - userState.lastRestart) < RESTART_COOLDOWN_MS) {
      const remainingTime = Math.ceil((RESTART_COOLDOWN_MS - (now - userState.lastRestart)) / 1000);
      console.log(`[restart-vite] Cooldown active, ${remainingTime}s remaining`);
      return NextResponse.json({
        success: true,
        message: `Vite was recently restarted, cooldown active (${remainingTime}s remaining)`
      });
    }

    // Set the restart flag
    userState.inProgress = true;

    console.log('[restart-vite] Using provider method to restart Vite...');

    // Use the provider's restartViteServer method if available
    if (typeof provider.restartViteServer === 'function') {
      await provider.restartViteServer();
      console.log('[restart-vite] Vite restarted via provider method');
    } else {
      // Fallback to manual restart using provider's runCommand
      console.log('[restart-vite] Fallback to manual Vite restart...');

      // Kill existing Vite processes
      try {
        await provider.runCommand('pkill -f vite');
        console.log('[restart-vite] Killed existing Vite processes');

        // Wait a moment for processes to terminate
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch {
        console.log('[restart-vite] No existing Vite processes found');
      }

      // Clear any error tracking files
      try {
        await provider.runCommand('bash -c "echo \'{\\"errors\\": [], \\"lastChecked\\": '+ Date.now() +'}\' > /tmp/vite-errors.json"');
      } catch {
        // Ignore if this fails
      }

      // Start Vite dev server in background
      await provider.runCommand('sh -c "nohup npm run dev > /tmp/vite.log 2>&1 &"');
      console.log('[restart-vite] Vite dev server restarted');

      // Wait for Vite to start up
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Update state
    userState.lastRestart = Date.now();
    userState.inProgress = false;

    return NextResponse.json({
      success: true,
      message: 'Vite restarted successfully'
    });

  } catch (error) {
    console.error('[restart-vite] Error:', error);

    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
