'use client';

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        padding: '16px 16px 8px',
        background: 'var(--bg-100)',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Desktop: labels + bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {STEP_LABELS.slice(0, totalSteps).map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;

            return (
              <div key={step.num} style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    transition: 'color 0.3s',
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
                  style={{
                    height: '3px',
                    borderRadius: '99px',
                    overflow: 'hidden',
                    background: 'var(--border-100)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '99px',
                      background: (isCompleted || isActive) ? 'var(--accent-100)' : 'transparent',
                      width: isCompleted ? '100%' : isActive ? '50%' : '0%',
                      transition: 'width 0.5s ease-in-out',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
