// @ts-nocheck
'use client';

export default function DiscoverTab() {
  return (
    <div className="tab-content active" id="tab-discover">
      <p className="page-subtitle" style={{ marginBottom: '20px' }}>Explore apps built by talented creators with Argus</p>

      {/* Featured Apps */}
      <div className="section-header"><div className="section-title">Featured apps</div></div>
      <div className="featured-grid">
        <div className="featured-hero stagger-2">
          <div className="card-gradient" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)' }}></div>
          <div className="dot-pattern"></div>
          <div className="featured-badge">Featured</div>
          <div className="like-badge"><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 2,847</div>
          <div className="card-overlay">
            <div className="card-title-white">Pulse Analytics</div>
            <div className="card-desc-white">Real-time business intelligence dashboard with AI-powered insights and predictive modeling</div>
            <div className="card-creator-white">
              <div className="avatar"></div>
              <span className="name">Sarah Chen</span>
              <button className="card-visit-btn">Visit project <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg></button>
            </div>
          </div>
        </div>
        <div className="featured-side stagger-3">
          <div className="card-gradient" style={{ background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)' }}></div>
          <div className="like-badge"><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,923</div>
          <div className="card-overlay">
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>ShopFlow</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Modern e-commerce storefront with AI recommendations</div>
          </div>
        </div>
        <div className="featured-side stagger-4">
          <div className="card-gradient" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' }}></div>
          <div className="like-badge"><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,654</div>
          <div className="card-overlay">
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>DevPortfolio</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Animated developer portfolio with GitHub integration</div>
          </div>
        </div>
      </div>

      {/* Apps for Builders */}
      <div className="section-header" style={{ marginTop: '8px' }}><div className="section-title">Apps for builders</div></div>
      <div className="scroll-row">
        <div className="scroll-card stagger-3">
          <div className="card-preview"><div className="card-gradient" style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}></div><div className="hover-overlay"><button className="view-btn">View <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg></button></div></div>
          <div className="card-info"><div className="card-name">CodeReview AI</div><div className="card-desc">Automated code review tool with AI-powered suggestions</div><div className="card-footer"><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 2,156</div><span className="card-category">SaaS</span></div></div>
        </div>
        <div className="scroll-card stagger-4">
          <div className="card-preview"><div className="card-gradient" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}></div><div className="hover-overlay"><button className="view-btn">View <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg></button></div></div>
          <div className="card-info"><div className="card-name">NoteSync</div><div className="card-desc">Collaborative note-taking app with real-time sync</div><div className="card-footer"><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,432</div><span className="card-category">Productivity</span></div></div>
        </div>
        <div className="scroll-card stagger-5">
          <div className="card-preview"><div className="card-gradient" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}></div><div className="hover-overlay"><button className="view-btn">View <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg></button></div></div>
          <div className="card-info"><div className="card-name">DesignKit Pro</div><div className="card-desc">Component library builder with Figma-to-code export</div><div className="card-footer"><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,089</div><span className="card-category">Design</span></div></div>
        </div>
        <div className="scroll-card stagger-6">
          <div className="card-preview"><div className="card-gradient" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)' }}></div><div className="hover-overlay"><button className="view-btn">View <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg></button></div></div>
          <div className="card-info"><div className="card-name">APIForge</div><div className="card-desc">Visual API builder with auto-generated documentation</div><div className="card-footer"><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 876</div><span className="card-category">Developer</span></div></div>
        </div>
        <div className="scroll-card stagger-7">
          <div className="card-preview"><div className="card-gradient" style={{ background: 'linear-gradient(135deg,#e11d48,#f43f5e)' }}></div><div className="hover-overlay"><button className="view-btn">View <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg></button></div></div>
          <div className="card-info"><div className="card-name">TestPilot</div><div className="card-desc">AI-powered test generation for React components</div><div className="card-footer"><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 743</div><span className="card-category">Testing</span></div></div>
        </div>
      </div>

      {/* Loved by Community */}
      <div className="section-header" style={{ marginTop: '32px' }}><div className="section-title">Loved by the community</div></div>
      <div className="community-grid">
        <div className="community-card stagger-5"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white', fontSize: '14px', fontWeight: 700 }}>PA</div><div className="app-info"><div className="app-name">Pulse Analytics</div><div className="app-desc">Real-time business intelligence dashboard</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 2,847</div></div>
        <div className="community-card stagger-6"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontSize: '14px', fontWeight: 700 }}>CR</div><div className="app-info"><div className="app-name">CodeReview AI</div><div className="app-desc">Automated code review with AI suggestions</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 2,156</div></div>
        <div className="community-card stagger-7"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#059669,#34d399)', color: 'white', fontSize: '14px', fontWeight: 700 }}>SF</div><div className="app-info"><div className="app-name">ShopFlow</div><div className="app-desc">E-commerce with AI product recommendations</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,923</div></div>
        <div className="community-card stagger-8"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#60a5fa)', color: 'white', fontSize: '14px', fontWeight: 700 }}>DP</div><div className="app-info"><div className="app-name">DevPortfolio</div><div className="app-desc">Animated portfolio with GitHub integration</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,654</div></div>
        <div className="community-card stagger-9"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: 'white', fontSize: '14px', fontWeight: 700 }}>NS</div><div className="app-info"><div className="app-name">NoteSync</div><div className="app-desc">Collaborative notes with real-time sync</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,432</div></div>
        <div className="community-card stagger-10"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: 'white', fontSize: '14px', fontWeight: 700 }}>DK</div><div className="app-info"><div className="app-name">DesignKit Pro</div><div className="app-desc">Component library builder</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 1,089</div></div>
        <div className="community-card stagger-11"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)', color: 'white', fontSize: '14px', fontWeight: 700 }}>FT</div><div className="app-info"><div className="app-name">FitTrack Pro</div><div className="app-desc">AI fitness coach and nutrition plans</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 987</div></div>
        <div className="community-card stagger-12"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)', color: 'white', fontSize: '14px', fontWeight: 700 }}>AF</div><div className="app-info"><div className="app-name">APIForge</div><div className="app-desc">Visual API builder with auto docs</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 876</div></div>
        <div className="community-card stagger-12"><div className="app-icon" style={{ background: 'linear-gradient(135deg,#e11d48,#f97316)', color: 'white', fontSize: '14px', fontWeight: 700 }}>TP</div><div className="app-info"><div className="app-name">TestPilot</div><div className="app-desc">AI test generation for React</div></div><div className="like-badge" style={{ background: 'var(--bg-200)' }}><svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg> 743</div></div>
      </div>
    </div>
  );
}
