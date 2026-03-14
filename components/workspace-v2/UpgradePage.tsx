// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';
import AsciiCanvasBackground from './AsciiCanvasBackground';
import { createCheckoutSession } from './workspace-api';

export default function UpgradePage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    var form = document.getElementById('waitlistForm') as HTMLElement | null;
    var emailInput = document.getElementById('waitlistEmail') as HTMLInputElement | null;
    var btn = document.getElementById('waitlistBtn') as HTMLElement | null;
    var success = document.getElementById('waitlistSuccess') as HTMLElement | null;

    var timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (!btn) return;

    var clickHandler = function() {
      if (!emailInput!.value || !emailInput!.validity.valid) {
        emailInput!.focus();
        return;
      }
      form!.style.display = 'none';
      success!.style.display = 'block';
      timeoutId = setTimeout(function() {
        success!.style.display = 'none';
        form!.style.display = 'flex';
        emailInput!.value = '';
      }, 3000);
    };

    btn.addEventListener('click', clickHandler);

    // Wire "Go Pro" CTA
    var goProBtn = document.querySelector('.pricing-card.highlight .plan-cta.primary');
    function handleGoPro() {
      createCheckoutSession('pro').then(function(url) {
        if (url) window.location.href = url;
      }).catch(function() {});
    }
    if (goProBtn) goProBtn.addEventListener('click', handleGoPro);

    // Wire "Start for free" CTA
    var freeBtn = document.querySelector('.pricing-card:not(.highlight):not(.waitlist) .plan-cta.outline');
    function handleFree() { window.location.href = '/workspace'; }
    if (freeBtn) freeBtn.addEventListener('click', handleFree);

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (btn) {
        btn.removeEventListener('click', clickHandler);
      }
      if (goProBtn) goProBtn.removeEventListener('click', handleGoPro);
      if (freeBtn) freeBtn.removeEventListener('click', handleFree);
    };
  }, []);

  return (
    <>
      {/* Back navigation */}
      <a href="/workspace" className="back-btn">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back to workspace
      </a>

      {/* ASCII animated background */}
      <AsciiCanvasBackground />

      {/* Pricing content overlay */}
      <div className="pricing-overlay">
        <div className="pricing-panel">
          <div className="pricing-header">
            <div className="pricing-label">[ upgrade ]</div>
            <h1 className="pricing-title">Choose your plan</h1>
            <p className="pricing-subtitle">Start building for free. Upgrade when you need more.</p>
          </div>

          <div className="pricing-grid">
            {/* FREE */}
            <div className="pricing-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">
                <span className="amount">$0</span>
                <span className="period">forever</span>
              </div>
              <p className="plan-desc">No strings.</p>
              <button className="plan-cta outline">Start for free</button>
              <ul className="feature-list">
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> 3 builds / 30 days</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> All 8 style transforms</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Download as ZIP</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Community support</li>
              </ul>
            </div>

            {/* PRO (highlighted) */}
            <div className="pricing-card highlight">
              <span className="popular-badge">Most popular</span>
              <div className="plan-name">Pro</div>
              <div className="plan-price">
                <span className="amount">$19</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-desc">For power builders.</p>
              <button className="plan-cta primary">Go Pro</button>
              <ul className="feature-list">
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Unlimited builds</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> All AI models (GPT-4o, Claude, Gemini, Kimi)</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Priority generation queue</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Push to Vercel in 1 click</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Brand extraction mode</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#ff4801" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Email support</li>
              </ul>
            </div>

            {/* TEAM (waitlist) */}
            <div className="pricing-card waitlist">
              <div className="plan-name">Team</div>
              <div className="plan-price">
                <span className="amount">$49</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-desc">Coming soon.</p>
              <div className="waitlist-form" id="waitlistForm">
                <input type="email" placeholder="you@email.com" id="waitlistEmail" />
                <button type="button" id="waitlistBtn">Join waitlist</button>
              </div>
              <div className="waitlist-success" id="waitlistSuccess" style={{ display: 'none' }}>You&apos;re on the list!</div>
              <ul className="feature-list">
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Everything in Pro</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> 5 team members</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Shared project library</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Custom AI model config</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> SSO & audit logs</li>
                <li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="rgba(82,16,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
