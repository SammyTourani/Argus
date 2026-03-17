// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { escapeHtml } from './workspace-api';
import { CLONE_CATEGORY_LABELS } from '@/lib/clone-templates';

export default function TemplatesTab() {

  useEffect(() => {
    var grid = document.getElementById('templateGrid');
    var catChips = document.getElementById('templateFilters');
    var styleChips = document.getElementById('templateStyleFilters');
    var searchInput = document.getElementById('templateSearch') as HTMLInputElement;
    var activeCategory = 'All';
    var activeStyle = 'All';
    var templates = [];
    var cancelled = false;

    function renderTemplates() {
      if (!grid) return;
      var q = searchInput ? searchInput.value.toLowerCase() : '';
      var filtered = templates.filter(function(t) {
        var matchCat = activeCategory === 'All' || t.category === activeCategory;
        var matchStyle = activeStyle === 'All' || t.browseStyle === activeStyle.toLowerCase();
        var matchSearch = !q || t.name.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1 || (t.tags || []).some(function(tag) { return tag.toLowerCase().indexOf(q) !== -1; });
        return matchCat && matchStyle && matchSearch;
      });

      if (filtered.length === 0 && templates.length === 0) {
        grid.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">Loading templates...</div></div></div>';
        return;
      }

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">No matching templates</div><div class="app-desc">Try adjusting your filters or search</div></div></div>';
        return;
      }

      grid.innerHTML = filtered.map(function(t, i) {
        var diffClass = 'diff-' + (t.diff || 'beginner');
        var catLabel = t.category.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

        // Screenshot or gradient preview
        var previewHtml;
        if (t.thumbnail) {
          previewHtml = '<img src="' + t.thumbnail + '" alt="' + escapeHtml(t.name) + '" class="card-screenshot" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'" />' +
            '<div class="card-gradient" style="background:' + t.gradient + ';display:none"></div>';
        } else {
          previewHtml = '<div class="card-gradient" style="background:' + t.gradient + ';"></div>';
        }

        return '<div class="template-card stagger-' + Math.min(i + 1, 12) + '" data-template-id="' + t.id + '">' +
          '<div class="tpl-preview">' + previewHtml +
          (t.isNew ? '<div class="new-badge"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.3l-3.7 2 .7-4.1-3-2.9 4.2-.7z"/></svg> NEW</div>' : '') +
          '<div class="hover-overlay"><button class="view-btn">Clone Site <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12L12 4M12 4H6M12 4v6"/></svg></button></div></div>' +
          '<div class="tpl-info"><div class="tpl-top"><div class="tpl-name">' + escapeHtml(t.name) + '</div>' +
          '<span class="diff-badge ' + diffClass + '"><span class="dot"></span> ' + escapeHtml(t.diff || 'beginner') + '</span></div>' +
          '<div class="tpl-desc">' + escapeHtml(t.desc) + '</div>' +
          '<div class="tech-pills">' + (t.tech || []).map(function(p) { return '<span class="tech-pill">' + escapeHtml(p) + '</span>'; }).join('') + '</div>' +
          '<div class="tpl-footer"><span class="tpl-uses">' + escapeHtml(catLabel) + '</span><span class="tpl-category">' + escapeHtml(t.browseStyle || '') + '</span></div></div></div>';
      }).join('');
    }

    // Show loading skeleton
    if (grid) grid.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">Loading templates...</div></div></div>';

    // Fetch curated templates
    fetch('/api/templates/curated').then(function(res) { return res.json(); }).then(function(data) {
      if (cancelled) return;
      templates = data.templates || [];
      renderTemplates();
    }).catch(function() {
      if (cancelled) return;
      templates = [];
      renderTemplates();
    });

    // Category filter chips
    var catClickHandler = function(e) {
      var chip = (e.target as HTMLElement).closest('.filter-chip');
      if (!chip) return;
      if (catChips) catChips.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeCategory = (chip as HTMLElement).dataset.category;
      renderTemplates();
    };
    if (catChips) catChips.addEventListener('click', catClickHandler);

    // Style filter chips
    var styleClickHandler = function(e) {
      var chip = (e.target as HTMLElement).closest('.filter-chip');
      if (!chip) return;
      if (styleChips) styleChips.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeStyle = (chip as HTMLElement).dataset.style;
      renderTemplates();
    };
    if (styleChips) styleChips.addEventListener('click', styleClickHandler);

    // Search input
    var inputHandler = function() { renderTemplates(); };
    if (searchInput) searchInput.addEventListener('input', inputHandler);

    // Click handler for "Clone Site" button → open preview modal
    var gridClickHandler = function(e) {
      var viewBtn = (e.target as HTMLElement).closest('.view-btn');
      if (!viewBtn) return;
      var card = viewBtn.closest('.template-card');
      if (!card) return;
      var templateId = card.getAttribute('data-template-id');
      var template = templates.find(function(t) { return t.id === templateId; });
      if (template && window.__templatePreviewModal) {
        window.__templatePreviewModal.open(template);
      }
    };
    if (grid) grid.addEventListener('click', gridClickHandler);

    return () => {
      cancelled = true;
      if (catChips) catChips.removeEventListener('click', catClickHandler);
      if (styleChips) styleChips.removeEventListener('click', styleClickHandler);
      if (searchInput) searchInput.removeEventListener('input', inputHandler);
      if (grid) grid.removeEventListener('click', gridClickHandler);
    };
  }, []);

  return (
    <div className="tab-content" id="tab-templates">
      <div className="search-input-wrap stagger-1">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
        <input className="search-input" type="text" placeholder="Search templates..." id="templateSearch" />
      </div>
      <div className="filter-chips stagger-2" id="templateFilters">
        <button className="filter-chip active" data-category="All">All</button>
        <button className="filter-chip" data-category="landing-pages">Landing Pages</button>
        <button className="filter-chip" data-category="portfolios">Portfolios</button>
        <button className="filter-chip" data-category="e-commerce">E-commerce</button>
        <button className="filter-chip" data-category="dashboards">Dashboards</button>
        <button className="filter-chip" data-category="blogs-content">Blogs</button>
        <button className="filter-chip" data-category="saas-apps">SaaS Apps</button>
        <button className="filter-chip" data-category="animations-effects">Animations</button>
      </div>
      <div className="style-filter-row stagger-2" id="templateStyleFilters">
        <button className="filter-chip active" data-style="All">All Styles</button>
        <button className="filter-chip" data-style="minimal">Minimal</button>
        <button className="filter-chip" data-style="bold">Bold</button>
        <button className="filter-chip" data-style="dark">Dark</button>
        <button className="filter-chip" data-style="colorful">Colorful</button>
        <button className="filter-chip" data-style="animated">Animated</button>
      </div>
      <div className="template-grid" id="templateGrid"></div>
    </div>
  );
}
