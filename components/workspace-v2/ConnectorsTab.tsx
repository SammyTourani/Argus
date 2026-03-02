// @ts-nocheck
'use client';

import { useEffect } from 'react';

const CONNECTORS = [
  { id:'c1', name:'Gmail', desc:'Draft replies, search inbox, summarize threads', icon:'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png', connected:true, popular:true },
  { id:'c2', name:'Google Calendar', desc:'Manage events and optimize your schedule', icon:'https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png', connected:true, popular:true },
  { id:'c3', name:'GitHub', desc:'Manage repos, track changes, collaborate', icon:'https://github.githubassets.com/favicons/favicon-dark.svg', connected:true, popular:false },
  { id:'c4', name:'Google Drive', desc:'Access files, search, and manage documents', icon:'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png', connected:false, popular:false },
  { id:'c5', name:'Slack', desc:'Team messaging and real-time notifications', icon:'https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png', connected:false, popular:true },
  { id:'c6', name:'Notion', desc:'Docs, wikis, and project management', icon:'https://www.notion.so/images/favicon.ico', connected:false, popular:false },
  { id:'c7', name:'Linear', desc:'Issue tracking and project planning', icon:'https://linear.app/favicon.ico', connected:false, popular:false },
  { id:'c8', name:'Figma', desc:'Design files and prototypes', icon:'https://static.figma.com/app/icon/1/favicon.png', connected:false, popular:false },
  { id:'c9', name:'Vercel', desc:'Deploy and host web applications', icon:'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico', connected:true, popular:false },
  { id:'c10', name:'Stripe', desc:'Payment processing and billing', icon:'https://images.stripeassets.com/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg', connected:false, popular:false },
  { id:'c11', name:'Jira', desc:'Project and issue tracking', icon:'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png', connected:false, popular:false },
  { id:'c12', name:'Meta Ads Manager', desc:'Automate ads insights and optimization', icon:'https://static.xx.fbcdn.net/rsrc.php/yb/r/hLRJ1GG_y0J.ico', connected:false, popular:false },
];

export default function ConnectorsTab() {

  /* ===== CONNECTOR SUB-TABS ===== */
  useEffect(() => {
    var bar = document.getElementById('connSubTabBar');
    var btns = bar.querySelectorAll('.sub-tab-btn');
    var indicator = document.getElementById('connSubIndicator');

    function setInd(btn) {
      indicator.style.left = btn.offsetLeft + 'px';
      indicator.style.width = btn.offsetWidth + 'px';
    }

    function switchSub(id) {
      btns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.sub-tab-content').forEach(function(c) { c.classList.remove('active'); });
      bar.querySelector('[data-subtab="' + id + '"]').classList.add('active');
      document.getElementById('subtab-' + id).classList.add('active');
      setInd(bar.querySelector('.sub-tab-btn.active'));
    }

    var clickHandlers = [];
    btns.forEach(function(btn) {
      var handler = function() { switchSub((btn as HTMLElement).dataset.subtab); };
      btn.addEventListener('click', handler);
      clickHandlers.push({ el: btn, handler: handler });
    });

    var initTimer = setTimeout(function() { setInd(bar.querySelector('.sub-tab-btn.active')); }, 100);

    var resizeHandler = function() { setInd(bar.querySelector('.sub-tab-btn.active')); };
    window.addEventListener('resize', resizeHandler);

    return () => {
      clearTimeout(initTimer);
      clickHandlers.forEach(function(item) {
        item.el.removeEventListener('click', item.handler);
      });
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  /* ===== CONNECTORS DATA & RENDERING ===== */
  useEffect(() => {
    var recommendedGrid = document.getElementById('recommendedGrid');
    var appsGrid = document.getElementById('appsGrid');

    function buildConnectorCard(c, i) {
      return '<div class="connector-card stagger-' + Math.min(i + 1, 12) + (c.connected ? ' connected' : '') + '">' +
        '<div class="connector-icon"><img src="' + c.icon + '" alt="' + c.name + '" onerror="this.style.display=\'none\';this.parentElement.textContent=\'' + c.name.charAt(0) + '\';this.parentElement.style.fontWeight=700;this.parentElement.style.fontSize=\'18px\';this.parentElement.style.color=\'var(--fg-200)\';"></div>' +
        '<div class="connector-info"><div class="connector-name">' + c.name + '</div><div class="connector-desc">' + c.desc + '</div></div>' +
        '<button class="connect-btn ' + (c.connected ? 'disconnect' : 'connect') + '" data-connector="' + c.id + '">' +
        (c.connected ? 'Connected' : 'Connect') + '</button></div>';
    }

    function renderConnectors() {
      var recommended = CONNECTORS.filter(function(c) { return c.popular; });
      var others = CONNECTORS.filter(function(c) { return !c.popular; });

      recommendedGrid.innerHTML = recommended.map(function(c, i) {
        return buildConnectorCard(c, i);
      }).join('');

      appsGrid.innerHTML = others.map(function(c, i) {
        return buildConnectorCard(c, i + recommended.length);
      }).join('');

      // Wire connect buttons
      document.querySelectorAll('.connect-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var id = (btn as HTMLElement).dataset.connector;
          var c = CONNECTORS.find(function(x) { return x.id === id; });
          if (c) { c.connected = !c.connected; renderConnectors(); }
        });
      });
    }

    // Search
    var connectorSearch = document.getElementById('connectorSearch');
    var searchHandler = function(e) {
      var q = (e.target as HTMLInputElement).value.toLowerCase();
      document.querySelectorAll('.connector-card').forEach(function(card) {
        var name = card.querySelector('.connector-name').textContent.toLowerCase();
        (card as HTMLElement).style.display = name.indexOf(q) !== -1 ? '' : 'none';
      });
    };
    connectorSearch.addEventListener('input', searchHandler);

    renderConnectors();

    return () => {
      connectorSearch.removeEventListener('input', searchHandler);
    };
  }, []);

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
