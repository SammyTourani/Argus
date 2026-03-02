'use client';

// JS IIFEs that correspond to this component:
// - Workspace dropdown open/close (workspaceDropdown, wsBackdrop)
// - Workspace switching (ws-workspace-item click)
// - Action buttons (settings, invite, upgrade, create)
// - Chevron rotation toggle

export default function WorkspaceDropdown() {
  return (
    <>
      <div className="workspace-dropdown" id="workspaceDropdown">
        <div className="ws-current">
          <div className="ws-avatar">S</div>
          <div className="ws-current-info">
            <div className="ws-current-name">Sammy&apos;s Lovable</div>
            <div className="ws-current-meta"><span className="ws-plan-badge">Free Plan</span> &bull; 1 member</div>
          </div>
        </div>
        <div className="ws-actions">
          <button className="ws-action-btn" data-ws-action="settings">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" /></svg>
            Settings
          </button>
          <button className="ws-action-btn" data-ws-action="invite">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5" /><path d="M1.5 14c0-3 2-4.5 4.5-4.5s4.5 1.5 4.5 4.5M11 6.5h3M12.5 5v3" /></svg>
            Invite members
          </button>
        </div>
        <div className="ws-divider"></div>
        <div className="ws-upgrade-card">
          <div className="ws-upgrade-left">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 1L3 9h4.5v6L13 7H8.5V1z" /></svg>
            Turn Pro
          </div>
          <button className="ws-upgrade-btn" data-ws-action="upgrade">Upgrade</button>
        </div>
        <div className="ws-divider"></div>
        <div className="ws-credits">
          <div className="ws-credits-header">
            <span className="ws-credits-label">Credits</span>
            <span className="ws-credits-count">3 left &rsaquo;</span>
          </div>
          <div className="ws-progress-bar"><div className="ws-progress-fill" style={{ width: '100%' }}></div></div>
          <div className="ws-credits-help">3 free builds reset monthly</div>
        </div>
        <div className="ws-divider"></div>
        <div className="ws-section-label-dd">All workspaces</div>
        <div className="ws-workspace-list">
          <div className="ws-workspace-item active" data-ws-id="sammys">
            <div className="ws-ws-avatar">S</div>
            <span className="ws-ws-name">Sammy&apos;s Lovable</span>
            <span className="ws-ws-badge">FREE</span>
            <svg className="ws-ws-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg>
          </div>
          <div className="ws-workspace-item" data-ws-id="alyssas">
            <div className="ws-ws-avatar">A</div>
            <span className="ws-ws-name">alyssas-matcha-dreams</span>
            <span className="ws-ws-badge">FREE</span>
            <svg className="ws-ws-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg>
          </div>
        </div>
        <button className="ws-create-btn" data-ws-action="create">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg>
          Create new workspace
        </button>
      </div>
      <div className="workspace-dropdown-backdrop" id="wsBackdrop"></div>
    </>
  );
}
