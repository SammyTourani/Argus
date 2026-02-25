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

// GET /api/user/onboarding — check state
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: state, error } = await supabase
      .from('onboarding_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // No row = new user, needs onboarding
    if (!state) {
      return NextResponse.json({ completed: false, current_step: 1, step_data: {} });
    }

    return NextResponse.json({
      completed: state.completed,
      current_step: state.current_step,
      step_data: state.step_data ?? {},
      completed_at: state.completed_at,
    });
  } catch (err) {
    console.error('[GET /api/user/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/onboarding — advance to next step
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { step, data: stepData } = body;

    if (typeof step !== 'number' || step < 1 || step > 4) {
      return NextResponse.json({ error: 'Invalid step (must be 1-4)' }, { status: 400 });
    }

    // Fetch existing state to merge step_data
    const { data: existing } = await supabase
      .from('onboarding_state')
      .select('step_data')
      .eq('user_id', user.id)
      .single();

    const mergedStepData = {
      ...(existing?.step_data ?? {}),
      ...(stepData ? { [`step_${step}`]: stepData } : {}),
    };

    const { data: state, error } = await supabase
      .from('onboarding_state')
      .upsert(
        {
          user_id: user.id,
          current_step: step + 1,
          completed: step >= 4,
          step_data: mergedStepData,
          completed_at: step >= 4 ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      completed: state.completed,
      current_step: state.current_step,
      step_data: state.step_data,
    });
  } catch (err) {
    console.error('[POST /api/user/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/onboarding — force-complete (skip)
export async function PUT() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('onboarding_state')
      .upsert(
        {
          user_id: user.id,
          current_step: 4,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ completed: true });
  } catch (err) {
    console.error('[PUT /api/user/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
