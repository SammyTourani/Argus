'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/components/onboarding/animations';
import { useKeyboardNav } from '@/components/onboarding/shared/useKeyboardNav';
import { Button } from '@/components/ui/button';
import { createTeam } from '@/lib/workspace/api';
import { setActiveWorkspace } from '@/lib/workspace/active-workspace';
import { PLANS } from './constants';
import type { CreateWorkspaceData } from './types';

interface StepPlanProps {
  data: CreateWorkspaceData;
  onBack: () => void;
  onComplete: () => void;
}

export default function StepPlan({ data, onBack, onComplete }: StepPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError('');

    try {
      const result = await createTeam(data.name.trim());
      const team = result as Record<string, unknown>;
      if (!team?.id || !team?.name) {
        throw new Error('Invalid response from server');
      }
      setActiveWorkspace({ id: String(team.id), name: String(team.name) });
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(message);
      setIsCreating(false);
    }
  }, [data.name, isCreating, onComplete]);

  useKeyboardNav({
    onEnter: handleCreate,
    onEscape: onBack,
  });

  return (
    <div className="flex flex-col items-center w-full">
      {/* Heading */}
      <motion.h1
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-2xl font-bold font-mono mb-2 text-center"
        style={{ color: 'var(--fg-100)' }}
      >
        Choose a plan
      </motion.h1>

      <motion.p
        custom={0.05}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-sm mb-24 text-center"
        style={{ color: 'var(--fg-300)' }}
      >
        All workspaces start on Free. Upgrade anytime.
      </motion.p>

      {/* Plan cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-12 w-full max-w-2xl"
      >
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <motion.button
              key={plan.id}
              variants={staggerItem}
              onClick={() => setSelectedPlan(plan.id)}
              className="text-left rounded-16 p-16 transition-all duration-200 relative"
              style={{
                border: isSelected
                  ? '2px solid var(--accent-100)'
                  : '1px solid var(--border-100)',
                background: isSelected
                  ? 'var(--bg-200)'
                  : 'var(--bg-100)',
                boxShadow: isSelected
                  ? '0 0 24px rgba(255, 72, 1, 0.08)'
                  : 'none',
                padding: isSelected ? '15px' : '16px', // compensate border width
              }}
            >
              {/* Badge (hidden when selected to avoid overlap with checkmark) */}
              {plan.badge && !isSelected && (
                <span
                  className="absolute top-10 right-10 font-mono text-[9px] tracking-[0.1em] uppercase px-6 py-2 rounded-full"
                  style={{
                    background: 'var(--border-100)',
                    color: 'var(--fg-300)',
                  }}
                >
                  {plan.badge}
                </span>
              )}

              {/* Selected check */}
              {isSelected && (
                <span
                  className="absolute top-10 right-10 w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-100)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M3 8.5l3.5 3.5L13 5" />
                  </svg>
                </span>
              )}

              {/* Recommended star */}
              {plan.recommended && (
                <span
                  className="font-mono text-[9px] tracking-[0.1em] uppercase mb-6 inline-block px-6 py-2 rounded-full"
                  style={{
                    background: 'rgba(255, 72, 1, 0.1)',
                    color: 'var(--accent-100)',
                  }}
                >
                  Recommended
                </span>
              )}

              <div
                className="font-mono text-[13px] font-bold uppercase tracking-[0.05em] mb-4"
                style={{ color: 'var(--fg-100)' }}
              >
                {plan.name}
              </div>

              <div
                className="font-mono text-xl font-bold mb-12"
                style={{ color: 'var(--fg-100)' }}
              >
                {plan.price}
              </div>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-6 text-[12px]"
                    style={{ color: 'var(--fg-200)' }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-1 flex-shrink-0"
                      style={{ color: isSelected ? 'var(--accent-100)' : 'var(--fg-muted)' }}
                    >
                      <path d="M3 8.5l3.5 3.5L13 5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 text-sm text-center"
          style={{ color: '#EF4444' }}
        >
          {error}
        </motion.p>
      )}

      {/* Footer */}
      <motion.div
        custom={0.2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between w-full max-w-2xl mt-24"
      >
        <button
          onClick={onBack}
          disabled={isCreating}
          className="font-mono text-[13px] transition-colors hover:opacity-70 disabled:opacity-40"
          style={{ color: 'var(--fg-300)' }}
        >
          Go back
        </button>
        <Button
          variant="orange"
          size="lg"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <span className="flex items-center gap-6">
              <svg className="animate-spin h-16 w-16" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            'Create workspace'
          )}
        </Button>
      </motion.div>
    </div>
  );
}
