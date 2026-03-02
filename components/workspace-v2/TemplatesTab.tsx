'use client';

export default function TemplatesTab() {
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
