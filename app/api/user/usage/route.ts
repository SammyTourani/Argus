import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserUsage } from '@/lib/usage/tracker';

// GET /api/user/usage — returns usage stats for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getUserUsage(user.id);
    return NextResponse.json(usage);
  } catch (err) {
    console.error('[GET /api/user/usage] unexpected:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
