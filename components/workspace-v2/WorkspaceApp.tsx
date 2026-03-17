// @ts-nocheck
'use client';

import { useEffect } from 'react';
import WorkspaceSidebar from './WorkspaceSidebar';
import HomePage from './HomePage';
import SearchModal from './SearchModal';
import ReferralModal from './ReferralModal';
import TemplatePreviewModal from './TemplatePreviewModal';

export default function WorkspaceApp() {
  // ===== Claim pending referral from localStorage (if any) =====
  useEffect(() => {
    const ref = localStorage.getItem('argus_ref_code');
    if (!ref) return;
    // Clear immediately to prevent duplicate attempts
    localStorage.removeItem('argus_ref_code');
    fetch('/api/user/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_code: ref }),
    }).catch(() => { /* best effort */ });
  }, []);

  // ===== initMobileMenu =====
  useEffect(() => {
    var btn = document.getElementById('mobileMenuBtn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!btn || !sidebar || !overlay) return;

    function toggle() {
      sidebar!.classList.toggle('open');
      overlay!.classList.toggle('active');
    }

    btn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);

    return () => {
      btn!.removeEventListener('click', toggle);
      overlay!.removeEventListener('click', toggle);
    };
  }, []);

  return (
    <>
      {/* Mobile menu */}
      <button className="mobile-menu-btn" id="mobileMenuBtn">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
      </button>
      <div className="sidebar-overlay" id="sidebarOverlay"></div>

      <div className="app">
        {/* SIDEBAR */}
        <WorkspaceSidebar />

        {/* MAIN */}
        <HomePage />
      </div>

      {/* Search Modal */}
      <SearchModal />

      {/* Referral Modal */}
      <ReferralModal />

      {/* Template Preview Modal */}
      <TemplatePreviewModal />

      {/* Toast element */}
      <div className="toast" id="toast"></div>
    </>
  );
}
