'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import GradientOrbs from '@/components/landing/GradientOrbs';
import TextScramble from '@/components/landing/TextScramble';

interface InviteLandingProps {
  referrerName: string;
  referrerInitial: string;
  referrerAvatarUrl: string | null;
  referralCode: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

const VALUE_PHRASES = [
  'Clone any website with AI',
  '9 AI models. One click.',
  'From URL to code in seconds',
];

export default function InviteLanding({
  referrerName,
  referrerInitial,
  referrerAvatarUrl,
  referralCode,
}: InviteLandingProps) {
  const firstName = referrerName.split(' ')[0];
  const signupUrl = `/sign-up?ref=${encodeURIComponent(referralCode)}`;

  return (
    <div className="min-h-screen bg-[var(--background-base,#080808)] relative overflow-hidden">
      {/* Ambient glow */}
      <GradientOrbs />

      {/* Subtle eye texture */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/argus-assets/official_eye.png"
          alt=""
          aria-hidden="true"
          className="w-[600px] h-[600px] object-contain opacity-[0.06] mix-blend-screen"
          style={{ filter: 'brightness(1.5)' }}
        />
      </div>

      {/* Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Argus wordmark */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-16"
          >
            <Link href="/">
              <span className="font-mono text-label-large tracking-[0.08em] text-heat-100 font-bold">
                ARGUS
              </span>
            </Link>
          </motion.div>

          {/* Referrer avatar + invite heading */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col items-center mb-8"
          >
            {referrerAvatarUrl ? (
              <img
                src={referrerAvatarUrl}
                alt={referrerName}
                className="w-14 h-14 rounded-full mb-5 ring-2 ring-heat-100/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full mb-5 flex items-center justify-center text-white text-xl font-bold ring-2 ring-heat-100/30 bg-gradient-to-br from-heat-100 to-[var(--heat-200,#ff6600)]">
                {referrerInitial}
              </div>
            )}
            <h1 className="text-title-h4 sm:text-title-h3 font-mono text-white leading-tight">
              {firstName} invited you to try Argus
            </h1>
          </motion.div>

          {/* Value prop scramble */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-10"
          >
            <TextScramble
              phrases={VALUE_PHRASES}
              className="text-body-large text-white/50"
              speed={30}
              revealDelay={4000}
            />
          </motion.div>

          {/* Bonus card */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-10 mx-auto max-w-sm"
          >
            <div className="rounded-xl px-6 py-4 text-center bg-heat-4 border border-heat-100/15">
              <p className="text-body-medium text-white/80">
                Sign up and get{' '}
                <span className="text-white font-semibold">40 credits</span>
              </p>
              <p className="text-body-small text-heat-100 mt-1">
                10 bonus from {firstName}&apos;s invite
              </p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex flex-col items-center gap-4"
          >
            <Link
              href={signupUrl}
              className="inline-block w-full max-w-xs text-center text-white text-label-medium font-semibold py-3.5 px-8 rounded-[10px] bg-heat-100 shadow-[0_1px_6px_rgba(250,69,0,0.25)] transition-all duration-150 active:scale-[0.97] hover:brightness-110"
            >
              Create free account
            </Link>
            <Link
              href="/"
              className="text-body-small text-white/40 hover:text-white/60 transition-colors duration-150"
            >
              Learn more about Argus &rarr;
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
