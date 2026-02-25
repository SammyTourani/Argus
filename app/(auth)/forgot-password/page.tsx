'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function ForgotPasswordInner() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white tracking-wider font-mono">
            ARGUS
          </Link>
        </div>

        {submitted ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-[#FA4500]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#FA4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-zinc-400 text-sm mb-6">
              We sent a password reset link to <span className="text-zinc-200">{email}</span>.
              Check your inbox and click the link to reset your password.
            </p>
            <Link
              href="/sign-in"
              className="text-[#FA4500] text-sm hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h1 className="text-white text-2xl font-semibold mb-2">Reset password</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-zinc-300 text-sm mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FA4500] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FA4500] hover:bg-[#e03e00] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="text-center text-zinc-500 text-sm mt-6">
              Remember your password?{' '}
              <Link href="/sign-in" className="text-[#FA4500] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FA4500] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPasswordInner />
    </Suspense>
  );
}
