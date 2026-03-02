// @ts-nocheck
'use client';

import { useEffect } from 'react';

export default function ProjectsDashboard() {
  // ===== initProjectsDashboard =====
  useEffect(() => {
    var PROJECTS = [
      { id: 1, name: 'Intern Insider', type: 'project', status: 'active', owner: 'sammytourani@gmail.com', ownerInitial: 'S', editedAt: '2 hours ago', starred: true, shared: false, gradient: 'linear-gradient(135deg, #ff4801 0%, #ff9a6c 50%, #ffd4b8 100%)' },
      { id: 2, name: 'argus-landing-page', type: 'project', status: 'deployed', owner: 'sammytourani@gmail.com', ownerInitial: 'S', editedAt: '5 hours ago', starred: true, shared: false, gradient: 'linear-gradient(135deg, #521000 0%, #ff4801 60%, #ff7038 100%)' },
      { id: 3, name: 'AI Resume Builder', type: 'project', status: 'active', owner: 'sammytourani@gmail.com', ownerInitial: 'S', editedAt: '1 day ago', starred: false, shared: false, gradient: 'linear-gradient(135deg, #0a0a0a 0%, #ff4801 40%, #ff7038 100%)' },
      { id: 4, name: 'Dashboard Pro', type: 'project', status: 'draft', owner: 'sammytourani@gmail.com', ownerInitial: 'S', editedAt: '3 days ago', starred: false, shared: false, gradient: 'linear-gradient(160deg, #fffdfb 0%, #ebd5c1 30%, #ff7038 70%, #ff4801 100%)' },
      { id: 5, name: 'McMaster Events App', type: 'project', status: 'active', owner: 'sammytourani@gmail.com', ownerInitial: 'S', editedAt: '6 hours ago', starred: false, shared: true, gradient: 'linear-gradient(135deg, #ff7038 0%, #ffb088 50%, #ffd4b8 100%)' },
      { id: 6, name: 'alyssas-matcha-dreams', type: 'project', status: 'deployed', owner: 'alyssa@gmail.com', ownerInitial: 'A', editedAt: '13 hours ago', starred: true, shared: true, gradient: 'linear-gradient(135deg, #3ecf8e 0%, #1a9f68 100%)' },
      { id: 7, name: 'OpenClaw Docs Site', type: 'folder', status: 'draft', owner: 'sammytourani@gmail.com', ownerInitial: 'S', editedAt: '1 week ago', starred: false, shared: false, gradient: 'linear-gradient(135deg, #7a3a1a 0%, #b08060 100%)' },
      { id: 8, name: 'Chatbase Widget Clone', type: 'project', status: 'active', owner: 'dev@team.co', ownerInitial: 'D', editedAt: '30 minutes ago', starred: false, shared: true, gradient: 'linear-gradient(135deg, #5e6ad2 0%, #8b5cf6 100%)' }
    ];

    var dashboard = document.getElementById('projectsDashboard');
    var centerContent = document.getElementById('centerContent');
    var carouselSection = document.getElementById('carouselSection');
    var bottomSection = document.querySelector('.bottom-section') as HTMLElement | null;
    var chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
    if (!dashboard) return;

    var pdState = {
      activeView: 'home',
      viewMode: 'grid',
      searchQuery: '',
      sortBy: 'last-edited',
      statusFilter: 'all'
    };

    var titles: Record<string, string> = {
      all: 'All Projects',
      starred: 'Starred',
      created: 'Created by Me',
      shared: 'Shared with Me'
    };

    var navMap: Record<string, string> = {
      'Home': 'home',
      'All projects': 'all',
      'Starred': 'starred',
      'Created by me': 'created',
      'Shared with me': 'shared'
    };

    function filterProjects() {
      var list = PROJECTS.slice();
      if (pdState.activeView === 'starred') list = list.filter(function(p) { return p.starred; });
      else if (pdState.activeView === 'created') list = list.filter(function(p) { return p.owner === 'sammytourani@gmail.com'; });
      else if (pdState.activeView === 'shared') list = list.filter(function(p) { return p.shared; });

      if (pdState.statusFilter !== 'all') list = list.filter(function(p) { return p.status === pdState.statusFilter; });
      if (pdState.searchQuery.trim()) {
        var q = pdState.searchQuery.toLowerCase();
        list = list.filter(function(p) { return p.name.toLowerCase().indexOf(q) !== -1; });
      }

      if (pdState.sortBy === 'name-asc') list.sort(function(a, b) { return a.name.localeCompare(b.name); });
      else if (pdState.sortBy === 'name-desc') list.sort(function(a, b) { return b.name.localeCompare(a.name); });
      return list;
    }

    function renderProjectCard(p: typeof PROJECTS[0], idx: number) {
      var starFill = p.starred
        ? '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l2 4 4.5.7-3.2 3.1.8 4.5L8 11.8 3.9 13.8l.8-4.5L1.5 6.2 6 5.5z"/></svg>'
        : '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8 1.5l2 4 4.5.7-3.2 3.1.8 4.5L8 11.8 3.9 13.8l.8-4.5L1.5 6.2 6 5.5z"/></svg>';
      var folderIcon = p.type === 'folder' ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--fg-muted)" stroke-width="1.5"><path d="M2 4h4l1.5 2H14v7H2z"/></svg>' : '';
      return '<div class="pd-card" data-project-id="' + p.id + '" style="animation-delay:' + (idx * 50) + 'ms">' +
        '<div class="pd-card-thumb"><div class="pd-card-thumb-inner" style="background:' + p.gradient + '"></div>' +
        '<span class="pd-card-index">[' + String(idx).padStart(2, '0') + ']</span>' +
        '<button class="pd-card-star' + (p.starred ? ' starred' : '') + '" data-star="' + p.id + '">' + starFill + '</button>' +
        '<span class="pd-card-status ' + p.status + '">' + p.status + '</span></div>' +
        '<div class="pd-card-info"><div class="pd-card-avatar">' + p.ownerInitial + '</div>' +
        '<div class="pd-card-info-text"><div class="pd-card-name">' + folderIcon + p.name + '</div>' +
        '<div class="pd-card-meta"><span>' + p.editedAt + '</span><span class="pd-card-meta-dot"></span><span>' + p.owner.split('@')[0] + '</span></div></div>' +
        '<button class="pd-card-menu" data-menu="' + p.id + '"><svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg></button></div></div>';
    }

    function renderNewCard(idx: number) {
      return '<div class="pd-card-new" data-action="new-project" style="animation-delay:' + (idx * 50) + 'ms">' +
        '<div class="pd-card-new-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v10M3 8h10"/></svg></div>' +
        '<span class="pd-card-new-text">Create new project</span></div>';
    }

    function renderFirstTimeHero() {
      var html = '<div class="pd-empty-hero">';
      html += '<video class="pd-empty-hero-video" autoplay loop muted playsinline><source src="animation-empty-state.mp4" type="video/mp4"></video>';
      html += '<button class="pd-empty-hero-cta" data-action="empty-cta">';
      html += '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v10M3 8h10"/></svg>';
      html += 'Start Building</button></div>';
      return html;
    }

    function renderNoResults() {
      var html = '<div class="pd-no-results">';
      html += '<svg class="pd-no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/><path d="M8 11h6" stroke-linecap="round"/></svg>';
      if (pdState.searchQuery) {
        html += '<div class="pd-no-results-title">No projects match \u201c' + pdState.searchQuery.replace(/</g, '&lt;') + '\u201d</div>';
      } else {
        html += '<div class="pd-no-results-title">No projects found</div>';
      }
      html += '<div class="pd-no-results-sub">Try a different search term or clear your filters</div>';
      html += '<button class="pd-no-results-clear" data-action="clear-filters">Clear all filters</button>';
      html += '</div>';
      return html;
    }

    function renderSubViewEmpty() {
      var views: Record<string, { icon: string; title: string; sub: string; cta: string }> = {
        starred: { icon: '<path d="M8 1.5l2 4 4.5.7-3.2 3.1.8 4.5L8 11.8 3.9 13.8l.8-4.5L1.5 6.2 6 5.5z"/>', title: 'No starred projects', sub: 'Star projects for quick access from any workspace', cta: 'Browse Projects' },
        created: { icon: '<path d="M8 3v10M3 8h10"/>', title: 'No projects created', sub: 'Everything you build with Argus will appear here', cta: 'Create First Project' },
        shared: { icon: '<path d="M16 14v-1a4 4 0 00-3-3.87M12 3.13a4 4 0 010 7.75M9 7a4 4 0 11-8 0 4 4 0 018 0zM2 14a6 6 0 0110 0"/>', title: 'Nothing shared yet', sub: 'When collaborators share projects with you, they\'ll appear here', cta: 'Explore Templates' }
      };
      var v = views[pdState.activeView] || views.created;
      var html = '<div class="pd-empty">';
      html += '<div class="pd-empty-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2">' + v.icon + '</svg></div>';
      html += '<h3 class="pd-empty-title">' + v.title + '</h3>';
      html += '<p class="pd-empty-sub">' + v.sub + '</p>';
      html += '<button class="pd-empty-cta" data-action="empty-cta">' + v.cta + '</button>';
      html += '</div>';
      return html;
    }

    function render() {
      var projects = filterProjects();
      var isFirstTime = PROJECTS.length === 0 && pdState.activeView === 'all';
      var hasFilters = pdState.searchQuery !== '' || pdState.statusFilter !== 'all';
      var html = '';

      dashboard!.classList.toggle('first-time', isFirstTime);

      if (isFirstTime) {
        html = renderFirstTimeHero();
        dashboard!.innerHTML = html;
        return;
      }

      // Header
      html += '<div class="pd-header"><div class="pd-title-group">';
      html += '<h2 class="pd-title">' + titles[pdState.activeView] + '</h2>';
      if (projects.length > 0) html += '<span class="pd-count">[' + String(projects.length).padStart(2, '0') + ']</span>';
      html += '</div><div class="pd-actions">';
      html += '<button class="pd-btn-new" data-action="new-project"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v10M3 8h10"/></svg>New Project</button>';
      html += '</div></div>';

      // Toolbar
      html += '<div class="pd-toolbar">';
      html += '<div class="pd-search"><svg class="pd-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>';
      html += '<input type="text" placeholder="Search projects..." value="' + pdState.searchQuery.replace(/"/g, '&quot;') + '" data-role="pd-search" /></div>';
      html += '<select class="pd-sort" data-role="pd-sort">';
      html += '<option value="last-edited"' + (pdState.sortBy === 'last-edited' ? ' selected' : '') + '>Last edited</option>';
      html += '<option value="name-asc"' + (pdState.sortBy === 'name-asc' ? ' selected' : '') + '>Name A\u2013Z</option>';
      html += '<option value="name-desc"' + (pdState.sortBy === 'name-desc' ? ' selected' : '') + '>Name Z\u2013A</option>';
      html += '</select>';
      html += '<div class="pd-filter-chips">';
      ['all', 'active', 'deployed', 'draft'].forEach(function(f) {
        var label = f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1);
        html += '<button class="pd-chip' + (pdState.statusFilter === f ? ' active' : '') + '" data-status="' + f + '">' + label + '</button>';
      });
      html += '</div>';
      html += '<div class="pd-view-toggle">';
      html += '<button class="pd-view-btn' + (pdState.viewMode === 'grid' ? ' active' : '') + '" data-view="grid" title="Grid view"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg></button>';
      html += '<button class="pd-view-btn' + (pdState.viewMode === 'list' ? ' active' : '') + '" data-view="list" title="List view"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h12"/></svg></button>';
      html += '</div></div>';

      // Content
      if (projects.length === 0) {
        if (pdState.activeView === 'all' && hasFilters) {
          html += renderNoResults();
        } else if (pdState.activeView !== 'all') {
          if (hasFilters) {
            html += renderNoResults();
          } else {
            html += renderSubViewEmpty();
          }
        } else {
          html += renderNoResults();
        }
      } else {
        html += '<div class="pd-grid' + (pdState.viewMode === 'list' ? ' list-view' : '') + '">';
        html += renderNewCard(0);
        projects.forEach(function(p, i) { html += renderProjectCard(p, i + 1); });
        html += '</div>';
      }

      dashboard!.innerHTML = html;
      attachInputListeners();
    }

    function attachInputListeners() {
      var searchInput = dashboard!.querySelector('[data-role="pd-search"]') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.addEventListener('input', function(e) {
          pdState.searchQuery = (e.target as HTMLInputElement).value;
          render();
          var newInput = dashboard!.querySelector('[data-role="pd-search"]') as HTMLInputElement | null;
          if (newInput) { newInput.focus(); newInput.setSelectionRange(newInput.value.length, newInput.value.length); }
        });
      }
      var sortSelect = dashboard!.querySelector('[data-role="pd-sort"]') as HTMLSelectElement | null;
      if (sortSelect) {
        sortSelect.addEventListener('change', function(e) { pdState.sortBy = (e.target as HTMLSelectElement).value; render(); });
      }
    }

    // Event delegation (attached once)
    function handleDashboardClick(e: Event) {
      var target = e.target as HTMLElement;

      var chip = target.closest('.pd-chip');
      if (chip) { pdState.statusFilter = chip.getAttribute('data-status') || 'all'; render(); return; }

      var viewBtn = target.closest('.pd-view-btn');
      if (viewBtn) { pdState.viewMode = viewBtn.getAttribute('data-view') || 'grid'; render(); return; }

      var starBtn = target.closest('.pd-card-star');
      if (starBtn) {
        var sid = parseInt(starBtn.getAttribute('data-star') || '0');
        var proj = PROJECTS.find(function(p) { return p.id === sid; });
        if (proj) { proj.starred = !proj.starred; render(); }
        return;
      }

      var clearBtn = target.closest('[data-action="clear-filters"]');
      if (clearBtn) { pdState.searchQuery = ''; pdState.statusFilter = 'all'; pdState.sortBy = 'last-edited'; render(); return; }

      var newBtn = target.closest('[data-action="new-project"]') || target.closest('[data-action="empty-cta"]');
      if (newBtn) { switchToHome(); setTimeout(function() { if (chatInput) chatInput.focus(); }, 100); return; }

      var card = target.closest('.pd-card');
      if (card && !target.closest('.pd-card-star') && !target.closest('.pd-card-menu')) {
        console.log('Open project:', card.getAttribute('data-project-id'));
        return;
      }

      var menuBtn = target.closest('.pd-card-menu');
      if (menuBtn) { e.stopPropagation(); console.log('Context menu for:', menuBtn.getAttribute('data-menu')); return; }
    }
    dashboard.addEventListener('click', handleDashboardClick);

    // View switching
    function switchView(viewKey: string) {
      pdState.activeView = viewKey;
      pdState.searchQuery = '';
      pdState.statusFilter = 'all';
      if (viewKey === 'home') { switchToHome(); return; }
      if (centerContent) centerContent.style.display = 'none';
      if (carouselSection) carouselSection.style.display = 'none';
      if (bottomSection) bottomSection.style.display = 'none';
      var switcher = document.getElementById('templateSwitcher');
      if (switcher) switcher.style.display = 'none';
      dashboard!.classList.add('active');
      render();
      updateNavActive(viewKey);
    }

    function switchToHome() {
      pdState.activeView = 'home';
      dashboard!.classList.remove('active');
      if (centerContent) centerContent.style.display = '';
      if (carouselSection) carouselSection.style.display = '';
      if (bottomSection) bottomSection.style.display = '';
      var switcher = document.getElementById('templateSwitcher');
      if (switcher) switcher.style.display = '';
      updateNavActive('home');
    }

    function updateNavActive(viewKey: string) {
      document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
        var text = item.textContent?.trim() || '';
        if (navMap[text] === viewKey) item.classList.add('active');
      });
    }

    // Wire sidebar nav items
    var projectNavItems = document.querySelectorAll('.sidebar-projects .nav-item');
    var navClickHandlers: Array<{ el: Element; handler: (e: Event) => void }> = [];
    projectNavItems.forEach(function(item) {
      var handler = function(e: Event) {
        var text = item.textContent?.trim() || '';
        var viewKey = navMap[text];
        if (viewKey) { e.preventDefault(); switchView(viewKey); }
      };
      item.addEventListener('click', handler);
      navClickHandlers.push({ el: item, handler });
    });

    // Wire Home nav item
    var homeNavItem = document.querySelector('.sidebar-nav .nav-item:first-child');
    function handleHomeClick() { switchView('home'); }
    if (homeNavItem) {
      homeNavItem.addEventListener('click', handleHomeClick);
    }

    // Keyboard shortcuts
    function handleKeydown(e: KeyboardEvent) {
      if (pdState.activeView === 'home') return;
      var searchModalOpen = document.querySelector('.search-modal-backdrop.active');
      if (searchModalOpen) return;

      if (e.key === 'Escape') { switchToHome(); return; }
      var tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); var si = dashboard!.querySelector('[data-role="pd-search"]') as HTMLInputElement | null; if (si) si.focus(); return; }
      if (e.key === 'v') { pdState.viewMode = pdState.viewMode === 'grid' ? 'list' : 'grid'; render(); return; }
      if (e.key === 'n') { switchToHome(); setTimeout(function() { if (chatInput) chatInput.focus(); }, 100); return; }
    }
    document.addEventListener('keydown', handleKeydown as EventListener);

    // Wire Browse All button
    var browseAllBtn = document.getElementById('browseAllBtn');
    function handleBrowseAll(e: Event) {
      e.preventDefault();
      switchView('all');
    }
    if (browseAllBtn) {
      browseAllBtn.addEventListener('click', handleBrowseAll);
    }

    // Handle URL params from cross-page navigation
    var urlParams = new URLSearchParams(window.location.search);
    var viewParam = urlParams.get('view');
    if (viewParam && ['all', 'starred', 'created', 'shared'].indexOf(viewParam) !== -1) {
      switchView(viewParam);
    }

    // Test hook
    (window as any).__pdTest = function(mode: string) {
      if (mode === 'first-time') { PROJECTS.length = 0; pdState.activeView = 'all'; switchView('all'); }
      else if (mode === 'restore') { location.reload(); }
    };

    return () => {
      dashboard!.removeEventListener('click', handleDashboardClick);
      document.removeEventListener('keydown', handleKeydown as EventListener);
      navClickHandlers.forEach(function(entry) {
        entry.el.removeEventListener('click', entry.handler);
      });
      if (homeNavItem) homeNavItem.removeEventListener('click', handleHomeClick);
      if (browseAllBtn) browseAllBtn.removeEventListener('click', handleBrowseAll);
      delete (window as any).__pdTest;
    };
  }, []);

  return (
    <div className="projects-dashboard" id="projectsDashboard"></div>
  );
}
