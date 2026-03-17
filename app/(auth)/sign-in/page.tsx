'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/auth/AuthLayout';

/* ─── SVG icons ─── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A1A">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 23 23">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
  </svg>
);

/* ─── OAuth button ─── */
function OAuthButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
      style={{
        borderRadius: '10px',
        border: '1px solid #E5E5E5',
        background: 'white',
        color: '#1A1A1A',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#C8C8C8';
        e.currentTarget.style.background = '#F8F8F8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E5E5E5';
        e.currentTarget.style.background = 'white';
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ─── Divider ─── */
function Divider() {
  return (
    <div className="flex items-center gap-4 my-7">
      <div className="flex-1 h-px" style={{ background: '#EBEBEB' }} />
      <span
        style={{
          fontSize: '11px',
          color: '#B0B0B0',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        or
      </span>
      <div className="flex-1 h-px" style={{ background: '#EBEBEB' }} />
    </div>
  );
}

/* ─── Input component ─── */
function AuthInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
}: {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 text-sm transition-all duration-150 focus:outline-none"
      style={{
        borderRadius: '10px',
        border: '1px solid #E0E0E0',
        background: 'white',
        color: '#1A1A1A',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#FA4500';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(250, 69, 0, 0.06)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#E0E0E0';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}

/* ─── Primary button ─── */
function PrimaryButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 text-center text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
      style={{
        borderRadius: '10px',
        background: loading ? '#D63D00' : '#FA4500',
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = '#E53D00';
      }}
      onMouseLeave={(e) => {
        if (!loading) e.currentTarget.style.background = '#FA4500';
      }}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Signing in...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/* ─── Error display ─── */
function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="text-xs px-3 py-2.5"
      style={{
        borderRadius: '8px',
        color: '#C0392B',
        background: 'rgba(192, 57, 43, 0.06)',
        border: '1px solid rgba(192, 57, 43, 0.12)',
      }}
    >
      {message}
    </div>
  );
}

/* ─── Main page content ─── */
function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'magiclink'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/workspace';

  // Handle error query params from auth redirects
  const urlError = searchParams.get('error');
  const errorMessages: Record<string, string> = {
    confirmation_failed: 'Email confirmation failed or link expired. Please try signing up again.',
    auth_callback_failed: 'Authentication failed. Please try again.',
  };
  const [error, setError] = useState<string | null>(
    urlError ? errorMessages[urlError] || 'An error occurred. Please try again.' : null
  );

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setMagicLinkSent(true);
    setLoading(false);
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

  const handleGitHubSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  };

  const handleMicrosoftSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email',
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  };

  return (
    <AuthLayout mode="signin">
      {/* Wordmark */}
      <div className="mb-10">
        <Link href="/">
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '18px',
              fontWeight: 700,
              color: '#FA4500',
              letterSpacing: '0.08em',
            }}
          >
            ARGUS
          </span>
        </Link>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '30px',
          fontWeight: 800,
          color: '#1A1A1A',
          lineHeight: 1.1,
          marginBottom: '8px',
        }}
      >
        Welcome back
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#888',
          marginBottom: '32px',
        }}
      >
        Sign in to your workspace
      </p>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-3">
        <OAuthButton icon={<GoogleIcon />} label="Continue with Google" onClick={handleGoogleSignIn} />
        <OAuthButton icon={<GitHubIcon />} label="Continue with GitHub" onClick={handleGitHubSignIn} />
        <OAuthButton icon={<MicrosoftIcon />} label="Continue with Microsoft" onClick={handleMicrosoftSignIn} />
      </div>

      <Divider />

      {/* Auth mode toggle — underline tabs */}
      <div
        className="flex mb-6"
        style={{ borderBottom: '1px solid #EBEBEB' }}
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode('password');
            setMagicLinkSent(false);
          }}
          className="flex-1 pb-3 text-center transition-all duration-150"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.02em',
            color: authMode === 'password' ? '#FA4500' : '#999',
            borderBottom: authMode === 'password' ? '2px solid #FA4500' : '2px solid transparent',
            marginBottom: '-1px',
            background: 'transparent',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomWidth: '2px',
            borderBottomColor: authMode === 'password' ? '#FA4500' : 'transparent',
            cursor: 'pointer',
          }}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('magiclink')}
          className="flex-1 pb-3 text-center transition-all duration-150"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.02em',
            color: authMode === 'magiclink' ? '#FA4500' : '#999',
            background: 'transparent',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomWidth: '2px',
            borderBottomColor: authMode === 'magiclink' ? '#FA4500' : 'transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          Magic Link
        </button>
      </div>

      {/* Magic link sent confirmation */}
      {magicLinkSent && authMode === 'magiclink' ? (
        <div className="text-center py-8">
          <div
            className="w-11 h-11 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FA4500' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
            Check your email
          </p>
          <p className="text-xs mt-2" style={{ color: '#888' }}>
            We sent a sign-in link to <strong style={{ color: '#555' }}>{email}</strong>
          </p>
        </div>
      ) : authMode === 'magiclink' ? (
        /* Magic link form */
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          {error && <ErrorMessage message={error} />}
          <PrimaryButton loading={loading}>Send magic link</PrimaryButton>
        </form>
      ) : (
        /* Password form */
        <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <AuthInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />
          {error && <ErrorMessage message={error} />}
          <PrimaryButton loading={loading}>Sign in</PrimaryButton>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs transition-colors duration-150 hover:underline"
              style={{ color: '#999' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FA4500')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
            >
              Forgot password?
            </Link>
          </div>
        </form>
      )}

      {/* Footer */}
      <p className="text-center text-xs mt-10" style={{ color: '#999' }}>
        New to Argus?{' '}
        <Link
          href="/sign-up"
          className="font-medium transition-colors duration-150"
          style={{ color: '#FA4500' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#D63D00')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#FA4500')}
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

/* ─── Page wrapper with Suspense ─── */
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center" style={{ background: '#FAFAFA' }}>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#FA4500', borderTopColor: 'transparent' }} />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
