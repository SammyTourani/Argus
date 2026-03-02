// @ts-nocheck
'use client';

import { useEffect } from 'react';
import WorkspaceSidebar from './WorkspaceSidebar';
import HomePage from './HomePage';
import SearchModal from './SearchModal';
import ReferralModal from './ReferralModal';

export default function WorkspaceApp() {
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

      {/* Toast element */}
      <div className="toast" id="toast"></div>
    </>
  );
}
