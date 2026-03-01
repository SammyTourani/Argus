'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import TextScramble from '@/components/landing/TextScramble';
import { EYE_FRAMES, SPINNER, STATUS_MESSAGES } from '../constants';
import { useKeyboardNav } from '../shared/useKeyboardNav';

const WELCOME_PHRASES = ['WELCOME TO ARGUS'] as const;

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const subtitleRef = useRef(false);

  const fullSubtitle = 'The AI that sees any website and rebuilds it.';

  useKeyboardNav({ onEnter: showCta ? onNext : undefined });

  // ASCII eye animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % EYE_FRAMES.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

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

  // Braille spinner
  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % SPINNER.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Status message cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Show CTA after delay
  useEffect(() => {
    const timeout = setTimeout(() => setShowCta(true), 2200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      {/* ASCII Eye */}
      <motion.pre
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-base leading-tight mb-12 hidden sm:block"
        style={{
          color: '#FA5D19',
          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
        }}
      >
        {EYE_FRAMES[frameIndex]}
      </motion.pre>

      {/* Mobile: smaller eye */}
      <motion.pre
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-[10px] leading-tight mb-6 sm:hidden"
        style={{
          color: '#FA5D19',
          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
        }}
      >
        {EYE_FRAMES[frameIndex]}
      </motion.pre>

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
        className="text-sm sm:text-base max-w-md mb-8 font-body"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        {subtitle}
        {subtitle.length < fullSubtitle.length && (
          <span className="animate-typing-cursor">&nbsp;</span>
        )}
      </motion.p>

      {/* Status bar with spinner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
        className="flex items-center gap-12 mb-10"
      >
        <span
          className="font-mono text-[12px]"
          style={{ color: '#FA5D19' }}
        >
          {SPINNER[spinnerIdx]}
        </span>
        <span
          className="font-mono text-[12px] tracking-[0.1em] uppercase"
          style={{ color: 'rgba(250, 93, 25, 0.6)' }}
        >
          {STATUS_MESSAGES[statusIdx]}
        </span>
      </motion.div>

      {/* CTA Button */}
      {showCta && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={onNext}
          className="px-24 py-14 rounded-12 font-mono text-label-large text-white transition-all hover:opacity-90 active:scale-[0.98] heat-glow"
          style={{ background: '#FA5D19' }}
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
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          press enter
        </motion.span>
      )}
    </div>
  );
}
