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
