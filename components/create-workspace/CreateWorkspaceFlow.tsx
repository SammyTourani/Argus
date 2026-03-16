'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { stepVariants } from '@/components/onboarding/animations';
import type { CreateWorkspaceData } from './types';
import WizardProgress from './WizardProgress';
import StepName from './StepName';
import StepPlan from './StepPlan';

export default function CreateWorkspaceFlow() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const router = useRouter();

  const [data, setData] = useState<CreateWorkspaceData>({
    name: '',
  });

  const updateData = useCallback((partial: Partial<CreateWorkspaceData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const nextStep = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const prevStep = useCallback(() => {
    if (step === 0) {
      router.push('/workspace');
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step, router]);

  const handleComplete = useCallback(() => {
    router.push('/workspace');
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 font-mono overflow-hidden"
      style={{ background: 'var(--bg-100)' }}
    >
      {/* Progress bar */}
      <WizardProgress currentStep={step} totalSteps={2} />

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
            className="w-full max-w-2xl"
          >
            {step === 0 && (
              <StepName
                data={data}
                onUpdate={updateData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {step === 1 && (
              <StepPlan
                data={data}
                onBack={prevStep}
                onComplete={handleComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
