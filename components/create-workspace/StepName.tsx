'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/components/onboarding/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        className="mb-8"
      >
        <div
          className="w-32 h-32 rounded-12 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ff4801, #ff7038)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        className="text-2xl font-bold font-mono mb-2 text-center"
        style={{ color: 'var(--fg-100)' }}
      >
        Create a Workspace
      </motion.h1>

      <motion.p
        custom={0.1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-sm mb-24 text-center max-w-sm"
        style={{ color: 'var(--fg-300)' }}
      >
        Create a new place to make projects or collaborate with others.
      </motion.p>

      {/* Name input */}
      <motion.div
        custom={0.15}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        <label
          className="block font-mono text-[12px] tracking-[0.1em] uppercase mb-6"
          style={{ color: 'var(--fg-200)' }}
        >
          Workspace name
        </label>
        <Input
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
          className="w-full"
        />

        {/* Slug preview */}
        {slug && (
          <p
            className="mt-6 font-mono text-[11px]"
            style={{ color: 'var(--fg-muted)' }}
          >
            Slug: <span style={{ color: 'var(--accent-100)' }}>{slug}</span>
            <span style={{ opacity: 0.5 }}>-xxxx</span>
          </p>
        )}
      </motion.div>

      {/* Footer buttons */}
      <motion.div
        custom={0.2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between w-full max-w-sm mt-24"
      >
        <button
          onClick={onBack}
          className="font-mono text-[13px] transition-colors hover:opacity-70"
          style={{ color: 'var(--fg-300)' }}
        >
          Go back
        </button>
        <Button
          variant="orange"
          onClick={handleNext}
          disabled={!isValid}
        >
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
