'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/components/onboarding/animations';
import type { CreateWorkspaceData } from './types';

interface StepNameProps {
  data: CreateWorkspaceData;
  onUpdate: (partial: Partial<CreateWorkspaceData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 44);
}

export default function StepName({ data, onUpdate, onNext, onBack }: StepNameProps) {
  const [touched, setTouched] = useState(false);
  const isValid = data.name.trim().length >= 1;
  const slug = slugify(data.name);

  const handleNext = useCallback(() => {
    if (isValid) onNext();
  }, [isValid, onNext]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault();
      onNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
    }
  }, [isValid, onNext, onBack]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Logo */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '20px' }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #ff4801, #ff7038)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255, 72, 1, 0.25)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        custom={0.05}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{
          fontSize: '34px',
          fontWeight: 800,
          color: 'var(--fg-100)',
          letterSpacing: '-0.03em',
          marginBottom: '10px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Create a Workspace
      </motion.h1>

      <motion.p
        custom={0.1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{
          fontSize: '16px',
          color: 'var(--fg-300)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '-0.01em',
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        Create a new place to make projects or collaborate with others.
      </motion.p>

      {/* Name input */}
      <motion.div
        custom={0.15}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: '440px' }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--fg-100)',
            fontFamily: 'var(--font-sans)',
            marginBottom: '8px',
          }}
        >
          Workspace name
        </label>
        <input
          type="text"
          placeholder="Enter workspace name"
          value={data.name}
          onChange={(e) => {
            onUpdate({ name: e.target.value });
            if (!touched) setTouched(true);
          }}
          onKeyDown={handleKeyDown}
          maxLength={100}
          autoFocus
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border-100)',
            background: 'white',
            fontSize: '16px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--fg-100)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 72, 1, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 72, 1, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-100)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {/* Slug preview */}
        {slug && (
          <p
            style={{
              marginTop: '10px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg-muted)',
              letterSpacing: '-0.01em',
            }}
          >
            Slug: <span style={{ color: 'var(--accent-100)' }}>{slug}</span>
            <span style={{ opacity: 0.4 }}>-xxxx</span>
          </p>
        )}
      </motion.div>

      {/* Footer buttons */}
      <motion.div
        custom={0.2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '440px',
          marginTop: '32px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            color: 'var(--fg-300)',
            padding: '10px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg-100)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-300)'; }}
        >
          Go back
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: isValid ? 'var(--accent-100)' : 'rgba(0,0,0,0.06)',
            color: isValid ? 'white' : 'var(--fg-muted)',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (isValid) { e.currentTarget.style.background = 'var(--accent-200)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 72, 1, 0.25)'; } }}
          onMouseLeave={(e) => { if (isValid) { e.currentTarget.style.background = 'var(--accent-100)'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
