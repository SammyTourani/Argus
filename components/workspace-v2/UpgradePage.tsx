'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AsciiCanvasBackground from './AsciiCanvasBackground';
import { useSubscription } from '@/hooks/use-subscription';
import { getActiveWorkspace } from '@/lib/workspace/active-workspace';
import type { SubscriptionTier } from '@/lib/subscription/gate';

const CHECK_MUTED = (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHECK_ACCENT = (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface PlanConfig {
  name: string;
  price: string;
  period: string;
  description: string;
  tier: SubscriptionTier;
  features: { text: string; accent: boolean }[];
  highlight?: boolean;
  waitlist?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'No strings.',
    tier: 'free',
    features: [
      { text: '30 credits / month', accent: false },
      { text: 'All 8 style transforms', accent: false },
      { text: 'Download as ZIP', accent: false },
      { text: 'Community support', accent: false },
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For power builders.',
    tier: 'pro',
    highlight: true,
    features: [
      { text: '300 credits / month', accent: true },
      { text: 'All 9 AI models \u2014 use any model', accent: true },
      { text: 'Priority generation queue', accent: true },
      { text: 'Push to Vercel in 1 click', accent: true },
      { text: 'Brand extraction mode', accent: true },
      { text: 'Email support', accent: true },
    ],
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'Coming soon.',
    tier: 'team',
    waitlist: true,
    features: [
      { text: 'Everything in Pro', accent: false },
      { text: '5 team members', accent: false },
      { text: 'Shared project library', accent: false },
      { text: 'Custom AI model config', accent: false },
      { text: 'SSO & audit logs', accent: false },
      { text: 'Dedicated support', accent: false },
    ],
  },
];

const TIER_ORDER: Record<string, number> = { free: 0, pro: 1, team: 2, enterprise: 2 };

function PricingCardSkeleton() {
  return (
    <div className="pricing-card" style={{ minHeight: 420 }}>
      <div style={{ height: 28, width: 60, background: 'var(--border-100)', borderRadius: 6, marginBottom: 12 }} className="animate-pulse" />
      <div style={{ height: 48, width: 100, background: 'var(--border-100)', borderRadius: 6, marginBottom: 8 }} className="animate-pulse" />
      <div style={{ height: 16, width: 120, background: 'var(--border-100)', borderRadius: 4, marginBottom: 24 }} className="animate-pulse" />
      <div style={{ height: 48, width: '100%', background: 'var(--border-100)', borderRadius: 10, marginBottom: 24 }} className="animate-pulse" />
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height: 14, width: `${60 + i * 10}%`, background: 'var(--border-100)', borderRadius: 4, marginBottom: 10 }} className="animate-pulse" />
      ))}
    </div>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const subscription = useSubscription();
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const currentTierIndex = TIER_ORDER[subscription.tier] ?? 0;
  const activeWorkspace = typeof window !== 'undefined' ? getActiveWorkspace() : { id: 'personal', name: 'Personal' };

  const handleWaitlistSubmit = () => {
    if (!waitlistEmail) return;
    setWaitlistSubmitted(true);
    setTimeout(() => {
      setWaitlistSubmitted(false);
      setWaitlistEmail('');
    }, 3000);
  };

  const getCtaContent = (planIndex: number, plan: PlanConfig) => {
    if (planIndex === currentTierIndex) {
      return { text: 'Current Plan', disabled: true };
    }
    if (planIndex < currentTierIndex) {
      return { text: 'Included in your plan', disabled: true };
    }
    if (plan.tier === 'free') {
      return { text: 'Start for free', disabled: false };
    }
    if (plan.tier === 'pro') {
      return { text: 'Go Pro', disabled: false };
    }
    return null; // Team uses waitlist form
  };

  const handleCtaClick = (plan: PlanConfig) => {
    if (plan.tier === 'free') {
      router.push('/workspace');
    } else if (plan.tier === 'pro') {
      subscription.openUpgrade('pro');
    }
  };

  const subtitle = subscription.loading
    ? 'Start building for free. Upgrade when you need more.'
    : subscription.tier !== 'free'
      ? `You\u2019re on the ${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan. See what\u2019s available.`
      : 'Start building for free. Upgrade when you need more.';

  return (
    <>
      <a href="/workspace" className="back-btn">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back to workspace
      </a>

      <AsciiCanvasBackground />

      <div className="pricing-overlay">
        <div className="pricing-panel">
          <div className="pricing-header">
            <div className="pricing-label">[ upgrade ]</div>
            <h1 className="pricing-title">Choose your plan</h1>
            <p className="pricing-subtitle">{subtitle}</p>
            {activeWorkspace.id !== 'personal' && !subscription.loading && (
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                Workspace: {activeWorkspace.name}
              </p>
            )}
          </div>

          <div className="pricing-grid">
            {subscription.loading ? (
              <>
                <PricingCardSkeleton />
                <PricingCardSkeleton />
                <PricingCardSkeleton />
              </>
            ) : (
              PLANS.map((plan, i) => {
                const isCurrent = i === currentTierIndex;
                const isIncluded = i < currentTierIndex;
                const cta = getCtaContent(i, plan);

                return (
                  <div
                    key={plan.name}
                    className={[
                      'pricing-card',
                      plan.highlight && !isCurrent ? 'highlight' : '',
                      isCurrent ? 'current-plan' : '',
                      plan.waitlist && !isCurrent ? 'waitlist' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {isCurrent && <span className="current-plan-badge">Current plan</span>}
                    {plan.highlight && !isCurrent && <span className="popular-badge">Most popular</span>}

                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-price">
                      <span className="amount">{plan.price}</span>
                      <span className="period">{plan.period}</span>
                    </div>
                    <p className="plan-desc">{plan.description}</p>

                    {/* CTA or waitlist form */}
                    {plan.waitlist && !isCurrent && !isIncluded ? (
                      <>
                        {waitlistSubmitted ? (
                          <div className="waitlist-success" style={{ display: 'block' }}>You&apos;re on the list!</div>
                        ) : (
                          <div className="waitlist-form" style={{ display: 'flex' }}>
                            <input
                              type="email"
                              placeholder="you@email.com"
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                            />
                            <button type="button" onClick={handleWaitlistSubmit}>Join waitlist</button>
                          </div>
                        )}
                      </>
                    ) : cta ? (
                      <button
                        className={`plan-cta ${plan.highlight && !cta.disabled ? 'primary' : 'outline'} ${cta.disabled ? 'disabled' : ''}`}
                        disabled={cta.disabled}
                        onClick={() => !cta.disabled && handleCtaClick(plan)}
                      >
                        {cta.text}
                      </button>
                    ) : null}

                    <ul className="feature-list">
                      {plan.features.map((f) => (
                        <li key={f.text}>
                          {f.accent ? CHECK_ACCENT : CHECK_MUTED}
                          {' '}{f.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
