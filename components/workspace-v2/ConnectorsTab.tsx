'use client';

export default function ConnectorsTab() {
  return (
    <div className="tab-content" id="tab-connectors">
      <div className="sub-tab-bar stagger-1" id="connSubTabBar">
        <div className="sub-tab-indicator" id="connSubIndicator"></div>
        <button className="sub-tab-btn active" data-subtab="apps">Apps</button>
        <button className="sub-tab-btn" data-subtab="custom-api">Custom API</button>
        <button className="sub-tab-btn" data-subtab="custom-mcp">Custom MCP</button>
      </div>

      {/* Apps sub-tab */}
      <div className="sub-tab-content active" id="subtab-apps">
        <div className="search-input-wrap stagger-2">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
          <input className="search-input" type="text" placeholder="Search apps..." id="connectorSearch" />
        </div>
        <div className="section-header stagger-2"><div className="section-title">Recommended</div></div>
        <div className="connector-grid" id="recommendedGrid" style={{ marginBottom: '24px' }}></div>
        <div className="section-header stagger-3"><div className="section-title">Apps</div></div>
        <div className="connector-grid" id="appsGrid"></div>
      </div>

      {/* Custom API sub-tab */}
      <div className="sub-tab-content" id="subtab-custom-api">
        <div className="section-header stagger-1">
          <div className="section-title">Custom APIs</div>
          <button className="add-btn"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg> Add API</button>
        </div>
        <div className="key-list">
          <div className="key-row stagger-2">
            <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h12M4 10h12M4 14h8" /></svg></div>
            <div className="key-info"><div className="key-provider">Internal Auth Service</div><div className="key-mask">https://auth.mycompany.com/v2</div></div>
            <span className="status-badge status-active"><span className="dot"></span> active</span>
            <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>Bearer</span>
            <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
          </div>
        </div>
      </div>

      {/* Custom MCP sub-tab */}
      <div className="sub-tab-content" id="subtab-custom-mcp">
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3v4a2 2 0 01-2 2H3M17 3v4a2 2 0 002 2h2M7 21v-4a2 2 0 00-2-2H3M17 21v-4a2 2 0 012-2h2" /></svg>
          </div>
          <h3>No custom MCP added yet.</h3>
          <p>Connect Model Context Protocol servers to extend your AI capabilities.</p>
          <button className="add-btn" style={{ marginTop: '16px' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg>
            Add custom MCP
          </button>
        </div>
      </div>
    </div>
  );
}
