// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { showToast } from './workspace-state';

export default function ReferralModal() {
  // ===== initReferralModal =====
  useEffect(() => {
    var backdrop = document.getElementById('referralBackdrop');
    var modal = document.getElementById('referralModal');
    var shareBtn = document.getElementById('shareArgusBtn');
    var closeBtn = document.getElementById('referralCloseBtn');
    var copyBtn = document.getElementById('referralCopyBtn');
    var linkInput = document.getElementById('referralLinkInput') as HTMLInputElement | null;
    if (!backdrop || !modal || !shareBtn || !closeBtn || !copyBtn || !linkInput) return;

    var isOpen = false;
    var copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function openReferral() {
      if (isOpen) return;
      isOpen = true;
      backdrop!.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeReferral() {
      if (!isOpen) return;
      isOpen = false;
      backdrop!.classList.remove('active');
      document.body.style.overflow = '';
    }

    function copyLink() {
      var link = linkInput!.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(function() {
          onCopySuccess();
        }, function() {
          fallbackCopy(link);
        });
      } else {
        fallbackCopy(link);
      }
    }

    function fallbackCopy(text: string) {
      linkInput!.select();
      linkInput!.setSelectionRange(0, text.length);
      try {
        document.execCommand('copy');
        onCopySuccess();
      } catch (err) {
        showToast('Failed to copy link', 'error');
      }
    }

    function onCopySuccess() {
      showToast('Referral link copied to clipboard');

      var originalHTML = copyBtn!.innerHTML;
      copyBtn!.innerHTML =
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 8.5l3.5 3.5L13 4.5"/>' +
        '</svg>' +
        'Copied!';
      copyBtn!.style.background = '#1a8f4a';

      copyTimeoutId = setTimeout(function() {
        copyBtn!.innerHTML = originalHTML;
        copyBtn!.style.background = '';
      }, 2000);
    }

    // Open handler
    function handleShareClick(e: Event) {
      e.preventDefault();
      openReferral();
    }
    shareBtn.addEventListener('click', handleShareClick);

    // Close handlers
    function handleCloseClick() {
      closeReferral();
    }
    closeBtn.addEventListener('click', handleCloseClick);

    function handleBackdropClick(e: Event) {
      if (e.target === backdrop) closeReferral();
    }
    backdrop.addEventListener('click', handleBackdropClick);

    // Escape key
    function handleKeydown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeReferral();
      }
    }
    document.addEventListener('keydown', handleKeydown as EventListener);

    // Copy button
    function handleCopyClick(e: Event) {
      e.preventDefault();
      copyLink();
    }
    copyBtn.addEventListener('click', handleCopyClick);

    // Click on input to select all
    function handleInputClick() {
      linkInput!.select();
    }
    linkInput.addEventListener('click', handleInputClick);

    return () => {
      shareBtn!.removeEventListener('click', handleShareClick);
      closeBtn!.removeEventListener('click', handleCloseClick);
      backdrop!.removeEventListener('click', handleBackdropClick);
      document.removeEventListener('keydown', handleKeydown as EventListener);
      copyBtn!.removeEventListener('click', handleCopyClick);
      linkInput!.removeEventListener('click', handleInputClick);
      if (copyTimeoutId) clearTimeout(copyTimeoutId);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="referral-backdrop" id="referralBackdrop">
      <div className="referral-modal" id="referralModal">

        {/* Close button */}
        <button className="referral-close" id="referralCloseBtn" aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Hero */}
        <div className="referral-hero">
          <img src="assets/official_eye.png" alt="" className="referral-hero-eye" aria-hidden="true" />
          <div className="referral-hero-glow"></div>
          <div className="referral-hero-gradient"></div>
          <div className="referral-hero-badge">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1v4M8 11v4M1 8h4M11 8h4M3.05 3.05l2.83 2.83M10.12 10.12l2.83 2.83M12.95 3.05l-2.83 2.83M5.88 10.12l-2.83 2.83" />
            </svg>
            Earn 5 bonus builds
          </div>
        </div>

        {/* Body */}
        <div className="referral-body">
          <div className="referral-heading">Share Argus with friends</div>
          <div className="referral-subheading">and earn free builds for every referral</div>

          {/* How it works */}
          <div className="referral-steps-label">How it works</div>
          <div className="referral-steps">

            <div className="referral-step">
              <div className="referral-step-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 12l-5-3V4" /><circle cx="10" cy="10" r="7" />
                </svg>
              </div>
              <div className="referral-step-text">
                <div className="referral-step-title">Share your referral link</div>
                <div className="referral-step-desc">Send your unique link to friends who&apos;d love Argus</div>
              </div>
            </div>

            <div className="referral-step">
              <div className="referral-step-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="3" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                </svg>
              </div>
              <div className="referral-step-text">
                <div className="referral-step-title">Friend signs up and gets 4 builds</div>
                <div className="referral-step-desc">They start with 1 extra build (4 instead of 3) as your gift</div>
              </div>
            </div>

            <div className="referral-step">
              <div className="referral-step-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2l2.4 4.8L18 7.6l-4 3.9.9 5.5L10 14.5 5.1 17l.9-5.5-4-3.9 5.6-.8z" />
                </svg>
              </div>
              <div className="referral-step-text">
                <div className="referral-step-title">They upgrade to Pro &mdash; you earn 5 builds</div>
                <div className="referral-step-desc">When your referral converts to the $19/mo Pro plan, you get rewarded</div>
              </div>
            </div>

          </div>

          {/* Stats */}
          <div className="referral-stats">
            <div className="referral-stat">
              <span className="referral-stat-value" id="referralSignedUp">0</span> signed up
            </div>
            <div className="referral-stat-dot"></div>
            <div className="referral-stat">
              <span className="referral-stat-value" id="referralConverted">0</span> converted
            </div>
          </div>

          {/* Link copy */}
          <div className="referral-link-section">
            <input
              type="text"
              className="referral-link-input"
              id="referralLinkInput"
              defaultValue="https://buildargus.dev/invite/SAMMY2024"
              readOnly
            />
            <button className="referral-copy-btn" id="referralCopyBtn">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                <path d="M5 11H3.5A1.5 1.5 0 012 9.5v-7A1.5 1.5 0 013.5 1h7A1.5 1.5 0 0112 2.5V5" />
              </svg>
              Copy link
            </button>
          </div>

          {/* Footer */}
          <div className="referral-footer">
            <a href="#">View Terms and Conditions</a>
          </div>

        </div>
      </div>
    </div>
  );
}
