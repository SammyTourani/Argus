// @ts-nocheck
// ===== WORKSPACE API LAYER =====
// Thin wrappers around existing API routes for workspace-v2 components.
// All functions handle errors gracefully and return null on auth failure.

import { createClient } from '@/lib/supabase/client';

// ===== CACHING =====
var _projectsCache = { data: null, ts: 0 };
var _subscriptionCache = { data: null, ts: 0 };
var _userCache = { data: null, ts: 0 };
var CACHE_TTL = 30000; // 30 seconds

function isFresh(cache) {
  return cache.data && (Date.now() - cache.ts < CACHE_TTL);
}

// ===== USER =====
export async function fetchCurrentUser() {
  if (isFresh(_userCache)) return _userCache.data;
  try {
    var supabase = createClient();
    var { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Try to get profile for display name
    var { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    var name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    var result = {
      id: user.id,
      email: user.email || '',
      name: name,
      initial: (name || 'U').charAt(0).toUpperCase(),
    };
    _userCache = { data: result, ts: Date.now() };
    return result;
  } catch (e) {
    return null;
  }
}

// ===== PROJECTS =====
export async function fetchProjects() {
  if (isFresh(_projectsCache)) return _projectsCache.data;
  try {
    var res = await fetch('/api/projects');
    if (!res.ok) return [];
    var json = await res.json();
    var projects = json.projects || [];
    _projectsCache = { data: projects, ts: Date.now() };
    return projects;
  } catch (e) {
    return [];
  }
}

export function invalidateProjectsCache() {
  _projectsCache = { data: null, ts: 0 };
}

export async function createProject(data) {
  try {
    var res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    var json = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create project');
    }
    invalidateProjectsCache();
    return json.project;
  } catch (e) {
    throw e;
  }
}

export async function createBuild(projectId, data) {
  try {
    var res = await fetch('/api/projects/' + projectId + '/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    var json = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create build');
    }
    return json.build;
  } catch (e) {
    throw e;
  }
}

export async function patchProject(projectId, updates) {
  try {
    var res = await fetch('/api/projects/' + projectId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update project');
    var json = await res.json();
    invalidateProjectsCache();
    return json.project;
  } catch (e) {
    throw e;
  }
}

export async function deleteProject(projectId) {
  try {
    var res = await fetch('/api/projects/' + projectId, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    invalidateProjectsCache();
    return true;
  } catch (e) {
    throw e;
  }
}

// ===== SEARCH =====
export async function searchWeb(query) {
  try {
    var res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query }),
    });
    if (!res.ok) throw new Error('Search failed');
    var json = await res.json();
    return (json.results || []).map(function(r) {
      return {
        url: r.url,
        title: r.title || r.url,
        description: r.description || '',
        screenshot: r.screenshot || null,
        markdown: r.markdown || '',
        gradient: generateGradient(r.url),
      };
    });
  } catch (e) {
    throw e;
  }
}

// ===== SUBSCRIPTION =====
export async function fetchSubscription() {
  if (isFresh(_subscriptionCache)) return _subscriptionCache.data;
  try {
    var res = await fetch('/api/user/subscription');
    if (!res.ok) return { tier: 'free', buildsRemaining: 3, maxBuilds: 3, canBuild: true, canDeploy: false, canUseAllModels: false, canCollaborate: false };
    var data = await res.json();
    _subscriptionCache = { data: data, ts: Date.now() };
    return data;
  } catch (e) {
    return { tier: 'free', buildsRemaining: 3, maxBuilds: 3, canBuild: true, canDeploy: false, canUseAllModels: false, canCollaborate: false };
  }
}

// ===== STRIPE =====
export async function createCheckoutSession(plan) {
  try {
    var res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: plan || 'pro' }),
    });
    if (res.status === 401) {
      window.location.href = '/sign-in';
      return null;
    }
    if (!res.ok) throw new Error('Failed to create checkout session');
    var json = await res.json();
    return json.url;
  } catch (e) {
    throw e;
  }
}

// ===== MARKETPLACE =====
var _marketplaceCache = { data: null, ts: 0, _key: '' };
var MARKETPLACE_CACHE_TTL = 60000; // 60 seconds

export async function fetchMarketplaceListings(params) {
  var cacheKey = JSON.stringify(params || {});
  if (_marketplaceCache.data && _marketplaceCache._key === cacheKey && (Date.now() - _marketplaceCache.ts < MARKETPLACE_CACHE_TTL)) {
    return _marketplaceCache.data;
  }
  try {
    var qs = new URLSearchParams();
    if (params) {
      if (params.category) qs.set('category', params.category);
      if (params.featured) qs.set('featured', 'true');
      if (params.search) qs.set('search', params.search);
      if (params.sort) qs.set('sort', params.sort);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
    }
    var res = await fetch('/api/marketplace?' + qs.toString());
    if (!res.ok) return [];
    var json = await res.json();
    var listings = json.listings || [];
    _marketplaceCache = { data: listings, ts: Date.now(), _key: cacheKey };
    return listings;
  } catch (e) {
    return [];
  }
}

export async function fetchTemplates() {
  return fetchMarketplaceListings({ sort: 'uses', limit: 50 });
}

export function invalidateMarketplaceCache() {
  _marketplaceCache = { data: null, ts: 0, _key: '' };
}

// ===== API KEYS =====
var _apiKeysCache = { data: null, ts: 0 };

