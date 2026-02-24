'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/app';

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-16"
      style={{ background: '#f9f9f9' }}
    >
      <div className="w-full max-w-[400px]">
        {/* Logo / wordmark */}
        <div className="text-center mb-32">
          <Link href="/" className="inline-block mb-16">
            <h1
              className="text-[28px] font-bold tracking-tight"
              style={{ color: '#FA4500' }}
            >
              Argus
            </h1>
          </Link>
          <p className="text-body-medium text-accent-black opacity-50">
            Sign in to your account
          </p>
        </div>

        {/* Card — matches HeroInput white card style */}
        <div
          className="bg-accent-white rounded-20 p-32"
          style={{
            boxShadow:
              '0px 0px 44px 0px rgba(0,0,0,0.02), 0px 88px 56px -20px rgba(0,0,0,0.03), 0px 56px 56px -20px rgba(0,0,0,0.02), 0px 32px 32px -20px rgba(0,0,0,0.03), 0px 16px 24px -12px rgba(0,0,0,0.03), 0px 0px 0px 1px rgba(0,0,0,0.05)',
          }}
        >
          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-8 px-16 py-12 rounded-10 transition-colors text-label-medium font-medium text-accent-black border border-black-alpha-5 hover:bg-black/5"
            style={{ background: '#f9f9f9' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f9f9f9')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-12 my-20">
            <div className="flex-1 h-[1px] bg-black/8" />
            <span className="text-label-small text-accent-black opacity-30">or</span>
            <div className="flex-1 h-[1px] bg-black/8" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSignIn} className="space-y-12">
            <div>
              <label
                htmlFor="email"
                className="block text-label-small font-medium mb-4 text-accent-black opacity-60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-12 py-10 rounded-8 text-body-medium text-accent-black bg-white transition-all focus:outline-none placeholder:text-accent-black/40"
                style={{ border: '1px solid rgba(0,0,0,0.10)' }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(0,0,0,0.30)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(0,0,0,0.10)')}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-label-small font-medium mb-4 text-accent-black opacity-60"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-12 py-10 rounded-8 text-body-medium text-accent-black bg-white transition-all focus:outline-none placeholder:text-accent-black/40"
                style={{ border: '1px solid rgba(0,0,0,0.10)' }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(0,0,0,0.30)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(0,0,0,0.10)')}
                placeholder="Your password"
                required
              />
            </div>

            {error && (
              <div
                className="text-label-small px-12 py-8 rounded-8"
                style={{
                  color: '#c0392b',
                  background: 'rgba(192,57,43,0.07)',
                  border: '1px solid rgba(192,57,43,0.15)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-12 rounded-10 text-label-medium font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: '#FA4500' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-label-small mt-16 text-accent-black opacity-50">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium hover:underline opacity-100"
            style={{ color: '#FA4500' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
