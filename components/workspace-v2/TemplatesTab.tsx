// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchTemplates, generateGradient, escapeHtml } from './workspace-api';

// Built-in templates used when the marketplace API returns empty
var FALLBACK_TEMPLATES = [
  { id: 'saas-landing', name: 'SaaS Landing Page', desc: 'Hero, features, pricing, testimonials, CTA', category: 'Marketing', gradient: 'linear-gradient(135deg, #f97316, #dc2626)', tech: ['React', 'Tailwind'], diff: 'beginner', uses: 2480, isNew: false },
  { id: 'dashboard', name: 'Analytics Dashboard', desc: 'Stats, charts, data tables, sidebar nav', category: 'Application', gradient: 'linear-gradient(135deg, #3b82f6, #7c3aed)', tech: ['React', 'Charts'], diff: 'intermediate', uses: 1820, isNew: false },
  { id: 'ecommerce', name: 'E-Commerce Store', desc: 'Product grid, cart, checkout flow', category: 'E-commerce', gradient: 'linear-gradient(135deg, #34d399, #0d9488)', tech: ['React', 'Commerce'], diff: 'intermediate', uses: 1540, isNew: false },
  { id: 'portfolio', name: 'Developer Portfolio', desc: 'About, projects, skills, contact form', category: 'Personal', gradient: 'linear-gradient(135deg, #8b5cf6, #7e22ce)', tech: ['React', 'Tailwind'], diff: 'beginner', uses: 1920, isNew: false },
  { id: 'blog', name: 'Blog Platform', desc: 'Post list, article view, categories', category: 'Content', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', tech: ['React', 'MDX'], diff: 'beginner', uses: 1260, isNew: false },
  { id: 'kanban', name: 'Task Manager', desc: 'Kanban board, drag-and-drop columns', category: 'Application', gradient: 'linear-gradient(135deg, #38bdf8, #2563eb)', tech: ['React', 'DnD'], diff: 'intermediate', uses: 980, isNew: false },
  { id: 'chat-ui', name: 'AI Chat Interface', desc: 'Chat bubbles, streaming responses, sidebar', category: 'Application', gradient: 'linear-gradient(135deg, #ec4899, #e11d48)', tech: ['React', 'AI'], diff: 'intermediate', uses: 1640, isNew: true },
  { id: 'auth-screens', name: 'Auth Screens', desc: 'Sign in, sign up, forgot password', category: 'Developer', gradient: 'linear-gradient(135deg, #52525b, #18181b)', tech: ['React', 'Auth'], diff: 'beginner', uses: 1100, isNew: false },
  { id: 'waitlist', name: 'Waitlist Page', desc: 'Email capture, social proof, countdown', category: 'Marketing', gradient: 'linear-gradient(135deg, #facc15, #f97316)', tech: ['React', 'Tailwind'], diff: 'beginner', uses: 870, isNew: false },
  { id: 'pricing', name: 'Pricing Page', desc: 'Comparison table, toggle monthly/yearly', category: 'Marketing', gradient: 'linear-gradient(135deg, #818cf8, #2563eb)', tech: ['React', 'Tailwind'], diff: 'beginner', uses: 760, isNew: false },
  { id: 'restaurant', name: 'Restaurant Website', desc: 'Menu, reservations, gallery, reviews', category: 'Food & Drink', gradient: 'linear-gradient(135deg, #ef4444, #991b1b)', tech: ['React', 'Tailwind'], diff: 'beginner', uses: 640, isNew: true },
  { id: 'fitness', name: 'Fitness Tracker', desc: 'Workout log, progress charts, goals', category: 'Health', gradient: 'linear-gradient(135deg, #22c55e, #15803d)', tech: ['React', 'Charts'], diff: 'intermediate', uses: 520, isNew: true },
];

export default function TemplatesTab() {

  useEffect(() => {
    var grid = document.getElementById('templateGrid');
    var chips = document.getElementById('templateFilters');
    var searchInput = document.getElementById('templateSearch') as HTMLInputElement;
    var activeCategory = 'All';
    var templates = [];
    var cancelled = false;

    function renderTemplates() {
      if (!grid) return;
      var q = searchInput ? searchInput.value.toLowerCase() : '';
      var filtered = templates.filter(function(t) {
        var matchCat = activeCategory === 'All' || t.category === activeCategory;
        var matchSearch = !q || t.name.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1;
        return matchCat && matchSearch;
      });

      if (filtered.length === 0 && templates.length === 0) {
        grid.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">No templates yet</div><div class="app-desc">Templates will appear here once published</div></div></div>';
        return;
      }

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">No matching templates</div></div></div>';
        return;
      }

      grid.innerHTML = filtered.map(function(t, i) {
        var diffClass = 'diff-' + (t.diff || 'beginner');
        return '<div class="template-card stagger-' + Math.min(i + 1, 12) + '">' +
          '<div class="tpl-preview"><div class="card-gradient" style="background:' + t.gradient + ';"></div>' +
          (t.isNew ? '<div class="new-badge"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.3l-3.7 2 .7-4.1-3-2.9 4.2-.7z"/></svg> NEW</div>' : '') +
          '<div class="hover-overlay"><button class="view-btn">Use Template <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12L12 4M12 4H6M12 4v6"/></svg></button></div></div>' +
          '<div class="tpl-info"><div class="tpl-top"><div class="tpl-name">' + escapeHtml(t.name) + '</div>' +
          '<span class="diff-badge ' + diffClass + '"><span class="dot"></span> ' + escapeHtml(t.diff || 'beginner') + '</span></div>' +
          '<div class="tpl-desc">' + escapeHtml(t.desc) + '</div>' +
          '<div class="tech-pills">' + (t.tech || []).map(function(p) { return '<span class="tech-pill">' + escapeHtml(p) + '</span>'; }).join('') + '</div>' +
          '<div class="tpl-footer"><span class="tpl-uses">' + (t.uses || 0).toLocaleString() + ' uses</span><span class="tpl-category">' + escapeHtml(t.category) + '</span></div></div></div>';
      }).join('');
    }

    // Show loading skeleton
    if (grid) grid.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">Loading templates...</div></div></div>';

    // Fetch templates from API, fall back to built-in templates
    fetchTemplates().then(function(listings) {
      if (cancelled) return;
      if (listings && listings.length > 0) {
        templates = listings.map(function(l) {
          return {
            id: l.id,
            name: l.title,
            desc: l.description || '',
            category: l.category || 'General',
            gradient: l.gradient || generateGradient(l.id),
            tech: l.tags || [],
            diff: 'beginner',
            uses: l.use_count || 0,
            isNew: false,
          };
        });
      } else {
        // Use built-in fallback templates when marketplace is empty
        templates = FALLBACK_TEMPLATES;
      }
      renderTemplates();
    }).catch(function() {
      if (cancelled) return;
      // Use built-in fallback templates on error
      templates = FALLBACK_TEMPLATES;
      renderTemplates();
    });

    var chipsClickHandler = function(e) {
      var chip = (e.target as HTMLElement).closest('.filter-chip');
      if (!chip) return;
      if (chips) chips.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeCategory = (chip as HTMLElement).dataset.category;
      renderTemplates();
    };
    if (chips) chips.addEventListener('click', chipsClickHandler);

    var inputHandler = function() { renderTemplates(); };
    if (searchInput) searchInput.addEventListener('input', inputHandler);

    return () => {
      cancelled = true;
      if (chips) chips.removeEventListener('click', chipsClickHandler);
      if (searchInput) searchInput.removeEventListener('input', inputHandler);
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
        <button className="filter-chip" data-category="Marketing">Marketing</button>
        <button className="filter-chip" data-category="Personal">Personal</button>
        <button className="filter-chip" data-category="E-commerce">E-commerce</button>
        <button className="filter-chip" data-category="Content">Content</button>
        <button className="filter-chip" data-category="Application">Application</button>
        <button className="filter-chip" data-category="Developer">Developer</button>
        <button className="filter-chip" data-category="Food & Drink">Food & Drink</button>
        <button className="filter-chip" data-category="Health">Health</button>
      </div>
      <div className="template-grid" id="templateGrid"></div>
    </div>
  );
}
