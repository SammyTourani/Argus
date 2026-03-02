'use client';

import HeroBackground from './HeroBackground';
import ChatBox from './ChatBox';
import FireCrawlCarousel from './FireCrawlCarousel';
import ProjectsDashboard from './ProjectsDashboard';

// JS IIFEs that correspond to this component:
// - Template switcher click (cycles through 3 hero templates)
// - Tab switching (recently viewed, my projects, templates)
// - Browse all button
// - Matrix bar canvas animation (#matrix-canvas)
// - Center content compact mode toggle
// - Bottom section visibility

export default function HomePage() {
  return (
    <main className="main" id="mainArea">
      <HeroBackground />

      {/* Template Switcher */}
      <button className="template-switcher" id="templateSwitcher" title="Switch background" data-label="Argus Vision">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path d="M4 4h5v5H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M11 4h5v5h-5V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M4 11h5v5H4v-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M11 11h5v5h-5v-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="center-content" id="centerContent">
        <h1 className="hero-heading">Ready to build, <span className="accent">Sammy</span>?</h1>

        <ChatBox />
      </div>

      {/* Search results carousel */}
      <FireCrawlCarousel />

      {/* Bottom templates */}
      <div className="bottom-section">
        <div className="bottom-header">
          <div className="bottom-tabs">
            <button className="tab-btn" data-tab="recent">Recently viewed</button>
            <button className="tab-btn" data-tab="projects">My projects</button>
            <button className="tab-btn active" data-tab="templates">Templates</button>
          </div>
          <a className="browse-all" href="#" id="browseAllBtn">
            Browse all
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </a>
        </div>

        <div className="bottom-content">
          {/* Recently viewed panel */}
          <div className="tab-panel" data-panel="recent">
            <div className="template-grid">
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #ff4801 0%, #ff9a6c 50%, #ffd4b8 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">Shopify Clone</div>
                  <div className="template-desc">E-commerce storefront built with modern stack</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #521000 0%, #ff4801 60%, #ff7038 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">alyssas-matcha-dreams</div>
                  <div className="template-desc">Brand website with custom design system</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #ff4801 40%, #ff7038 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">AI Chat Agent</div>
                  <div className="template-desc">Full-stack conversational AI with streaming responses</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(160deg, #fffdfb 0%, #ebd5c1 30%, #ff7038 70%, #ff4801 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">Dashboard Pro</div>
                  <div className="template-desc">Analytics dashboard with charts and real-time data</div>
                </div>
              </div>
            </div>
          </div>

          {/* My projects panel */}
          <div className="tab-panel" data-panel="projects">
            <div className="template-grid">
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #ff4801 0%, #ff9a6c 50%, #ffd4b8 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">Shopify Clone</div>
                  <div className="template-desc">E-commerce storefront with cart and checkout</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #521000 0%, #ff4801 60%, #ff7038 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">alyssas-matcha-dreams</div>
                  <div className="template-desc">Brand website with custom design system</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #ff4801 40%, #ff7038 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">Marketing Site</div>
                  <div className="template-desc">Modern startup landing with animations and CTA sections</div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates panel (active by default) */}
          <div className="tab-panel active" data-panel="templates">
            <div className="template-grid">
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #ff4801 0%, #ff9a6c 50%, #ffd4b8 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">AI Chat Interface</div>
                  <div className="template-desc">Full-stack conversational AI with streaming responses</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #521000 0%, #ff4801 60%, #ff7038 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">SaaS Dashboard</div>
                  <div className="template-desc">Analytics dashboard with charts, tables, and real-time data</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #ff4801 40%, #ff7038 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">Landing Page</div>
                  <div className="template-desc">Modern startup landing with animations and CTA sections</div>
                </div>
              </div>
              <div className="template-card">
                <div className="template-preview">
                  <div className="template-preview-inner" style={{ background: 'linear-gradient(160deg, #fffdfb 0%, #ebd5c1 30%, #ff7038 70%, #ff4801 100%)' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name">E-Commerce Store</div>
                  <div className="template-desc">Product catalog with cart, checkout, and payment integration</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix glitch overlay */}
        <div className="matrix-bar">
          <canvas id="matrix-canvas" />
        </div>
      </div>

      {/* Projects Dashboard */}
      <ProjectsDashboard />

    </main>
  );
}
