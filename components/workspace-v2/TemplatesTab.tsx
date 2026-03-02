// @ts-nocheck
'use client';

import { useEffect } from 'react';

const TEMPLATES = [
  { id:'t1', name:'SaaS Starter Kit', desc:'Full SaaS boilerplate with auth, billing, and dashboard', category:'SaaS', gradient:'linear-gradient(135deg,#ff4801,#ef4444)', tech:['Next.js','Tailwind','Stripe','Supabase'], diff:'intermediate', uses:4523, isNew:true },
  { id:'t2', name:'Portfolio Starter', desc:'Minimal animated portfolio with project showcase', category:'Portfolio', gradient:'linear-gradient(135deg,#7c3aed,#a78bfa)', tech:['React','Framer Motion','Tailwind'], diff:'beginner', uses:3891, isNew:false },
  { id:'t3', name:'E-commerce Pro', desc:'Full-stack store with cart, checkout, and inventory', category:'E-commerce', gradient:'linear-gradient(135deg,#059669,#34d399)', tech:['Next.js','Stripe','Prisma','PostgreSQL'], diff:'advanced', uses:2847, isNew:false },
  { id:'t4', name:'AI Chat Interface', desc:'Full-stack conversational AI with streaming responses', category:'AI/ML', gradient:'linear-gradient(135deg,#0ea5e9,#6366f1)', tech:['React','OpenAI','Tailwind','WebSocket'], diff:'intermediate', uses:2654, isNew:true },
  { id:'t5', name:'Blog Platform', desc:'Modern blog with MDX, syntax highlighting, and RSS', category:'Blog', gradient:'linear-gradient(135deg,#f59e0b,#ef4444)', tech:['Next.js','MDX','Tailwind'], diff:'beginner', uses:2341, isNew:false },
  { id:'t6', name:'Dashboard Pro', desc:'Analytics dashboard with charts, tables, and real-time data', category:'Dashboard', gradient:'linear-gradient(135deg,#8b5cf6,#ec4899)', tech:['React','Recharts','Tailwind','WebSocket'], diff:'advanced', uses:2198, isNew:false },
  { id:'t7', name:'Landing Page Kit', desc:'Conversion-optimized landing page with A/B testing', category:'Landing Pages', gradient:'linear-gradient(135deg,#10b981,#0ea5e9)', tech:['Next.js','Tailwind','Framer Motion'], diff:'beginner', uses:3102, isNew:false },
  { id:'t8', name:'Mobile App Shell', desc:'React Native starter with navigation and auth', category:'Mobile', gradient:'linear-gradient(135deg,#e11d48,#f43f5e)', tech:['React Native','Expo','NativeWind'], diff:'intermediate', uses:1876, isNew:true },
  { id:'t9', name:'API Starter', desc:'REST API boilerplate with auth, rate limiting, and docs', category:'SaaS', gradient:'linear-gradient(135deg,#1e40af,#3b82f6)', tech:['Node.js','Express','Swagger','JWT'], diff:'intermediate', uses:1654, isNew:false },
  { id:'t10', name:'ML Pipeline', desc:'End-to-end ML pipeline with model training and deployment', category:'AI/ML', gradient:'linear-gradient(135deg,#7c3aed,#2563eb)', tech:['Python','FastAPI','TensorFlow','Docker'], diff:'advanced', uses:1432, isNew:false },
  { id:'t11', name:'Admin Panel', desc:'Full-featured admin panel with RBAC and audit logs', category:'Dashboard', gradient:'linear-gradient(135deg,#475569,#1e293b)', tech:['React','Tailwind','Prisma','PostgreSQL'], diff:'advanced', uses:1987, isNew:false },
  { id:'t12', name:'Newsletter App', desc:'Newsletter platform with subscriber management', category:'SaaS', gradient:'linear-gradient(135deg,#ea580c,#f59e0b)', tech:['Next.js','Resend','Tailwind'], diff:'beginner', uses:1123, isNew:false },
];

export default function TemplatesTab() {

  useEffect(() => {
    var grid = document.getElementById('templateGrid');
    var chips = document.getElementById('templateFilters');
    var searchInput = document.getElementById('templateSearch') as HTMLInputElement;
    var activeCategory = 'All';

    function renderTemplates() {
      var q = searchInput.value.toLowerCase();
      var filtered = TEMPLATES.filter(function(t) {
        var matchCat = activeCategory === 'All' || t.category === activeCategory;
        var matchSearch = !q || t.name.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1;
        return matchCat && matchSearch;
      });

      grid.innerHTML = filtered.map(function(t, i) {
        var diffClass = 'diff-' + t.diff;
        return '<div class="template-card stagger-' + Math.min(i + 1, 12) + '">' +
          '<div class="tpl-preview"><div class="card-gradient" style="background:' + t.gradient + ';"></div>' +
          (t.isNew ? '<div class="new-badge"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.3l-3.7 2 .7-4.1-3-2.9 4.2-.7z"/></svg> NEW</div>' : '') +
          '<div class="hover-overlay"><button class="view-btn">Use Template <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12L12 4M12 4H6M12 4v6"/></svg></button></div></div>' +
          '<div class="tpl-info"><div class="tpl-top"><div class="tpl-name">' + t.name + '</div>' +
          '<span class="diff-badge ' + diffClass + '"><span class="dot"></span> ' + t.diff + '</span></div>' +
          '<div class="tpl-desc">' + t.desc + '</div>' +
          '<div class="tech-pills">' + t.tech.map(function(p) { return '<span class="tech-pill">' + p + '</span>'; }).join('') + '</div>' +
          '<div class="tpl-footer"><span class="tpl-uses">' + t.uses.toLocaleString() + ' uses</span><span class="tpl-category">' + t.category + '</span></div></div></div>';
      }).join('');
    }

    var chipsClickHandler = function(e) {
      var chip = (e.target as HTMLElement).closest('.filter-chip');
      if (!chip) return;
      chips.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeCategory = (chip as HTMLElement).dataset.category;
      renderTemplates();
    };
    chips.addEventListener('click', chipsClickHandler);

    var inputHandler = function() { renderTemplates(); };
    searchInput.addEventListener('input', inputHandler);

    renderTemplates();

    return () => {
      chips.removeEventListener('click', chipsClickHandler);
      searchInput.removeEventListener('input', inputHandler);
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
        <button className="filter-chip" data-category="Landing Pages">Landing Pages</button>
        <button className="filter-chip" data-category="SaaS">SaaS</button>
        <button className="filter-chip" data-category="E-commerce">E-commerce</button>
        <button className="filter-chip" data-category="Dashboard">Dashboard</button>
        <button className="filter-chip" data-category="Portfolio">Portfolio</button>
        <button className="filter-chip" data-category="Blog">Blog</button>
        <button className="filter-chip" data-category="Mobile">Mobile</button>
        <button className="filter-chip" data-category="AI/ML">AI/ML</button>
      </div>
      <div className="template-grid" id="templateGrid"></div>
    </div>
  );
}
