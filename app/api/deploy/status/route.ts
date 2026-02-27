import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

// GET /api/deploy/status?deploymentId=xxx
// Returns Vercel deployment status for real-time polling
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: deploymentId' },
        { status: 400 }
      );
    }

    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    if (!VERCEL_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel token not configured' },
        { status: 500 }
      );
    }

    // Query Vercel deployment status
    const vercelRes = await fetch(
      `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!vercelRes.ok) {
      const errorText = await vercelRes.text();
      console.error('[deploy/status] Vercel API error:', vercelRes.status, errorText);

      if (vercelRes.status === 404) {
        return NextResponse.json(
          { error: 'Deployment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Vercel status check failed: ${vercelRes.status}` },
        { status: 502 }
      );
    }

    const data = await vercelRes.json();

    // Map Vercel's readyState to our state type
    const stateMap: Record<string, string> = {
      INITIALIZING: 'INITIALIZING',
      ANALYZING: 'ANALYZING',
      BUILDING: 'BUILDING',
      DEPLOYING: 'DEPLOYING',
      READY: 'READY',
      ERROR: 'ERROR',
      CANCELED: 'CANCELED',
      QUEUED: 'INITIALIZING',
    };

    const state = stateMap[data.readyState] ?? stateMap[data.status] ?? 'INITIALIZING';

    // Build URL
    const url = data.url
      ? `https://${data.url}`
      : data.alias?.[0]
      ? `https://${data.alias[0]}`
      : undefined;

    // Extract error message from Vercel response if present
    let errorMessage: string | undefined;
    if (state === 'ERROR') {
      errorMessage =
        data.errorMessage ??
        data.errorCode ??
        data.error?.message ??
        'Deployment failed';
    }

    return NextResponse.json({
      state,
      url,
      errorMessage,
      createdAt: data.createdAt ?? data.created ?? Date.now(),
      readyAt: data.ready ?? undefined,
      buildingAt: data.buildingAt ?? undefined,
    });
  } catch (err) {
    console.error('[GET /api/deploy/status]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
