import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Backward compat redirects: /dashboard, /app, /generation → /workspace
  if (pathname === '/dashboard' || pathname === '/app' || pathname === '/generation') {
    const url = request.nextUrl.clone();
    url.pathname = '/workspace';
    return NextResponse.redirect(url);
  }

  // Protected routes — require auth
  if (!user && (pathname.startsWith('/workspace') || pathname.startsWith('/resources') || pathname.startsWith('/upgrade') || pathname.startsWith('/account'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
    const url = request.nextUrl.clone();
    url.pathname = '/workspace';
    return NextResponse.redirect(url);
  }

  // Onboarding guard: if authenticated user hits /workspace and hasn't finished onboarding
  // We check a cookie set after onboarding completes to avoid a DB call on every request
  if (user && pathname.startsWith('/workspace') && !pathname.startsWith('/workspace/invite')) {
    const onboardingDone = request.cookies.get('argus_onboarding_done');
    if (!onboardingDone) {
      // Check DB — only do this once, then set cookie
      const { data: state } = await supabase
        .from('onboarding_state')
        .select('current_step, completed_at')
        .eq('user_id', user.id)
        .single();

      if (!state || state.current_step !== 'completed') {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }

      // Set cookie so we skip DB check on subsequent requests (expires 365 days)
      supabaseResponse.cookies.set('argus_onboarding_done', '1', {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
    }
  }

  // After completing onboarding, set the done cookie
  if (user && pathname === '/onboarding') {
    // Clear any stale onboarding cookie so it re-checks when they return
    supabaseResponse.cookies.delete('argus_onboarding_done');
  }

  return supabaseResponse;
}
