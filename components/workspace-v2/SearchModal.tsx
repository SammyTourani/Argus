// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchProjects, fetchCurrentUser, formatRelativeTime, generateGradient } from './workspace-api';
import { getActiveWorkspace, onWorkspaceChange } from './workspace-active';

export default function SearchModal() {
  // ===== initSearchModal =====
  useEffect(() => {
    var SEARCH_PROJECTS = [];

    var backdrop = document.getElementById('searchBackdrop');
    var modal = document.getElementById('searchModal');
    var searchNav = document.getElementById('searchNavItem');
    if (!backdrop || !modal) return;

    var smState = { isOpen: false, query: '', activeFilter: 'all', selectedIndex: 0, isEmpty: false };
    var openTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function openSearch() {
      smState.isOpen = true;
      smState.query = '';
      smState.activeFilter = 'all';
      smState.selectedIndex = 0;
      renderPanel();
      backdrop!.classList.add('active');
      document.body.style.overflow = 'hidden';
      openTimeoutId = setTimeout(function() {
        var input = modal!.querySelector('.search-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 50);
    }

    function closeSearch() {
      smState.isOpen = false;
      backdrop!.classList.remove('active');
      document.body.style.overflow = '';
    }

    function filterResults() {
      var q = smState.query.toLowerCase().trim();
      var items = SEARCH_PROJECTS;
      if (smState.activeFilter !== 'all') {
        items = items.filter(function(p) { return p.type === smState.activeFilter; });
      }
      if (q) {
        items = items.filter(function(p) { return p.name.toLowerCase().indexOf(q) !== -1; });
      }
      return items;
    }

    function highlightMatch(name: string, query: string) {
      if (!query) return name;
      var q = query.toLowerCase();
      var idx = name.toLowerCase().indexOf(q);
      if (idx === -1) return name;
      return name.substring(0, idx) + '<mark>' + name.substring(idx, idx + query.length) + '</mark>' + name.substring(idx + query.length);
    }

    function renderPanel() {
      var results = filterResults();
      var html = '';

      // Search input row
      html += '<div class="search-input-row">';
      html += '<svg class="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fg-300)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
      html += '<input type="text" class="search-input" placeholder="Search projects and folders..." value="' + smState.query.replace(/"/g, '&quot;') + '" />';
      html += '<div class="search-kbd-group"><kbd class="search-kbd">' + (navigator.platform.indexOf('Mac') > -1 ? '\u2318' : 'Ctrl') + '</kbd><kbd class="search-kbd">K</kbd></div>';
      html += '</div>';

      // Filter chips
      html += '<div class="search-filters">';
      var filters = [
        { key: 'all', label: 'All' },
        { key: 'project', label: 'Projects' },
        { key: 'folder', label: 'Folders' },
        { key: 'template', label: 'Templates' }
      ];
      filters.forEach(function(f) {
        var active = smState.activeFilter === f.key ? ' active' : '';
        html += '<button class="search-filter-chip' + active + '" data-filter="' + f.key + '">' + f.label + '</button>';
      });
      html += '</div>';

      // Results area
      html += '<div class="search-results">';

      if (smState.isEmpty && !smState.query) {
        html += '<div class="search-empty-state">';
        html += '<div class="search-empty-graphic">';
        html += '<div class="search-empty-folder">';
        html += '<div class="search-empty-folder-tab"></div>';
        html += '<div class="search-empty-folder-plus">+</div>';
        html += '</div>';
        html += '<span class="search-empty-char c1">\u2593</span>';
        html += '<span class="search-empty-char c2">\u2591</span>';
        html += '<span class="search-empty-char c3">\u2588</span>';
        html += '<span class="search-empty-char c4">\u2592</span>';
        html += '<span class="search-empty-char c5">\u25C6</span>';
        html += '<span class="search-empty-char c6">\u25B8</span>';
        html += '</div>';
        html += '<h3 class="search-empty-title">No projects yet</h3>';
        html += '<p class="search-empty-sub">Create your first project to see it here</p>';
        html += '<button class="search-empty-cta" data-action="start-building">Start Building</button>';
        html += '</div>';
      } else if (results.length === 0 && smState.query) {
        html += '<div class="search-no-results">';
        html += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
        html += '<p class="search-no-results-title">No results for \u201c' + smState.query.replace(/</g, '&lt;') + '\u201d</p>';
        html += '<p class="search-no-results-sub">Try a different search term</p>';
        html += '</div>';
      } else {
        var label = smState.query ? results.length + ' result' + (results.length !== 1 ? 's' : '') : 'RECENT PROJECTS';
        html += '<div class="search-results-label">' + label + '</div>';
        results.forEach(function(p, i) {
          var selected = i === smState.selectedIndex ? ' selected' : '';
          var typeIcon = p.type === 'folder'
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
            : '';
          html += '<div class="search-result-item' + selected + '" data-project-id="' + p.id + '" data-project-name="' + p.name + '">';
          html += '<div class="search-result-thumb" style="background: ' + p.gradient + '"></div>';
          html += '<div class="search-result-info">';
          html += '<div class="search-result-name">' + typeIcon + highlightMatch(p.name, smState.query) + '</div>';
          html += '<div class="search-result-meta"><span class="search-result-owner-dot">' + p.owner.charAt(0).toUpperCase() + '</span><span class="search-result-owner">' + p.owner + '</span></div>';
          html += '</div>';
          html += '<div class="search-result-time">' + p.time + '</div>';
          html += '</div>';
        });
      }

      html += '</div>';

      // Footer
      html += '<div class="search-footer">';
      html += '<span class="search-footer-hint"><kbd>\u2191</kbd><kbd>\u2193</kbd> Navigate</span>';
      html += '<span class="search-footer-dot">\u00B7</span>';
      html += '<span class="search-footer-hint"><kbd>\u21B5</kbd> Open</span>';
      html += '<span class="search-footer-dot">\u00B7</span>';
      html += '<span class="search-footer-hint"><kbd>Esc</kbd> Close</span>';
      html += '</div>';

      modal!.innerHTML = html;

      // Attach input listener
      var input = modal!.querySelector('.search-input') as HTMLInputElement | null;
      if (input) {
        input.addEventListener('input', function(e) {
          smState.query = (e.target as HTMLInputElement).value;
          smState.selectedIndex = 0;
          renderPanel();
          var newInput = modal!.querySelector('.search-input') as HTMLInputElement | null;
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
          }
        });
      }
    }

    function selectResult() {
      var results = filterResults();
      if (results.length > 0 && smState.selectedIndex < results.length) {
        var project = results[smState.selectedIndex];
        closeSearch();
        window.location.href = '/workspace/' + project.id;
      }
    }

    // Event delegation on modal
    function handleModalClick(e: Event) {
      var chip = (e.target as HTMLElement).closest('.search-filter-chip');
      if (chip) {
        smState.activeFilter = chip.getAttribute('data-filter') || 'all';
        smState.selectedIndex = 0;
        renderPanel();
        var input = modal!.querySelector('.search-input') as HTMLInputElement | null;
        if (input) input.focus();
        return;
      }

      var item = (e.target as HTMLElement).closest('.search-result-item');
      if (item) {
        var projectId = item.getAttribute('data-project-id');
        closeSearch();
        if (projectId) window.location.href = '/workspace/' + projectId;
        return;
      }

      var cta = (e.target as HTMLElement).closest('.search-empty-cta');
      if (cta) {
        closeSearch();
        var chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
        if (chatInput) chatInput.focus();
        return;
      }
    }
    modal.addEventListener('click', handleModalClick);

    // Backdrop click to close
    function handleBackdropClick(e: Event) {
      if (e.target === backdrop) closeSearch();
    }
    backdrop.addEventListener('click', handleBackdropClick);

    // Search nav item click
    function handleSearchNavClick(e: Event) {
      e.preventDefault();
      openSearch();
    }
    if (searchNav) searchNav.addEventListener('click', handleSearchNavClick);

    // Load real projects from API (scoped to active workspace)
    var cancelled = false;
    var searchUser = null;
    function loadSearchProjects(teamId) {
      Promise.all([fetchCurrentUser(), fetchProjects(teamId)]).then(function(results) {
        if (cancelled) return;
        searchUser = results[0];
        var apiProjects = results[1] || [];
        SEARCH_PROJECTS = apiProjects.map(function(p) {
          var ownerEmail = (searchUser && p.created_by === searchUser.id) ? searchUser.email : (searchUser?.email || '');
          return {
            id: p.id,
            name: p.name,
            type: 'project',
            owner: ownerEmail,
            time: formatRelativeTime(p.updated_at),
            gradient: generateGradient(p.id),
          };
        });
        smState.isEmpty = SEARCH_PROJECTS.length === 0;
        if (smState.isOpen) renderPanel();
      }).catch(function() {});
    }
    loadSearchProjects(getActiveWorkspace().id);

    // Re-populate when workspace switches
    var removeWsListener = onWorkspaceChange(function(ws) {
      if (cancelled) return;
      loadSearchProjects(ws.id);
    });

    // Auto-open search if navigated from another page with ?action=search
    var searchParams = new URLSearchParams(window.location.search);
    var autoOpenTimeoutId: ReturnType<typeof setTimeout> | null = null;
    if (searchParams.get('action') === 'search') {
      autoOpenTimeoutId = setTimeout(function() { openSearch(); }, 150);
    }

    // Keyboard shortcuts
    function handleKeydown(e: KeyboardEvent) {
      // Cmd+K / Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (smState.isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
        return;
      }

      if (!smState.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
        return;
      }

      var results = filterResults();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        smState.selectedIndex = Math.min(smState.selectedIndex + 1, results.length - 1);
        updateSelection();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        smState.selectedIndex = Math.max(smState.selectedIndex - 1, 0);
        updateSelection();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectResult();
        return;
      }
    }
    document.addEventListener('keydown', handleKeydown as EventListener);

    function updateSelection() {
      var items = modal!.querySelectorAll('.search-result-item');
      items.forEach(function(item, i) {
        if (i === smState.selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    return () => {
      cancelled = true;
      removeWsListener();
      modal!.removeEventListener('click', handleModalClick);
      backdrop!.removeEventListener('click', handleBackdropClick);
      if (searchNav) searchNav.removeEventListener('click', handleSearchNavClick);
      document.removeEventListener('keydown', handleKeydown as EventListener);
      if (openTimeoutId) clearTimeout(openTimeoutId);
      if (autoOpenTimeoutId) clearTimeout(autoOpenTimeoutId);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="search-modal-backdrop" id="searchBackdrop">
      <div className="search-modal" id="searchModal"></div>
    </div>
  );
}
