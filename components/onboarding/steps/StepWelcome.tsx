'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TextScramble from '@/components/landing/TextScramble';
import { useKeyboardNav } from '../shared/useKeyboardNav';

const WELCOME_PHRASES = ['WELCOME TO ARGUS'] as const;

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  const [subtitle, setSubtitle] = useState('');
  const [showCta, setShowCta] = useState(false);
  const subtitleRef = useRef(false);

  const fullSubtitle = 'The AI that sees any website and rebuilds it.';

  useKeyboardNav({ onEnter: showCta ? onNext : undefined });

  // Typewriter subtitle
  useEffect(() => {
    if (subtitleRef.current) return;
    subtitleRef.current = true;

    let i = 0;
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setSubtitle(fullSubtitle.slice(0, i));
        if (i >= fullSubtitle.length) {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }, 1200);
    return () => clearTimeout(delay);
  }, []);

  // Show CTA after delay
  useEffect(() => {
    const timeout = setTimeout(() => setShowCta(true), 2200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated SVG Eye */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-10"
      >
        <svg
          width="120"
          height="70"
          viewBox="0 0 120 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Eye outer shape */}
          <path
            d="M10 35 Q60 0 110 35 Q60 70 10 35Z"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Iris circle */}
          <circle
            cx="60"
            cy="35"
            r="16"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
          {/* Pupil with scanning animation */}
          <motion.circle
            cx="60"
            cy="35"
            r="7"
            fill="white"
            animate={{ cx: [57, 63, 57] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Light reflection */}
          <circle cx="66" cy="30" r="3" fill="white" opacity="0.4" />
        </svg>
      </motion.div>

      {/* TextScramble headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-3xl sm:text-4xl font-bold font-mono text-white mb-4"
      >
        <TextScramble
          phrases={WELCOME_PHRASES as unknown as string[]}
          speed={25}
          revealDelay={999999}
        />
      </motion.h1>

      {/* Typewriter subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
        className="text-sm sm:text-base max-w-md mb-10 font-body"
        style={{ color: 'rgba(255,255,255,0.8)' }}
      >
        {subtitle}
        {subtitle.length < fullSubtitle.length && (
          <span className="animate-typing-cursor">&nbsp;</span>
        )}
      </motion.p>

      {/* CTA Button — white on orange */}
      {showCta && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={onNext}
          className="px-28 py-16 rounded-16 font-mono text-base font-semibold transition-all hover:bg-white/90 active:scale-[0.98]"
          style={{
            background: '#FFFFFF',
            color: '#EA580C',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          Initialize &rarr;
        </motion.button>
      )}

      {/* Keyboard hint */}
      {showCta && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 font-mono text-[11px] tracking-[0.1em] uppercase"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          press enter
        </motion.span>
      )}
    </div>
  );
}
