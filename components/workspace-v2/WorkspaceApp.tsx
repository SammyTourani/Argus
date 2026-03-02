'use client';

import WorkspaceSidebar from './WorkspaceSidebar';
import HomePage from './HomePage';
import SearchModal from './SearchModal';
import ReferralModal from './ReferralModal';

// JS IIFEs that correspond to this component:
// - Dark mode FOUC prevention script (reads localStorage for 'argus-hero-template')
// - Mobile menu button click handler (toggles sidebar open/close)
// - Sidebar overlay click handler (closes sidebar on mobile)

export default function WorkspaceApp() {
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
