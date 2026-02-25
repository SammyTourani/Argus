'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/auth/AuthLayout';

/* ─── SVG icons ─── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1A1A">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
  </svg>
);

/* ─── OAuth button ─── */
function OAuthButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-full border transition-colors hover:bg-gray-50 active:scale-[0.98]"
      style={{ borderColor: 'rgba(0,0,0,0.12)', background: 'white' }}
    >
      {icon}
      <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{label}</span>
    </button>
  );
}

/* ─── Divider ─── */
function Divider() {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

/* ─── Main page ─── */
export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleGitHubSignUp = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleMicrosoftSignUp = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <AuthLayout mode="signup">
        <div className="text-center py-8">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FA4500' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>
            Check your email
          </h2>
          <p className="text-sm" style={{ color: '#888' }}>
            We sent a confirmation link to <strong style={{ color: '#1A1A1A' }}>{email}</strong>.
            Click it to activate your account.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout mode="signup">
      {/* Wordmark */}
      <div className="mb-8">
        <Link href="/">
          <span className="text-[22px] font-bold tracking-tight" style={{ color: '#FA4500' }}>
            ARGUS
          </span>
        </Link>
      </div>

      {/* Heading */}
      <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1A1A' }}>
        Start building
      </h1>
      <p className="text-sm mb-8" style={{ color: '#888' }}>
        Create your free account
      </p>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-3">
        <OAuthButton icon={<GoogleIcon />} label="Continue with Google" onClick={handleGoogleSignUp} />
        <OAuthButton icon={<GitHubIcon />} label="Continue with GitHub" onClick={handleGitHubSignUp} />
        <OAuthButton icon={<MicrosoftIcon />} label="Continue with Microsoft" onClick={handleMicrosoftSignUp} />
      </div>

      <Divider />

      {/* Form */}
      <form onSubmit={handleEmailSignUp} className="flex flex-col gap-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm bg-white transition-all focus:outline-none"
          style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#1A1A1A' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FA4500')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)')}
          placeholder="Full name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm bg-white transition-all focus:outline-none"
          style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#1A1A1A' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FA4500')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)')}
          placeholder="you@example.com"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm bg-white transition-all focus:outline-none"
          style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#1A1A1A' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FA4500')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)')}
          placeholder="Min 6 characters"
          required
          minLength={6}
        />

        {error && (
          <div className="text-xs px-3 py-2 rounded-lg" style={{ color: '#c0392b', background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.15)' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#FA4500' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-[11px] text-center" style={{ color: '#aaa' }}>
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>

      {/* Footer */}
      <p className="text-center text-xs mt-8" style={{ color: '#888' }}>
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium hover:underline" style={{ color: '#FA4500' }}>
          Sign in →
        </Link>
      </p>
    </AuthLayout>
  );
}
