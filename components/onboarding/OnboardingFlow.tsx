'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { stepVariants } from './animations';
import { STEP_NAMES } from './constants';
import type { OnboardingData } from './types';
import OnboardingBackground from './shared/OnboardingBackground';
import OnboardingProgress from './shared/OnboardingProgress';
import StepWelcome from './steps/StepWelcome';
import StepBuild from './steps/StepBuild';
import StepModel from './steps/StepModel';
import StepLaunch from './steps/StepLaunch';

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const router = useRouter();

  const [data, setData] = useState<OnboardingData>({
    role: '',
    useCase: '',
    referenceUrl: '',
    projectDescription: '',
    category: '',
    chosenModel: '',
  });

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  // Persist step progress to server (preserving exact API contract)
  const persistStep = useCallback(
    async (stepIndex: number) => {
      try {
        const stepData: Record<string, unknown> = {};

        if (stepIndex >= 1) {
          // Concatenate role + useCase + description for what_to_build
          const parts = [
            data.role ? `[${data.role}]` : '',
            data.useCase ? `[${data.useCase}]` : '',
            data.projectDescription,
          ]
            .filter(Boolean)
            .join(' ');

          stepData.projectDescription = data.projectDescription;
          stepData.referenceUrl = data.referenceUrl;
          stepData.category = data.category;
          stepData.what_to_build = parts || data.projectDescription;
        }
        if (stepIndex >= 2) {
          stepData.chosenModel = data.chosenModel;
          stepData.chosen_model = data.chosenModel;
        }

        await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: STEP_NAMES[stepIndex],
            data: stepData,
          }),
        });
      } catch (err) {
        console.error('[Onboarding] Failed to persist step:', err);
      }
    },
    [data]
  );

  const nextStep = useCallback(async () => {
    if (step < 3) {
      setDirection(1);
      await persistStep(step);
      setStep((s) => s + 1);
    }
  }, [step, persistStep]);

  const handleSkip = useCallback(
    async (stepIndex: number) => {
      // Apply defaults for skipped steps
      if (stepIndex === 1) {
        // Skip build step - leave data empty
      }
      if (stepIndex === 2) {
        // Skip model step - default to Claude Sonnet
        setData((prev) => ({ ...prev, chosenModel: 'claude-sonnet-4-6' }));
        try {
          localStorage.setItem('argus_default_model', 'claude-sonnet-4-6');
        } catch {}
      }
      setDirection(1);
      await persistStep(stepIndex);
      setStep((s) => s + 1);
    },
    [persistStep]
  );

  const handleFinish = useCallback(
    async (projectId: string) => {
      // Mark onboarding complete
      try {
        await fetch('/api/user/onboarding', { method: 'PUT' });
      } catch {}

      // Set cookie so middleware skips onboarding
      try {
        document.cookie =
          'argus_onboarding_done=1; path=/; max-age=31536000; SameSite=Lax';
      } catch {}

      if (projectId) {
        router.push(`/workspace/${projectId}/build/new`);
      } else {
        router.push('/workspace');
      }
    },
    [router]
  );

  return (
    <div
      className="fixed inset-0 z-50 font-mono overflow-hidden"
      style={{ background: '#080808' }}
    >
      {/* Persistent background */}
      <OnboardingBackground />

      {/* Progress bar */}
      <OnboardingProgress currentStep={step} totalSteps={4} />

      {/* Content area */}
      <div className="relative z-10 flex items-center justify-center h-full px-16 pt-48 pb-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-xl"
          >
            {step === 0 && <StepWelcome onNext={nextStep} />}
            {step === 1 && (
              <StepBuild
                data={data}
                onUpdate={updateData}
                onNext={nextStep}
                onSkip={() => handleSkip(1)}
              />
            )}
            {step === 2 && (
              <StepModel
                data={data}
                onUpdate={updateData}
                onNext={nextStep}
                onSkip={() => handleSkip(2)}
              />
            )}
            {step === 3 && <StepLaunch data={data} onFinish={handleFinish} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip link (steps 1 & 2 only) */}
      {(step === 1 || step === 2) && (
        <button
          onClick={() => handleSkip(step)}
          className="fixed bottom-20 right-20 font-mono text-[12px] tracking-[0.1em] uppercase transition-colors z-20 hover:text-heat-100"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          [ SKIP ]
        </button>
      )}
    </div>
  );
}
