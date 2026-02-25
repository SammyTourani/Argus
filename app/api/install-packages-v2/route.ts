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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packages } = await request.json();

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Packages array is required'
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

    console.log(`[install-packages-v2] Installing for user ${user.id}: ${packages.join(', ')}`);

    const result = await provider.installPackages(packages);

    return NextResponse.json({
      success: result.success,
      output: result.stdout,
      error: result.stderr,
      message: result.success ? 'Packages installed successfully' : 'Package installation failed'
    });

  } catch (error) {
    console.error('[install-packages-v2] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