export async function fetchApiKeys() {
  if (isFresh(_apiKeysCache)) return _apiKeysCache.data;
  try {
    var res = await fetch('/api/user/api-keys');
    if (!res.ok) return [];
    var json = await res.json();
    var keys = json.keys || [];
    _apiKeysCache = { data: keys, ts: Date.now() };
    return keys;
  } catch (e) {
    return [];
  }
}

export function invalidateApiKeysCache() {
  _apiKeysCache = { data: null, ts: 0 };
}

export async function addApiKey(provider, key, label) {
  try {
    var res = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: provider, key: key, label: label || null }),
    });
    var json = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      throw new Error(json.error || 'Failed to add API key');
    }
    invalidateApiKeysCache();
    return json.key;
  } catch (e) {
    throw e;
  }
}

export async function deleteApiKey(keyId) {
  try {
    var res = await fetch('/api/user/api-keys/' + keyId, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete API key');
    invalidateApiKeysCache();
    return true;
  } catch (e) {
    throw e;
  }
}

// ===== REFERRALS =====
export async function fetchReferralStats() {
  try {
    var res = await fetch('/api/user/referrals');
    if (!res.ok) return { referral_code: '', referral_url: '', stats: { signed_up: 0, converted: 0 }, total_builds_earned: 0 };
    return await res.json();
  } catch (e) {
    return { referral_code: '', referral_url: '', stats: { signed_up: 0, converted: 0 }, total_builds_earned: 0 };
  }
}

// ===== RECENTS =====
var _recentsCache = { data: null, ts: 0 };

export async function fetchRecents() {
  if (isFresh(_recentsCache)) return _recentsCache.data;
  try {
    var res = await fetch('/api/user/recents');
    if (!res.ok) return [];
    var json = await res.json();
    var recents = json.recents || [];
    _recentsCache = { data: recents, ts: Date.now() };
    return recents;
  } catch (e) {
    return [];
  }
}

export async function recordView(projectId) {
  try {
    await fetch('/api/user/recents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    invalidateRecentsCache();
  } catch (e) {
    // fire-and-forget
  }
}

export function invalidateRecentsCache() {
  _recentsCache = { data: null, ts: 0 };
}

// ===== CONNECTORS =====
export async function fetchConnectorStatuses() {
  try {
    var res = await fetch('/api/user/connectors');
    if (!res.ok) return [];
    var json = await res.json();
    return json.connectors || [];
  } catch (e) {
    return [];
  }
}

// ===== TEAMS =====
var _teamsCache = { data: null, ts: 0 };

export async function fetchTeams() {
  if (isFresh(_teamsCache)) return _teamsCache.data;
  try {
    var res = await fetch('/api/teams');
    if (!res.ok) return [];
    var json = await res.json();
    var teams = json.teams || [];
    _teamsCache = { data: teams, ts: Date.now() };
    return teams;
  } catch (e) {
    return [];
  }
}

export async function createTeam(name) {
  try {
    var res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name }),
    });
    var json = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create team');
    }
    _teamsCache = { data: null, ts: 0 };
    return json.team;
  } catch (e) {
    throw e;
  }
}

// ===== HELPERS =====

// Escape HTML entities to prevent XSS in innerHTML assignments
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatRelativeTime(isoString) {
  if (!isoString) return 'just now';
  var now = Date.now();
  var then = new Date(isoString).getTime();
  var diff = Math.max(0, now - then);
  var seconds = Math.floor(diff / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);
  var days = Math.floor(hours / 24);
  var weeks = Math.floor(days / 7);
  var months = Math.floor(days / 30);

  if (months > 0) return months + (months === 1 ? ' month ago' : ' months ago');
  if (weeks > 0) return weeks + (weeks === 1 ? ' week ago' : ' weeks ago');
  if (days > 0) return days + (days === 1 ? ' day ago' : ' days ago');
  if (hours > 0) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  if (minutes > 0) return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
  return 'just now';
}

// Deterministic gradient from a string (UUID or URL)
var GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'linear-gradient(135deg, #ff4801 0%, #ff6b35 100%)',
  'linear-gradient(135deg, #5e6ad2 0%, #8b5cf6 100%)',
];

export function generateGradient(str) {
  if (!str) return GRADIENTS[0];
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function extractDomainName(url) {
  try {
    var hostname = new URL(url.indexOf('://') === -1 ? 'https://' + url : url).hostname;
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch (e) {
    return url.substring(0, 30);
  }
}

// Map API project to display shape used by ProjectsDashboard/SearchModal
export function mapProjectToDisplay(apiProject, currentUser) {
  var displayStatus = 'active';
  if (apiProject.status === 'archived') displayStatus = 'draft';
  else if (apiProject.latest_build && apiProject.latest_build.preview_url) displayStatus = 'deployed';

  var isOwner = currentUser && apiProject.created_by === currentUser.id;
  var ownerEmail = isOwner ? currentUser.email : (currentUser?.email || '');
  var shared = (apiProject.project_collaborators && apiProject.project_collaborators.length > 0) || !isOwner;

  return {
    id: apiProject.id,
    name: apiProject.name,
    type: 'project',
    status: displayStatus,
    owner: ownerEmail,
    ownerInitial: (ownerEmail || 'U').charAt(0).toUpperCase(),
    editedAt: formatRelativeTime(apiProject.updated_at),
    starred: !!apiProject.is_starred,
    shared: !!shared,
    gradient: generateGradient(apiProject.id),
  };
}
