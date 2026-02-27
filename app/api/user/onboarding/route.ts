import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const STEP_ORDER = ['welcome', 'what_to_build', 'choose_model', 'first_build', 'completed'] as const;
type OnboardingStep = typeof STEP_ORDER[number];

async function createSupabaseServer() {
  const cookieStore = await cookies();
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
    const supabase = await createSupabaseServer();
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
      return NextResponse.json({
        current_step: 'welcome',
        what_to_build: null,
        chosen_model: null,
        completed_at: null,
      });
    }

    return NextResponse.json({
      current_step: state.current_step,
      what_to_build: state.what_to_build,
      chosen_model: state.chosen_model,
      completed_at: state.completed_at,
    });
  } catch (err) {
    console.error('[GET /api/user/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/onboarding — advance to next step + persist step data
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { step, data: stepData } = body;

    // Validate step is a valid text enum value
    if (!step || !STEP_ORDER.includes(step as OnboardingStep)) {
      return NextResponse.json(
        { error: `Invalid step. Must be one of: ${STEP_ORDER.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine the next step
    const currentIndex = STEP_ORDER.indexOf(step as OnboardingStep);
    const nextStep = currentIndex < STEP_ORDER.length - 1
      ? STEP_ORDER[currentIndex + 1]
      : 'completed';

    // Build the upsert payload with correct column names
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      current_step: nextStep,
    };

    // Store step data cumulatively — the client sends all collected data each time
    // what_to_build: project description from step 2
    if (stepData?.what_to_build) {
      upsertData.what_to_build = String(stepData.what_to_build).slice(0, 500);
    }
    // chosen_model: model ID from step 3
    if (stepData?.chosen_model) {
      upsertData.chosen_model = String(stepData.chosen_model);
    }

    if (nextStep === 'completed') {
      upsertData.completed_at = new Date().toISOString();
    }

    const { data: state, error } = await supabase
      .from('onboarding_state')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If a model was chosen, also upsert user_model_preferences so it persists server-side
    if (stepData?.chosen_model) {
      await supabase
        .from('user_model_preferences')
        .upsert(
          {
            user_id: user.id,
            preferred_model: String(stepData.chosen_model),
          },
          { onConflict: 'user_id' }
        );
    }

    return NextResponse.json({
      current_step: state.current_step,
      what_to_build: state.what_to_build,
      chosen_model: state.chosen_model,
      completed_at: state.completed_at,
    });
  } catch (err) {
    console.error('[POST /api/user/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/onboarding — mark complete + finalize preferences
export async function PUT() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Read existing onboarding data before completing, so we can finalize preferences
    const { data: existing } = await supabase
      .from('onboarding_state')
      .select('chosen_model')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('onboarding_state')
      .upsert(
        {
          user_id: user.id,
          current_step: 'completed',
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Ensure user_model_preferences reflects the chosen model from onboarding
    if (existing?.chosen_model) {
      await supabase
        .from('user_model_preferences')
        .upsert(
          {
            user_id: user.id,
            preferred_model: existing.chosen_model,
          },
          { onConflict: 'user_id' }
        );
    }

    return NextResponse.json({ current_step: 'completed', completed_at: new Date().toISOString() });
  } catch (err) {
    console.error('[PUT /api/user/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
