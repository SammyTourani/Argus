import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearViteErrorsCache } from '@/lib/vite/per-user-errors';

export async function POST() {
  try {
    // Auth check — require authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Clear the per-user cache
    clearViteErrorsCache(user.id);

    console.log('[clear-vite-errors-cache] Cache cleared for user', user.id);

    return NextResponse.json({
      success: true,
      message: 'Vite errors cache cleared'
    });

  } catch (error) {
    console.error('[clear-vite-errors-cache] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
