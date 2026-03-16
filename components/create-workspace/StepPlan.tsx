'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/components/onboarding/animations';
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
    <path d="M5 10.5l3.5 3.5L15 7" stroke="rgba(82,16,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    amount: '$0',
    period: 'forever',
    desc: 'No strings.',
    features: ['3 builds / 30 days', 'All 8 style transforms', 'Download as ZIP', 'Community support'],
    highlight: false,
    checkIcon: CHECK_DIM,
  },
  {
    id: 'pro',
    name: 'Pro',
    amount: '$19',
    period: '/month',
    desc: 'For power builders.',
    features: ['Unlimited builds', 'All AI models (GPT-4o, Claude, Gemini)', 'Priority generation queue', 'Push to Vercel in 1 click', 'Brand extraction mode', 'Email support'],
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
    <div className="flex flex-col items-center w-full">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ textAlign: 'center', marginBottom: '44px' }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--fg-muted)',
            marginBottom: '12px',
          }}
        >
          [ workspace ]
        </div>
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
      </motion.div>

      {/* Plan cards grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          width: '100%',
          maxWidth: '960px',
        }}
      >
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            variants={staggerItem}
            style={{
              background: 'white',
              border: plan.highlight
                ? '1.5px solid rgba(255, 72, 1, 0.3)'
                : '1.5px solid var(--border-100)',
              borderRadius: 'var(--radius-xl)',
              padding: '34px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transition: 'box-shadow 0.3s, transform 0.3s',
              opacity: plan.id === 'team' ? 0.82 : 1,
              boxShadow: plan.highlight
                ? '0 0 40px -10px rgba(250, 93, 25, 0.12)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = plan.highlight
                ? '0 0 40px -10px rgba(250, 93, 25, 0.18), 0 4px 24px rgba(82, 16, 0, 0.06)'
                : '0 4px 24px rgba(82, 16, 0, 0.06)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = plan.highlight
                ? '0 0 40px -10px rgba(250, 93, 25, 0.12)'
                : 'none';
              e.currentTarget.style.transform = 'translateY(0)';
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
                  fontSize: '50px',
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
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'default',
                  border: '1.5px solid var(--border-100)',
                  background: 'rgba(0, 0, 0, 0.03)',
                  color: 'var(--fg-100)',
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
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--accent-100)',
                  color: 'white',
                  transition: 'all 0.2s',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              >
                Upgrade later
              </button>
            )}
            {plan.id === 'team' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--border-100)',
                    background: 'white',
                    fontSize: '14px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--fg-muted)',
                  }}
                >
                  Coming soon
                </div>
              </div>
            )}

            {/* Feature list */}
            <ul
              style={{
                listStyle: 'none',
                margin: '24px 0 0',
                padding: '20px 0 0',
                borderTop: '1px solid var(--bg-300, #fff5eb)',
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
                    fontSize: '14.5px',
                    color: 'var(--fg-200)',
                    lineHeight: 1.4,
                  }}
                >
                  {plan.checkIcon}
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#EF4444',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
          }}
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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '960px',
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
            borderRadius: 'var(--radius-lg)',
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
          onMouseEnter={(e) => { if (!isCreating) { e.currentTarget.style.background = 'var(--accent-200)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 72, 1, 0.25)'; } }}
          onMouseLeave={(e) => { if (!isCreating) { e.currentTarget.style.background = 'var(--accent-100)'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          {isCreating ? 'Creating...' : 'Create workspace'}
        </button>
      </motion.div>
    </div>
  );
}
