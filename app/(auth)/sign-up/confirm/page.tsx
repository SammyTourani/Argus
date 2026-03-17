'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

/* ─── Email app detection ─── */
function getEmailApp(email: string): { label: string; url: string } | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  const map: Record<string, { label: string; url: string }> = {
    'gmail.com':      { label: 'Open Gmail',       url: 'https://mail.google.com' },
    'googlemail.com': { label: 'Open Gmail',       url: 'https://mail.google.com' },
    'outlook.com':    { label: 'Open Outlook',     url: 'https://outlook.live.com' },
    'hotmail.com':    { label: 'Open Outlook',     url: 'https://outlook.live.com' },
    'live.com':       { label: 'Open Outlook',     url: 'https://outlook.live.com' },
    'yahoo.com':      { label: 'Open Yahoo Mail',  url: 'https://mail.yahoo.com' },
    'icloud.com':     { label: 'Open iCloud Mail', url: 'https://www.icloud.com/mail' },
    'protonmail.com': { label: 'Open Proton Mail', url: 'https://mail.proton.me' },
    'proton.me':      { label: 'Open Proton Mail', url: 'https://mail.proton.me' },
  };
  return map[domain] ?? null;
}

/* ─── Resend button states ─── */
type ResendState = 'idle' | 'sending' | 'sent' | 'cooldown' | 'error';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [resendState, setResendState] = useState<ResendState>('idle');
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Guard: redirect to sign-up if no email param
  useEffect(() => {
    if (!email) {
      router.replace('/sign-up');
    }
  }, [email, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setResendState('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResendState('sending');
    setResendError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      setResendState('error');
      setResendError(error.message);
    } else {
      setResendState('sent');
      setCooldown(60);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FA4500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const emailApp = getEmailApp(email);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white tracking-wider font-mono">
            ARGUS
          </Link>
        </div>

        <motion.div
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Mail icon */}
          <div className="w-12 h-12 bg-[#FA4500]/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-[#FA4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-white text-xl font-semibold mb-3">Check your inbox</h2>

          {/* Description */}
          <p className="text-zinc-400 text-sm mb-2">
            We sent a confirmation link to{' '}
            <span className="text-zinc-200 font-medium">{email}</span>
          </p>
          <p className="text-zinc-400 text-sm mb-4">
            Click it to activate your account.
          </p>

          {/* Spam hint */}
          <p className="text-zinc-500 text-xs mb-6">
            Don&apos;t see it? Check your spam folder.
          </p>

          {/* Separator */}
          <div className="border-t border-zinc-800 mb-6" />

          {/* Resend button */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === 'sending' || cooldown > 0}
            className="w-full py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            style={{
              borderColor: resendState === 'sent' ? 'rgba(34, 197, 94, 0.3)' : '#3f3f46',
              color: resendState === 'sent' ? '#22c55e' : '#d4d4d8',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (cooldown <= 0 && resendState !== 'sending') {
                e.currentTarget.style.borderColor = '#52525b';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = resendState === 'sent' ? 'rgba(34, 197, 94, 0.3)' : '#3f3f46';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {resendState === 'sending' && (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
            )}
            {resendState === 'sent' && (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email sent!
              </span>
            )}
            {resendState === 'idle' && 'Resend confirmation email'}
            {(resendState === 'cooldown' || (cooldown > 0 && resendState === 'sent')) &&
              cooldown > 0 && `Resend in ${cooldown}s`}
            {resendState === 'error' && 'Resend confirmation email'}
          </button>

          {/* Resend error */}
          {resendState === 'error' && resendError && (
            <p className="text-red-400 text-xs mb-3">{resendError}</p>
          )}

          {/* Open email app button */}
          {emailApp && (
            <a
              href={emailApp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-lg text-sm font-medium text-white text-center transition-colors mb-4"
              style={{ background: '#FA4500' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e03e00')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FA4500')}
            >
              {emailApp.label}
            </a>
          )}

          {/* Wrong email */}
          <p className="text-zinc-500 text-xs mt-4">
            Wrong email?{' '}
            <Link href="/sign-up" className="text-[#FA4500] hover:underline">
              Sign up again
            </Link>
          </p>
        </motion.div>

        {/* Back to sign in */}
        <p className="text-center mt-6">
          <Link href="/sign-in" className="text-[#FA4500] text-sm hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#FA4500] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
