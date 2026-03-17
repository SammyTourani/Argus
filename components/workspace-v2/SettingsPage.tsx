// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchCurrentUser, fetchSubscription, escapeHtml } from './workspace-api';
import { getActiveWorkspace, getActiveTeamId, setActiveWorkspace, onWorkspaceChange } from './workspace-active';
import { createClient } from '@/lib/supabase/client';

/* ── Brand SVGs (reused from sign-in page + shared icons) ── */
var GOOGLE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
var GITHUB_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>';

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
      // Also switch People sub-tabs if entering people
      if (sectionId === 'people') {
        var allTab = document.querySelector('.people-tab[data-ptab="all"]');
        if (allTab && !document.querySelector('.people-tab.active')) allTab.click();
      }
    }

    navItems.forEach(function(item) {
      item.addEventListener('click', function() { switchSection(item.getAttribute('data-section')); });
    });

    var params = new URLSearchParams(window.location.search);
    var section = params.get('section') || params.get('tab');
    var billing = params.get('billing');
    if (billing) section = 'plans';
    if (section === 'members') section = 'people';
    if (!section) section = getActiveTeamId() ? 'general' : 'account';
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
    return onWorkspaceChange(function() { window.location.reload(); });
  }, []);

  /* ===== MOBILE MENU ===== */
  useEffect(() => {
    var menuBtn = document.getElementById('settingsMobileBtn');
    var sidebar = document.querySelector('.page-settings .sidebar');
    var overlay = document.getElementById('settingsSidebarOverlay');
    if (!menuBtn || !sidebar || !overlay) return;
    function toggle() { sidebar.classList.toggle('open'); overlay.classList.toggle('active'); }
    menuBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
    return () => { menuBtn.removeEventListener('click', toggle); overlay.removeEventListener('click', toggle); };
  }, []);

  /* ===== SIDEBAR: POPULATE WORKSPACE NAME ===== */
  useEffect(() => {
    var cancelled = false;
    fetchCurrentUser().then(function(user) {
      if (cancelled || !user) return;
      var wsLabel = document.getElementById('settingsWsNavLabel');
      if (wsLabel) wsLabel.textContent = user.name + "'s Workspace";
    });
    return () => { cancelled = true; };
  }, []);

  /* ===== LOAD USER PROFILE + LINKED ACCOUNTS ===== */
  useEffect(() => {
    var cancelled = false;
    var supabase = createClient();
    supabase.auth.getUser().then(function(result) {
      if (cancelled || !result.data.user) return;
      var user = result.data.user;
      // Profile fields
      var nameInput = document.getElementById('settingsProfileName');
      var emailInput = document.getElementById('settingsProfileEmail');
      if (nameInput) nameInput.value = user.user_metadata?.full_name || '';
      if (emailInput) emailInput.value = user.email || '';
      // Store email for delete confirmation
      var container = document.querySelector('.page-settings');
      if (container) container.setAttribute('data-user-email', user.email || '');

      // Linked accounts
      var linkedContainer = document.getElementById('settingsLinkedAccounts');
      if (linkedContainer && user.identities) {
        var html = '';
        user.identities.forEach(function(identity, idx) {
          var provider = identity.provider || 'unknown';
          var providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
          var email = identity.identity_data?.email || user.email || '';
          var EMAIL_SVG = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--fg-muted)" stroke-width="1.5"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 4l8 6 8-6"/></svg>';
          var icon = provider === 'google' ? GOOGLE_SVG : provider === 'github' ? GITHUB_SVG : provider === 'email' ? EMAIL_SVG : '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--fg-muted)" stroke-width="1.5"><circle cx="10" cy="7" r="3.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>';
          var isPrimary = idx === 0;
          html += '<div style="display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--border-100);border-radius:10px;margin-bottom:8px">' +
            '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center">' + icon + '</div>' +
            '<div style="flex:1"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600">' + escapeHtml(providerName) + '</span>' + (isPrimary ? '<span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:var(--bg-300);color:var(--fg-200)">Primary</span>' : '') + '</div><div style="font-size:13px;color:var(--fg-muted)">' + escapeHtml(email) + '</div></div></div>';
        });
        // Link company account (hollow)
        html += '<div style="display:flex;align-items:center;gap:14px;padding:16px;border:1px dashed var(--border-200);border-radius:10px;margin-bottom:8px">' +
          '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--fg-muted)" stroke-width="1.5"><circle cx="10" cy="10" r="7"/></svg></div>' +
          '<div style="flex:1"><div style="font-size:14px;font-weight:600">Link company account</div><div style="font-size:13px;color:var(--fg-muted)">Use your organization\'s single sign-on</div></div>' +
          '<button style="padding:6px 16px;border:1px solid var(--border-100);border-radius:8px;background:var(--bg-100);font-size:13px;font-weight:500;cursor:pointer;color:var(--fg-100);font-family:inherit">Link</button></div>';
        linkedContainer.innerHTML = html;
      }
    });

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

  /* ===== ACCOUNT: SAVE HANDLERS ===== */
  useEffect(() => {
    var cleanups = [];

    // Save profile
    var saveProfileBtn = document.getElementById('settingsSaveProfile');
    if (saveProfileBtn) {
      var profileHandler = function() {
        var nameInput = document.getElementById('settingsProfileName');
        if (!nameInput) return;
        saveProfileBtn.textContent = 'Saving...'; saveProfileBtn.disabled = true;
        var supabase = createClient();
        supabase.auth.updateUser({ data: { full_name: nameInput.value } }).then(function() {
          saveProfileBtn.textContent = '✓ Saved';
          setTimeout(function() { saveProfileBtn.textContent = 'Save'; saveProfileBtn.disabled = false; }, 2000);
        });
      };
      saveProfileBtn.addEventListener('click', profileHandler);
      cleanups.push(function() { saveProfileBtn.removeEventListener('click', profileHandler); });
    }

    // Sign out
    var signOutBtn = document.getElementById('settingsSignOut');
    if (signOutBtn) {
      var signOutHandler = function() { var supabase = createClient(); supabase.auth.signOut().then(function() { window.location.href = '/'; }); };
      signOutBtn.addEventListener('click', signOutHandler);
      cleanups.push(function() { signOutBtn.removeEventListener('click', signOutHandler); });
    }

    // Delete account
    var deleteBtn = document.getElementById('settingsDeleteAccountBtn');
    var deleteConfirm = document.getElementById('settingsDeleteConfirm');
    var deleteCancel = document.getElementById('settingsDeleteCancel');
    var deleteInput = document.getElementById('settingsDeleteInput');
    var deleteReveal = document.getElementById('settingsDeleteReveal');

    if (deleteBtn) {
      var showDelete = function() { if (deleteReveal) deleteReveal.style.display = 'block'; deleteBtn.style.display = 'none'; };
      deleteBtn.addEventListener('click', showDelete);
      cleanups.push(function() { deleteBtn.removeEventListener('click', showDelete); });
    }
    if (deleteCancel) {
      var hideDelete = function() { if (deleteReveal) deleteReveal.style.display = 'none'; if (deleteBtn) deleteBtn.style.display = ''; if (deleteInput) deleteInput.value = ''; };
      deleteCancel.addEventListener('click', hideDelete);
      cleanups.push(function() { deleteCancel.removeEventListener('click', hideDelete); });
    }
    if (deleteConfirm && deleteInput) {
      var inputHandler = function() {
        var email = document.querySelector('.page-settings')?.getAttribute('data-user-email') || '';
        deleteConfirm.disabled = deleteInput.value.trim().toLowerCase() !== email.toLowerCase();
        deleteConfirm.style.opacity = deleteConfirm.disabled ? '0.5' : '1';
      };
      var confirmHandler = function() {
        deleteConfirm.textContent = 'Deleting...'; deleteConfirm.disabled = true;
        fetch('/api/user/delete-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmEmail: deleteInput.value.trim() }) })
          .then(function(r) { if (!r.ok) return r.json().then(function(d) { alert(d.error || 'Failed'); deleteConfirm.textContent = 'Delete account'; deleteConfirm.disabled = false; }); var s = createClient(); s.auth.signOut().then(function() { window.location.href = '/'; }); })
          .catch(function() { alert('Something went wrong.'); deleteConfirm.textContent = 'Delete account'; deleteConfirm.disabled = false; });
      };
      deleteInput.addEventListener('input', inputHandler);
      deleteConfirm.addEventListener('click', confirmHandler);
      cleanups.push(function() { deleteInput.removeEventListener('input', inputHandler); deleteConfirm.removeEventListener('click', confirmHandler); });
    }

    return function() { cleanups.forEach(function(fn) { fn(); }); };
  }, []);

  /* ===== PLANS: LOAD SUBSCRIPTION ===== */
  useEffect(() => {
    var cancelled = false;
    fetchSubscription().then(function(sub) {
      if (cancelled) return;
      var tier = sub.tier || 'free';
      var el = function(id) { return document.getElementById(id); };
      if (el('settingsTier')) el('settingsTier').textContent = "You're on " + tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan';
      if (el('settingsCreditsCount')) el('settingsCreditsCount').textContent = (sub.creditsRemaining || 0) + ' of ' + (sub.creditsTotal || 30);
      if (el('settingsCreditProgress')) { var pct = Math.min(100, Math.round(((sub.creditsRemaining || 0) / (sub.creditsTotal || 30)) * 100)); el('settingsCreditProgress').style.width = pct + '%'; }
      if (el('settingsManageBtn')) el('settingsManageBtn').style.display = tier !== 'free' ? '' : 'none';
      // Update plan subtitle
      if (el('settingsPlanSubtitle')) el('settingsPlanSubtitle').textContent = "You're on the " + tier.charAt(0).toUpperCase() + tier.slice(1) + ' plan. See what\'s available.';
      // Mark current plan card with orange border + badge
      var tierCard = tier === 'free' ? 'settingsFreeCard' : tier === 'pro' ? 'settingsProCard' : tier === 'team' ? 'settingsTeamCard' : null;
      if (tierCard && el(tierCard)) { el(tierCard).style.borderColor = 'var(--accent-100)'; el(tierCard).style.borderWidth = '2px'; }
      if (el('settingsCurrentBadge')) el('settingsCurrentBadge').style.display = tier === 'pro' ? '' : 'none';
      // Update Pro button if current
      if (tier === 'pro' && el('settingsUpgradePro')) { el('settingsUpgradePro').textContent = 'Current Plan'; el('settingsUpgradePro').disabled = true; el('settingsUpgradePro').classList.remove('sb-primary'); el('settingsUpgradePro').classList.add('sb-secondary'); }
    });

    function doUpgrade(plan) {
      var teamId = getActiveTeamId();
      var body = { plan: plan };
      if (teamId) body.team_id = teamId;
      fetch('/api/stripe/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function(r) { return r.json(); }).then(function(d) { if (d.url) window.location.href = d.url; });
    }
    var proBtn = document.getElementById('settingsUpgradePro');
    var teamBtn = document.getElementById('settingsUpgradeTeam');
    if (proBtn) proBtn.addEventListener('click', function() { doUpgrade('pro'); });
    if (teamBtn) teamBtn.addEventListener('click', function() { doUpgrade('team'); });

    var manageBtn = document.getElementById('settingsManageBtn');
    if (manageBtn) {
      manageBtn.addEventListener('click', function() {
        manageBtn.textContent = 'Opening...';
        var teamId = getActiveTeamId();
        var url = teamId ? '/api/stripe/billing-portal?team_id=' + teamId : '/api/stripe/billing-portal';
        fetch(url).then(function(r) { return r.json(); }).then(function(d) { if (d.url) window.location.href = d.url; else manageBtn.textContent = 'Manage'; }).catch(function() { manageBtn.textContent = 'Manage'; });
      });
    }

    return () => { cancelled = true; };
  }, []);

  /* ===== GENERAL: WORKSPACE SETTINGS ===== */
  useEffect(() => {
    var teamId = getActiveTeamId();
    if (!teamId) return;
    var cancelled = false;
    var cleanups = [];

    fetch('/api/teams/' + teamId).then(function(r) { return r.json(); }).then(function(data) {
      if (cancelled || !data.team) return;
      var nameInput = document.getElementById('settingsWsName');
      var descInput = document.getElementById('settingsWsDesc');
      var charCount = document.getElementById('settingsWsNameCount');
      var wsAvatar = document.getElementById('settingsWsAvatar');
      if (nameInput) { nameInput.value = data.team.name || ''; if (charCount) charCount.textContent = (data.team.name || '').length + ' / 50 characters'; }
      if (descInput) descInput.value = data.team.description || '';
      if (wsAvatar) wsAvatar.textContent = (data.team.name || 'W').charAt(0).toUpperCase();
      var dangerZone = document.getElementById('settingsDangerZone');
      if (dangerZone) dangerZone.style.display = data.team.role === 'owner' ? '' : 'none';
    });

    var nameInput = document.getElementById('settingsWsName');
    var charCount = document.getElementById('settingsWsNameCount');
    if (nameInput && charCount) {
      var countHandler = function() { charCount.textContent = nameInput.value.length + ' / 50 characters'; };
      nameInput.addEventListener('input', countHandler);
      cleanups.push(function() { nameInput.removeEventListener('input', countHandler); });
    }

    var saveBtn = document.getElementById('settingsSaveWorkspace');
    if (saveBtn) {
      var saveHandler = function() {
        var n = document.getElementById('settingsWsName');
        var d = document.getElementById('settingsWsDesc');
        saveBtn.textContent = 'Saving...'; saveBtn.disabled = true;
        fetch('/api/teams/' + teamId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: (n?.value || '').trim(), description: (d?.value || '').trim() }) })
          .then(function(r) { if (r.ok) { setActiveWorkspace({ id: teamId, name: (n?.value || '').trim() }); saveBtn.textContent = '✓ Saved'; } else saveBtn.textContent = 'Error'; setTimeout(function() { saveBtn.textContent = 'Save changes'; saveBtn.disabled = false; }, 2000); });
      };
      saveBtn.addEventListener('click', saveHandler);
      cleanups.push(function() { saveBtn.removeEventListener('click', saveHandler); });
    }

    // Delete workspace
    var delBtn = document.getElementById('settingsDeleteWsBtn');
    var delReveal = document.getElementById('settingsDeleteWsReveal');
    var delCancel = document.getElementById('settingsDeleteWsCancel');
    var delConfirm = document.getElementById('settingsDeleteWsConfirm');
    var delInput = document.getElementById('settingsDeleteWsInput');
    if (delBtn) { var h = function() { if (delReveal) delReveal.style.display='block'; delBtn.style.display='none'; }; delBtn.addEventListener('click',h); cleanups.push(function(){delBtn.removeEventListener('click',h);}); }
    if (delCancel) { var h2 = function() { if (delReveal) delReveal.style.display='none'; if (delBtn) delBtn.style.display=''; if (delInput) delInput.value=''; }; delCancel.addEventListener('click',h2); cleanups.push(function(){delCancel.removeEventListener('click',h2);}); }
    if (delConfirm && delInput) {
      var ih = function() { var n=document.getElementById('settingsWsName'); delConfirm.disabled=delInput.value!==(n?.value||''); delConfirm.style.opacity=delConfirm.disabled?'0.5':'1'; };
      var ch = function() { delConfirm.textContent='Deleting...'; delConfirm.disabled=true; fetch('/api/teams/'+teamId,{method:'DELETE'}).then(function(r){if(r.ok){setActiveWorkspace({id:'personal',name:'Personal'});window.location.href='/workspace';}else{r.json().then(function(d){alert(d.error||'Failed');});delConfirm.textContent='Yes, delete workspace';delConfirm.disabled=false;}}); };
      delInput.addEventListener('input',ih); delConfirm.addEventListener('click',ch);
      cleanups.push(function(){delInput.removeEventListener('input',ih);delConfirm.removeEventListener('click',ch);});
    }

    return function() { cancelled=true; cleanups.forEach(function(fn){fn();}); };
  }, []);

  /* ===== PEOPLE: LOAD MEMBERS ===== */
  useEffect(() => {
    var teamId = getActiveTeamId();
    if (!teamId) return;
    var cancelled = false;
    var cleanups = [];

    // Load team info for subtitle
    fetch('/api/teams/' + teamId).then(function(r){return r.json();}).then(function(data) {
      if (cancelled || !data.team) return;
      var subtitle = document.getElementById('settingsPeopleSubtitle');
      if (subtitle) subtitle.innerHTML = 'Inviting people to <strong>' + escapeHtml(data.team.name || 'this workspace') + '</strong> gives access to workspace shared projects and credits. You have <strong>' + (data.team.member_count || 1) + '</strong> builder(s) in this workspace.';
    });

    // Load members
    fetch('/api/teams/' + teamId + '/members').then(function(r){return r.json();}).then(function(data) {
      if (cancelled || !data.members) return;
      var tbody = document.getElementById('settingsMembersBody');
      if (!tbody) return;
      var html = '';
      data.members.forEach(function(m) {
        var p = m.profiles || {};
        var name = p.full_name || p.email || 'Unknown';
        var initial = name.charAt(0).toUpperCase();
        var avatar = p.avatar_url ? '<img src="'+escapeHtml(p.avatar_url)+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover"/>' : '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent-100),var(--accent-200));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px">'+initial+'</div>';
        var role = m.role.charAt(0).toUpperCase() + m.role.slice(1);
        var date = m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
        html += '<tr style="border-bottom:1px solid var(--border-100)">' +
          '<td style="padding:12px 8px;display:flex;align-items:center;gap:10px">' + avatar + '<div><div style="font-size:13px;font-weight:500">'+escapeHtml(name)+'</div><div style="font-size:12px;color:var(--fg-muted)">'+escapeHtml(p.email||'')+'</div></div></td>' +
          '<td style="padding:12px 8px;font-size:13px;color:var(--fg-200)">'+role+'</td>' +
          '<td style="padding:12px 8px;font-size:13px;color:var(--fg-muted)">'+date+'</td>' +
          '<td style="padding:12px 8px;font-size:13px;color:var(--fg-muted)">—</td>' +
          '<td style="padding:12px 8px;font-size:13px;color:var(--fg-muted)">—</td>' +
          '<td style="padding:12px 8px;font-size:13px;color:var(--fg-muted)">—</td>' +
          '<td style="padding:12px 8px;text-align:right"><span style="cursor:pointer;color:var(--fg-muted)">⋯</span></td></tr>';
      });
      tbody.innerHTML = html;
    });

    // People sub-tabs
    document.querySelectorAll('.people-tab').forEach(function(tab) {
      var handler = function() {
        document.querySelectorAll('.people-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        document.querySelectorAll('.people-panel').forEach(function(p){p.style.display='none';});
        var panel = document.getElementById('people-panel-'+tab.getAttribute('data-ptab'));
        if (panel) panel.style.display = 'block';
      };
      tab.addEventListener('click', handler);
      cleanups.push(function(){tab.removeEventListener('click',handler);});
    });

    // Invite
    var inviteBtn = document.getElementById('settingsInviteBtn');
    var inviteForm = document.getElementById('settingsInviteForm');
    var inviteCancel = document.getElementById('settingsInviteCancel');
    var inviteSubmit = document.getElementById('settingsInviteSubmit');
    var inviteEmail = document.getElementById('settingsInviteEmail');
    var inviteMsg = document.getElementById('settingsInviteMsg');
    if (inviteBtn) { var h=function(){if(inviteForm)inviteForm.style.display='block';inviteBtn.style.display='none';}; inviteBtn.addEventListener('click',h); cleanups.push(function(){inviteBtn.removeEventListener('click',h);}); }
    if (inviteCancel) { var h2=function(){if(inviteForm)inviteForm.style.display='none';if(inviteBtn)inviteBtn.style.display='';if(inviteEmail)inviteEmail.value='';if(inviteMsg)inviteMsg.textContent='';}; inviteCancel.addEventListener('click',h2); cleanups.push(function(){inviteCancel.removeEventListener('click',h2);}); }
    if (inviteSubmit&&inviteEmail) { var h3=function(){var e=inviteEmail.value.trim();if(!e)return;inviteSubmit.textContent='Inviting...';inviteSubmit.disabled=true;fetch('/api/teams/'+teamId+'/members',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d};});}).then(function(result){if(result.ok)window.location.reload();else{if(inviteMsg){inviteMsg.textContent=result.data.error||'Failed';inviteMsg.style.color='#dc2626';}inviteSubmit.textContent='Invite members';inviteSubmit.disabled=false;}});}; inviteSubmit.addEventListener('click',h3); cleanups.push(function(){inviteSubmit.removeEventListener('click',h3);}); }

    return function() { cancelled=true; cleanups.forEach(function(fn){fn();}); };
  }, []);

  /* ===== LABS: DARK MODE ===== */
  useEffect(() => {
    var toggle = document.getElementById('settingsDarkModeToggle');
    if (!toggle) return;
    var template = localStorage.getItem('argus-hero-template') || 'classic';
    if (template === 'matrix') toggle.classList.add('active');
    var handler = function() {
      toggle.classList.toggle('active');
      var isDark = toggle.classList.contains('active');
      localStorage.setItem('argus-hero-template', isDark ? 'matrix' : 'classic');
      localStorage.setItem('argus-dark-mode', isDark ? 'true' : 'false');
      var root = document.querySelector('.workspace-root');
      if (root) root.classList.toggle('dark', isDark);
      window.dispatchEvent(new CustomEvent('argus-dark-mode-change', { detail: { dark: isDark } }));
    };
    toggle.addEventListener('click', handler);
    return () => toggle.removeEventListener('click', handler);
  }, []);

  /* ===== DARK MODE SYNC ===== */
  useEffect(() => {
    var template = localStorage.getItem('argus-hero-template') || 'classic';
    var isDark = template === 'matrix';
    var root = document.querySelector('.workspace-root');
    if (root) root.classList.toggle('dark', isDark);
    if (isDark) document.documentElement.setAttribute('data-argus-dark', 'true');
    else document.documentElement.removeAttribute('data-argus-dark');
    var handler = function(e) { if (e.key==='argus-hero-template') { var d=e.newValue==='matrix'; var r=document.querySelector('.workspace-root'); if(r)r.classList.toggle('dark',d); if(d)document.documentElement.setAttribute('data-argus-dark','true');else document.documentElement.removeAttribute('data-argus-dark'); } };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  var hasTeam = typeof window !== 'undefined' && getActiveTeamId();

  return (
    <div className="app page-settings">
      <button className="mobile-menu-btn" id="settingsMobileBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14M3 10h14M3 15h14"/></svg></button>
      <div className="sidebar-overlay" id="settingsSidebarOverlay"></div>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{paddingBottom:'12px'}}>
          <a href="/workspace" style={{display:'flex',alignItems:'center',gap:'8px',textDecoration:'none',color:'var(--fg-200)',fontSize:'13px',fontWeight:'500'}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L5 8l5 5"/></svg>
            Go back
          </a>
        </div>

        <nav className="sidebar-nav" style={{flex:1,overflowY:'auto'}}>
          {hasTeam && (<>
            <div className="nav-section-label">Workspace</div>
            <div className="nav-item settings-nav-item active" data-section="general" style={{fontWeight:'500'}}>
              <div style={{width:'18px',height:'18px',borderRadius:'4px',background:'linear-gradient(135deg,var(--accent-100),var(--accent-200))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'10px',fontWeight:'700',flexShrink:0}}>S</div>
              <span id="settingsWsNavLabel">Workspace</span>
            </div>
            <div className="nav-item settings-nav-item" data-section="people">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3"/><circle cx="14" cy="8" r="2.5"/><path d="M2 17c0-3 2.2-5.5 5-5.8M11.5 17c0-2.5 1.5-4.5 3.5-5"/></svg>
              People
            </div>
            <div className="nav-item settings-nav-item" data-section="plans">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="16" height="11" rx="2"/><path d="M2 9h16"/></svg>
              Plans &amp; credits
            </div>
            <div className="nav-item settings-nav-item" data-section="privacy">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="9" width="10" height="8" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>
              Privacy &amp; security
            </div>
          </>)}

          <div className="nav-section-label">Account</div>
          <div className={'nav-item settings-nav-item'+(!hasTeam?' active':'')} data-section="account">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
            Your account
          </div>
          {!hasTeam && (
            <div className="nav-item settings-nav-item" data-section="plans">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="16" height="11" rx="2"/><path d="M2 9h16"/></svg>
              Plans &amp; credits
            </div>
          )}
          <div className="nav-item settings-nav-item" data-section="labs">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v5l-4 8h12l-4-8V3M6 3h8"/></svg>
            Labs
          </div>

          <div className="nav-section-label">Knowledge</div>
          <div className="nav-item settings-nav-item" data-section="knowledge">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h5l2 2h7v10H3V4z"/></svg>
            Knowledge
          </div>

          <div className="nav-section-label">Connectors</div>
          <div className="nav-item settings-nav-item" data-section="github">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </div>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="main">
        <div className="main-inner" style={{maxWidth:'800px'}}>
          <div id="settingsToast" style={{position:'fixed',bottom:'24px',right:'24px',padding:'12px 20px',background:'var(--accent-100)',color:'white',borderRadius:'10px',fontSize:'14px',fontWeight:'600',opacity:'0',transition:'opacity 0.3s',pointerEvents:'none',zIndex:1000}}></div>

          {/* ═══ WORKSPACE SETTINGS ═══ */}
          {hasTeam && (
            <div className="settings-section-content" id="section-general" style={{display:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}><h1 className="page-title">Workspace settings</h1></div>
              <p className="page-subtitle" style={{marginBottom:'24px'}}>Workspaces allow you to collaborate on projects in real time.</p>

              <div className="sc">
                <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'20px',marginBottom:'20px'}}>
                  <div><div className="sr-label">Avatar</div><div className="sr-desc">Set an avatar for your workspace.</div></div>
                  <div id="settingsWsAvatar" style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-100),var(--accent-200))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'18px'}}>S</div>
                </div>
                <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'20px',marginBottom:'20px'}}>
                  <div><div className="sr-label">Name</div><div className="sr-desc">Your full workspace name, as visible to others.</div></div>
                  <div style={{width:'300px'}}><input type="text" id="settingsWsName" className="si" maxLength={50}/><div id="settingsWsNameCount" style={{fontSize:'11px',color:'var(--fg-muted)',marginTop:'4px',textAlign:'right'}}>0 / 50 characters</div></div>
                </div>
                <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'20px',marginBottom:'20px'}}>
                  <div><div className="sr-label">Workspace handle</div><div className="sr-desc">Set a handle for the workspace profile page.</div></div>
                  <button className="sb-secondary" style={{padding:'8px 16px',fontSize:'13px'}}>Set handle</button>
                </div>
                <div className="sr">
                  <div><div className="sr-label">Default monthly member credit limit</div><div className="sr-desc">The default monthly credit limit for members of this workspace. Leave empty to use no limit.</div></div>
                  <input type="number" className="si" style={{width:'280px'}} placeholder="Enter default monthly member credit limit (optional)"/>
                </div>
              </div>
              <div style={{marginTop:'16px'}}><button id="settingsSaveWorkspace" className="sb-primary">Save changes</button></div>

              <div className="sc" style={{marginTop:'24px'}} id="settingsDangerZone">
                <div className="sr-label">Leave workspace</div>
                <p style={{fontSize:'13px',color:'var(--fg-muted)',margin:'8px 0 16px'}}>You cannot leave your last workspace. Your account must be a member of at least one workspace.</p>
                <button className="sb-danger" disabled style={{opacity:0.5}}>Leave workspace</button>
              </div>
            </div>
          )}

          {/* ═══ PEOPLE ═══ */}
          {hasTeam && (
            <div className="settings-section-content" id="section-people" style={{display:'none'}}>
              <h1 className="page-title">People</h1>
              <p id="settingsPeopleSubtitle" className="page-subtitle" style={{marginBottom:'20px'}}>Loading...</p>

              <div style={{display:'flex',gap:'4px',marginBottom:'16px'}}>
                <button className="people-tab active" data-ptab="all" style={{padding:'6px 16px',borderRadius:'8px',border:'1px solid var(--border-100)',background:'var(--bg-100)',fontSize:'13px',fontWeight:'500',cursor:'pointer',fontFamily:'inherit',color:'var(--fg-100)'}}>All</button>
                <button className="people-tab" data-ptab="invitations" style={{padding:'6px 16px',borderRadius:'8px',border:'1px solid var(--border-100)',background:'transparent',fontSize:'13px',fontWeight:'500',cursor:'pointer',fontFamily:'inherit',color:'var(--fg-muted)'}}>Invitations</button>
                <button className="people-tab" data-ptab="collaborators" style={{padding:'6px 16px',borderRadius:'8px',border:'1px solid var(--border-100)',background:'transparent',fontSize:'13px',fontWeight:'500',cursor:'pointer',fontFamily:'inherit',color:'var(--fg-muted)'}}>Collaborators</button>
              </div>

              <div className="people-panel" id="people-panel-all" style={{display:'block'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                  <div style={{flex:'1',minWidth:'150px',position:'relative'}}><svg style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',opacity:0.4}} width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5L17 17"/></svg><input className="si" style={{paddingLeft:'32px'}} placeholder="Search..."/></div>
                  <button className="sb-secondary" style={{padding:'8px 14px',fontSize:'13px'}}>All roles ▾</button>
                  <div style={{flex:1}}></div>
                  <button className="sb-secondary" style={{padding:'8px 14px',fontSize:'13px'}}>↓ Export</button>
                  <button className="sb-secondary" style={{padding:'8px 14px',fontSize:'13px'}}>🔗 Invite link</button>
                  <button id="settingsInviteBtn" className="sb-primary" style={{padding:'8px 16px',fontSize:'13px'}}>👤 Invite members</button>
                </div>
                <div id="settingsInviteForm" style={{display:'none',padding:'16px',border:'1px solid var(--border-100)',borderRadius:'10px',marginBottom:'16px',background:'var(--bg-200)'}}>
                  <div style={{fontSize:'13px',fontWeight:'500',marginBottom:'8px'}}>Invite by email</div>
                  <div style={{display:'flex',gap:'8px'}}><input type="email" id="settingsInviteEmail" className="si" placeholder="name@example.com" style={{flex:1}}/><button id="settingsInviteSubmit" className="sb-primary" style={{padding:'8px 16px',fontSize:'13px',flexShrink:0}}>Invite members</button><button id="settingsInviteCancel" style={{fontSize:'13px',color:'var(--fg-muted)',background:'none',border:'none',cursor:'pointer'}}>Cancel</button></div>
                  <div id="settingsInviteMsg" style={{fontSize:'12px',marginTop:'6px'}}></div>
                </div>
                <div className="sc" style={{padding:0,overflow:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                    <thead><tr style={{borderBottom:'1px solid var(--border-100)'}}>
                      <th style={{padding:'10px 8px',textAlign:'left',fontWeight:'500',fontSize:'12px',color:'var(--fg-muted)'}}>Name</th>
                      <th style={{padding:'10px 8px',textAlign:'left',fontWeight:'500',fontSize:'12px',color:'var(--fg-muted)'}}>Role</th>
                      <th style={{padding:'10px 8px',textAlign:'left',fontWeight:'500',fontSize:'12px',color:'var(--fg-muted)'}}>Joined date</th>
                      <th style={{padding:'10px 8px',textAlign:'left',fontWeight:'500',fontSize:'12px',color:'var(--fg-muted)'}}>Mar usage</th>
                      <th style={{padding:'10px 8px',textAlign:'left',fontWeight:'500',fontSize:'12px',color:'var(--fg-muted)'}}>Total usage</th>
                      <th style={{padding:'10px 8px',textAlign:'left',fontWeight:'500',fontSize:'12px',color:'var(--fg-muted)'}}>Credit limit</th>
                      <th style={{padding:'10px 8px',width:'40px'}}></th>
                    </tr></thead>
                    <tbody id="settingsMembersBody"><tr><td colSpan={7} style={{padding:'20px',color:'var(--fg-muted)',textAlign:'center'}}>Loading members...</td></tr></tbody>
                  </table>
                </div>
              </div>

              <div className="people-panel" id="people-panel-invitations" style={{display:'none'}}>
                <div className="sc" style={{textAlign:'center',padding:'60px 24px'}}>
                  <div style={{fontSize:'40px',color:'var(--fg-muted)',marginBottom:'12px'}}>📋</div>
                  <div style={{fontSize:'16px',fontWeight:'600',marginBottom:'8px'}}>No invitations found</div>
                  <button className="sb-secondary" style={{marginTop:'12px',padding:'8px 16px',fontSize:'13px'}}>👤 Invite members</button>
                </div>
              </div>

              <div className="people-panel" id="people-panel-collaborators" style={{display:'none'}}>
                <div className="sc" style={{textAlign:'center',padding:'60px 24px'}}>
                  <div style={{fontSize:'40px',color:'var(--fg-muted)',marginBottom:'12px'}}>👥</div>
                  <div style={{fontSize:'16px',fontWeight:'600',marginBottom:'8px'}}>No collaborators found</div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PLANS & CREDITS ═══ */}
          <div className="settings-section-content" id="section-plans" style={{display:'none'}}>
            <h1 className="page-title">Plans &amp; credits</h1>
            <p className="page-subtitle" style={{marginBottom:'24px'}}>Manage your subscription plan and credit balance.</p>

            {/* Top row: current plan + credits */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
              <div className="sc">
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'linear-gradient(135deg,var(--accent-100),var(--accent-200))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'16px'}}>A</div>
                  <div><div id="settingsTier" style={{fontSize:'16px',fontWeight:'700'}}>You're on Free Plan</div><div style={{fontSize:'13px',color:'var(--fg-muted)'}}>Upgrade anytime</div></div>
                </div>
                <button id="settingsManageBtn" className="sb-secondary" style={{display:'none',marginTop:'16px',padding:'8px 16px',fontSize:'13px'}}>Manage</button>
              </div>
              <div className="sc">
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                  <span style={{fontSize:'15px',fontWeight:'700'}}>Credits remaining</span>
                  <span id="settingsCreditsCount" style={{fontSize:'15px',fontWeight:'700'}}>0 of 30</span>
                </div>
                <div style={{height:'8px',borderRadius:'4px',background:'var(--border-100)',overflow:'hidden',marginBottom:'16px'}}><div id="settingsCreditProgress" style={{height:'100%',borderRadius:'4px',background:'var(--accent-100)',width:'100%',transition:'width 0.5s'}}></div></div>
                <div style={{fontSize:'13px',color:'var(--fg-muted)',lineHeight:'2'}}>
                  <div>● Credits used on each generation</div>
                  <div>✕ No credits will rollover</div>
                  <div>✓ Credits reset monthly</div>
                </div>
              </div>
            </div>

            {/* Choose your plan — 3 cards matching upgrade page */}
            <div id="settingsUpgradeSection">
              <p id="settingsPlanSubtitle" style={{fontSize:'14px',color:'var(--fg-muted)',marginBottom:'20px',fontFamily:'var(--font-mono)'}}>You're on the Free plan. See what's available.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px',marginBottom:'24px'}}>
                {/* Free */}
                <div className="sc" id="settingsFreeCard">
                  <div style={{fontSize:'22px',fontWeight:'800',marginBottom:'8px'}}>Free</div>
                  <div style={{marginBottom:'16px'}}><span style={{fontSize:'32px',fontWeight:'800'}}>$0</span><span style={{fontSize:'14px',color:'var(--fg-muted)',marginLeft:'4px'}}>forever</span></div>
                  <div style={{fontSize:'13px',color:'var(--fg-muted)',marginBottom:'20px'}}>No strings.</div>
                  <button className="sb-secondary" style={{width:'100%',marginBottom:'20px'}}>Included in your plan</button>
                  <div style={{borderTop:'1px solid var(--border-100)',paddingTop:'16px'}}>
                    <ul style={{listStyle:'none',padding:0,fontSize:'13px',color:'var(--fg-200)',lineHeight:'2.2'}}>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> 30 credits / month</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> All 8 style transforms</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> Download as ZIP</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> Community support</li>
                    </ul>
                  </div>
                </div>
                {/* Pro */}
                <div className="sc" id="settingsProCard" style={{position:'relative'}}>
                  <div id="settingsCurrentBadge" style={{display:'none',position:'absolute',top:'-12px',left:'50%',transform:'translateX(-50%)',padding:'4px 16px',borderRadius:'99px',background:'var(--accent-100)',color:'white',fontSize:'11px',fontWeight:'700',letterSpacing:'0.05em'}}>Current plan</div>
                  <div style={{fontSize:'22px',fontWeight:'800',marginBottom:'8px'}}>Pro</div>
                  <div style={{marginBottom:'16px'}}><span style={{fontSize:'32px',fontWeight:'800'}}>$19</span><span style={{fontSize:'14px',color:'var(--fg-muted)',marginLeft:'4px'}}>/month</span></div>
                  <div style={{fontSize:'13px',color:'var(--fg-muted)',marginBottom:'20px'}}>For power builders.</div>
                  <button id="settingsUpgradePro" className="sb-primary" style={{width:'100%',marginBottom:'20px'}}>Upgrade</button>
                  <div style={{borderTop:'1px solid var(--border-100)',paddingTop:'16px'}}>
                    <ul style={{listStyle:'none',padding:0,fontSize:'13px',lineHeight:'2.2'}}>
                      <li><span style={{color:'var(--accent-100)'}}>✓</span> 300 credits / month</li>
                      <li><span style={{color:'var(--accent-100)'}}>✓</span> All 9 AI models — use any model</li>
                      <li><span style={{color:'var(--accent-100)'}}>✓</span> Priority generation queue</li>
                      <li><span style={{color:'var(--accent-100)'}}>✓</span> Push to Vercel in 1 click</li>
                      <li><span style={{color:'var(--accent-100)'}}>✓</span> Brand extraction mode</li>
                      <li><span style={{color:'var(--accent-100)'}}>✓</span> Email support</li>
                    </ul>
                  </div>
                </div>
                {/* Team */}
                <div className="sc" id="settingsTeamCard">
                  <div style={{fontSize:'22px',fontWeight:'800',marginBottom:'8px'}}>Team</div>
                  <div style={{marginBottom:'16px'}}><span style={{fontSize:'32px',fontWeight:'800'}}>$49</span><span style={{fontSize:'14px',color:'var(--fg-muted)',marginLeft:'4px'}}>/month</span></div>
                  <div style={{fontSize:'13px',color:'var(--fg-muted)',marginBottom:'20px'}}>Coming soon.</div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}><input className="si" placeholder="you@email.com" style={{flex:1,fontSize:'13px'}}/><button className="sb-secondary" style={{padding:'8px 14px',fontSize:'13px',flexShrink:0}}>Join waitlist</button></div>
                  <div style={{borderTop:'1px solid var(--border-100)',paddingTop:'16px'}}>
                    <ul style={{listStyle:'none',padding:0,fontSize:'13px',color:'var(--fg-200)',lineHeight:'2.2'}}>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> Everything in Pro</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> 5 team members</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> Shared project library</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> Custom AI model config</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> SSO &amp; audit logs</li>
                      <li><span style={{color:'var(--fg-muted)'}}>✓</span> Dedicated support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Gift cards */}
            <div className="sc" style={{marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div className="sr-label" style={{fontSize:'16px'}}>Gift cards</div><div className="sr-desc" style={{marginTop:'4px'}}>Send a gift card to your friends.</div><button className="sb-secondary" style={{marginTop:'12px',padding:'8px 16px',fontSize:'13px'}}>See all gift cards</button></div>
              <div style={{width:'120px',height:'80px',borderRadius:'8px',background:'linear-gradient(135deg,var(--accent-100),var(--accent-200),#ff9060)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'11px',textAlign:'center',lineHeight:'1.3',transform:'rotate(3deg)'}}>Argus<br/>Gift card</div>
            </div>

            {/* Student discount */}
            <div className="sc" style={{marginBottom:'16px'}}>
              <div className="sr">
                <div><div className="sr-label" style={{fontSize:'16px'}}>Student discount</div><div className="sr-desc" style={{marginTop:'4px'}}>Verify student status and get access to up to 50% off Argus Pro.</div></div>
                <button className="sb-secondary" style={{padding:'10px 24px',fontSize:'13px'}}>Learn more</button>
              </div>
            </div>

            {/* Security and compliance */}
            <div className="sc" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div className="sr-label" style={{fontSize:'16px'}}>Security and compliance</div><div className="sr-desc" style={{marginTop:'4px'}}>Enterprise-grade security and compliance certifications</div></div>
              <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'var(--fg-100)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'8px',fontWeight:'700',textAlign:'center',lineHeight:'1.2'}}>SOC 2<br/>TYPE II</div>
                <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'var(--fg-100)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'9px',fontWeight:'700'}}>GDPR</div>
                <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'var(--fg-100)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'7px',fontWeight:'700',textAlign:'center',lineHeight:'1.2'}}>ISO<br/>27001</div>
              </div>
              <button className="sb-secondary" style={{padding:'10px 24px',fontSize:'13px'}}>Learn more</button>
            </div>
          </div>

          {/* ═══ PRIVACY & SECURITY ═══ */}
          {hasTeam && (
            <div className="settings-section-content" id="section-privacy" style={{display:'none'}}>
              <h1 className="page-title">Privacy &amp; security</h1>
              <p className="page-subtitle" style={{marginBottom:'24px'}}>Manage privacy and security settings for your workspace.</p>
              <div className="sc">
                {[
                  {label:'Default project visibility',desc:'Choose whether new projects start as public, private (workspace-only), or drafts.',badge:null,right:'<div class="sr-select">Workspace</div>'},
                  {label:'Default website access',desc:'Choose if new published websites are public or only accessible to logged in workspace members.',badge:'Business',right:'<div class="sr-select">Anyone</div>'},
                  {label:'MCP servers access',desc:'Allow workspace members to use MCP servers.',badge:'Business',right:'toggle-on'},
                  {label:'Data collection opt out',desc:'Opt out of data collection for this workspace.',badge:'Business',right:'toggle-off'},
                  {label:'Restrict workspace invitations',desc:'When enabled, only admins and owners can invite members to this workspace.',badge:'Enterprise',right:'toggle-off'},
                  {label:'Allow editors to transfer projects',desc:'When enabled, editors who own a project can transfer it to another workspace.',badge:'Enterprise',right:'toggle-off'},
                  {label:'Invite links',desc:'Allow workspace members to create and share invite links.',badge:null,right:'toggle-on'},
                  {label:'Who can publish externally',desc:'Control which roles can publish projects outside the workspace.',badge:'Enterprise',right:'<div class="sr-select">Editors and above</div>'},
                ].map(function(item,i){
                  return (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0',borderBottom:i<7?'1px solid var(--border-100)':'none'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span style={{fontSize:'14px',fontWeight:'600'}}>{item.label}</span>
                          {item.badge && <span style={{padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:'600',background:item.badge==='Enterprise'?'var(--bg-300)':'rgba(99,102,241,0.1)',color:item.badge==='Enterprise'?'var(--fg-muted)':'#6366f1'}}>{item.badge}</span>}
                        </div>
                        <div style={{fontSize:'13px',color:'var(--fg-muted)',marginTop:'2px'}}>{item.desc}</div>
                      </div>
                      {item.right === 'toggle-on' ? (
                        <div style={{width:'44px',height:'24px',borderRadius:'12px',background:'var(--fg-100)',cursor:'not-allowed',position:'relative',flexShrink:0}}>
                          <div style={{width:'20px',height:'20px',borderRadius:'10px',background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.15)',position:'absolute',top:'2px',right:'2px'}}></div>
                        </div>
                      ) : item.right === 'toggle-off' ? (
                        <div style={{width:'44px',height:'24px',borderRadius:'12px',background:'var(--border-100)',cursor:'not-allowed',position:'relative',opacity:0.6,flexShrink:0}}>
                          <div style={{width:'20px',height:'20px',borderRadius:'10px',background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.15)',position:'absolute',top:'2px',left:'2px'}}></div>
                        </div>
                      ) : (
                        <div style={{padding:'6px 16px',border:'1px solid var(--border-100)',borderRadius:'8px',fontSize:'13px',color:'var(--fg-100)',cursor:'not-allowed',display:'flex',alignItems:'center',gap:'6px',background:'var(--bg-100)'}}>
                          {item.right === '<div class="sr-select">Workspace</div>' ? 'Workspace' : item.right === '<div class="sr-select">Anyone</div>' ? 'Anyone' : 'Editors and above'}
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--fg-muted)" strokeWidth="1.5"><path d="M3 5l3 3 3-3"/></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ ACCOUNT SETTINGS ═══ */}
          <div className="settings-section-content" id="section-account" style={{display:'none'}}>
            <h1 className="page-title">Account settings</h1>
            <p className="page-subtitle" style={{marginBottom:'24px'}}>Personalize how others see and interact with you on Argus.</p>

            {/* Preferences card */}
            <div className="sc" style={{marginBottom:'16px'}}>
              <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'16px',marginBottom:'16px'}}>
                <div><div className="sr-label">Chat suggestions</div><div className="sr-desc">Show helpful suggestions in the chat interface to enhance your experience.</div></div>
                <div className="stoggle active"><div></div></div>
              </div>
              <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'16px',marginBottom:'16px'}}>
                <div style={{flex:1}}>
                  <div className="sr-label">Generation complete sound</div>
                  <div className="sr-desc">Plays a satisfying sound notification when a generation is finished.</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'13px'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}><input type="radio" name="genSound" defaultChecked style={{accentColor:'var(--fg-100)'}}/> First generation</label>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}><input type="radio" name="genSound" style={{accentColor:'var(--fg-100)'}}/> Always</label>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}><input type="radio" name="genSound" style={{accentColor:'var(--fg-100)'}}/> Never</label>
                </div>
              </div>
              <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'16px',marginBottom:'16px'}}>
                <div><div className="sr-label">Auto-accept invitations</div><div className="sr-desc">Automatically join workspaces and projects when invited instead of requiring manual acceptance.</div></div>
                <div className="stoggle active"><div></div></div>
              </div>
              <div className="sr">
                <div style={{flex:1}}><div className="sr-label">Push notifications</div><div className="sr-desc">Enable push notifications in the mobile app to customize these settings.</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'13px',fontWeight:'500',marginBottom:'4px'}}>Agent action</div><div style={{fontSize:'12px',color:'var(--fg-muted)',marginBottom:'8px'}}>Stay updated when the agent finishes work</div><div className="stoggle"><div></div></div></div>
              </div>
            </div>

            {/* Linked accounts */}
            <div className="sc" style={{marginBottom:'16px'}}>
              <div className="sr-label" style={{marginBottom:'4px'}}>Linked accounts</div>
              <div className="sr-desc" style={{marginBottom:'16px'}}>Manage accounts linked for sign-in.</div>
              <div id="settingsLinkedAccounts"><div style={{color:'var(--fg-muted)',fontSize:'13px'}}>Loading...</div></div>
            </div>

            {/* 2FA */}
            <div className="sc" style={{marginBottom:'16px'}}>
              <div className="sr">
                <div><div className="sr-label">Two-factor authentication</div><div className="sr-desc">Secure your account with a one-time code via an authenticator app or SMS.</div></div>
                <button className="sb-secondary" style={{padding:'8px 16px',fontSize:'13px'}}>Enable</button>
              </div>
            </div>

            {/* Profile edit */}
            <div className="sc" style={{marginBottom:'16px'}}>
              <div className="sr-label" style={{marginBottom:'12px'}}>Profile</div>
              <div style={{marginBottom:'12px'}}><label style={{fontSize:'13px',fontWeight:'500',display:'block',marginBottom:'6px',color:'var(--fg-200)'}}>Display name</label><input type="text" id="settingsProfileName" className="si" style={{maxWidth:'400px'}}/></div>
              <div style={{marginBottom:'16px'}}><label style={{fontSize:'13px',fontWeight:'500',display:'block',marginBottom:'6px',color:'var(--fg-200)'}}>Email</label><input type="email" id="settingsProfileEmail" className="si" disabled style={{maxWidth:'400px',opacity:0.5,cursor:'not-allowed'}}/></div>
              <button id="settingsSaveProfile" className="sb-primary" style={{fontSize:'13px',padding:'8px 16px'}}>Save</button>
            </div>

            {/* Sign out */}
            <div style={{marginBottom:'16px'}}><button id="settingsSignOut" className="sb-secondary">Sign out</button></div>

            {/* Delete account */}
            <div className="sc" style={{borderColor:'#fca5a5'}}>
              <div className="sr">
                <div><div className="sr-label" style={{color:'#dc2626'}}>Delete account</div><div className="sr-desc">Permanently delete your Argus account. This cannot be undone.</div></div>
                <button id="settingsDeleteAccountBtn" style={{padding:'8px 16px',background:'#dc2626',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}>Delete account</button>
              </div>
              <div id="settingsDeleteReveal" style={{display:'none',marginTop:'12px',padding:'16px',border:'1px solid #fca5a5',borderRadius:'10px',background:'rgba(254,226,226,0.15)'}}>
                <p style={{fontSize:'13px',color:'#b91c1c',fontWeight:'500',marginBottom:'8px'}}>Type your email to confirm:</p>
                <input type="text" id="settingsDeleteInput" className="si" style={{borderColor:'#fca5a5',marginBottom:'12px'}}/>
                <div style={{display:'flex',gap:'8px'}}><button id="settingsDeleteConfirm" disabled className="sb-danger" style={{opacity:0.5}}>Delete account</button><button id="settingsDeleteCancel" style={{fontSize:'13px',color:'var(--fg-muted)',background:'none',border:'none',cursor:'pointer'}}>Cancel</button></div>
              </div>
            </div>
          </div>

          {/* ═══ LABS ═══ */}
          <div className="settings-section-content" id="section-labs" style={{display:'none'}}>
            <h1 className="page-title">Labs</h1>
            <p className="page-subtitle" style={{marginBottom:'24px'}}>These are experimental features that might be modified or removed.</p>
            <div className="sc">
              <div className="sr" style={{borderBottom:'1px solid var(--border-100)',paddingBottom:'16px',marginBottom:'16px'}}>
                <div><div className="sr-label">Dark mode</div><div className="sr-desc">Toggle dark theme across the workspace.</div></div>
                <div id="settingsDarkModeToggle" className="stoggle"><div></div></div>
              </div>
              <div className="sr">
                <div><div className="sr-label">GitHub branch switching</div><div className="sr-desc">Select the branch to make edits to in your GitHub repository.</div></div>
                <div className="stoggle" style={{opacity:0.5,cursor:'not-allowed'}}><div></div></div>
              </div>
            </div>
          </div>

          {/* ═══ KNOWLEDGE ═══ */}
          <div className="settings-section-content" id="section-knowledge" style={{display:'none'}}>
            <h1 className="page-title">Knowledge</h1>
            <p className="page-subtitle" style={{marginBottom:'24px'}}>Manage knowledge for your project and workspace.</p>
            <div style={{padding:'12px 16px',background:'rgba(99,130,255,0.08)',border:'1px solid rgba(99,130,255,0.2)',borderRadius:'10px',marginBottom:'20px',fontSize:'13px',color:'#6366f1'}}><strong>Workspace knowledge</strong> — You can now add custom instructions that apply across all projects in your workspace.</div>
            <div className="sc">
              <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'8px'}}>Workspace knowledge</div>
              <p style={{fontSize:'13px',color:'var(--fg-muted)',marginBottom:'12px'}}>Set shared rules and preferences that apply to every project in this workspace.</p>
              <ul style={{fontSize:'13px',color:'var(--fg-muted)',paddingLeft:'20px',marginBottom:'16px'}}><li>Define coding style and naming conventions.</li><li>Set preferred libraries, frameworks, or patterns.</li><li>Add behavioral rules like tone, language, and formatting.</li></ul>
              <textarea className="si" rows={8} placeholder="Set coding style, conventions, and preferences for all your projects..." disabled style={{opacity:0.6,resize:'none'}}></textarea>
              <div style={{marginTop:'12px'}}><button className="sb-primary" disabled style={{opacity:0.5}}>Save</button></div>
            </div>
          </div>

          {/* ═══ GITHUB ═══ */}
          <div className="settings-section-content" id="section-github" style={{display:'none'}}>
            <h1 className="page-title">GitHub</h1>
            <p className="page-subtitle" style={{marginBottom:'24px'}}>Sync your project 2-way with GitHub to collaborate at source.</p>
            <div className="sc">
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                <span style={{fontSize:'14px',fontWeight:'600'}}>Connected account</span>
                <span style={{padding:'2px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:'600',background:'rgba(255,72,1,0.08)',color:'var(--accent-100)'}}>Admin</span>
              </div>
              <p style={{fontSize:'13px',color:'var(--fg-muted)',marginBottom:'16px'}}>Add your GitHub account to manage connected organizations.</p>
              <button style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#1A1A1A',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}} dangerouslySetInnerHTML={{__html:'<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg> Connect GitHub'}} />
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes settingsFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .sc{padding:24px;border:1px solid var(--border-100);border-radius:12px;background:var(--bg-100);margin-bottom:0}
        .sr{display:flex;justify-content:space-between;align-items:center}
        .sr-label{font-size:14px;font-weight:600;color:var(--fg-100)}
        .sr-desc{font-size:13px;color:var(--fg-muted);margin-top:2px}
        .sr-select{padding:6px 16px;border:1px solid var(--border-100);border-radius:8px;font-size:13px;color:var(--fg-100);cursor:not-allowed;display:flex;align-items:center;gap:6px;background:var(--bg-100)}
        .si{width:100%;padding:10px 12px;border:1px solid var(--border-100);border-radius:8px;font-size:14px;background:var(--bg-100);color:var(--fg-100);outline:none;transition:border-color .15s;font-family:inherit;box-sizing:border-box}
        .si:focus{border-color:var(--accent-100)}
        .sb-primary{padding:10px 20px;background:var(--accent-100);color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s;font-family:inherit}
        .sb-primary:hover{opacity:.9}.sb-primary:disabled{opacity:.5;cursor:not-allowed}
        .sb-secondary{padding:10px 20px;background:var(--bg-100);color:var(--fg-100);border:1px solid var(--border-100);border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:background .15s;font-family:inherit}
        .sb-secondary:hover{background:var(--bg-300)}
        .sb-danger{padding:10px 20px;background:none;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        .sb-danger:hover{background:rgba(254,226,226,.5)}.sb-danger:disabled{opacity:.5;cursor:not-allowed}
        .stoggle{width:44px;height:24px;border-radius:12px;background:var(--border-100);cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
        .stoggle>div{width:20px;height:20px;border-radius:10px;background:white;box-shadow:0 1px 3px rgba(0,0,0,.15);position:absolute;top:2px;left:2px;transition:transform .2s}
        .stoggle.active{background:var(--fg-100)}.stoggle.active>div{transform:translateX(20px)}
        .people-tab.active{background:var(--bg-100)!important;color:var(--fg-100)!important;border-color:var(--border-200)!important}
        .settings-nav-item{cursor:pointer}
      `}</style>
    </div>
  );
}
