// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { fetchMarketplaceListings, generateGradient } from './workspace-api';

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatLikes(n) {
  if (!n || n === 0) return '0';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return n.toLocaleString();
}

var heartSvg = '<svg viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" fill="currentColor" /></svg>';
var arrowSvg = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12L12 4M12 4H6M12 4v6" /></svg>';

export default function DiscoverTab() {

  useEffect(() => {
    var cancelled = false;
    var featuredEl = document.getElementById('discoverFeatured');
    var buildersEl = document.getElementById('discoverBuilders');
    var communityEl = document.getElementById('discoverCommunity');

    // Show loading state
    if (featuredEl) featuredEl.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">Loading...</div></div></div>';

    // Fetch all three sections
    Promise.all([
      fetchMarketplaceListings({ featured: true, limit: 3 }),
      fetchMarketplaceListings({ sort: 'newest', limit: 5 }),
      fetchMarketplaceListings({ sort: 'popular', limit: 9 }),
    ]).then(function(results) {
      if (cancelled) return;
      var featured = results[0] || [];
      var builders = results[1] || [];
      var community = results[2] || [];

      // Featured section
      if (featuredEl) {
        if (featured.length === 0) {
          featuredEl.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">No featured apps yet</div><div class="app-desc">Check back soon for featured community apps</div></div></div>';
        } else {
          var html = '';
          featured.forEach(function(item, i) {
            var grad = item.gradient || generateGradient(item.id);
            var title = escapeHtml(item.title);
            var desc = escapeHtml(item.description);
            var likes = formatLikes(item.like_count);
            if (i === 0) {
              html += '<div class="featured-hero stagger-2">' +
                '<div class="card-gradient" style="background:' + grad + '"></div>' +
                '<div class="dot-pattern"></div>' +
                '<div class="featured-badge">Featured</div>' +
                '<div class="like-badge">' + heartSvg + ' ' + likes + '</div>' +
                '<div class="card-overlay">' +
                '<div class="card-title-white">' + title + '</div>' +
                '<div class="card-desc-white">' + desc + '</div>' +
                '<div class="card-creator-white">' +
                '<button class="card-visit-btn">View project ' + arrowSvg + '</button>' +
                '</div></div></div>';
            } else {
              html += '<div class="featured-side stagger-' + (i + 2) + '">' +
                '<div class="card-gradient" style="background:' + grad + '"></div>' +
                '<div class="like-badge">' + heartSvg + ' ' + likes + '</div>' +
                '<div class="card-overlay">' +
                '<div style="font-size:15px;font-weight:700;color:white">' + title + '</div>' +
                '<div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px">' + desc + '</div>' +
                '</div></div>';
            }
          });
          featuredEl.innerHTML = html;
        }
      }

      // Builders section
      if (buildersEl) {
        if (builders.length === 0) {
          buildersEl.innerHTML = '<div class="scroll-card"><div class="card-info"><div class="card-name" style="color:var(--fg-muted)">No apps yet</div><div class="card-desc">Be the first to publish!</div></div></div>';
        } else {
          var html = '';
          builders.forEach(function(item, i) {
            var grad = item.gradient || generateGradient(item.id);
            var title = escapeHtml(item.title);
            var desc = escapeHtml(item.description);
            var likes = formatLikes(item.like_count);
            var cat = escapeHtml(item.category || 'General');
            html += '<div class="scroll-card stagger-' + Math.min(i + 3, 12) + '">' +
              '<div class="card-preview"><div class="card-gradient" style="background:' + grad + '"></div>' +
              '<div class="hover-overlay"><button class="view-btn">View ' + arrowSvg + '</button></div></div>' +
              '<div class="card-info"><div class="card-name">' + title + '</div>' +
              '<div class="card-desc">' + desc + '</div>' +
              '<div class="card-footer"><div class="like-badge" style="background:var(--bg-200)">' + heartSvg + ' ' + likes + '</div>' +
              '<span class="card-category">' + cat + '</span></div></div></div>';
          });
          buildersEl.innerHTML = html;
        }
      }

      // Community section
      if (communityEl) {
        if (community.length === 0) {
          communityEl.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">No community apps yet</div></div></div>';
        } else {
          var html = '';
          community.forEach(function(item, i) {
            var grad = item.gradient || generateGradient(item.id);
            var title = escapeHtml(item.title);
            var desc = escapeHtml(item.description);
            var likes = formatLikes(item.like_count);
            var initials = title.split(' ').map(function(w) { return w.charAt(0); }).join('').substring(0, 2).toUpperCase();
            html += '<div class="community-card stagger-' + Math.min(i + 5, 12) + '">' +
              '<div class="app-icon" style="background:' + grad + ';color:white;font-size:14px;font-weight:700">' + initials + '</div>' +
              '<div class="app-info"><div class="app-name">' + title + '</div>' +
              '<div class="app-desc">' + desc + '</div></div>' +
              '<div class="like-badge" style="background:var(--bg-200)">' + heartSvg + ' ' + likes + '</div></div>';
          });
          communityEl.innerHTML = html;
        }
      }
    }).catch(function() {
      if (cancelled) return;
      if (featuredEl) featuredEl.innerHTML = '<div class="community-card"><div class="app-info"><div class="app-name" style="color:var(--fg-muted)">Failed to load apps</div></div></div>';
    });

    return function() { cancelled = true; };
  }, []);

  return (
    <div className="tab-content active" id="tab-discover">
      <p className="page-subtitle" style={{ marginBottom: '20px' }}>Explore apps built by talented creators with Argus</p>

      {/* Featured Apps */}
      <div className="section-header"><div className="section-title">Featured apps</div></div>
      <div className="featured-grid" id="discoverFeatured"></div>

      {/* Apps for Builders */}
      <div className="section-header" style={{ marginTop: '8px' }}><div className="section-title">Apps for builders</div></div>
      <div className="scroll-row" id="discoverBuilders"></div>

      {/* Loved by Community */}
      <div className="section-header" style={{ marginTop: '32px' }}><div className="section-title">Loved by the community</div></div>
      <div className="community-grid" id="discoverCommunity"></div>
    </div>
  );
}
