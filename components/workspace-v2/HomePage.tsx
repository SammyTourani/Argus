// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';
import HeroBackground from './HeroBackground';
import { startMatrixAnimation, stopMatrixAnimation } from './HeroBackground';
import ChatBox from './ChatBox';
import FireCrawlCarousel from './FireCrawlCarousel';
import ProjectsDashboard from './ProjectsDashboard';
import { fetchCurrentUser, fetchProjects, fetchTemplates, fetchRecents, generateGradient, formatRelativeTime, escapeHtml } from './workspace-api';
import { getActiveWorkspace, onWorkspaceChange } from './workspace-active';
import { useUser } from '@/components/providers/UserProvider';

export default function HomePage() {
  const { user } = useUser();
  const matrixBarAnimRef = useRef<number>(0);

  // ===== initTemplateSwitcher =====
  useEffect(() => {
    var templates = ['classic', 'vision', 'matrix'];
    var templateNames: Record<string, string> = { classic: 'Classic', vision: 'Argus Vision', matrix: 'Matrix' };
    var heroTemplate1 = document.getElementById('heroTemplate1');
    var heroTemplate2 = document.getElementById('heroTemplate2');
    var heroTemplate3 = document.getElementById('heroTemplate3');
    var switcherBtn = document.getElementById('templateSwitcher');
    if (!switcherBtn || !heroTemplate1 || !heroTemplate2 || !heroTemplate3) return;

    var current = localStorage.getItem('argus-hero-template') || 'classic';

    function applyTemplate(name: string) {
      current = name;
      localStorage.setItem('argus-hero-template', name);
      heroTemplate1!.classList.toggle('active', name === 'classic');
      heroTemplate2!.classList.toggle('active', name === 'vision');
      heroTemplate3!.classList.toggle('active', name === 'matrix');

      // Matrix template forces dark mode — use .workspace-root instead of body
      var wsRoot = document.querySelector('.workspace-root');
      if (wsRoot) {
        wsRoot.classList.toggle('dark', name === 'matrix');
      }
      document.body.classList.toggle('dark-mode', name === 'matrix');
      if (name === 'matrix') {
        document.documentElement.setAttribute('data-argus-dark', 'true');
      } else {
        document.documentElement.removeAttribute('data-argus-dark');
      }
      localStorage.setItem('argus-dark-mode', (name === 'matrix').toString());
      window.dispatchEvent(new CustomEvent('argus-dark-mode-change', { detail: { dark: name === 'matrix' } }));

      // Start/stop matrix canvas animation for GPU savings
      if (name === 'matrix') {
        startMatrixAnimation();
      } else {
        stopMatrixAnimation();
      }

      var nextIdx = (templates.indexOf(name) + 1) % templates.length;
      switcherBtn!.setAttribute('data-label', templateNames[templates[nextIdx]]);
    }

    applyTemplate(current);

    function handleClick() {
      var nextIdx = (templates.indexOf(current) + 1) % templates.length;
      applyTemplate(templates[nextIdx]);
    }

    switcherBtn.addEventListener('click', handleClick);

    return () => {
      switcherBtn!.removeEventListener('click', handleClick);
      // Stop matrix if it was running
      stopMatrixAnimation();
    };
  }, []);

  // ===== initMatrixBar — Matrix glitch overlay canvas =====
  useEffect(() => {
    var canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var w: number, h: number;
    var time = 0;
    var chars = '01{}[]<>()=+-;:_|/\\#@&*~$.%^!?';
    var cells: Array<{ x: number; y: number; char: string; phase: number; speed: number; brightness: number; nextChange: number }> = [];
    var spacingX = 20;
    var spacingY = 22;
    var dpr = window.devicePixelRatio || 1;
    var running = true;
    var resizeObserver: ResizeObserver | null = null;

    function resize() {
      var displayW = canvas!.parentElement!.offsetWidth;
      var displayH = canvas!.parentElement!.offsetHeight;
      canvas!.width = displayW * dpr;
      canvas!.height = displayH * dpr;
      canvas!.style.width = displayW + 'px';
      canvas!.style.height = displayH + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = displayW;
      h = displayH;
      var numCols = Math.ceil(w / spacingX);
      var numRows = Math.ceil(h / spacingY);
      cells = [];
      for (var r = 0; r < numRows; r++) {
        for (var c = 0; c < numCols; c++) {
          cells.push({
            x: c * spacingX + spacingX / 2,
            y: r * spacingY + spacingY / 2,
            char: chars[Math.floor(Math.random() * chars.length)],
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 1.2,
            brightness: 0.1 + Math.random() * 0.2,
            nextChange: Math.random() * 4,
          });
        }
      }
    }

    resize();

    // Use ResizeObserver so canvas re-renders when bottom-section changes size
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(function() { resize(); });
      resizeObserver.observe(canvas.parentElement!);
    } else {
      window.addEventListener('resize', resize);
    }

    function draw() {
      if (!running) return;
      time += 0.016;
      ctx!.clearRect(0, 0, w, h);

      // Horizontal scan line
      var scanX = ((time * 60) % (w + 400)) - 200;
      var scanGrad = ctx!.createLinearGradient(scanX - 120, 0, scanX + 120, 0);
      scanGrad.addColorStop(0, 'rgba(150, 150, 150, 0)');
      scanGrad.addColorStop(0.5, 'rgba(150, 150, 150, 0.04)');
      scanGrad.addColorStop(1, 'rgba(150, 150, 150, 0)');
      ctx!.fillStyle = scanGrad;
      ctx!.fillRect(scanX - 120, 0, 240, h);

      ctx!.font = "14px 'Geist Mono', monospace";
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        cell.nextChange -= 0.016;

        if (cell.nextChange <= 0) {
          cell.char = chars[Math.floor(Math.random() * chars.length)];
          cell.nextChange = 0.5 + Math.random() * 3;
          if (Math.random() < 0.12) {
            cell.brightness = 0.8 + Math.random() * 0.2;
          }
        }

        cell.brightness += (0.5 + Math.sin(cell.phase) * 0.15 - cell.brightness) * 0.03;

        var wave = Math.sin(time * cell.speed + cell.phase) * 0.5 + 0.5;

        var isAccent = cell.brightness > 0.55;
        if (isAccent) {
          ctx!.fillStyle = 'rgba(180, 180, 180, ' + (0.25 + wave * 0.15).toFixed(2) + ')';
        } else {
          ctx!.fillStyle = 'rgba(200, 200, 200, ' + (0.15 + wave * 0.10).toFixed(2) + ')';
        }

        ctx!.fillText(cell.char, cell.x, cell.y);
      }

      // Random glitch flicker on a cluster
      if (Math.random() < 0.04) {
        var gi = Math.floor(Math.random() * cells.length);
        var glen = 3 + Math.floor(Math.random() * 8);
        for (var g = gi; g < Math.min(gi + glen, cells.length); g++) {
          cells[g].brightness = 0.6 + Math.random() * 0.4;
          cells[g].char = chars[Math.floor(Math.random() * chars.length)];
        }
      }

      matrixBarAnimRef.current = requestAnimationFrame(draw);
    }
    matrixBarAnimRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(matrixBarAnimRef.current);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resize);
      }
    };
  }, []);

  // ===== Tab switching for bottom section =====
  useEffect(() => {
    var tabBtns = document.querySelectorAll('.tab-btn');

    function handleTabClick(this: HTMLElement) {
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');

      // Switch active panel
      var tabName = this.getAttribute('data-tab');
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      var targetPanel = document.querySelector('.tab-panel[data-panel="' + tabName + '"]');
      if (targetPanel) targetPanel.classList.add('active');
    }

    tabBtns.forEach(function(btn) {
      btn.addEventListener('click', handleTabClick as EventListener);
    });

    return () => {
      tabBtns.forEach(function(btn) {
        btn.removeEventListener('click', handleTabClick as EventListener);
      });
    };
  }, []);

  // ===== Fetch real user name and projects =====
  useEffect(() => {
    var cancelled = false;

    // Update hero greeting with real name
    fetchCurrentUser().then(function(user) {
      if (cancelled || !user) return;
      var accent = document.querySelector('.hero-heading .accent');
      if (accent) accent.textContent = user.name.split(' ')[0];
    }).catch(function() {});

    // Populate "Recently viewed" tab with real recents
    fetchRecents().then(function(recents) {
      if (cancelled) return;
      var recentPanel = document.querySelector('.tab-panel[data-panel="recent"] .template-grid');
      if (!recentPanel) return;
      if (!recents || recents.length === 0) {
        recentPanel.innerHTML = '<div style="padding:24px;text-align:center;color:var(--fg-muted);font-size:13px">No recently viewed projects</div>';
        return;
      }
      var html = '';
      var display = recents.slice(0, 4);
      display.forEach(function(r) {
        html += '<div class="template-card" data-project-id="' + r.project_id + '" style="cursor:pointer">';
        html += '<div class="template-preview"><div class="template-preview-inner" style="background:' + generateGradient(r.project_id) + '"></div></div>';
        html += '<div class="template-info"><div class="template-name">' + escapeHtml(r.project_name || 'Untitled') + '</div>';
        html += '<div class="template-desc">' + formatRelativeTime(r.viewed_at) + '</div></div></div>';
      });
      recentPanel.innerHTML = html;
      recentPanel.querySelectorAll('.template-card[data-project-id]').forEach(function(card) {
        card.addEventListener('click', function() {
          var pid = card.getAttribute('data-project-id');
          if (pid) window.location.href = '/workspace/' + pid;
        });
      });
    }).catch(function() {});

    // Populate "My projects" tab with real projects (scoped to active workspace)
    function renderProjectsTab(apiProjects) {
      var projectsPanel = document.querySelector('.tab-panel[data-panel="projects"] .template-grid');
      if (!projectsPanel) return;
      if (!apiProjects || apiProjects.length === 0) {
        projectsPanel.innerHTML = '<div style="padding:24px;text-align:center;color:var(--fg-muted);font-size:13px">No projects yet</div>';
        return;
      }
      var html = '';
      var display = apiProjects.slice(0, 4);
      display.forEach(function(p) {
        html += '<div class="template-card" data-project-id="' + p.id + '" style="cursor:pointer">';
        html += '<div class="template-preview"><div class="template-preview-inner" style="background:' + generateGradient(p.id) + '"></div></div>';
        html += '<div class="template-info"><div class="template-name">' + escapeHtml(p.name) + '</div>';
        html += '<div class="template-desc">' + formatRelativeTime(p.updated_at) + '</div></div></div>';
      });
      projectsPanel.innerHTML = html;
      projectsPanel.querySelectorAll('.template-card[data-project-id]').forEach(function(card) {
        card.addEventListener('click', function() {
          var pid = card.getAttribute('data-project-id');
          if (pid) window.location.href = '/workspace/' + pid;
        });
      });
    }

    fetchProjects(getActiveWorkspace().id).then(function(apiProjects) {
      if (cancelled) return;
      renderProjectsTab(apiProjects);
    }).catch(function() {});

    // Re-fetch when workspace switches
    var hpFetchGen = 0;
    var removeWsListener = onWorkspaceChange(function(ws) {
      if (cancelled) return;
      var gen = ++hpFetchGen;
      fetchProjects(ws.id).then(function(apiProjects) {
        if (cancelled || gen !== hpFetchGen) return;
        renderProjectsTab(apiProjects);
      }).catch(function() {});
    });

    // Populate "Templates" tab with marketplace data
    fetchTemplates().then(function(listings) {
      if (cancelled) return;
      var templatesPanel = document.querySelector('.tab-panel[data-panel="templates"] .template-grid');
      if (!templatesPanel) return;
      if (!listings || listings.length === 0) {
        templatesPanel.innerHTML = '<div style="padding:24px;text-align:center;color:var(--fg-muted);font-size:13px">No templates available</div>';
        return;
      }
      var html = '';
      var display = listings.slice(0, 4);
      display.forEach(function(t) {
        var grad = t.gradient || generateGradient(t.id);
        html += '<div class="template-card">';
        html += '<div class="template-preview"><div class="template-preview-inner" style="background:' + grad + '"></div></div>';
        html += '<div class="template-info"><div class="template-name">' + escapeHtml(t.title || '') + '</div>';
        html += '<div class="template-desc">' + escapeHtml(t.description || '') + '</div></div></div>';
      });
      templatesPanel.innerHTML = html;
    }).catch(function() {});

    return () => { cancelled = true; removeWsListener(); };
  }, []);

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
        <h1 className="hero-heading">Ready to build, <span className="accent">{user?.name?.split(' ')[0] || '\u00A0'}</span>?</h1>

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
          {/* Recently viewed panel — populated by useEffect */}
          <div className="tab-panel" data-panel="recent">
            <div className="template-grid">
              <div className="template-card" style={{ opacity: 0.4 }}>
                <div className="template-preview">
                  <div className="template-preview-inner skeleton-pulse" style={{ minHeight: '120px' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name skeleton-pulse" style={{ width: '80px', height: '14px' }}>&nbsp;</div>
                </div>
              </div>
            </div>
          </div>

          {/* My projects panel — populated by useEffect */}
          <div className="tab-panel" data-panel="projects">
            <div className="template-grid">
              <div className="template-card" style={{ opacity: 0.4 }}>
                <div className="template-preview">
                  <div className="template-preview-inner skeleton-pulse" style={{ minHeight: '120px' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name skeleton-pulse" style={{ width: '80px', height: '14px' }}>&nbsp;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates panel (active by default) — populated by useEffect */}
          <div className="tab-panel active" data-panel="templates">
            <div className="template-grid">
              <div className="template-card" style={{ opacity: 0.4 }}>
                <div className="template-preview">
                  <div className="template-preview-inner skeleton-pulse" style={{ minHeight: '120px' }}></div>
                </div>
                <div className="template-info">
                  <div className="template-name skeleton-pulse" style={{ width: '80px', height: '14px' }}>&nbsp;</div>
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
