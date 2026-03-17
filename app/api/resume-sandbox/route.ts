import { NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';
import { createClient } from '@/lib/supabase/server';
import { getSandbox, setSandbox, removeSandbox } from '@/lib/sandbox/registry';
import { SandboxFactory } from '@/lib/sandbox/factory';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { appConfig } from '@/config/app.config';

// Resume can involve Tier 2/3 sandbox creation — needs time
export const maxDuration = 120;

/**
 * POST /api/resume-sandbox
 *
 * 3-tier sandbox resume:
 *   Tier 1: Reconnect to paused/running sandbox (~1s)
 *   Tier 2: Create from custom template + inject files (~3-8s)
 *   Tier 3: Full rebuild — create blank sandbox + setupViteApp + inject files (~15-30s)
 *
 * Request: { projectId: string, buildId?: string }
 * Response: { success, sandboxId, url, resumeTier, resumeTimeMs }
 */
export async function POST(request: Request) {
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;

    const body = await request.json();
    const { projectId, buildId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Fetch latest build for this project
    let query = supabase
      .from('project_builds')
      .select('id, sandbox_id, files_json, preview_url, status, version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (buildId && buildId !== 'new' && buildId !== 'latest') {
      query = supabase
        .from('project_builds')
        .select('id, sandbox_id, files_json, preview_url, status, version_number')
        .eq('id', buildId)
        .limit(1);
    }

    const { data: build, error: buildError } = await query.single();

    if (buildError || !build) {
      return NextResponse.json(
        { error: 'No builds found for this project' },
        { status: 404 }
      );
    }

    const startTime = Date.now();

    // ── TIER 1: Reconnect to paused/running sandbox ──────────────────────
    if (build.sandbox_id) {
      try {
        console.log(`[resume-sandbox] Tier 1: Attempting to connect to sandbox ${build.sandbox_id}...`);

        const sandbox = await Sandbox.connect(build.sandbox_id, {
          apiKey: process.env.E2B_API_KEY,
        });

        const host = sandbox.getHost(appConfig.e2b.vitePort);
        const url = `https://${host}`;

        // Register in per-user registry so subsequent API calls (apply-ai-code-stream, etc.) work
        registerSandboxForUser(userId, sandbox, build.sandbox_id, url);

        const resumeTimeMs = Date.now() - startTime;
        console.log(`[resume-sandbox] Tier 1 SUCCESS: Reconnected to ${build.sandbox_id} in ${resumeTimeMs}ms`);

        return NextResponse.json({
          success: true,
          sandboxId: build.sandbox_id,
          url,
          resumeTier: 1,
          resumeTimeMs,
        });
      } catch (e: any) {
        console.log(`[resume-sandbox] Tier 1 failed (sandbox ${build.sandbox_id}): ${e.message}`);
        // Fall through to Tier 2
      }
    }

    // ── TIER 2: Custom template + file injection ─────────────────────────
    const snapshotId = appConfig.e2b.snapshotId;
    if (snapshotId) {
      try {
        console.log(`[resume-sandbox] Tier 2: Creating sandbox from snapshot '${snapshotId}'...`);

        // Clean up any stale registry entry
        removeSandbox(userId);

        const createOpts: Record<string, any> = {
          apiKey: process.env.E2B_API_KEY,
          timeoutMs: appConfig.e2b.timeoutMs,
        };
        if (snapshotId) {
          createOpts.snapshot = snapshotId;
        }
        if (appConfig.e2b.preferPause) {
          createOpts.lifecycle = appConfig.e2b.lifecycle;
        }
        const sandbox = await Sandbox.create(createOpts);

        const sandboxId = sandbox.sandboxId;
        const host = sandbox.getHost(appConfig.e2b.vitePort);
        const url = `https://${host}`;

        // Inject files from files_json
        const files = extractFilesFromSnapshot(build.files_json);
        let hasCustomPackages = false;

        if (files.length > 0) {
          console.log(`[resume-sandbox] Tier 2: Injecting ${files.length} files...`);
          for (const file of files) {
            try {
              const fullPath = file.path.startsWith('/')
                ? file.path
                : `/home/user/app/${file.path}`;
              await sandbox.files.write(fullPath, file.content);

              if (file.path === 'package.json') hasCustomPackages = true;
            } catch (writeErr: any) {
              console.error(`[resume-sandbox] Failed to write ${file.path}:`, writeErr.message);
            }
          }
        }

        // Install project-specific packages not in the template
        if (hasCustomPackages) {
          console.log('[resume-sandbox] Tier 2: Installing project-specific packages...');
          try {
            await sandbox.commands.run(
              'cd /home/user/app && npm install --legacy-peer-deps',
              { timeoutMs: 60000 }
            );
          } catch (npmErr: any) {
            console.error('[resume-sandbox] npm install warning:', npmErr.message);
            // Non-fatal: Vite will still start, just some imports may fail
          }
        }

        // Wait for Vite to pick up new files
        await new Promise(r => setTimeout(r, 3000));

        // Update DB with new sandbox ID
        await supabase
          .from('project_builds')
          .update({ sandbox_id: sandboxId, preview_url: url })
          .eq('id', build.id);

        registerSandboxForUser(userId, sandbox, sandboxId, url);

        const resumeTimeMs = Date.now() - startTime;
        console.log(`[resume-sandbox] Tier 2 SUCCESS: Created from template in ${resumeTimeMs}ms`);

        return NextResponse.json({
          success: true,
          sandboxId,
          url,
          resumeTier: 2,
          resumeTimeMs,
        });
      } catch (e: any) {
        console.error(`[resume-sandbox] Tier 2 failed: ${e.message}`);
        // Fall through to Tier 3
      }
    }

    // ── TIER 3: Full rebuild (current create-ai-sandbox-v2 behavior) ─────
    try {
      console.log('[resume-sandbox] Tier 3: Full sandbox rebuild...');

      // Clean up any stale registry entry
      removeSandbox(userId);

      const provider = SandboxFactory.create();

      const creationTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sandbox creation timed out after 60 seconds')), 60_000)
      );
      const sandboxInfo = await Promise.race([provider.createSandbox(), creationTimeout]);

      // Full setup since we don't have a template
      await provider.setupViteApp();

      // Register with sandbox manager
      sandboxManager.registerSandbox(sandboxInfo.sandboxId, provider);

      // Inject files from files_json
      const files = extractFilesFromSnapshot(build.files_json);
      if (files.length > 0) {
        console.log(`[resume-sandbox] Tier 3: Injecting ${files.length} files...`);
        for (const file of files) {
          try {
            await provider.writeFile(file.path, file.content);
          } catch (writeErr: any) {
            console.error(`[resume-sandbox] Failed to write ${file.path}:`, writeErr.message);
          }
        }

        // Install any packages from the injected package.json
        const pkgFile = files.find(f => f.path === 'package.json');
        if (pkgFile) {
          try {
            await provider.runCommand('npm install --legacy-peer-deps');
          } catch { /* best-effort */ }
        }

        // Restart Vite to pick up all changes
        try {
          await provider.restartViteServer();
        } catch { /* best-effort */ }
      }

      // Store in registry
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

      // Update DB with new sandbox ID
      await supabase
        .from('project_builds')
        .update({ sandbox_id: sandboxInfo.sandboxId, preview_url: sandboxInfo.url })
        .eq('id', build.id);

      const resumeTimeMs = Date.now() - startTime;
      console.log(`[resume-sandbox] Tier 3 SUCCESS: Full rebuild in ${resumeTimeMs}ms`);

      return NextResponse.json({
        success: true,
        sandboxId: sandboxInfo.sandboxId,
        url: sandboxInfo.url,
        resumeTier: 3,
        resumeTimeMs,
      });
    } catch (e: any) {
      console.error('[resume-sandbox] Tier 3 failed:', e);
      return NextResponse.json(
        { error: `All resume tiers failed: ${e.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[resume-sandbox] Error:', error);

    // Clean up on error
    if (userId) {
      try { removeSandbox(userId); } catch { /* best-effort */ }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to resume sandbox',
      },
      { status: 500 }
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractFilesFromSnapshot(
  filesJson: any
): Array<{ path: string; content: string }> {
  if (!filesJson) return [];
  if (Array.isArray(filesJson)) return filesJson;
  if (Array.isArray(filesJson?.files)) return filesJson.files;
  return [];
}

function registerSandboxForUser(
  userId: string,
  sandbox: any,
  sandboxId: string,
  url: string
): void {
  // Create a provider wrapper that holds the reconnected sandbox
  const provider = SandboxFactory.create();
  // Attach the existing E2B sandbox to the provider's internal state
  (provider as any).sandbox = sandbox;
  (provider as any).sandboxInfo = {
    sandboxId,
    url,
    provider: 'e2b',
    createdAt: new Date(),
  };

  // Register with sandbox manager
  sandboxManager.registerSandbox(sandboxId, provider);

  // Store in per-user registry
  // IMPORTANT: Set both `sandbox` (raw handle, used by get-sandbox-files)
  // and `provider` (wrapper, used by apply-ai-code-stream)
  setSandbox(userId, {
    sandbox,
    provider,
    sandboxData: { sandboxId, url },
    sandboxState: {
      fileCache: {
        files: {},
        lastSync: Date.now(),
        sandboxId,
      },
      sandbox: provider,
      sandboxData: { sandboxId, url },
    },
  });
}
