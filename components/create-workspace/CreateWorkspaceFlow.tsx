'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import type { CreateWorkspaceData } from './types';
import WizardProgress from './WizardProgress';
import StepName from './StepName';
import StepPlan from './StepPlan';

export default function CreateWorkspaceFlow() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const [data, setData] = useState<CreateWorkspaceData>({
    name: '',
    emoji: '',
    description: '',
  });

  const updateData = useCallback((partial: Partial<CreateWorkspaceData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const nextStep = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const prevStep = useCallback(() => {
    if (step === 0) {
      router.push('/workspace');
      return;
    }
    setStep((s) => s - 1);
  }, [step, router]);

  const handleComplete = useCallback(() => {
    router.push('/workspace');
  }, [router]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'var(--bg-100)',
        overflow: 'auto',
      }}
    >
      {/* Progress bar */}
      <WizardProgress currentStep={step} totalSteps={2} />

      {/* Content area — uses CSS transition instead of framer-motion for performance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: '80px 24px 40px',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepName
              key="name"
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {step === 1 && (
            <StepPlan
              key="plan"
              data={data}
              onBack={prevStep}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
