// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchCurrentUser, fetchRecents, fetchSubscription, fetchTeams, fetchApiKeys, addApiKey, deleteApiKey, fetchConnectorStatuses, invalidateSubscriptionCache, invalidateApiKeysCache, escapeHtml } from './workspace-api';
import { getActiveWorkspace, getActiveTeamId, setActiveWorkspace, onWorkspaceChange } from './workspace-active';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {

  /* ===== TAB SYSTEM ===== */
  useEffect(() => {
    var tabBar = document.getElementById('settingsTabBar');
    if (!tabBar) return;
    var tabBtns = tabBar.querySelectorAll('.tab-btn');
    var indicator = document.getElementById('settingsTabIndicator');

    function setIndicator(btn) {
      if (!btn || !indicator) return;
      indicator.style.left = btn.offsetLeft + 'px';
      indicator.style.width = btn.offsetWidth + 'px';
    }

    function switchTab(tabId) {
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.settings-tab-content').forEach(function(c) { c.classList.remove('active'); });
      var btn = tabBar.querySelector('[data-tab="' + tabId + '"]');
      if (btn) btn.classList.add('active');
      var content = document.getElementById('settings-tab-' + tabId);
      if (content) content.classList.add('active');
      if (btn) setIndicator(btn);
    }

    // Check URL params for initial tab
    var params = new URLSearchParams(window.location.search);
    var initialTab = params.get('tab') || (getActiveTeamId() ? 'general' : 'account');
    // Handle billing redirect
    var billingParam = params.get('billing');
    if (billingParam) initialTab = 'account';

    var clickHandlers = [];
    tabBtns.forEach(function(btn) {
      var handler = function() { switchTab(btn.dataset.tab); };
      btn.addEventListener('click', handler);
      clickHandlers.push({ el: btn, handler: handler });
    });

    var initTimer = setTimeout(function() {
      switchTab(initialTab);
    }, 50);

    var resizeHandler = function() { setIndicator(tabBar.querySelector('.tab-btn.active')); };
    window.addEventListener('resize', resizeHandler);

    return () => {
      clearTimeout(initTimer);
      clickHandlers.forEach(function(item) { item.el.removeEventListener('click', item.handler); });
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  /* ===== BILLING REDIRECT HANDLING ===== */
  useEffect(() => {
    var params = new URLSearchParams(window.location.search);
    var billing = params.get('billing');
    if (billing === 'success') {
      var toast = document.getElementById('settingsToast');
      if (toast) { toast.textContent = "You're now on Pro!"; toast.classList.add('active'); setTimeout(function() { toast.classList.remove('active'); }, 4000); }
      var url = new URL(window.location.href);
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.toString());
    } else if (billing === 'cancelled') {
      var toast = document.getElementById('settingsToast');
      if (toast) { toast.textContent = 'Upgrade cancelled. You can try again any time.'; toast.classList.add('active'); setTimeout(function() { toast.classList.remove('active'); }, 4000); }
      var url = new URL(window.location.href);
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  /* ===== USER DATA FOR SIDEBAR ===== */
  useEffect(() => {
    var cancelled = false;
    fetchCurrentUser().then(function(user) {
      if (cancelled || !user) return;
      var logo = document.querySelector('.page-settings .sidebar-logo');
      var title = document.querySelector('.page-settings .sidebar-title');
      if (logo) logo.textContent = user.initial;
      if (title) title.innerHTML = escapeHtml(user.name) + '\'s Workspace <svg class="sidebar-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 6l3 3 3-3"/></svg>';
    }).catch(function() {});

    var docSvg = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h12v12H4z" /><path d="M8 8h4M8 11h2" /></svg>';
    fetchRecents().then(function(recents) {
      if (cancelled) return;
      var container = document.getElementById('settingsRecents');
      if (!container) return;
      if (!recents || recents.length === 0) {
        container.innerHTML = '<div class="nav-item" style="color:var(--fg-muted);font-size:12px;pointer-events:none">No recent projects</div>';
        return;
      }
      var html = '';
      recents.slice(0, 5).forEach(function(r) {
        html += '<a class="nav-item" href="/workspace/' + encodeURIComponent(r.project_id) + '" style="text-decoration:none">' + docSvg + ' ' + escapeHtml(r.project_name || 'Untitled') + '</a>';
      });
      container.innerHTML = html;
    }).catch(function() {});

    return () => { cancelled = true; };
  }, []);

  /* ===== ACCOUNT TAB: LOAD USER PROFILE ===== */
  useEffect(() => {
    var cancelled = false;
    var supabase = createClient();
    supabase.auth.getUser().then(function(result) {
      if (cancelled || !result.data.user) return;
      var user = result.data.user;
      var nameInput = document.getElementById('settingsProfileName');
      var emailInput = document.getElementById('settingsProfileEmail');
      var avatarEl = document.getElementById('settingsProfileAvatar');
      if (nameInput) nameInput.value = user.user_metadata?.full_name || '';
      if (emailInput) emailInput.value = user.email || '';
      if (avatarEl) avatarEl.textContent = (user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase();
      // Store email for delete confirmation
      var container = document.querySelector('.page-settings');
      if (container) container.setAttribute('data-user-email', user.email || '');
    });

    // Load notification prefs from localStorage
    try {
      var stored = localStorage.getItem('argus_notification_prefs');
      if (stored) {
        var parsed = JSON.parse(stored);
        ['notifyBuilds', 'notifyInvites', 'notifyMarketing'].forEach(function(key) {
          var toggle = document.getElementById('settings-' + key);
          if (toggle && typeof parsed[key] === 'boolean') {
            toggle.classList.toggle('active', parsed[key]);
          }
        });
      }
    } catch (e) {}

    // Load model preferences
    fetch('/api/user/preferences').then(function(res) { return res.json(); }).then(function(data) {
      if (cancelled) return;
      var modelId = data.preferences?.default_model_id || 'claude-sonnet-4-6';
      var radios = document.querySelectorAll('input[name="settingsDefaultModel"]');
      radios.forEach(function(r) { r.checked = r.value === modelId; });
    }).catch(function() {});

    return () => { cancelled = true; };
  }, []);

  /* ===== ACCOUNT TAB: SAVE HANDLERS ===== */
  useEffect(() => {
    // Save profile
    var saveProfileBtn = document.getElementById('settingsSaveProfile');
    if (saveProfileBtn) {
      var handler = function() {
        var nameInput = document.getElementById('settingsProfileName');
        if (!nameInput) return;
        saveProfileBtn.textContent = 'Saving...';
        saveProfileBtn.disabled = true;
        var supabase = createClient();
        supabase.auth.updateUser({ data: { full_name: nameInput.value } }).then(function() {
          saveProfileBtn.textContent = '✓ Saved';
          setTimeout(function() { saveProfileBtn.textContent = 'Save profile'; saveProfileBtn.disabled = false; }, 2000);
        });
      };
      saveProfileBtn.addEventListener('click', handler);
    }

    // Save model
    var saveModelBtn = document.getElementById('settingsSaveModel');
    if (saveModelBtn) {
      var modelHandler = function() {
        var checked = document.querySelector('input[name="settingsDefaultModel"]:checked');
        if (!checked) return;
        saveModelBtn.textContent = 'Saving...';
        saveModelBtn.disabled = true;
        fetch('/api/user/preferences', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ default_model_id: checked.value }),
        }).then(function() {
          saveModelBtn.textContent = '✓ Saved';
          setTimeout(function() { saveModelBtn.textContent = 'Save preference'; saveModelBtn.disabled = false; }, 2000);
        });
      };
      saveModelBtn.addEventListener('click', modelHandler);
    }

    // Notification toggles
    var toggles = document.querySelectorAll('.settings-notif-toggle');
    toggles.forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        toggle.classList.toggle('active');
      });
    });

    // Save notifications
    var saveNotifBtn = document.getElementById('settingsSaveNotifications');
    if (saveNotifBtn) {
      var notifHandler = function() {
        var prefs = {};
        ['notifyBuilds', 'notifyInvites', 'notifyMarketing'].forEach(function(key) {
          var el = document.getElementById('settings-' + key);
          prefs[key] = el ? el.classList.contains('active') : false;
        });
        try { localStorage.setItem('argus_notification_prefs', JSON.stringify(prefs)); } catch(e) {}
        saveNotifBtn.textContent = '✓ Saved';
        setTimeout(function() { saveNotifBtn.textContent = 'Save preferences'; }, 2000);
      };
      saveNotifBtn.addEventListener('click', notifHandler);
    }

    // Sign out
    var signOutBtn = document.getElementById('settingsSignOut');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', function() {
        var supabase = createClient();
        supabase.auth.signOut().then(function() { window.location.href = '/'; });
      });
    }

    // Delete account
    var deleteAcctBtn = document.getElementById('settingsDeleteAccountBtn');
    var deleteAcctReveal = document.getElementById('settingsDeleteReveal');
    var deleteAcctConfirm = document.getElementById('settingsDeleteConfirm');
    var deleteAcctCancel = document.getElementById('settingsDeleteCancel');
    var deleteAcctInput = document.getElementById('settingsDeleteInput');

    if (deleteAcctBtn) {
      deleteAcctBtn.addEventListener('click', function() {
        if (deleteAcctReveal) deleteAcctReveal.style.display = 'block';
        deleteAcctBtn.style.display = 'none';
      });
    }
    if (deleteAcctCancel) {
      deleteAcctCancel.addEventListener('click', function() {
        if (deleteAcctReveal) deleteAcctReveal.style.display = 'none';
        if (deleteAcctBtn) deleteAcctBtn.style.display = '';
        if (deleteAcctInput) deleteAcctInput.value = '';
      });
    }
    if (deleteAcctConfirm && deleteAcctInput) {
      deleteAcctInput.addEventListener('input', function() {
        var container = document.querySelector('.page-settings');
        var email = container ? container.getAttribute('data-user-email') : '';
        deleteAcctConfirm.disabled = deleteAcctInput.value.trim().toLowerCase() !== (email || '').toLowerCase();
      });
      deleteAcctConfirm.addEventListener('click', function() {
        deleteAcctConfirm.textContent = 'Deleting...';
        deleteAcctConfirm.disabled = true;
        fetch('/api/user/delete-account', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmEmail: deleteAcctInput.value.trim() }),
        }).then(function(res) {
          if (!res.ok) return res.json().then(function(d) { alert(d.error || 'Failed'); deleteAcctConfirm.textContent = 'Delete my account'; deleteAcctConfirm.disabled = false; });
          var supabase = createClient();
          supabase.auth.signOut().then(function() { window.location.href = '/'; });
        }).catch(function() { alert('Something went wrong.'); deleteAcctConfirm.textContent = 'Delete my account'; deleteAcctConfirm.disabled = false; });
      });
    }
  }, []);

  /* ===== BILLING TAB ===== */
  useEffect(() => {
    var cancelled = false;
    fetchSubscription().then(function(sub) {
      if (cancelled) return;
      var tierEl = document.getElementById('settingsTier');
      var creditsEl = document.getElementById('settingsCredits');
      var progressEl = document.getElementById('settingsCreditProgress');
      if (tierEl) tierEl.textContent = (sub.tier || 'free').charAt(0).toUpperCase() + (sub.tier || 'free').slice(1) + ' Plan';
      if (creditsEl) creditsEl.textContent = (sub.creditsRemaining || 0) + ' / ' + (sub.creditsTotal || 30) + ' credits';
      if (progressEl) {
        var pct = Math.round(((sub.creditsRemaining || 0) / (sub.creditsTotal || 30)) * 100);
        progressEl.style.width = pct + '%';
        if ((sub.creditsRemaining || 0) <= 5) progressEl.style.background = '#ef4444';
      }
      // Show/hide upgrade section
      var upgradeSection = document.getElementById('settingsUpgradeSection');
      if (upgradeSection) upgradeSection.style.display = sub.tier === 'free' ? '' : 'none';
      // Show/hide manage subscription
      var manageSection = document.getElementById('settingsManageSection');
      if (manageSection) manageSection.style.display = sub.tier !== 'free' ? '' : 'none';
    }).catch(function() {});

    // Upgrade buttons
    var upgradeProBtn = document.getElementById('settingsUpgradePro');
    var upgradeTeamBtn = document.getElementById('settingsUpgradeTeam');
    function doUpgrade(plan) {
      var teamId = getActiveTeamId();
      var body = { plan: plan };
      if (teamId) body.team_id = teamId;
      fetch('/api/stripe/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function(res) { return res.json(); }).then(function(data) {
        if (data.url) window.location.href = data.url;
      }).catch(function() {});
    }
    if (upgradeProBtn) upgradeProBtn.addEventListener('click', function() { doUpgrade('pro'); });
    if (upgradeTeamBtn) upgradeTeamBtn.addEventListener('click', function() { doUpgrade('team'); });

    // Manage subscription
    var manageBtn = document.getElementById('settingsManageBilling');
    if (manageBtn) {
      manageBtn.addEventListener('click', function() {
        manageBtn.textContent = 'Opening...';
        var teamId = getActiveTeamId();
        var url = teamId ? '/api/stripe/billing-portal?team_id=' + teamId : '/api/stripe/billing-portal';
        fetch(url).then(function(res) { return res.json(); }).then(function(data) {
          if (data.url) window.location.href = data.url;
          else { manageBtn.textContent = 'Manage Subscription'; }
        }).catch(function() { manageBtn.textContent = 'Manage Subscription'; });
      });
    }

    return () => { cancelled = true; };
  }, []);

  /* ===== GENERAL TAB: WORKSPACE SETTINGS ===== */
  useEffect(() => {
    var teamId = getActiveTeamId();
    if (!teamId) return;
    var cancelled = false;

    fetch('/api/teams/' + teamId).then(function(res) { return res.json(); }).then(function(data) {
      if (cancelled || !data.team) return;
      var nameInput = document.getElementById('settingsWsName');
      var descInput = document.getElementById('settingsWsDesc');
      var slugInput = document.getElementById('settingsWsSlug');
      if (nameInput) nameInput.value = data.team.name || '';
      if (descInput) descInput.value = data.team.description || '';
      if (slugInput) slugInput.value = data.team.slug || '';
      // Store role for permission checks
      var container = document.querySelector('.page-settings');
      if (container) container.setAttribute('data-team-role', data.team.role || '');
      // Show/hide danger zone based on owner role
      var dangerZone = document.getElementById('settingsDangerZone');
      if (dangerZone) dangerZone.style.display = data.team.role === 'owner' ? '' : 'none';
      // Enable/disable inputs for non-owners
      if (data.team.role !== 'owner' && data.team.role !== 'admin') {
        if (nameInput) { nameInput.disabled = true; nameInput.style.opacity = '0.5'; }
        if (descInput) { descInput.disabled = true; descInput.style.opacity = '0.5'; }
        var saveBtn = document.getElementById('settingsSaveWorkspace');
        if (saveBtn) saveBtn.style.display = 'none';
      }
    }).catch(function() {});

    // Save workspace
    var saveWsBtn = document.getElementById('settingsSaveWorkspace');
    if (saveWsBtn) {
      saveWsBtn.addEventListener('click', function() {
        var nameInput = document.getElementById('settingsWsName');
        var descInput = document.getElementById('settingsWsDesc');
        saveWsBtn.textContent = 'Saving...';
        saveWsBtn.disabled = true;
        fetch('/api/teams/' + teamId, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: (nameInput?.value || '').trim(), description: (descInput?.value || '').trim() }),
        }).then(function(res) {
          if (res.ok) {
            setActiveWorkspace({ id: teamId, name: (nameInput?.value || '').trim() });
            saveWsBtn.textContent = '✓ Saved';
          } else {
            saveWsBtn.textContent = 'Error';
          }
          setTimeout(function() { saveWsBtn.textContent = 'Save changes'; saveWsBtn.disabled = false; }, 2000);
        });
      });
    }

    // Danger zone: delete workspace
    var deleteWsBtn = document.getElementById('settingsDeleteWsBtn');
    var deleteWsReveal = document.getElementById('settingsDeleteWsReveal');
    var deleteWsCancel = document.getElementById('settingsDeleteWsCancel');
    var deleteWsConfirm = document.getElementById('settingsDeleteWsConfirm');
    var deleteWsInput = document.getElementById('settingsDeleteWsInput');

    if (deleteWsBtn) {
      deleteWsBtn.addEventListener('click', function() {
        if (deleteWsReveal) deleteWsReveal.style.display = 'block';
        deleteWsBtn.style.display = 'none';
      });
    }
    if (deleteWsCancel) {
      deleteWsCancel.addEventListener('click', function() {
        if (deleteWsReveal) deleteWsReveal.style.display = 'none';
        if (deleteWsBtn) deleteWsBtn.style.display = '';
        if (deleteWsInput) deleteWsInput.value = '';
      });
    }
    if (deleteWsConfirm && deleteWsInput) {
      deleteWsInput.addEventListener('input', function() {
        var nameInput = document.getElementById('settingsWsName');
        deleteWsConfirm.disabled = deleteWsInput.value !== (nameInput?.value || '');
      });
      deleteWsConfirm.addEventListener('click', function() {
        deleteWsConfirm.textContent = 'Deleting...';
        deleteWsConfirm.disabled = true;
        fetch('/api/teams/' + teamId, { method: 'DELETE' }).then(function(res) {
          if (res.ok) {
            setActiveWorkspace({ id: 'personal', name: 'Personal' });
            window.location.href = '/workspace';
          } else {
            res.json().then(function(d) { alert(d.error || 'Failed to delete'); });
            deleteWsConfirm.textContent = 'Yes, delete workspace';
            deleteWsConfirm.disabled = false;
          }
        });
      });
    }

    return () => { cancelled = true; };
  }, []);

  /* ===== DARK MODE SYNC ===== */
  useEffect(() => {
    var template = localStorage.getItem('argus-hero-template') || 'classic';
    var isDark = template === 'matrix';
    var root = document.querySelector('.workspace-root');
    if (root) { root.classList.toggle('dark', isDark); }
    if (isDark) { document.documentElement.setAttribute('data-argus-dark', 'true'); }
    else { document.documentElement.removeAttribute('data-argus-dark'); }

    var storageHandler = function(e) {
      if (e.key === 'argus-hero-template') {
        var nowDark = e.newValue === 'matrix';
        var r = document.querySelector('.workspace-root');
        if (r) r.classList.toggle('dark', nowDark);
        if (nowDark) document.documentElement.setAttribute('data-argus-dark', 'true');
        else document.documentElement.removeAttribute('data-argus-dark');
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => { window.removeEventListener('storage', storageHandler); };
  }, []);

  var hasTeam = typeof window !== 'undefined' && getActiveTeamId();

  return (
    <div className="app page-settings">
      {/* SIDEBAR — exact same structure as ResourcesPage */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">A</div>
          <div className="sidebar-title">Workspace <svg className="sidebar-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 6l3 3 3-3" /></svg></div>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-item" href="/workspace" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10.5L10 4l7 6.5M5 9v7a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V9" /></svg>
            Home
          </a>
          <a className="nav-item" href="/workspace?action=search" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
            Search
          </a>
          <a className="nav-item" href="/resources" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z" /></svg>
            Resources
          </a>
          <div className="nav-item active">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="2.5" /><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.2 4.2l2.1 2.1M13.7 13.7l2.1 2.1M4.2 15.8l2.1-2.1M13.7 6.3l2.1-2.1" /></svg>
            Settings
          </div>
        </nav>

        <div className="nav-section-label">Projects</div>
        <div className="sidebar-projects">
          <a className="nav-item" href="/workspace?view=all" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" /><path d="M7 3v14M3 8h4" /></svg>
            All projects
          </a>
          <a className="nav-item" href="/workspace?view=starred" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l2.5 5 5.5.8-4 3.9.9 5.3L10 15.5 5.1 18l.9-5.3-4-3.9 5.5-.8z" /></svg>
            Starred
          </a>
          <a className="nav-item" href="/workspace?view=created" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
            Created by me
          </a>
          <a className="nav-item" href="/workspace?view=shared" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3" /><circle cx="14" cy="8" r="2.5" /><path d="M2 17c0-3 2.2-5.5 5-5.8M11.5 17c0-2.5 1.5-4.5 3.5-5" /></svg>
            Shared with me
          </a>
        </div>

        <div className="nav-section-label">Recents</div>
        <div style={{ padding: '0 8px 12px' }} id="settingsRecents">
          <div className="nav-item" style={{ color: 'var(--fg-muted)', fontSize: '12px', pointerEvents: 'none' }}>Loading...</div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-item" style={{ cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 12l-5-3V4" /><circle cx="10" cy="10" r="7" /></svg>
            <div>
              <div>Share Argus</div>
              <div className="desc">5 builds per referral</div>
            </div>
            <span className="badge">NEW</span>
          </div>
          <a className="sidebar-footer-item" href="/upgrade" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3v14M6 7l4-4 4 4" /></svg>
            <div>
              <div>Upgrade to Pro</div>
              <div className="desc">Unlock all features</div>
            </div>
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        <div className="main-inner">
          {/* Page Header */}
          <div className="page-header stagger-1">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your workspace, account, and integrations.</p>
          </div>

          {/* Tab Bar */}
          <div className="tab-bar stagger-2" id="settingsTabBar">
            <div className="tab-indicator" id="settingsTabIndicator"></div>
            {hasTeam && (
              <button className="tab-btn active" data-tab="general">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="2.5" /><path d="M10 2v3M10 15v3M2 10h3M15 10h3" /></svg>
                General
              </button>
            )}
            {hasTeam && (
              <button className="tab-btn" data-tab="members">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3" /><circle cx="14" cy="8" r="2.5" /><path d="M2 17c0-3 2.2-5.5 5-5.8M11.5 17c0-2.5 1.5-4.5 3.5-5" /></svg>
                Members
              </button>
            )}
            <button className="tab-btn" data-tab="billing">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="16" height="11" rx="2" /><path d="M2 9h16" /></svg>
              Billing
            </button>
            <button className="tab-btn" data-tab="account">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
              Account
            </button>
          </div>

          {/* Toast for billing notifications */}
          <div id="settingsToast" style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--accent-100)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: '0', transition: 'opacity 0.3s', pointerEvents: 'none', zIndex: 1000 }}></div>

          {/* ===== GENERAL TAB ===== */}
          {hasTeam && (
            <div className="settings-tab-content" id="settings-tab-general">
              <div className="settings-section">
                <h2 className="settings-section-title">Workspace</h2>
                <div className="settings-field">
                  <label className="settings-label">Workspace name</label>
                  <input type="text" id="settingsWsName" className="settings-input" maxLength={100} placeholder="My Workspace" />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Description</label>
                  <textarea id="settingsWsDesc" className="settings-input" rows={3} maxLength={500} placeholder="What is this workspace for?" style={{ resize: 'none' }}></textarea>
                </div>
                <div className="settings-field">
                  <label className="settings-label">Slug</label>
                  <input type="text" id="settingsWsSlug" className="settings-input" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '12px', color: 'var(--fg-muted)', marginTop: '4px' }}>Workspace slug cannot be changed.</p>
                </div>
                <button id="settingsSaveWorkspace" className="settings-btn-primary">Save changes</button>
              </div>

              {/* Danger Zone */}
              <div className="settings-section settings-danger" id="settingsDangerZone">
                <h2 className="settings-section-title" style={{ color: '#dc2626' }}>Danger Zone</h2>
                <p style={{ fontSize: '14px', color: 'var(--fg-muted)', marginBottom: '16px' }}>Permanently delete this workspace. All team members will be removed and any active subscription will be cancelled. Projects will be moved to your personal workspace.</p>
                <button id="settingsDeleteWsBtn" className="settings-btn-danger">Delete workspace</button>
                <div id="settingsDeleteWsReveal" style={{ display: 'none', marginTop: '12px', padding: '16px', border: '1px solid #fca5a5', borderRadius: '10px', background: 'rgba(254,226,226,0.3)' }}>
                  <p style={{ fontSize: '14px', color: '#b91c1c', fontWeight: '500', marginBottom: '8px' }}>Type the workspace name to confirm:</p>
                  <input type="text" id="settingsDeleteWsInput" className="settings-input" style={{ borderColor: '#fca5a5', marginBottom: '12px' }} />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button id="settingsDeleteWsConfirm" disabled className="settings-btn-danger" style={{ opacity: 0.5 }}>Yes, delete workspace</button>
                    <button id="settingsDeleteWsCancel" style={{ fontSize: '14px', color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== MEMBERS TAB ===== */}
          {hasTeam && (
            <div className="settings-tab-content" id="settings-tab-members">
              <div className="settings-section">
                <h2 className="settings-section-title">Team Members</h2>
                <p style={{ fontSize: '14px', color: 'var(--fg-muted)', marginBottom: '16px' }}>Member management is coming in the next update.</p>
              </div>
            </div>
          )}

          {/* ===== BILLING TAB ===== */}
          <div className="settings-tab-content" id="settings-tab-billing">
            <div className="settings-section">
              <h2 className="settings-section-title">Current Plan</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-100)', borderRadius: '10px', marginBottom: '16px' }}>
                <div>
                  <span id="settingsTier" style={{ fontSize: '15px', fontWeight: '600' }}>Free Plan</span>
                </div>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--border-100)', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Credits remaining</span>
                  <span id="settingsCredits" style={{ fontSize: '14px', fontWeight: '600' }}>0 / 30 credits</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-100)', overflow: 'hidden' }}>
                  <div id="settingsCreditProgress" style={{ height: '100%', borderRadius: '3px', background: 'var(--accent-100)', width: '100%', transition: 'width 0.5s' }}></div>
                </div>
              </div>
              <div id="settingsManageSection" style={{ display: 'none' }}>
                <button id="settingsManageBilling" className="settings-btn-secondary">Manage Subscription</button>
              </div>
            </div>
            <div id="settingsUpgradeSection" className="settings-section">
              <h2 className="settings-section-title">Upgrade your plan</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-100)', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Pro</span>
                    <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'var(--accent-100)', color: 'white', fontWeight: '600' }}>POPULAR</span>
                    <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '4px' }}>300 credits/month, deploy to Vercel, all 9 AI models</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700' }}>$19/mo</div>
                    <button id="settingsUpgradePro" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-100)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Upgrade</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-100)', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Team</span>
                    <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '4px' }}>Everything in Pro + 5 members, shared library, SSO</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700' }}>$49/mo</div>
                    <button id="settingsUpgradeTeam" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-100)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Upgrade</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== ACCOUNT TAB ===== */}
          <div className="settings-tab-content" id="settings-tab-account">
            {/* Profile */}
            <div className="settings-section">
              <h2 className="settings-section-title">Profile</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div id="settingsProfileAvatar" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--border-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--fg-muted)' }}>U</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>Loading...</div>
                </div>
              </div>
              <div className="settings-field">
                <label className="settings-label">Display name</label>
                <input type="text" id="settingsProfileName" className="settings-input" />
              </div>
              <div className="settings-field">
                <label className="settings-label">Email</label>
                <input type="email" id="settingsProfileEmail" className="settings-input" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <p style={{ fontSize: '12px', color: 'var(--fg-muted)', marginTop: '4px' }}>Email is managed by your authentication provider.</p>
              </div>
              <button id="settingsSaveProfile" className="settings-btn-primary">Save profile</button>
            </div>

            {/* Default Model */}
            <div className="settings-section">
              <h2 className="settings-section-title">Default AI Model</h2>
              <p style={{ fontSize: '14px', color: 'var(--fg-muted)', marginBottom: '12px' }}>Used for new projects unless overridden per-project.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {[
                  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic' },
                  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
                  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
                  { id: 'gemini-2.5-flash', name: 'Gemini Flash', provider: 'Google' },
                  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic' },
                  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral' },
                  { id: 'deepseek-chat', name: 'DeepSeek', provider: 'DeepSeek' },
                ].map(function(m) {
                  return (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--border-100)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <input type="radio" name="settingsDefaultModel" value={m.id} style={{ accentColor: 'var(--accent-100)' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{m.provider}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <button id="settingsSaveModel" className="settings-btn-primary">Save preference</button>
            </div>

            {/* Notifications */}
            <div className="settings-section">
              <h2 className="settings-section-title">Notifications</h2>
              {[
                { id: 'notifyBuilds', label: 'Build updates', desc: 'Get notified when a build completes or fails' },
                { id: 'notifyInvites', label: 'Collaboration invites', desc: 'Email me when someone invites me to a project' },
                { id: 'notifyMarketing', label: 'Product updates', desc: 'Occasional emails about new features' },
              ].map(function(item) {
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-100)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--fg-muted)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <div id={'settings-' + item.id} className={'settings-notif-toggle' + (item.id !== 'notifyMarketing' ? ' active' : '')} style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-100)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: '2px', left: '2px', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                );
              })}
              <button id="settingsSaveNotifications" className="settings-btn-primary" style={{ marginTop: '16px' }}>Save preferences</button>
            </div>

            {/* Sign Out */}
            <div className="settings-section">
              <button id="settingsSignOut" className="settings-btn-secondary">Sign out</button>
            </div>

            {/* Delete Account */}
            <div className="settings-section settings-danger">
              <h2 className="settings-section-title" style={{ color: '#dc2626' }}>Delete Account</h2>
              <p style={{ fontSize: '14px', color: 'var(--fg-muted)', marginBottom: '16px' }}>Permanently delete your Argus account. This cannot be undone.</p>
              <button id="settingsDeleteAccountBtn" className="settings-btn-danger">Delete account</button>
              <div id="settingsDeleteReveal" style={{ display: 'none', marginTop: '12px', padding: '16px', border: '1px solid #fca5a5', borderRadius: '10px', background: 'rgba(254,226,226,0.3)' }}>
                <div style={{ fontSize: '14px', color: '#b91c1c', marginBottom: '8px' }}>
                  <p style={{ fontWeight: '500', marginBottom: '6px' }}>This will permanently:</p>
                  <ul style={{ listStyle: 'disc', paddingLeft: '20px', fontSize: '13px' }}>
                    <li>Delete all your projects and builds</li>
                    <li>Delete all workspaces you own</li>
                    <li>Cancel all active subscriptions</li>
                    <li>Remove all your API keys and data</li>
                  </ul>
                </div>
                <p style={{ fontSize: '14px', color: '#b91c1c', fontWeight: '500', marginBottom: '8px' }}>Type your email to confirm:</p>
                <input type="text" id="settingsDeleteInput" className="settings-input" style={{ borderColor: '#fca5a5', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button id="settingsDeleteConfirm" disabled className="settings-btn-danger" style={{ opacity: 0.5 }}>Delete my account</button>
                  <button id="settingsDeleteCancel" style={{ fontSize: '14px', color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Settings-specific styles */}
      <style>{`
        .settings-tab-content { display: none; }
        .settings-tab-content.active { display: block; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .settings-section { padding: 24px; border: 1px solid var(--border-100); border-radius: 12px; background: var(--bg-100); margin-bottom: 16px; }
        .settings-section.settings-danger { border-color: #fca5a5; }
        .settings-section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: var(--fg-100); }
        .settings-field { margin-bottom: 16px; }
        .settings-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--fg-200); }
        .settings-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border-100); border-radius: 8px; font-size: 14px; background: var(--bg-100); color: var(--fg-100); outline: none; transition: border-color 0.15s; font-family: inherit; }
        .settings-input:focus { border-color: var(--accent-100); }
        .settings-btn-primary { padding: 10px 20px; background: var(--accent-100); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; font-family: inherit; }
        .settings-btn-primary:hover { opacity: 0.9; }
        .settings-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .settings-btn-secondary { padding: 10px 20px; background: none; color: var(--fg-200); border: 1px solid var(--border-100); border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; font-family: inherit; }
        .settings-btn-secondary:hover { background: var(--bg-300); }
        .settings-btn-danger { padding: 10px 20px; background: none; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
        .settings-btn-danger:hover { background: rgba(254,226,226,0.5); }
        .settings-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .settings-notif-toggle.active { background: var(--accent-100) !important; }
        .settings-notif-toggle.active > div { transform: translateX(20px) !important; }
        #settingsToast.active { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
