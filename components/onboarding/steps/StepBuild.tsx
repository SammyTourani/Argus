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
  }, [subStep]);

  const handleRoleSelect = useCallback(
    (roleId: string) => {
      onUpdate({ role: roleId });
      autoAdvanceRef.current = setTimeout(() => setSubStep('usecase'), 400);
    },
    [onUpdate]
  );

  const handleUseCaseSelect = useCallback(
    (useCaseId: string) => {
      onUpdate({ useCase: useCaseId });
      // All use cases go to URL step (URL is optional for "scratch")
      autoAdvanceRef.current = setTimeout(() => setSubStep('url'), 400);
    },
    [onUpdate]
  );

  const handleFinish = useCallback(() => {
    onNext();
  }, [onNext]);

  // Keyboard navigation varies by sub-step
  useKeyboardNav({
    onEnter: subStep === 'url' ? handleFinish : undefined,
    onEscape: onSkip,
  });

  // Sub-step indicator dots
  const SUB_STEPS: SubStep[] = ['role', 'usecase', 'url'];
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
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              [ 01 ] WHO ARE YOU
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              What describes you best?
            </h1>
            <p
              className="text-sm font-mono mb-10 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              This helps Argus personalize your experience.
            </p>

            <motion.div
              className="grid grid-cols-2 gap-16 w-full max-w-lg"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {ROLES.map((role) => {
                const isSelected = data.role === role.id;
                return (
                  <motion.div key={role.id} variants={staggerItem}>
                    <BracketCard
                      selected={isSelected}
                      onClick={() => handleRoleSelect(role.id)}
                      className="w-full"
                    >
                      <pre
                        className="font-mono text-[13px] leading-tight mb-10"
                        style={{
                          color: isSelected ? '#EA580C' : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {role.ascii}
                      </pre>
                      <span
                        className="block font-mono text-sm font-medium mb-2 transition-colors duration-300"
                        style={{
                          color: isSelected ? '#1A1A1A' : '#FFFFFF',
                        }}
                      >
                        {role.label}
                      </span>
                      <span
                        className="block font-mono text-[11px] transition-colors duration-300"
                        style={{
                          color: isSelected
                            ? 'rgba(26,26,26,0.5)'
                            : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {role.description}
                      </span>
                    </BracketCard>
                  </motion.div>
                );
              })}
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
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              [ 02 ] WHAT&apos;S THE GOAL
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              What are you here to do?
            </h1>
            <p
              className="text-sm font-mono mb-10 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Choose your primary use case for Argus.
            </p>

            <motion.div
              className="flex flex-col gap-12 w-full max-w-lg"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {USE_CASES.map((uc) => {
                const isSelected = data.useCase === uc.id;
                return (
                  <motion.div key={uc.id} variants={staggerItem}>
                    <BracketCard
                      selected={isSelected}
                      onClick={() => handleUseCaseSelect(uc.id)}
                      className="w-full"
                    >
                      <div className="flex items-center gap-16">
                        <div
                          className="w-40 h-40 rounded-10 flex items-center justify-center shrink-0 font-mono text-sm font-bold transition-colors duration-300"
                          style={{
                            background: isSelected
                              ? 'rgba(234, 88, 12, 0.1)'
                              : 'rgba(255, 255, 255, 0.15)',
                            border: isSelected
                              ? '1px solid rgba(234, 88, 12, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.2)',
                            color: isSelected ? '#EA580C' : '#FFFFFF',
                          }}
                        >
                          {uc.icon}
                        </div>
                        <div className="text-left">
                          <span
                            className="block font-mono text-sm font-medium mb-1 transition-colors duration-300"
                            style={{
                              color: isSelected ? '#1A1A1A' : '#FFFFFF',
                            }}
                          >
                            {uc.label}
                          </span>
                          <span
                            className="block font-mono text-[11px] transition-colors duration-300"
                            style={{
                              color: isSelected
                                ? 'rgba(26,26,26,0.5)'
                                : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {uc.description}
                          </span>
                        </div>
                      </div>
                    </BracketCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* ─── Sub-step 3: URL + Categories ─── */}
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
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              [ 03 ] {data.useCase === 'scratch' ? 'CONFIGURE' : 'TARGET URL'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
              {data.useCase === 'clone'
                ? 'Paste the URL to clone'
                : data.useCase === 'redesign'
                  ? 'Paste the URL to redesign'
                  : 'Have a reference? (optional)'}
            </h1>
            <p
              className="text-sm font-mono mb-8 max-w-sm"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {data.useCase === 'scratch'
                ? 'Optionally paste a URL for inspiration, then pick a category.'
                : 'Argus will analyze the structure, styles, and layout.'}
            </p>

            {/* URL Input — frosted glass container */}
            <div
              className="w-full max-w-md mb-6 rounded-16 p-16"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div className="relative">
                {/* Globe icon */}
                <div
                  className="absolute left-12 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(0,0,0,0.3)' }}
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
                  className="w-full pl-36 pr-16 py-12 rounded-12 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                />
              </div>

              {/* Preview placeholder */}
              {data.referenceUrl.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-12 rounded-10 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Skeleton browser preview */}
                  <div className="p-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-6 h-6 rounded-full bg-white/20" />
                      <div className="w-6 h-6 rounded-full bg-white/20" />
                      <div className="w-6 h-6 rounded-full bg-white/20" />
                      <div className="flex-1 h-6 rounded-full bg-white/10 ml-8" />
                    </div>
                    <div className="space-y-6">
                      <div className="h-20 rounded bg-white/10 animate-pulse" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-12 rounded bg-white/8 animate-pulse" />
                        <div className="h-12 rounded bg-white/8 animate-pulse" />
                        <div className="h-12 rounded bg-white/8 animate-pulse" />
                      </div>
                      <div className="h-8 rounded bg-white/6 w-2/3 animate-pulse" />
                    </div>
                    <p
                      className="mt-8 font-mono text-[10px] text-center"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Argus will analyze &amp; rebuild in React
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Category chips */}
            <div className="w-full max-w-md mb-10 text-left">
              <label
                className="block font-mono text-[11px] tracking-[0.1em] uppercase mb-6"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                What kind of project?
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
                          ? 'rgba(255, 255, 255, 0.95)'
                          : 'rgba(255, 255, 255, 0.12)',
                      border:
                        data.category === cat
                          ? '1px solid #FFFFFF'
                          : '1px solid rgba(255, 255, 255, 0.2)',
                      color:
                        data.category === cat
                          ? '#EA580C'
                          : 'rgba(255,255,255,0.7)',
                      boxShadow:
                        data.category === cat
                          ? '0 2px 8px rgba(0, 0, 0, 0.1)'
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
              className="px-28 py-16 rounded-16 font-mono text-base font-semibold transition-all hover:bg-white/90 active:scale-[0.98]"
              style={{
                background: '#FFFFFF',
                color: '#EA580C',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
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
                  ? '#FFFFFF'
                  : i < currentSubIdx
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
