import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
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

    // Check sandbox manager first, then fall back to per-user registry
    const provider = sandboxManager.getActiveProvider() || entry.provider;
    const sandboxExists = !!provider;

    let sandboxHealthy = false;
    let sandboxInfo = null;

    if (sandboxExists && provider) {
      try {
        // Check if sandbox is healthy by getting its info
        const providerInfo = provider.getSandboxInfo();
        sandboxHealthy = !!providerInfo;

        sandboxInfo = {
          sandboxId: providerInfo?.sandboxId || entry.sandboxData?.sandboxId,
          url: providerInfo?.url || entry.sandboxData?.url,
          filesTracked: Array.from(entry.existingFiles),
          lastHealthCheck: new Date().toISOString()
        };
      } catch (error) {
        console.error('[sandbox-status] Health check failed:', error);
        sandboxHealthy = false;
      }
    }

    return NextResponse.json({
      success: true,
      active: sandboxExists,
      healthy: sandboxHealthy,
      sandboxData: sandboxInfo,
      message: sandboxHealthy
        ? 'Sandbox is active and healthy'
        : sandboxExists
          ? 'Sandbox exists but is not responding'
          : 'No active sandbox'
    });

  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    return NextResponse.json({
      success: false,
      active: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
