// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchCurrentUser, fetchSubscription, fetchTeams, escapeHtml } from './workspace-api';
import { getActiveWorkspace, setActiveWorkspace } from './workspace-active';
import { useUser } from '@/components/providers/UserProvider';

export default function WorkspaceDropdown() {
  const { user } = useUser();

  // ===== initWorkspaceDropdown =====
  useEffect(() => {
    var header = document.querySelector('.sidebar-header');
    var dropdown = document.getElementById('workspaceDropdown');
    var backdrop = document.getElementById('wsBackdrop');
    var chevron = document.querySelector('.sidebar-chevron');
    if (!header || !dropdown || !backdrop || !chevron) return;

    // Re-query chevron each time since innerHTML replacement can detach the original reference
    function getChevron() {
      return document.querySelector('.sidebar-chevron');
    }
    function open() {
      dropdown!.classList.add('active');
      backdrop!.classList.add('active');
      var c = getChevron(); if (c) c.classList.add('open');
    }
    function close() {
      dropdown!.classList.remove('active');
      backdrop!.classList.remove('active');
      var c = getChevron(); if (c) c.classList.remove('open');
    }
    function toggle() {
      dropdown!.classList.contains('active') ? close() : open();
    }

    function handleHeaderClick(e: Event) {
      e.stopPropagation();
      toggle();
    }

    function handleBackdropClick() {
      close();
    }

    function handleKeydown(e: Event) {
      if ((e as KeyboardEvent).key === 'Escape' && dropdown!.classList.contains('active')) close();
    }

    function handleDropdownClick(e: Event) {
      var actionBtn = (e.target as HTMLElement).closest('[data-ws-action]');
      if (actionBtn) {
        var action = actionBtn.getAttribute('data-ws-action');
        if (action === 'upgrade') { window.location.href = '/upgrade'; return; }
        if (action === 'create') {
          close();
          window.location.href = '/workspace/new';
          return;
        }
        return;
      }

      var wsItem = (e.target as HTMLElement).closest('.ws-workspace-item');
      if (wsItem) {
        var items = dropdown!.querySelectorAll('.ws-workspace-item');
        items.forEach(function(item) { item.classList.remove('active'); });
        wsItem.classList.add('active');
        var wsName = wsItem.querySelector('.ws-ws-name')!.textContent || 'Workspace';
        document.querySelector('.sidebar-title')!.innerHTML = escapeHtml(wsName) + ' <svg class="sidebar-chevron open" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 6l3 3 3-3"/></svg>';

        // Set active workspace state
        var wsId = wsItem.getAttribute('data-ws-id');
        setActiveWorkspace({ id: wsId || 'personal', name: wsName || 'Workspace' });
        close();
      }
    }

    header.addEventListener('click', handleHeaderClick);
    backdrop.addEventListener('click', handleBackdropClick);
    document.addEventListener('keydown', handleKeydown);
    dropdown.addEventListener('click', handleDropdownClick);

    // Fetch user + subscription + teams to populate dropdown
    var cancelled = false;
    Promise.all([fetchCurrentUser(), fetchSubscription(), fetchTeams()]).then(function(results) {
      if (cancelled) return;
      var user = results[0];
      var sub = results[1];
      var teams = results[2];
      if (user) {
        var avatar = dropdown!.querySelector('.ws-avatar');
        if (avatar) avatar.textContent = user.initial;
        var name = dropdown!.querySelector('.ws-current-name');
        if (name) name.textContent = user.name + "'s Workspace";
      }
      if (sub) {
        var planBadge = dropdown!.querySelector('.ws-plan-badge');
        if (planBadge) planBadge.textContent = (sub.tier || 'Free').charAt(0).toUpperCase() + (sub.tier || 'free').slice(1) + ' Plan';
        var creditsCount = dropdown!.querySelector('.ws-credits-count');
        if (creditsCount) creditsCount.textContent = (sub.buildsRemaining || 0) + ' left \u203A';
        var progressFill = dropdown!.querySelector('.ws-progress-fill') as HTMLElement;
        if (progressFill && sub.maxBuilds > 0) {
          progressFill.style.width = Math.round((sub.buildsRemaining / sub.maxBuilds) * 100) + '%';
        }
        var creditsHelp = dropdown!.querySelector('.ws-credits-help');
        if (creditsHelp) creditsHelp.textContent = sub.maxBuilds + ' ' + sub.tier + ' builds reset monthly';

        // Handle unlimited builds for paid tiers
        if (sub.maxBuilds === null) {
          if (creditsCount) creditsCount.textContent = 'Unlimited';
          if (creditsHelp) creditsHelp.textContent = sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1) + ' \u2014 unlimited builds';
          if (progressFill) {
            progressFill.style.width = '100%';
            progressFill.style.background = 'var(--accent-100)';
          }
        }

        // Conditional upgrade card based on tier
        var upgradeCard = dropdown!.querySelector('.ws-upgrade-card');
        if (upgradeCard) {
          if (sub.tier === 'team' || sub.tier === 'enterprise') {
            upgradeCard.style.display = 'none';
          } else if (sub.tier === 'pro') {
            var upgradeLeft = upgradeCard.querySelector('.ws-upgrade-left');
            if (upgradeLeft) upgradeLeft.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 1L3 9h4.5v6L13 7H8.5V1z" /></svg> Go Team';
          }
        }
      }
      // Render workspace list dynamically
      var wsList = dropdown!.querySelector('.ws-workspace-list');
      var activeWs = getActiveWorkspace();
      if (wsList && user) {
        var checkSvg = '<svg class="ws-ws-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg>';
        var tierLabel = (sub && sub.tier) ? sub.tier.toUpperCase() : 'FREE';
        var html = '<div class="ws-workspace-item' + (activeWs.id === 'personal' ? ' active' : '') + '" data-ws-id="personal">' +
          '<div class="ws-ws-avatar">' + user.initial + '</div>' +
          '<span class="ws-ws-name">' + escapeHtml(user.name) + '\'s Workspace</span>' +
          '<span class="ws-ws-badge">' + tierLabel + '</span>' +
          checkSvg + '</div>';
        if (teams && teams.length > 0) {
          teams.forEach(function(t) {
            var initial = (t.name || 'T').charAt(0).toUpperCase();
            var badge = (t.plan || 'free').toUpperCase();
            html += '<div class="ws-workspace-item' + (activeWs.id === t.id ? ' active' : '') + '" data-ws-id="' + t.id + '">' +
              '<div class="ws-ws-avatar">' + initial + '</div>' +
              '<span class="ws-ws-name">' + escapeHtml(t.name || 'Team') + '</span>' +
              '<span class="ws-ws-badge">' + badge + '</span>' +
              checkSvg + '</div>';
          });
        }
        wsList.innerHTML = html;
      }
    }).catch(function() {});

    return () => {
      cancelled = true;
      header!.removeEventListener('click', handleHeaderClick);
      backdrop!.removeEventListener('click', handleBackdropClick);
      document.removeEventListener('keydown', handleKeydown);
      dropdown!.removeEventListener('click', handleDropdownClick);
    };
  }, []);

  return (
    <>
      <div className="workspace-dropdown" id="workspaceDropdown">
        <div className="ws-current">
          <div className="ws-avatar">{user?.initial || '\u00A0'}</div>
          <div className="ws-current-info">
            <div className="ws-current-name">{user ? `${user.name}'s Workspace` : 'Loading...'}</div>
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
          {/* Populated dynamically by useEffect */}
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
