'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES, USE_CASES, CATEGORIES } from '../constants';
import { subStepVariants, staggerContainer, staggerItem } from '../animations';
import { useKeyboardNav } from '../shared/useKeyboardNav';
import BracketCard from '../shared/BracketCard';
import type { StepProps, SubStep } from '../types';

export default function StepBuild({ data, onUpdate, onNext, onSkip }: StepProps) {
  const [subStep, setSubStep] = useState<SubStep>('role');
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Clean up auto-advance on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // Focus URL input when sub-step becomes 'url'
  useEffect(() => {
    if (subStep === 'url') {
      setTimeout(() => urlInputRef.current?.focus(), 350);
    }
    if (subStep === 'details') {
      setTimeout(() => descRef.current?.focus(), 350);
    }
  }, [subStep]);

  const handleRoleSelect = useCallback(
    (roleId: string) => {
      onUpdate({ role: roleId });
      // Auto-advance after selection
      autoAdvanceRef.current = setTimeout(() => setSubStep('usecase'), 400);
    },
    [onUpdate]
  );

  const handleUseCaseSelect = useCallback(
    (useCaseId: string) => {
      onUpdate({ useCase: useCaseId });
      const uc = USE_CASES.find((u) => u.id === useCaseId);
      autoAdvanceRef.current = setTimeout(() => {
        if (uc?.showsUrl) {
          setSubStep('url');
        } else {
          setSubStep('details');
        }
      }, 400);
    },
    [onUpdate]
  );

  const handleUrlContinue = useCallback(() => {
    setSubStep('details');
  }, []);

  const handleFinish = useCallback(() => {
    onNext();
  }, [onNext]);

  const canFinish = data.projectDescription.trim().length > 0;

  // Keyboard navigation varies by sub-step
  useKeyboardNav({
    onEnter:
      subStep === 'url'
        ? handleUrlContinue
        : subStep === 'details' && canFinish
          ? handleFinish
          : undefined,
    onEscape: onSkip,
  });

  // Sub-step indicator dots
  const SUB_STEPS: SubStep[] = ['role', 'usecase', 'url', 'details'];
  const currentSubIdx = SUB_STEPS.indexOf(subStep);

  return (
    <div className="flex flex-col items-center w-full">
      <AnimatePresence mode="wait">
        {/* ─── Sub-step 1: Role Selection ─── */}
        {subStep === 'role' && (
          <motion.div
            key="role"
            variants={subStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center w-full"
          >
            <span
              className="font-mono text-[12px] tracking-[0.2em] uppercase mb-6"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              [ 01 ] WHO ARE YOU
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              What describes you best?
            </h1>
            <p
              className="text-sm font-mono mb-10 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              This helps Argus personalize your experience.
            </p>

            <motion.div
              className="grid grid-cols-2 gap-16 w-full max-w-lg"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {ROLES.map((role) => (
                <motion.div key={role.id} variants={staggerItem}>
                  <BracketCard
                    selected={data.role === role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="w-full"
                  >
                    <pre
                      className="font-mono text-[13px] leading-tight mb-10"
                      style={{ color: '#FA5D19' }}
                    >
                      {role.ascii}
                    </pre>
                    <span className="block font-mono text-sm font-medium text-white mb-2">
                      {role.label}
                    </span>
                    <span
                      className="block font-mono text-[11px]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {role.description}
                    </span>
                  </BracketCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ─── Sub-step 2: Use Case ─── */}
        {subStep === 'usecase' && (
          <motion.div
            key="usecase"
            variants={subStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center w-full"
          >
            <span
              className="font-mono text-[12px] tracking-[0.2em] uppercase mb-6"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              [ 02 ] WHAT&apos;S THE GOAL
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              What are you here to do?
            </h1>
            <p
              className="text-sm font-mono mb-10 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Choose your primary use case for Argus.
            </p>

            <motion.div
              className="flex flex-col gap-12 w-full max-w-lg"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {USE_CASES.map((uc) => (
                <motion.div key={uc.id} variants={staggerItem}>
                  <BracketCard
                    selected={data.useCase === uc.id}
                    onClick={() => handleUseCaseSelect(uc.id)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-16">
                      <div
                        className="w-40 h-40 rounded-10 flex items-center justify-center shrink-0 font-mono text-sm font-bold"
                        style={{
                          background: 'rgba(250, 93, 25, 0.1)',
                          border: '1px solid rgba(250, 93, 25, 0.2)',
                          color: '#FA5D19',
                        }}
                      >
                        {uc.icon}
                      </div>
                      <div className="text-left">
                        <span className="block font-mono text-sm font-medium text-white mb-1">
                          {uc.label}
                        </span>
                        <span
                          className="block font-mono text-[11px]"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                        >
                          {uc.description}
                        </span>
                      </div>
                    </div>
                  </BracketCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ─── Sub-step 3: URL Input ─── */}
        {subStep === 'url' && (
          <motion.div
            key="url"
            variants={subStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center w-full"
          >
            <span
              className="font-mono text-[12px] tracking-[0.2em] uppercase mb-6"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              [ 03 ] TARGET URL
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              {data.useCase === 'clone'
                ? 'Paste the URL to clone'
                : 'Paste the URL to redesign'}
            </h1>
            <p
              className="text-sm font-mono mb-10 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Argus will analyze the structure, styles, and layout.
            </p>

            <div className="w-full max-w-md mb-8">
              <div className="relative">
                {/* Globe icon */}
                <div
                  className="absolute left-12 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  >
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M1.5 8h13M8 1.5c-2.5 3-2.5 10 0 13M8 1.5c2.5 3 2.5 10 0 13" />
                  </svg>
                </div>
                <input
                  ref={urlInputRef}
                  type="url"
                  value={data.referenceUrl}
                  onChange={(e) => onUpdate({ referenceUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full pl-36 pr-16 py-14 rounded-12 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#FA5D19]/50 transition-all"
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleUrlContinue}
              className="px-24 py-14 rounded-12 font-mono text-label-large text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#FA5D19' }}
            >
              Continue &rarr;
            </button>
          </motion.div>
        )}

        {/* ─── Sub-step 4: Details ─── */}
        {subStep === 'details' && (
          <motion.div
            key="details"
            variants={subStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center w-full"
          >
            <span
              className="font-mono text-[12px] tracking-[0.2em] uppercase mb-6"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              [ 04 ] DETAILS
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              Tell us about your project
            </h1>
            <p
              className="text-sm font-mono mb-8 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              A brief description to help Argus get you started.
            </p>

            {/* Project description */}
            <div className="w-full max-w-md mb-10 text-left">
              <label
                className="block font-mono text-[11px] tracking-[0.1em] uppercase mb-6"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Describe your project
              </label>
              <textarea
                ref={descRef}
                value={data.projectDescription}
                onChange={(e) => onUpdate({ projectDescription: e.target.value })}
                placeholder="e.g. A dashboard for tracking my SaaS metrics..."
                rows={3}
                maxLength={500}
                className="w-full px-16 py-12 rounded-12 text-sm font-mono text-white placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-[#FA5D19]/50 transition-all"
                style={{
                  background: '#1A1A1A',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>

            {/* Category chips */}
            <div className="w-full max-w-md mb-10 text-left">
              <label
                className="block font-mono text-[11px] tracking-[0.1em] uppercase mb-6"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Category
              </label>
              <div className="flex flex-wrap gap-8">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      onUpdate({ category: data.category === cat ? '' : cat })
                    }
                    className="px-14 py-6 rounded-full text-[12px] font-mono transition-all"
                    style={{
                      background:
                        data.category === cat
                          ? 'rgba(250, 93, 25, 0.12)'
                          : 'rgba(255, 255, 255, 0.04)',
                      border:
                        data.category === cat
                          ? '1px solid #FA5D19'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                      color:
                        data.category === cat
                          ? '#FA5D19'
                          : 'rgba(255,255,255,0.4)',
                      boxShadow:
                        data.category === cat
                          ? '0 0 12px rgba(250, 93, 25, 0.1)'
                          : 'none',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={!canFinish}
              className="px-24 py-14 rounded-12 font-mono text-label-large text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: '#FA5D19',
                boxShadow: canFinish
                  ? '0 0 20px rgba(250, 93, 25, 0.2)'
                  : 'none',
              }}
            >
              Continue &rarr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-step progress dots */}
      <div className="flex gap-6 justify-center mt-12">
        {SUB_STEPS.map((s, i) => (
          <div
            key={s}
            className="w-5 h-5 rounded-full transition-all duration-300"
            style={{
              background:
                i === currentSubIdx
                  ? '#FA5D19'
                  : i < currentSubIdx
                    ? 'rgba(250, 93, 25, 0.4)'
                    : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
