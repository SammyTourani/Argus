// @ts-nocheck
'use client';

import { useEffect } from 'react';
import DiscoverTab from './DiscoverTab';
import TemplatesTab from './TemplatesTab';
import ModelsTab from './ModelsTab';
import ConnectorsTab from './ConnectorsTab';

export default function ResourcesPage() {

  /* ===== TAB SYSTEM ===== */
  useEffect(() => {
    var tabBar = document.getElementById('tabBar');
    var tabBtns = tabBar.querySelectorAll('.tab-btn');
    var indicator = document.getElementById('tabIndicator');

    function setIndicator(btn) {
      indicator.style.left = btn.offsetLeft + 'px';
      indicator.style.width = btn.offsetWidth + 'px';
    }

    function switchTab(tabId) {
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      var btn = tabBar.querySelector('[data-tab="' + tabId + '"]');
      btn.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
      setIndicator(btn);
    }

    var clickHandlers = [];
    tabBtns.forEach(function(btn) {
      var handler = function() { switchTab(btn.dataset.tab); };
      btn.addEventListener('click', handler);
      clickHandlers.push({ el: btn, handler: handler });
    });

    // Init indicator
    var initTimer = setTimeout(function() { setIndicator(tabBar.querySelector('.tab-btn.active')); }, 50);

    var resizeHandler = function() { setIndicator(tabBar.querySelector('.tab-btn.active')); };
    window.addEventListener('resize', resizeHandler);

    return () => {
      clearTimeout(initTimer);
      clickHandlers.forEach(function(item) {
        item.el.removeEventListener('click', item.handler);
      });
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  /* ===== DARK MODE SYNC ===== */
  useEffect(() => {
    var template = localStorage.getItem('argus-hero-template') || 'classic';
    var isDark = template === 'matrix';

    var root = document.querySelector('.workspace-root');
    if (root) {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    window.dispatchEvent(new CustomEvent('argus-dark-mode-change', { detail: { dark: isDark } }));

    // Listen for storage changes from other tabs/pages
    var storageHandler = function(e) {
      if (e.key === 'argus-hero-template') {
        var nowDark = e.newValue === 'matrix';
        var r = document.querySelector('.workspace-root');
        if (r) {
          r.classList.toggle('dark', nowDark);
        }
        window.dispatchEvent(new CustomEvent('argus-dark-mode-change', { detail: { dark: nowDark } }));
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  return (
    <div className="app page-resources">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">A</div>
          <div className="sidebar-title">Sammy&apos;s Workspace <svg className="sidebar-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 6l3 3 3-3" /></svg></div>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-item" href="index.html" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10.5L10 4l7 6.5M5 9v7a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V9" /></svg>
            Home
          </a>
          <a className="nav-item" href="index.html?action=search" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
            Search
          </a>
          <div className="nav-item active">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z" /></svg>
            Resources
          </div>
        </nav>

        <div className="nav-section-label">Projects</div>
        <div className="sidebar-projects">
          <a className="nav-item" href="index.html?view=all" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" /><path d="M7 3v14M3 8h4" /></svg>
            All projects
          </a>
          <a className="nav-item" href="index.html?view=starred" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l2.5 5 5.5.8-4 3.9.9 5.3L10 15.5 5.1 18l.9-5.3-4-3.9 5.5-.8z" /></svg>
            Starred
          </a>
          <a className="nav-item" href="index.html?view=created" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3.5" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
            Created by me
          </a>
          <a className="nav-item" href="index.html?view=shared" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="7" r="3" /><circle cx="14" cy="8" r="2.5" /><path d="M2 17c0-3 2.2-5.5 5-5.8M11.5 17c0-2.5 1.5-4.5 3.5-5" /></svg>
            Shared with me
          </a>
        </div>

        <div className="nav-section-label">Recents</div>
        <div style={{ padding: '0 8px 12px' }}>
          <div className="nav-item">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h12v12H4z" /><path d="M8 8h4M8 11h2" /></svg>
            AI Chat Agent
          </div>
          <div className="nav-item">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h12v12H4z" /><path d="M8 8h4M8 11h2" /></svg>
            Dashboard Pro
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-item">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 12l-5-3V4" /><circle cx="10" cy="10" r="7" /></svg>
            <div>
              <div>Share Argus</div>
              <div className="desc">100 credits per referral</div>
            </div>
            <span className="badge">NEW</span>
          </div>
          <div className="sidebar-footer-item">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3v14M6 7l4-4 4 4" /></svg>
            <div>
              <div>Upgrade to Pro</div>
              <div className="desc">Unlock all features</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        <div className="main-inner">
          {/* Page Header */}
          <div className="page-header stagger-1">
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Discover community apps, templates, AI models, and integrations.</p>
          </div>

          {/* Tab Bar */}
          <div className="tab-bar stagger-2" id="tabBar">
            <div className="tab-indicator" id="tabIndicator"></div>
            <button className="tab-btn active" data-tab="discover">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7" /><path d="M14 6l-4 4.5L8 8.5" /></svg>
              Discover
            </button>
            <button className="tab-btn" data-tab="templates">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 8h14M8 3v14" /></svg>
              Templates
            </button>
            <button className="tab-btn" data-tab="models">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="3" /><path d="M10 3v4M10 13v4M3 10h4M13 10h4M5.5 5.5l2.8 2.8M11.7 11.7l2.8 2.8M5.5 14.5l2.8-2.8M11.7 8.3l2.8-2.8" /></svg>
              Models
            </button>
            <button className="tab-btn" data-tab="connectors">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3v4a2 2 0 01-2 2H3M13 3v4a2 2 0 002 2h2M7 17v-4a2 2 0 00-2-2H3M13 17v-4a2 2 0 012-2h2" /></svg>
              Connectors
            </button>
          </div>

          {/* Tab Contents */}
          <DiscoverTab />
          <TemplatesTab />
          <ModelsTab />
          <ConnectorsTab />

        </div>
      </main>
    </div>
  );
}
