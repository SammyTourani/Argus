// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchCurrentUser, fetchSubscription, fetchConnectorStatuses, escapeHtml } from './workspace-api';
import { getActiveWorkspace, getActiveTeamId, setActiveWorkspace, onWorkspaceChange } from './workspace-active';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {

  /* ===== SECTION NAVIGATION ===== */
  useEffect(() => {
    var navItems = document.querySelectorAll('.settings-nav-item');
    var sections = document.querySelectorAll('.settings-section-content');

    function switchSection(sectionId) {
      navItems.forEach(function(n) { n.classList.remove('active'); });
      sections.forEach(function(s) { s.style.display = 'none'; });
      var navItem = document.querySelector('.settings-nav-item[data-section="' + sectionId + '"]');
      var section = document.getElementById('section-' + sectionId);
      if (navItem) navItem.classList.add('active');
      if (section) { section.style.display = 'block'; section.style.animation = 'settingsFadeIn 0.2s ease'; }
    }

    navItems.forEach(function(item) {
      item.addEventListener('click', function() { switchSection(item.getAttribute('data-section')); });
    });

    // Determine initial section from URL
    var params = new URLSearchParams(window.location.search);
    var section = params.get('section') || params.get('tab');
    var billing = params.get('billing');
    if (billing) section = 'plans';
    if (section === 'members') section = 'people';
    if (!section) section = getActiveTeamId() ? 'general' : 'account';
    // If section doesn't exist (personal user accessing team section), fall back
    var target = document.getElementById('section-' + section);
    if (!target) section = 'account';

    setTimeout(function() { switchSection(section); }, 50);
  }, []);

  /* ===== BILLING REDIRECT TOAST ===== */
  useEffect(() => {
    var params = new URLSearchParams(window.location.search);
    var billing = params.get('billing');
    if (!billing) return;
    var toast = document.getElementById('settingsToast');
    if (toast) {
      toast.textContent = billing === 'success' ? "You're now on Pro!" : 'Upgrade cancelled. Try again any time.';
      toast.style.opacity = '1';
      setTimeout(function() { toast.style.opacity = '0'; }, 4000);
    }
    var url = new URL(window.location.href);
    url.searchParams.delete('billing');
    window.history.replaceState({}, '', url.toString());
  }, []);

  /* ===== WORKSPACE CHANGE LISTENER ===== */
  useEffect(() => {
    var cleanup = onWorkspaceChange(function() {
      window.location.reload();
    });
    return cleanup;
  }, []);

  /* ===== MOBILE MENU ===== */
  useEffect(() => {
    var menuBtn = document.getElementById('settingsMobileBtn');
    var sidebar = document.querySelector('.page-settings .sidebar');
    var overlay = document.getElementById('settingsSidebarOverlay');
    if (!menuBtn || !sidebar || !overlay) return;

    function toggle() {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    }
    menuBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
    return () => {
      menuBtn.removeEventListener('click', toggle);
      overlay.removeEventListener('click', toggle);
    };
  }, []);

  /* ===== LOAD USER PROFILE (Account section) ===== */
  useEffect(() => {
    var cancelled = false;
    fetchCurrentUser().then(function(user) {
      if (cancelled || !user) return;
      var nameInput = document.getElementById('settingsProfileName');
      var emailInput = document.getElementById('settingsProfileEmail');
      var avatarEl = document.getElementById('settingsProfileAvatar');
      var avatarImg = document.getElementById('settingsProfileAvatarImg');
      var avatarInitial = document.getElementById('settingsProfileAvatarInitial');
      if (nameInput) nameInput.value = user.name || '';
      if (emailInput) emailInput.value = user.email || '';
      // Show real avatar or fallback to initial
      if (user.avatarUrl && avatarImg) {
        avatarImg.src = user.avatarUrl;
        avatarImg.style.display = 'block';
        if (avatarInitial) avatarInitial.style.display = 'none';
      } else if (avatarInitial) {
        avatarInitial.textContent = user.initial;
      }
      // Store email for delete confirmation
      var container = document.querySelector('.page-settings');
      if (container) container.setAttribute('data-user-email', user.email || '');
    }).catch(function() {});

    // Load notification prefs
    try {
      var stored = localStorage.getItem('argus_notification_prefs');
      if (stored) {
        var parsed = JSON.parse(stored);
        ['notifyBuilds', 'notifyInvites', 'notifyMarketing'].forEach(function(key) {
          var toggle = document.getElementById('settings-' + key);
          if (toggle && typeof parsed[key] === 'boolean') toggle.classList.toggle('active', parsed[key]);
        });
      }
    } catch (e) {}

    return () => { cancelled = true; };
  }, []);

  /* ===== ACCOUNT SECTION: SAVE HANDLERS ===== */
  useEffect(() => {
    // Save profile
    var saveProfileBtn = document.getElementById('settingsSaveProfile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', function() {
        var nameInput = document.getElementById('settingsProfileName');
        if (!nameInput) return;
        saveProfileBtn.textContent = 'Saving...';
        saveProfileBtn.disabled = true;
        var supabase = createClient();
        supabase.auth.updateUser({ data: { full_name: nameInput.value } }).then(function() {
          saveProfileBtn.textContent = '✓ Saved';
          setTimeout(function() { saveProfileBtn.textContent = 'Save profile'; saveProfileBtn.disabled = false; }, 2000);
        });
      });
    }

    // Notification toggles
    document.querySelectorAll('.settings-notif-toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function() { toggle.classList.toggle('active'); });
    });

    // Save notifications
    var saveNotifBtn = document.getElementById('settingsSaveNotifications');
    if (saveNotifBtn) {
      saveNotifBtn.addEventListener('click', function() {
        var prefs = {};
        ['notifyBuilds', 'notifyInvites', 'notifyMarketing'].forEach(function(key) {
          var el = document.getElementById('settings-' + key);
          prefs[key] = el ? el.classList.contains('active') : false;
        });
        try { localStorage.setItem('argus_notification_prefs', JSON.stringify(prefs)); } catch(e) {}
        saveNotifBtn.textContent = '✓ Saved';
        setTimeout(function() { saveNotifBtn.textContent = 'Save preferences'; }, 2000);
      });
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
        deleteAcctConfirm.style.opacity = deleteAcctConfirm.disabled ? '0.5' : '1';
      });
      deleteAcctConfirm.addEventListener('click', function() {
        deleteAcctConfirm.textContent = 'Deleting...';
        deleteAcctConfirm.disabled = true;
        fetch('/api/user/delete-account', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmEmail: deleteAcctInput.value.trim() }),
        }).then(function(res) {
          if (!res.ok) return res.json().then(function(d) { alert(d.error || 'Failed'); deleteAcctConfirm.textContent = 'Delete my account'; deleteAcctConfirm.disabled = false; deleteAcctConfirm.style.opacity = '0.5'; });
          var supabase = createClient();
          supabase.auth.signOut().then(function() { window.location.href = '/'; });
        }).catch(function() { alert('Something went wrong.'); deleteAcctConfirm.textContent = 'Delete my account'; deleteAcctConfirm.disabled = false; });
      });
    }
  }, []);

  /* ===== PLANS & CREDITS: LOAD SUBSCRIPTION ===== */
  useEffect(() => {
    var cancelled = false;
    fetchSubscription().then(function(sub) {
      if (cancelled) return;
      var tierEl = document.getElementById('settingsTier');
      var priceEl = document.getElementById('settingsTierPrice');
      var creditsEl = document.getElementById('settingsCredits');
      var progressEl = document.getElementById('settingsCreditProgress');
      var tier = sub.tier || 'free';
      if (tierEl) tierEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan';
      if (priceEl) priceEl.textContent = tier === 'free' ? '$0/month' : tier === 'pro' ? '$19/month' : tier === 'team' ? '$49/month' : 'Custom';
      if (creditsEl) creditsEl.textContent = (sub.creditsRemaining || 0) + ' / ' + (sub.creditsTotal || 30);
      if (progressEl) {
        var pct = Math.round(((sub.creditsRemaining || 0) / (sub.creditsTotal || 30)) * 100);
        progressEl.style.width = Math.min(100, pct) + '%';
        if ((sub.creditsRemaining || 0) <= 5) progressEl.style.background = '#ef4444';
      }
      var upgradeSection = document.getElementById('settingsUpgradeSection');
      if (upgradeSection) upgradeSection.style.display = tier === 'free' ? '' : 'none';
      var manageSection = document.getElementById('settingsManageSection');
      if (manageSection) manageSection.style.display = tier !== 'free' ? '' : 'none';
      var activeBadge = document.getElementById('settingsActiveBadge');
      if (activeBadge) activeBadge.style.display = tier !== 'free' ? '' : 'none';
    }).catch(function() {});

    // Upgrade buttons
    function doUpgrade(plan) {
      var teamId = getActiveTeamId();
      var body = { plan: plan };
      if (teamId) body.team_id = teamId;
      fetch('/api/stripe/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function(r) { return r.json(); }).then(function(d) { if (d.url) window.location.href = d.url; });
    }
    var proBtn = document.getElementById('settingsUpgradePro');
    var teamBtn = document.getElementById('settingsUpgradeTeam');
    if (proBtn) proBtn.addEventListener('click', function() { doUpgrade('pro'); });
    if (teamBtn) teamBtn.addEventListener('click', function() { doUpgrade('team'); });

    var manageBtn = document.getElementById('settingsManageBilling');
    if (manageBtn) {
      manageBtn.addEventListener('click', function() {
        manageBtn.textContent = 'Opening...';
        var teamId = getActiveTeamId();
        var url = teamId ? '/api/stripe/billing-portal?team_id=' + teamId : '/api/stripe/billing-portal';
        fetch(url).then(function(r) { return r.json(); }).then(function(d) {
          if (d.url) window.location.href = d.url;
          else manageBtn.textContent = 'Manage Subscription';
        }).catch(function() { manageBtn.textContent = 'Manage Subscription'; });
      });
    }

    return () => { cancelled = true; };
  }, []);

  /* ===== GENERAL: WORKSPACE SETTINGS ===== */
  useEffect(() => {
    var teamId = getActiveTeamId();
    if (!teamId) return;
    var cancelled = false;

    fetch('/api/teams/' + teamId).then(function(r) { return r.json(); }).then(function(data) {
      if (cancelled || !data.team) return;
      var nameInput = document.getElementById('settingsWsName');
      var descInput = document.getElementById('settingsWsDesc');
      var slugEl = document.getElementById('settingsWsSlug');
      var charCount = document.getElementById('settingsWsNameCount');
      if (nameInput) { nameInput.value = data.team.name || ''; if (charCount) charCount.textContent = (data.team.name || '').length + ' / 50 characters'; }
      if (descInput) descInput.value = data.team.description || '';
      if (slugEl) slugEl.textContent = data.team.slug || '';
      var container = document.querySelector('.page-settings');
      if (container) container.setAttribute('data-team-role', data.team.role || '');
      var dangerZone = document.getElementById('settingsDangerZone');
      if (dangerZone) dangerZone.style.display = data.team.role === 'owner' ? '' : 'none';
      if (data.team.role !== 'owner' && data.team.role !== 'admin') {
        if (nameInput) { nameInput.disabled = true; nameInput.style.opacity = '0.5'; }
        if (descInput) { descInput.disabled = true; descInput.style.opacity = '0.5'; }
        var saveBtn = document.getElementById('settingsSaveWorkspace');
        if (saveBtn) saveBtn.style.display = 'none';
      }
    });

    // Name character count
    var nameInput = document.getElementById('settingsWsName');
    var charCount = document.getElementById('settingsWsNameCount');
    if (nameInput && charCount) {
      nameInput.addEventListener('input', function() { charCount.textContent = nameInput.value.length + ' / 50 characters'; });
    }

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
          if (res.ok) { setActiveWorkspace({ id: teamId, name: (nameInput?.value || '').trim() }); saveWsBtn.textContent = '✓ Saved'; }
          else saveWsBtn.textContent = 'Error';
          setTimeout(function() { saveWsBtn.textContent = 'Save changes'; saveWsBtn.disabled = false; }, 2000);
        });
      });
    }

    // Delete workspace
    var deleteWsBtn = document.getElementById('settingsDeleteWsBtn');
    var deleteWsReveal = document.getElementById('settingsDeleteWsReveal');
    var deleteWsCancel = document.getElementById('settingsDeleteWsCancel');
    var deleteWsConfirm = document.getElementById('settingsDeleteWsConfirm');
    var deleteWsInput = document.getElementById('settingsDeleteWsInput');

    if (deleteWsBtn) deleteWsBtn.addEventListener('click', function() { if (deleteWsReveal) deleteWsReveal.style.display = 'block'; deleteWsBtn.style.display = 'none'; });
    if (deleteWsCancel) deleteWsCancel.addEventListener('click', function() { if (deleteWsReveal) deleteWsReveal.style.display = 'none'; if (deleteWsBtn) deleteWsBtn.style.display = ''; if (deleteWsInput) deleteWsInput.value = ''; });
    if (deleteWsConfirm && deleteWsInput) {
      deleteWsInput.addEventListener('input', function() {
        var nameInput = document.getElementById('settingsWsName');
        deleteWsConfirm.disabled = deleteWsInput.value !== (nameInput?.value || '');
        deleteWsConfirm.style.opacity = deleteWsConfirm.disabled ? '0.5' : '1';
      });
      deleteWsConfirm.addEventListener('click', function() {
        deleteWsConfirm.textContent = 'Deleting...'; deleteWsConfirm.disabled = true;
        fetch('/api/teams/' + teamId, { method: 'DELETE' }).then(function(res) {
          if (res.ok) { setActiveWorkspace({ id: 'personal', name: 'Personal' }); window.location.href = '/workspace'; }
          else { res.json().then(function(d) { alert(d.error || 'Failed'); }); deleteWsConfirm.textContent = 'Yes, delete workspace'; deleteWsConfirm.disabled = false; }
        });
      });
    }

    return () => { cancelled = true; };
  }, []);

  /* ===== PEOPLE: LOAD MEMBERS ===== */
  useEffect(() => {
    var teamId = getActiveTeamId();
    if (!teamId) return;
    var cancelled = false;

    fetch('/api/teams/' + teamId + '/members').then(function(r) { return r.json(); }).then(function(data) {
      if (cancelled || !data.members) return;
      var tbody = document.getElementById('settingsMembersList');
      if (!tbody) return;
      var html = '';
      data.members.forEach(function(m) {
        var p = m.profiles || {};
        var name = p.full_name || p.email || 'Unknown';
        var initial = name.charAt(0).toUpperCase();
        var avatar = p.avatar_url ? '<img src="' + escapeHtml(p.avatar_url) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover" />' : '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent-100),var(--accent-200));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px">' + initial + '</div>';
        var roleBadge = m.role === 'owner' ? '<span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:var(--accent-100);color:white">Owner</span>' : '<span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500;background:var(--bg-300);color:var(--fg-200)">' + m.role.charAt(0).toUpperCase() + m.role.slice(1) + '</span>';
        var date = m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-100)">' +
          avatar +
          '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500">' + escapeHtml(name) + '</div><div style="font-size:12px;color:var(--fg-muted)">' + escapeHtml(p.email || '') + '</div></div>' +
          roleBadge +
          '<div style="font-size:12px;color:var(--fg-muted);min-width:80px;text-align:right">' + date + '</div>' +
          '</div>';
      });
      tbody.innerHTML = html || '<div style="padding:16px;color:var(--fg-muted);font-size:14px">No members yet.</div>';

      // Invite form
      var inviteBtn = document.getElementById('settingsInviteBtn');
      var inviteForm = document.getElementById('settingsInviteForm');
      var inviteCancel = document.getElementById('settingsInviteCancel');
      var inviteSubmit = document.getElementById('settingsInviteSubmit');
      var inviteEmail = document.getElementById('settingsInviteEmail');
      var inviteMsg = document.getElementById('settingsInviteMsg');

      if (inviteBtn) inviteBtn.addEventListener('click', function() { if (inviteForm) inviteForm.style.display = 'block'; inviteBtn.style.display = 'none'; });
      if (inviteCancel) inviteCancel.addEventListener('click', function() { if (inviteForm) inviteForm.style.display = 'none'; if (inviteBtn) inviteBtn.style.display = ''; if (inviteEmail) inviteEmail.value = ''; if (inviteMsg) inviteMsg.textContent = ''; });
      if (inviteSubmit && inviteEmail) {
        inviteSubmit.addEventListener('click', function() {
          var email = inviteEmail.value.trim();
          if (!email) return;
          inviteSubmit.textContent = 'Inviting...';
          inviteSubmit.disabled = true;
          fetch('/api/teams/' + teamId + '/members', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email }),
          }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); }).then(function(result) {
            if (result.ok) { window.location.reload(); }
            else { if (inviteMsg) { inviteMsg.textContent = result.data.error || 'Failed'; inviteMsg.style.color = '#dc2626'; } inviteSubmit.textContent = 'Invite'; inviteSubmit.disabled = false; }
          });
        });
      }
    });

    return () => { cancelled = true; };
  }, []);

  /* ===== CONNECTORS: LOAD STATUS ===== */
  useEffect(() => {
    var cancelled = false;
    fetchConnectorStatuses().then(function(connectors) {
      if (cancelled) return;
      var statusMap = {};
      (connectors || []).forEach(function(c) { statusMap[c.provider] = c.status; });
      document.querySelectorAll('.settings-connector-status').forEach(function(el) {
        var provider = el.getAttribute('data-provider');
        if (statusMap[provider] === 'connected') {
          el.textContent = 'Connected';
          el.style.color = '#16a34a';
        }
      });
    });
    return () => { cancelled = true; };
  }, []);

  /* ===== LABS: DARK MODE TOGGLE ===== */
  useEffect(() => {
    var toggle = document.getElementById('settingsDarkModeToggle');
    if (!toggle) return;
    var template = localStorage.getItem('argus-hero-template') || 'classic';
    if (template === 'matrix') toggle.classList.add('active');

    toggle.addEventListener('click', function() {
      toggle.classList.toggle('active');
      var isDark = toggle.classList.contains('active');
      localStorage.setItem('argus-hero-template', isDark ? 'matrix' : 'classic');
      localStorage.setItem('argus-dark-mode', isDark ? 'true' : 'false');
      var root = document.querySelector('.workspace-root');
      if (root) root.classList.toggle('dark', isDark);
      window.dispatchEvent(new CustomEvent('argus-dark-mode-change', { detail: { dark: isDark } }));
    });
  }, []);

  /* ===== DARK MODE SYNC ===== */
  useEffect(() => {
    var template = localStorage.getItem('argus-hero-template') || 'classic';
    var isDark = template === 'matrix';
    var root = document.querySelector('.workspace-root');
    if (root) root.classList.toggle('dark', isDark);
    if (isDark) document.documentElement.setAttribute('data-argus-dark', 'true');
    else document.documentElement.removeAttribute('data-argus-dark');

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
    return () => window.removeEventListener('storage', storageHandler);
  }, []);

  var hasTeam = typeof window !== 'undefined' && getActiveTeamId();

  return (
    <div className="app page-settings">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" id="settingsMobileBtn">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
      </button>
      <div className="sidebar-overlay" id="settingsSidebarOverlay"></div>

      {/* SETTINGS SIDEBAR — Lovable-style with section navigation */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ paddingBottom: '12px' }}>
          <a href="/workspace" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--fg-200)', fontSize: '13px', fontWeight: '500' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L5 8l5 5" /></svg>
            Back to workspace
          </a>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {/* WORKSPACE group */}
          {hasTeam && (<>
            <div className="nav-section-label">Workspace</div>
            <div className="nav-item settings-nav-item active" data-section="general">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="2.5" /><path d="M10 2v3M10 15v3M2 10h3M15 10h3" /></svg>
              General
            </div>
            <div className="nav-item settings-nav-item" data-section="people">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3" /><circle cx="14" cy="8" r="2.5" /><path d="M2 17c0-3 2.2-5.5 5-5.8M11.5 17c0-2.5 1.5-4.5 3.5-5" /></svg>
              People
            </div>
            <div className="nav-item settings-nav-item" data-section="plans">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="16" height="11" rx="2" /><path d="M2 9h16" /></svg>
              Plans &amp; credits
            </div>
            <div className="nav-item settings-nav-item" data-section="privacy">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="9" width="10" height="8" rx="2" /><path d="M7 9V6a3 3 0 016 0v3" /></svg>
              Privacy &amp; security
            </div>
          </>)}

          {/* ACCOUNT group */}
          <div className="nav-section-label">Account</div>
          <div className={'nav-item settings-nav-item' + (!hasTeam ? ' active' : '')} data-section="account">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
            Your account
          </div>
          <div className="nav-item settings-nav-item" data-section="labs">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v5l-4 8h12l-4-8V3M6 3h8" /></svg>
            Labs
          </div>

          {/* KNOWLEDGE group */}
          <div className="nav-section-label">Knowledge</div>
          <div className="nav-item settings-nav-item" data-section="knowledge">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h5l2 2h7v10H3V4z" /></svg>
            Knowledge
          </div>

          {/* CONNECTORS group */}
          <div className="nav-section-label">Connectors</div>
          <div className="nav-item settings-nav-item" data-section="connectors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3v4a2 2 0 01-2 2H3M13 3v4a2 2 0 002 2h2M7 17v-4a2 2 0 00-2-2H3M13 17v-4a2 2 0 012-2h2" /></svg>
            Connectors
          </div>
          <div className="nav-item settings-nav-item" data-section="github">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2C5.6 2 2 5.6 2 10c0 3.5 2.3 6.5 5.5 7.5.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.4 7.4 0 014 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.6v2.4c0 .2.1.5.6.4A8 8 0 0018 10c0-4.4-3.6-8-8-8z" /></svg>
            GitHub
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        <div className="main-inner" style={{ maxWidth: '800px' }}>

          {/* Toast */}
          <div id="settingsToast" style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--accent-100)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '600', opacity: '0', transition: 'opacity 0.3s', pointerEvents: 'none', zIndex: 1000 }}></div>

          {/* ═══════════ GENERAL ═══════════ */}
          {hasTeam && (
            <div className="settings-section-content" id="section-general" style={{ display: 'none' }}>
              <h1 className="page-title stagger-1">Workspace settings</h1>
              <p className="page-subtitle" style={{ marginBottom: '24px' }}>Manage your workspace details and preferences.</p>

              <div className="settings-card">
                <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div><div className="settings-row-label">Avatar</div><div className="settings-row-desc">Set an avatar for your workspace.</div></div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-100),var(--accent-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }} id="settingsWsAvatar">A</div>
                </div>
                <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div><div className="settings-row-label">Name</div><div className="settings-row-desc">Your full workspace name, as visible to others.</div></div>
                  <div style={{ width: '300px' }}>
                    <input type="text" id="settingsWsName" className="settings-input" maxLength={50} placeholder="My Workspace" />
                    <div id="settingsWsNameCount" style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '4px', textAlign: 'right' }}>0 / 50 characters</div>
                  </div>
                </div>
                <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div><div className="settings-row-label">Description</div><div className="settings-row-desc">A brief description of this workspace.</div></div>
                  <div style={{ width: '300px' }}>
                    <textarea id="settingsWsDesc" className="settings-input" rows={3} maxLength={500} placeholder="What is this workspace for?" style={{ resize: 'none' }}></textarea>
                  </div>
                </div>
                <div className="settings-row">
                  <div><div className="settings-row-label">Workspace handle</div><div className="settings-row-desc">Your workspace's unique identifier.</div></div>
                  <div id="settingsWsSlug" style={{ fontSize: '14px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>—</div>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}><button id="settingsSaveWorkspace" className="settings-btn-primary">Save changes</button></div>

              {/* Danger Zone */}
              <div className="settings-card settings-card-danger" id="settingsDangerZone" style={{ display: 'none', marginTop: '24px' }}>
                <div className="settings-row-label" style={{ color: '#dc2626' }}>Leave workspace</div>
                <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: '8px 0 16px' }}>Permanently delete this workspace. All team members will lose access and any active subscription will be cancelled.</p>
                <button id="settingsDeleteWsBtn" className="settings-btn-danger">Delete workspace</button>
                <div id="settingsDeleteWsReveal" style={{ display: 'none', marginTop: '12px', padding: '16px', border: '1px solid #fca5a5', borderRadius: '10px', background: 'rgba(254,226,226,0.15)' }}>
                  <p style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '500', marginBottom: '8px' }}>Type the workspace name to confirm:</p>
                  <input type="text" id="settingsDeleteWsInput" className="settings-input" style={{ borderColor: '#fca5a5', marginBottom: '12px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button id="settingsDeleteWsConfirm" disabled className="settings-btn-danger" style={{ opacity: 0.5 }}>Yes, delete workspace</button>
                    <button id="settingsDeleteWsCancel" style={{ fontSize: '13px', color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PEOPLE ═══════════ */}
          {hasTeam && (
            <div className="settings-section-content" id="section-people" style={{ display: 'none' }}>
              <h1 className="page-title stagger-1">People</h1>
              <p className="page-subtitle" style={{ marginBottom: '24px' }}>Manage who has access to this workspace.</p>
              <div className="settings-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>Members</div>
                  <button id="settingsInviteBtn" className="settings-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Invite members</button>
                </div>
                <div id="settingsInviteForm" style={{ display: 'none', padding: '16px', border: '1px solid var(--border-100)', borderRadius: '10px', marginBottom: '16px', background: 'var(--bg-200)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Invite by email</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="email" id="settingsInviteEmail" className="settings-input" placeholder="name@example.com" style={{ flex: 1 }} />
                    <button id="settingsInviteSubmit" className="settings-btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}>Invite</button>
                    <button id="settingsInviteCancel" style={{ fontSize: '13px', color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                  <div id="settingsInviteMsg" style={{ fontSize: '12px', marginTop: '6px' }}></div>
                </div>
                <div id="settingsMembersList"><div style={{ padding: '16px', color: 'var(--fg-muted)', fontSize: '14px' }}>Loading members...</div></div>
              </div>
            </div>
          )}

          {/* ═══════════ PLANS & CREDITS ═══════════ */}
          <div className="settings-section-content" id="section-plans" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">Plans &amp; credits</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>Manage your subscription plan and credit balance.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span id="settingsTier" style={{ fontSize: '15px', fontWeight: '600' }}>Free Plan</span>
                  <span id="settingsActiveBadge" style={{ display: 'none', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: '600', background: 'var(--accent-100)', color: 'white' }}>ACTIVE</span>
                </div>
                <div id="settingsTierPrice" style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>$0/month</div>
                <div id="settingsManageSection" style={{ display: 'none', marginTop: '12px' }}>
                  <button id="settingsManageBilling" className="settings-btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>Manage</button>
                </div>
              </div>
              <div className="settings-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Credits remaining</span>
                  <span id="settingsCredits" style={{ fontSize: '14px', fontWeight: '600' }}>0 / 30</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-100)', overflow: 'hidden', marginTop: '10px' }}>
                  <div id="settingsCreditProgress" style={{ height: '100%', borderRadius: '3px', background: 'var(--accent-100)', width: '100%', transition: 'width 0.5s' }}></div>
                </div>
              </div>
            </div>

            <div id="settingsUpgradeSection">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="settings-card">
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Pro</div>
                  <div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '16px' }}>For individuals building seriously.</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>$19<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--fg-muted)' }}>/month</span></div>
                  <button id="settingsUpgradePro" className="settings-btn-primary" style={{ width: '100%', marginTop: '16px' }}>Upgrade</button>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px', fontSize: '13px', color: 'var(--fg-200)' }}>
                    <li style={{ padding: '4px 0' }}>✓ 300 credits / month</li>
                    <li style={{ padding: '4px 0' }}>✓ All 9 AI models</li>
                    <li style={{ padding: '4px 0' }}>✓ Deploy to Vercel</li>
                    <li style={{ padding: '4px 0' }}>✓ Priority queue</li>
                  </ul>
                </div>
                <div className="settings-card">
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Team</div>
                  <div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '16px' }}>For teams building together.</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>$49<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--fg-muted)' }}>/month</span></div>
                  <button id="settingsUpgradeTeam" className="settings-btn-secondary" style={{ width: '100%', marginTop: '16px' }}>Upgrade</button>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px', fontSize: '13px', color: 'var(--fg-200)' }}>
                    <li style={{ padding: '4px 0' }}>✓ 500 credits / month</li>
                    <li style={{ padding: '4px 0' }}>✓ Everything in Pro</li>
                    <li style={{ padding: '4px 0' }}>✓ 5 team members</li>
                    <li style={{ padding: '4px 0' }}>✓ Shared library &amp; SSO</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════ PRIVACY & SECURITY (HOLLOW) ═══════════ */}
          <div className="settings-section-content" id="section-privacy" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">Privacy &amp; security</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>Manage privacy and security settings for your workspace.</p>
            <div className="settings-card">
              {[
                { label: 'Default project visibility', desc: 'Choose whether new projects start as public, private, or drafts.', badge: null, type: 'select' },
                { label: 'Default website access', desc: 'Choose if published websites are public or workspace-only.', badge: 'Business', type: 'select' },
                { label: 'MCP servers access', desc: 'Allow workspace members to use MCP servers.', badge: 'Business', type: 'toggle' },
                { label: 'Data collection opt out', desc: 'Opt out of data collection for this workspace.', badge: 'Business', type: 'toggle' },
                { label: 'Restrict workspace invitations', desc: 'Only admins and owners can invite to this workspace.', badge: 'Enterprise', type: 'toggle' },
                { label: 'Allow editors to transfer projects', desc: 'Editors who own a project can transfer it to another workspace.', badge: 'Enterprise', type: 'toggle' },
                { label: 'Invite links', desc: 'Allow workspace members to create and share invite links.', badge: null, type: 'toggle' },
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < 6 ? '1px solid var(--border-100)' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
                        {item.badge && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: item.badge === 'Enterprise' ? 'var(--bg-300)' : 'rgba(99,102,241,0.1)', color: item.badge === 'Enterprise' ? 'var(--fg-muted)' : '#6366f1' }}>{item.badge}</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    {item.type === 'toggle' ? (
                      <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-100)', cursor: 'not-allowed', position: 'relative', opacity: 0.5, flexShrink: 0 }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: '2px', left: '2px' }}></div>
                      </div>
                    ) : (
                      <div style={{ padding: '6px 12px', border: '1px solid var(--border-100)', borderRadius: '8px', fontSize: '13px', color: 'var(--fg-muted)', cursor: 'not-allowed', opacity: 0.5 }}>Workspace</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════ YOUR ACCOUNT ═══════════ */}
          <div className="settings-section-content" id="section-account" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">Account settings</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>Personalize how others see and interact with you on Argus.</p>

            <div className="settings-card">
              <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div><div className="settings-row-label">Profile</div><div className="settings-row-desc">Change name and avatar on your profile.</div></div>
                <div id="settingsProfileAvatar" style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--accent-100),var(--accent-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img id="settingsProfileAvatarImg" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'none' }} alt="" />
                  <span id="settingsProfileAvatarInitial" style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>U</span>
                </div>
              </div>
              <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div><div className="settings-row-label">Display name</div><div className="settings-row-desc">Your name as shown to others.</div></div>
                <input type="text" id="settingsProfileName" className="settings-input" style={{ width: '300px' }} />
              </div>
              <div className="settings-row">
                <div><div className="settings-row-label">Email</div><div className="settings-row-desc">Managed by your authentication provider.</div></div>
                <input type="email" id="settingsProfileEmail" className="settings-input" disabled style={{ width: '300px', opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}><button id="settingsSaveProfile" className="settings-btn-primary">Save profile</button></div>

            {/* Notifications */}
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Notifications</div>
              {[
                { id: 'notifyBuilds', label: 'Build updates', desc: 'Get notified when a build completes or fails' },
                { id: 'notifyInvites', label: 'Collaboration invites', desc: 'Email me when someone invites me to a project' },
                { id: 'notifyMarketing', label: 'Product updates', desc: 'Occasional emails about new features' },
              ].map(function(item, i) {
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border-100)' : 'none' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div><div style={{ fontSize: '12px', color: 'var(--fg-muted)', marginTop: '2px' }}>{item.desc}</div></div>
                    <div id={'settings-' + item.id} className={'settings-notif-toggle' + (item.id !== 'notifyMarketing' ? ' active' : '')} style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-100)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: '2px', left: '2px', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '16px' }}><button id="settingsSaveNotifications" className="settings-btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>Save preferences</button></div>
            </div>

            {/* Sign out + Delete */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button id="settingsSignOut" className="settings-btn-secondary">Sign out</button>
            </div>

            <div className="settings-card settings-card-danger" style={{ marginTop: '24px' }}>
              <div className="settings-row-label" style={{ color: '#dc2626' }}>Delete account</div>
              <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: '8px 0 16px' }}>Permanently delete your Argus account. This cannot be undone.</p>
              <button id="settingsDeleteAccountBtn" className="settings-btn-danger">Delete account</button>
              <div id="settingsDeleteReveal" style={{ display: 'none', marginTop: '12px', padding: '16px', border: '1px solid #fca5a5', borderRadius: '10px', background: 'rgba(254,226,226,0.15)' }}>
                <p style={{ fontWeight: '500', fontSize: '13px', color: '#b91c1c', marginBottom: '6px' }}>This will permanently:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', fontSize: '12px', color: '#b91c1c', marginBottom: '12px' }}>
                  <li>Delete all your projects and builds</li>
                  <li>Delete all workspaces you own</li>
                  <li>Cancel all active subscriptions</li>
                  <li>Remove all your API keys and data</li>
                </ul>
                <p style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '500', marginBottom: '8px' }}>Type your email to confirm:</p>
                <input type="text" id="settingsDeleteInput" className="settings-input" style={{ borderColor: '#fca5a5', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button id="settingsDeleteConfirm" disabled className="settings-btn-danger" style={{ opacity: 0.5 }}>Delete my account</button>
                  <button id="settingsDeleteCancel" style={{ fontSize: '13px', color: 'var(--fg-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════ LABS (HOLLOW) ═══════════ */}
          <div className="settings-section-content" id="section-labs" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">Labs</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>These are experimental features that might be modified or removed.</p>
            <div className="settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-100)' }}>
                <div><div style={{ fontSize: '14px', fontWeight: '600' }}>Dark mode</div><div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '2px' }}>Toggle dark theme across the workspace.</div></div>
                <div id="settingsDarkModeToggle" className="settings-notif-toggle" style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-100)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: '2px', left: '2px', transition: 'transform 0.2s' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                <div><div style={{ fontSize: '14px', fontWeight: '600' }}>GitHub branch switching</div><div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '2px' }}>Select the branch to make edits to in your GitHub repository.</div></div>
                <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-100)', cursor: 'not-allowed', position: 'relative', opacity: 0.5, flexShrink: 0 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: '2px', left: '2px' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════ KNOWLEDGE (HOLLOW) ═══════════ */}
          <div className="settings-section-content" id="section-knowledge" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">Knowledge</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>Manage knowledge for your project and workspace.</p>
            <div style={{ padding: '12px 16px', background: 'rgba(99,130,255,0.08)', border: '1px solid rgba(99,130,255,0.2)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#6366f1' }}>
              <strong>Workspace knowledge</strong> — You can now add custom instructions that apply across all projects in your workspace.
            </div>
            <div className="settings-card">
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Workspace knowledge</div>
              <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '12px' }}>Set shared rules and preferences that apply to every project in this workspace.</p>
              <ul style={{ fontSize: '13px', color: 'var(--fg-muted)', paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Define coding style and naming conventions.</li>
                <li>Set preferred libraries, frameworks, or patterns.</li>
                <li>Add behavioral rules like tone, language, and formatting.</li>
              </ul>
              <textarea className="settings-input" rows={8} placeholder="Set coding style, conventions, and preferences for all your projects..." disabled style={{ opacity: 0.6, resize: 'none' }}></textarea>
              <div style={{ marginTop: '12px' }}><button className="settings-btn-primary" disabled style={{ opacity: 0.5 }}>Save</button></div>
            </div>
          </div>

          {/* ═══════════ CONNECTORS ═══════════ */}
          <div className="settings-section-content" id="section-connectors" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">Connectors</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>Connect external services to enhance your workflow.</p>
            <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-muted)', marginBottom: '12px' }}>Recommended</div>
            <div className="settings-card" style={{ padding: 0 }}>
              {[
                { name: 'GitHub', desc: 'Manage repos, track changes, collaborate', icon: '🐙', connectable: true, provider: 'github' },
                { name: 'Gmail', desc: 'Draft replies, search inbox, summarize threads', icon: '📧', connectable: true, provider: 'gmail' },
                { name: 'Slack', desc: 'Team messaging and real-time notifications', icon: '💬', connectable: true, provider: 'slack' },
              ].map(function(c, i) {
                return (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: i < 2 ? '1px solid var(--border-100)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{c.icon}</span>
                      <div><div style={{ fontSize: '14px', fontWeight: '600' }}>{c.name}</div><div style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{c.desc}</div></div>
                    </div>
                    <span className="settings-connector-status" data-provider={c.provider} style={{ fontSize: '13px', fontWeight: '500', color: 'var(--accent-100)', cursor: 'pointer' }}>Connect ↗</span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-muted)', margin: '24px 0 12px' }}>All apps</div>
            <div className="settings-card" style={{ padding: 0 }}>
              {[
                { name: 'Notion', desc: 'Docs, wikis, and project management' },
                { name: 'Linear', desc: 'Issue tracking and project planning' },
                { name: 'Figma', desc: 'Design files and prototypes' },
                { name: 'Vercel', desc: 'Deploy and host web applications' },
                { name: 'Google Drive', desc: 'Access files, search, and manage documents' },
                { name: 'Google Calendar', desc: 'Manage events and optimize your schedule' },
                { name: 'Stripe', desc: 'Payment processing and billing' },
                { name: 'Jira', desc: 'Project and issue tracking' },
              ].map(function(c, i) {
                return (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: i < 7 ? '1px solid var(--border-100)' : 'none' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: '500' }}>{c.name}</div><div style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{c.desc}</div></div>
                    <span style={{ fontSize: '12px', fontWeight: '500', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-300)', color: 'var(--fg-muted)' }}>COMING SOON</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════ GITHUB (HOLLOW) ═══════════ */}
          <div className="settings-section-content" id="section-github" style={{ display: 'none' }}>
            <h1 className="page-title stagger-1">GitHub</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>Manage your GitHub integration and repository settings.</p>
            <div className="settings-card">
              <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div><div className="settings-row-label">Connection status</div><div className="settings-row-desc">Connect your GitHub account to sync repositories.</div></div>
                <span className="settings-connector-status" data-provider="github" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--accent-100)', cursor: 'pointer' }}>Connect ↗</span>
              </div>
              <div className="settings-row" style={{ borderBottom: '1px solid var(--border-100)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div><div className="settings-row-label">Repository</div><div className="settings-row-desc">Select which repository to sync with your workspace.</div></div>
                <div style={{ padding: '6px 12px', border: '1px solid var(--border-100)', borderRadius: '8px', fontSize: '13px', color: 'var(--fg-muted)', cursor: 'not-allowed', opacity: 0.5 }}>Select repo</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '14px', fontWeight: '600' }}>Auto-deploy</div><div style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '2px' }}>Automatically deploy when pushing to main branch.</div></div>
                <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-100)', cursor: 'not-allowed', position: 'relative', opacity: 0.5, flexShrink: 0 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', position: 'absolute', top: '2px', left: '2px' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Settings-specific styles */}
      <style>{`
        @keyframes settingsFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .settings-card { padding: 24px; border: 1px solid var(--border-100); border-radius: 12px; background: var(--bg-100); }
        .settings-card-danger { border-color: #fca5a5; }
        .settings-row { display: flex; justify-content: space-between; align-items: center; }
        .settings-row-label { font-size: 14px; font-weight: 600; color: var(--fg-100); }
        .settings-row-desc { font-size: 13px; color: var(--fg-muted); margin-top: 2px; }
        .settings-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border-100); border-radius: 8px; font-size: 14px; background: var(--bg-100); color: var(--fg-100); outline: none; transition: border-color 0.15s; font-family: inherit; box-sizing: border-box; }
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
        .settings-nav-item { cursor: pointer; }
      `}</style>
    </div>
  );
}
