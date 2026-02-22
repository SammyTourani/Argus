'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center px-16">
        <div className="w-full max-w-[400px] text-center">
          <div className="bg-white rounded-20 p-32" style={{
            boxShadow: '0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="w-48 h-48 rounded-full mx-auto mb-16 flex items-center justify-center" style={{ background: '#FA4500' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-[20px] font-semibold text-accent-black mb-8">Check your email</h2>
            <p className="text-body-medium text-black-alpha-48">
              We sent a confirmation link to <strong className="text-accent-black">{email}</strong>. Click it to activate your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base flex items-center justify-center px-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-32">
          <Link href="/" className="inline-block mb-16">
            <h1 className="text-[28px] font-bold tracking-tight text-accent-black">Argus</h1>
          </Link>
          <p className="text-body-medium text-black-alpha-48">Create your account</p>
        </div>

        <div className="bg-white rounded-20 p-32" style={{
          boxShadow: '0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <button
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-8 px-16 py-12 rounded-10 border border-border-muted hover:bg-gray-50 transition-colors text-label-medium font-medium text-accent-black"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-12 my-20">
            <div className="flex-1 h-[1px] bg-border-faint" />
            <span className="text-label-small text-black-alpha-32">or</span>
            <div className="flex-1 h-[1px] bg-border-faint" />
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-12">
            <div>
              <label htmlFor="name" className="block text-label-small font-medium text-black-alpha-72 mb-4">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-12 py-10 rounded-8 border border-border-muted text-body-medium text-accent-black placeholder:text-black-alpha-32 focus:outline-none focus:ring-2 focus:ring-heat-100/20 focus:border-heat-100 transition-all"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-label-small font-medium text-black-alpha-72 mb-4">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-12 py-10 rounded-8 border border-border-muted text-body-medium text-accent-black placeholder:text-black-alpha-32 focus:outline-none focus:ring-2 focus:ring-heat-100/20 focus:border-heat-100 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-label-small font-medium text-black-alpha-72 mb-4">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-12 py-10 rounded-8 border border-border-muted text-body-medium text-accent-black placeholder:text-black-alpha-32 focus:outline-none focus:ring-2 focus:ring-heat-100/20 focus:border-heat-100 transition-all"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-label-small text-red-500 bg-red-50 px-12 py-8 rounded-8">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-12 rounded-10 text-label-medium font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: '#FA4500' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-label-small text-black-alpha-48 mt-16">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-heat-100 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
