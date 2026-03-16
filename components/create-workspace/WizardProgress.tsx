'use client';

import { motion } from 'framer-motion';
import { STEP_LABELS } from './constants';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function WizardProgress({
  currentStep,
  totalSteps,
}: WizardProgressProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-20 px-16 pt-16 pb-8">
      <div className="max-w-xl mx-auto">
        {/* Desktop: labels + bars */}
        <div className="hidden sm:flex items-end gap-8">
          {STEP_LABELS.slice(0, totalSteps).map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            const isFuture = i > currentStep;

            return (
              <div key={step.num} className="flex-1">
                <span
                  className="block font-mono text-[11px] tracking-[0.2em] uppercase mb-6 transition-colors duration-300"
                  style={{
                    color: isActive
                      ? 'var(--fg-100)'
                      : isCompleted
                        ? 'var(--fg-300)'
                        : 'var(--fg-muted)',
                  }}
                >
                  {step.num} {step.label}
                </span>

                <div
                  className="h-6 rounded-full overflow-hidden"
                  style={{ background: 'var(--border-100)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isFuture ? 'transparent' : 'var(--accent-100)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{
                      width: isCompleted
                        ? '100%'
                        : isActive
                          ? '50%'
                          : '0%',
                    }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: bars only */}
        <div className="flex sm:hidden gap-4">
          {STEP_LABELS.slice(0, totalSteps).map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;

            return (
              <div
                key={step.num}
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--border-100)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--accent-100)' }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: isCompleted
                      ? '100%'
                      : isActive
                        ? '50%'
                        : '0%',
                  }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
