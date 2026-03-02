'use client';

export default function ModelsTab() {
  return (
    <div className="tab-content" id="tab-models">
      <div className="models-header stagger-1">
        <div className="section-title">Available Models <span className="section-count" id="modelCount">11 enabled</span></div>
        <button className="add-btn" id="addModelBtn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg>
          Add Custom Model
        </button>
      </div>
      <div className="custom-model-form" id="customModelForm">
        <h3>Add Custom Model <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '18px' }}>&times;</button></h3>
        <div className="form-grid">
          <div className="form-group"><label>Model Name</label><input className="form-input" placeholder="e.g. My Fine-tuned Model" /></div>
          <div className="form-group"><label>Provider</label><input className="form-input" placeholder="e.g. OpenAI" /></div>
          <div className="form-group"><label>Endpoint URL</label><input className="form-input" placeholder="https://api.example.com/v1/chat" /></div>
          <div className="form-group"><label>API Key</label><input className="form-input" type="password" placeholder="sk-..." /></div>
        </div>
        <div className="form-actions"><button className="btn-primary">Add Model</button></div>
      </div>
      <div className="search-input-wrap stagger-2">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
        <input className="search-input" type="text" placeholder="Search models..." id="modelSearch" />
      </div>
      <div className="model-list" id="modelList"></div>

      <div className="section-divider"></div>

      {/* Subscriptions */}
      <div className="section-header stagger-1"><div className="section-title">Subscription</div></div>
      <p className="sub-section-subtitle">Start building for free. Upgrade when you need more.</p>
      <div className="sub-grid">
        {/* Free */}
        <div className="sub-card current-plan stagger-2">
          <span className="current-badge">Current Plan</span>
          <div className="sub-name">Free</div>
          <div className="sub-price-row">
            <span className="sub-price">$0</span>
            <span className="sub-period">forever</span>
          </div>
          <div className="sub-tagline">No strings.</div>
          <button className="sub-cta outline">Start for free</button>
          <ul className="sub-features grey-checks">
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> 3 builds / 30 days</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> All 8 style transforms</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Download as ZIP</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Community support</li>
          </ul>
        </div>
        {/* Pro */}
        <div className="sub-card popular stagger-3">
          <span className="popular-plan-badge">Most popular</span>
          <div className="sub-name">Pro</div>
          <div className="sub-price-row">
            <span className="sub-price">$19</span>
            <span className="sub-period">/month</span>
          </div>
          <div className="sub-tagline">For power builders.</div>
          <button className="sub-cta primary">Go Pro</button>
          <ul className="sub-features orange-checks">
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Unlimited builds</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> All AI models (GPT-4o, Claude, Gemini, Kimi)</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Priority generation queue</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Push to Vercel in 1 click</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Brand extraction mode</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Email support</li>
          </ul>
        </div>
        {/* Team */}
        <div className="sub-card stagger-4">
          <div className="sub-name">Team</div>
          <div className="sub-price-row">
            <span className="sub-price">$49</span>
            <span className="sub-period">/month</span>
          </div>
          <div className="sub-tagline">Coming soon.</div>
          <div className="sub-waitlist">
            <input type="email" placeholder="you@email.com" />
            <button>Join waitlist</button>
          </div>
          <ul className="sub-features grey-checks">
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Everything in Pro</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> 5 team members</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Shared project library</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Custom AI model config</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> SSO &amp; audit logs</li>
            <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5L13 5" /></svg> Dedicated support</li>
          </ul>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* API Keys */}
      <div className="section-header">
        <div className="section-title">API Keys</div>
        <button className="add-btn"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg> Add Key</button>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '12px' }}>Configure your own API keys to use AI models at cost. Keys are stored locally in your browser.</p>
      <div className="key-list">
        <div className="key-row stagger-2">
          <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M2 10l5.5-2M10 8V3M14.5 8L17 6" /></svg></div>
          <div className="key-info"><div className="key-provider">OpenAI</div><div className="key-mask">sk-...3kF9</div></div>
          <span className="status-badge status-active"><span className="dot"></span> active</span>
          <span className="key-time">2 hours ago</span>
          <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
        <div className="key-row stagger-3">
          <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M2 10l5.5-2M10 8V3M14.5 8L17 6" /></svg></div>
          <div className="key-info"><div className="key-provider">Anthropic</div><div className="key-mask">sk-ant-...xY2m</div></div>
          <span className="status-badge status-active"><span className="dot"></span> active</span>
          <span className="key-time">1 day ago</span>
          <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
        <div className="key-row stagger-4">
          <div className="key-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M2 10l5.5-2M10 8V3M14.5 8L17 6" /></svg></div>
          <div className="key-info"><div className="key-provider">Google AI</div><div className="key-mask">AIza...9pQr</div></div>
          <span className="status-badge status-expired"><span className="dot"></span> expired</span>
          <span className="key-time">5 days ago</span>
          <button className="key-delete"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
      </div>
    </div>
  );
}
