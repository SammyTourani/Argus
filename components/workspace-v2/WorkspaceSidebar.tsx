// @ts-nocheck
'use client';

import { useEffect } from 'react';
import WorkspaceDropdown from './WorkspaceDropdown';
import { fetchCurrentUser, fetchRecents, fetchSubscription, escapeHtml } from './workspace-api';
import { useUser } from '@/components/providers/UserProvider';

var sidebarTier = 'free';

export default function WorkspaceSidebar() {
  const { user } = useUser();
  // ===== Upgrade to Pro button handler =====
  useEffect(() => {
    var upgradeBtn = document.getElementById('upgradeProBtn');
    if (!upgradeBtn) return;

    function handleUpgradeClick() {
      if (sidebarTier === 'team' || sidebarTier === 'enterprise') {
        window.location.href = '/account';
      } else {
        window.location.href = '/upgrade';
      }
    }

    upgradeBtn.addEventListener('click', handleUpgradeClick);

    // Fetch user data to update sidebar
    var cancelled = false;
    fetchCurrentUser().then(function(user) {
      if (cancelled || !user) return;
      var logo = document.querySelector('.sidebar-logo');
      var title = document.querySelector('.sidebar-title');
      if (logo) logo.textContent = user.initial;
      if (title) title.innerHTML = escapeHtml(user.name) + '\'s Workspace <svg class="sidebar-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 6l3 3 3-3"/></svg>';
    }).catch(function() {});

    // Fetch recently viewed projects
    var docSvg = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h12v12H4z" /><path d="M8 8h4M8 11h2" /></svg>';
    fetchRecents().then(function(recents) {
      if (cancelled) return;
      var recentsContainer = document.getElementById('sidebarRecents');
      if (!recentsContainer) return;
      if (!recents || recents.length === 0) {
        recentsContainer.innerHTML = '<div class="nav-item" style="color:var(--fg-muted);font-size:12px;pointer-events:none">No recent projects</div>';
        return;
      }
      var html = '';
      recents.slice(0, 5).forEach(function(r) {
        html += '<a class="nav-item" href="/workspace/' + encodeURIComponent(r.project_id) + '" style="text-decoration:none">' + docSvg + ' ' + escapeHtml(r.project_name || 'Untitled') + '</a>';
      });
      recentsContainer.innerHTML = html;
    }).catch(function() {});

    // Fetch subscription to update upgrade button based on tier
    fetchSubscription().then(function(sub) {
      if (cancelled) return;
      sidebarTier = sub.tier || 'free';
      var btnLabel = document.querySelector('#upgradeProBtn > div > div:first-child');
      var btnDesc = document.querySelector('#upgradeProBtn > div > .desc');
      if (!btnLabel || !btnDesc) return;

      if (sidebarTier === 'pro') {
        btnLabel.textContent = 'Upgrade to Team';
        btnDesc.textContent = 'Add collaboration';
      } else if (sidebarTier === 'team' || sidebarTier === 'enterprise') {
        btnLabel.textContent = 'Manage Subscription';
        btnDesc.textContent = sidebarTier.charAt(0).toUpperCase() + sidebarTier.slice(1) + ' plan active';
        // Add green active dot
        var dot = document.createElement('span');
        dot.className = 'plan-active-dot';
        upgradeBtn.appendChild(dot);
      }
    }).catch(function() {});

    return () => {
      cancelled = true;
      upgradeBtn!.removeEventListener('click', handleUpgradeClick);
    };
  }, []);

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">{user?.initial || 'A'}</div>
        <div className="sidebar-title">{user ? `${user.name}'s Workspace` : 'Workspace'} <svg className="sidebar-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 6l3 3 3-3" /></svg></div>
      </div>

      {/* Workspace Dropdown */}
      <WorkspaceDropdown />

      <nav className="sidebar-nav">
        <div className="nav-item active">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10.5L10 4l7 6.5M5 9v7a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V9" /></svg>
          Home
        </div>
        <div className="nav-item" id="searchNavItem">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
          Search
        </div>
        <a className="nav-item" href="/resources" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z" /></svg>
          Resources
        </a>
      </nav>

      <div className="nav-section-label">Projects</div>
      <div className="sidebar-projects">
        <div className="nav-item">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" /><path d="M7 3v14M3 8h4" /></svg>
          All projects
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l2.5 5 5.5.8-4 3.9.9 5.3L10 15.5 5.1 18l.9-5.3-4-3.9 5.5-.8z" /></svg>
          Starred
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
          Created by me
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3" /><circle cx="14" cy="8" r="2.5" /><path d="M2 17c0-3 2.2-5.5 5-5.8M11.5 17c0-2.5 1.5-4.5 3.5-5" /></svg>
          Shared with me
        </div>
      </div>

      <div className="nav-section-label">Recents</div>
      <div style={{ padding: '0 8px 12px' }} id="sidebarRecents">
        <div className="nav-item skeleton-pulse" style={{ height: '20px', width: '140px', pointerEvents: 'none' }}>&nbsp;</div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-item" id="shareArgusBtn">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 12l-5-3V4" /><circle cx="10" cy="10" r="7" /></svg>
          <div>
            <div>Share Argus</div>
            <div className="desc">5 builds per referral</div>
          </div>
          <span className="badge">NEW</span>
        </div>
        <div className="sidebar-footer-item" id="upgradeProBtn">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3v14M6 7l4-4 4 4" /></svg>
          <div>
            <div>Upgrade to Pro</div>
            <div className="desc">Unlock all features</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
