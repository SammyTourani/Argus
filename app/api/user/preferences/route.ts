import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
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
}

// GET /api/user/preferences
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: prefs, error } = await supabase
      .from('user_model_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return defaults if no preferences set yet
    return NextResponse.json({
      preferences: prefs ?? {
        default_model_id: 'claude-sonnet-4-6',
        default_style_preset: 'minimal',
      },
    });
  } catch (err) {
    console.error('[GET /api/user/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/preferences — upsert
export async function PUT(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { default_model_id, default_style_preset } = body;

    const updates: Record<string, string> = { user_id: user.id };
    if (default_model_id) updates.default_model_id = default_model_id;
    if (default_style_preset) updates.default_style_preset = default_style_preset;

    const { data: prefs, error } = await supabase
      .from('user_model_preferences')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ preferences: prefs });
  } catch (err) {
    console.error('[PUT /api/user/preferences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
