import { NextResponse } from 'next/server';

// Sandbox creation + Vite setup can take up to 60s
export const maxDuration = 60;

import { SandboxFactory } from '@/lib/sandbox/factory';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';
import { getSandbox, setSandbox, removeSandbox, cleanupStale } from '@/lib/sandbox/registry';

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
  let userId: string | null = null;
  try {
    // Auth — require authenticated user for sandbox isolation
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = user.id;

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
      console.error('[create-ai-sandbox-v2] Failed to log build:', e);
    }

    console.log(`[create-ai-sandbox-v2] Creating sandbox for user ${userId}...`);

    // Clean up only THIS user's existing sandbox (not other users')
    console.log('[create-ai-sandbox-v2] Cleaning up existing sandbox for user', userId);
    removeSandbox(userId);

    // Get a fresh entry after cleanup
    const entry = getSandbox(userId);

    // Create new sandbox using factory
    const provider = SandboxFactory.create();

    // Timeout sandbox creation at 60 seconds
    const creationTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sandbox creation timed out after 60 seconds')), 60_000)
    );
    const sandboxInfo = await Promise.race([provider.createSandbox(), creationTimeout]);

    console.log('[create-ai-sandbox-v2] Setting up Vite React app...');
    await provider.setupViteApp();

    // Register with sandbox manager
    sandboxManager.registerSandbox(sandboxInfo.sandboxId, provider);

    // Store in per-user registry
    setSandbox(userId, {
      provider,
      sandboxData: {
        sandboxId: sandboxInfo.sandboxId,
        url: sandboxInfo.url,
      },
      sandboxState: {
        fileCache: {
          files: {},
          lastSync: Date.now(),
          sandboxId: sandboxInfo.sandboxId,
        },
        sandbox: provider,
        sandboxData: {
          sandboxId: sandboxInfo.sandboxId,
          url: sandboxInfo.url,
        },
      },
    });

    // Housekeeping
    cleanupStale();

    console.log('[create-ai-sandbox-v2] Sandbox ready at:', sandboxInfo.url);

    return NextResponse.json({
      success: true,
      sandboxId: sandboxInfo.sandboxId,
      url: sandboxInfo.url,
      provider: sandboxInfo.provider,
      message: 'Sandbox created and Vite React app initialized'
    });

  } catch (error) {
    console.error('[create-ai-sandbox-v2] Error:', error);

    // Clean up only this user's sandbox on error
    if (userId) {
      try { removeSandbox(userId); } catch { /* best-effort */ }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create sandbox',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
