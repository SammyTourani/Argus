'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createTeam } from '@/lib/workspace/api';
import { setActiveWorkspace } from '@/lib/workspace/active-workspace';
import type { CreateWorkspaceData } from './types';

interface StepPlanProps {
  data: CreateWorkspaceData;
  onBack: () => void;
  onComplete: () => void;
}

const CHECK_ORANGE = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
    <path d="M5 10.5l3.5 3.5L15 7" stroke="#ff4801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHECK_DIM = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
    <path d="M5 10.5l3.5 3.5L15 7" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    amount: '$0',
    period: 'forever',
    desc: 'No strings.',
    features: ['30 credits / month', 'All 9 AI models', 'Free models after credits run out', 'Download as ZIP', 'Community support'],
    highlight: false,
    checkIcon: CHECK_DIM,
  },
  {
    id: 'pro',
    name: 'Pro',
    amount: '$19',
    period: '/month',
    desc: 'For power builders.',
    features: ['300 credits / month', 'All 9 AI models — use any model', 'Unlimited free models after credits', 'Priority generation queue', 'Push to Vercel in 1 click', 'Email support'],
    highlight: true,
    checkIcon: CHECK_ORANGE,
  },
  {
    id: 'team',
    name: 'Team',
    amount: '$49',
    period: '/month',
    desc: 'Coming soon.',
    features: ['Everything in Pro', '5 team members', 'Shared project library', 'Custom AI model config', 'SSO & audit logs', 'Dedicated support'],
    highlight: false,
    checkIcon: CHECK_DIM,
  },
];

export default function StepPlan({ data, onBack, onComplete }: StepPlanProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1060px', margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '34px',
            fontWeight: 800,
            color: 'var(--fg-100)',
            letterSpacing: '-0.03em',
            marginBottom: '10px',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Choose your plan
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--fg-300)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.01em',
          }}
        >
          All workspaces start on Free. Upgrade anytime.
        </p>
      </div>

      {/* Plan cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          width: '100%',
        }}
      >
        {PLANS.map((plan, i) => (
          <div
            key={plan.id}
            style={{
              background: 'var(--bg-200, #fffbf5)',
              border: plan.highlight
                ? '1.5px solid rgba(255, 72, 1, 0.3)'
                : '1.5px solid var(--border-100)',
              borderRadius: 'var(--radius-xl, 16px)',
              padding: '34px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transition: 'box-shadow 0.3s, transform 0.3s',
              opacity: plan.id === 'team' ? 0.75 : 1,
              boxShadow: plan.highlight
                ? '0 0 40px -10px rgba(250, 93, 25, 0.12)'
                : 'none',
              animation: `fadeInCard 0.4s ease ${0.1 + i * 0.08}s both`,
            }}
          >
            {/* Plan name */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--fg-100)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              {plan.name}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: 'var(--fg-100)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {plan.amount}
              </span>
              <span style={{ fontSize: '16px', color: 'var(--fg-muted)', fontWeight: 400 }}>
                {plan.period}
              </span>
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '15px',
                color: 'var(--fg-300)',
                marginBottom: '24px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.01em',
              }}
            >
              {plan.desc}
            </div>

            {/* CTA button */}
            {plan.id === 'free' && (
              <button
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 'var(--radius-lg, 12px)',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'default',
                  border: '1.5px solid var(--border-100)',
                  background: 'rgba(0, 0, 0, 0.03)',
                  color: 'var(--fg-100)',
                  textAlign: 'center',
                }}
              >
                Included in your plan
              </button>
            )}
            {plan.id === 'pro' && (
              <button
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 'var(--radius-lg, 12px)',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'default',
                  border: 'none',
                  background: 'var(--accent-100)',
                  color: 'white',
                  textAlign: 'center',
                  opacity: 0.5,
                }}
              >
                Upgrade later
              </button>
            )}
            {plan.id === 'team' && (
              <div
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 'var(--radius-lg, 12px)',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'center',
                  border: '1.5px solid var(--border-100)',
                  color: 'var(--fg-muted)',
                }}
              >
                Coming soon
              </div>
            )}

            {/* Feature list */}
            <ul
              style={{
                listStyle: 'none',
                margin: '24px 0 0',
                padding: '20px 0 0',
                borderTop: '1px solid var(--border-100)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: 1,
              }}
            >
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '14px',
                    color: 'var(--fg-200)',
                    lineHeight: 1.4,
                  }}
                >
                  {plan.checkIcon}
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Inline keyframe for card stagger */}
      <style>{`
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Error message */}
      {error && (
        <p
          style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#EF4444',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error}
        </p>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '32px',
        }}
      >
        <button
          onClick={onBack}
          disabled={isCreating}
          style={{
            background: 'none',
            border: 'none',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            color: 'var(--fg-300)',
            padding: '10px 0',
            opacity: isCreating ? 0.4 : 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { if (!isCreating) e.currentTarget.style.color = 'var(--fg-100)'; }}
          onMouseLeave={(e) => { if (!isCreating) e.currentTarget.style.color = 'var(--fg-300)'; }}
        >
          Go back
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          style={{
            padding: '14px 32px',
            borderRadius: 'var(--radius-lg, 12px)',
            border: 'none',
            background: 'var(--accent-100)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: isCreating ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!isCreating) { e.currentTarget.style.background = 'var(--accent-200, #ff7038)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 72, 1, 0.25)'; } }}
          onMouseLeave={(e) => { if (!isCreating) { e.currentTarget.style.background = 'var(--accent-100)'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          {isCreating ? 'Creating...' : 'Create workspace'}
        </button>
      </div>
    </motion.div>
  );
}
