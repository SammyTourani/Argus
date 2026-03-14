// ===== WORKSPACE API LAYER =====
// Thin wrappers around existing API routes for workspace-v2 components.
// All functions handle errors gracefully and return null on auth failure.

import { createClient } from '@/lib/supabase/client';

// ===== Types =====

interface CacheEntry<T> {
  data: T | null;
  ts: number;
}

interface MarketplaceCacheEntry<T> extends CacheEntry<T> {
  _key: string;
}

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  initial: string;
}

export interface ProjectBuildSummary {
  id: string;
  status: string;
  preview_url: string | null;
  version_number: number;
  model: string | null;
  created_at: string;
  project_id: string;
}

export interface ProjectCollaboratorSummary {
  id: string;
  role: string;
  status: string;
  user_id: string | null;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  is_starred: boolean;
  is_archived: boolean;
  created_by: string;
  updated_at: string;
  created_at: string;
  default_model: string | null;
  default_style: string | null;
  latest_build?: ProjectBuildSummary | null;
  project_collaborators?: ProjectCollaboratorSummary[];
}

export interface DisplayProject {
  id: string;
  name: string;
  type: 'project';
  status: string;
  owner: string;
  ownerInitial: string;
  editedAt: string;
  starred: boolean;
  shared: boolean;
  gradient: string;
}

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  screenshot: string | null;
  markdown: string;
  gradient: string;
}

export interface SubscriptionInfo {
  tier: string;
  buildsRemaining: number;
  maxBuilds: number;
  canBuild: boolean;
  canDeploy: boolean;
  canUseAllModels: boolean;
  canCollaborate: boolean;
}

export interface ApiKeyEntry {
  id: string;
  provider: string;
  label: string | null;
  key_mask: string;
  status: string;
  created_at: string;
}

export interface ReferralStats {
  referral_code: string;
  referral_url: string;
  stats: { signed_up: number; converted: number };
  total_builds_earned: number;
}

export interface MarketplaceParams {
  category?: string;
  featured?: boolean;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  source_url?: string;
  default_model?: string;
  default_style?: string;
}

export interface CreateBuildData {
  title?: string;
  description?: string;
  model?: string;
  style?: string;
}

// ===== CACHING =====
let _projectsCache: CacheEntry<ApiProject[]> = { data: null, ts: 0 };
let _subscriptionCache: CacheEntry<SubscriptionInfo> = { data: null, ts: 0 };
let _userCache: CacheEntry<WorkspaceUser> = { data: null, ts: 0 };
const CACHE_TTL = 30000; // 30 seconds

function isFresh<T>(cache: CacheEntry<T>): cache is CacheEntry<T> & { data: T } {
  return cache.data !== null && (Date.now() - cache.ts < CACHE_TTL);
}

// ===== USER =====
export async function fetchCurrentUser(): Promise<WorkspaceUser | null> {
  if (isFresh(_userCache)) return _userCache.data;
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const result: WorkspaceUser = {
      id: user.id,
      email: user.email || '',
      name,
      initial: (name || 'U').charAt(0).toUpperCase(),
    };
    _userCache = { data: result, ts: Date.now() };
    return result;
  } catch {
    return null;
  }
}

// ===== PROJECTS =====
export async function fetchProjects(): Promise<ApiProject[]> {
  if (isFresh(_projectsCache)) return _projectsCache.data;
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) return [];
    const json = await res.json();
    const projects: ApiProject[] = json.projects || [];
    _projectsCache = { data: projects, ts: Date.now() };
    return projects;
  } catch {
    return [];
  }
}

export function invalidateProjectsCache(): void {
  _projectsCache = { data: null, ts: 0 };
}

export async function createProject(data: CreateProjectData): Promise<ApiProject> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Failed to create project');
  }
  invalidateProjectsCache();
  return json.project;
}

export async function createBuild(projectId: string, data: CreateBuildData): Promise<ProjectBuildSummary> {
  const res = await fetch(`/api/projects/${projectId}/builds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Failed to create build');
  }
  return json.build;
}

export async function patchProject(projectId: string, updates: Partial<ApiProject>): Promise<ApiProject> {
  const res = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update project');
  const json = await res.json();
  invalidateProjectsCache();
  return json.project;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
  invalidateProjectsCache();
  return true;
}

// ===== SEARCH =====
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Search failed');
  const json = await res.json();
  return (json.results || []).map((r: Record<string, unknown>) => ({
    url: r.url as string,
    title: (r.title as string) || (r.url as string),
    description: (r.description as string) || '',
    screenshot: (r.screenshot as string | null) || null,
    markdown: (r.markdown as string) || '',
    gradient: generateGradient(r.url as string),
  }));
}

// ===== SUBSCRIPTION =====
const DEFAULT_FREE_SUB: SubscriptionInfo = {
  tier: 'free',
  buildsRemaining: 3,
  maxBuilds: 3,
  canBuild: true,
  canDeploy: false,
  canUseAllModels: false,
  canCollaborate: false,
};

export async function fetchSubscription(): Promise<SubscriptionInfo> {
  if (isFresh(_subscriptionCache)) return _subscriptionCache.data;
  try {
    const res = await fetch('/api/user/subscription');
    if (!res.ok) return DEFAULT_FREE_SUB;
    const data: SubscriptionInfo = await res.json();
    _subscriptionCache = { data, ts: Date.now() };
    return data;
  } catch {
    return DEFAULT_FREE_SUB;
  }
}

// ===== STRIPE =====
export async function createCheckoutSession(plan?: string): Promise<string | null> {
  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: plan || 'pro' }),
  });
  if (res.status === 401) {
    window.location.href = '/sign-in';
    return null;
  }
  if (!res.ok) throw new Error('Failed to create checkout session');
  const json = await res.json();
  return json.url;
}

// ===== MARKETPLACE =====
let _marketplaceCache: MarketplaceCacheEntry<unknown[]> = { data: null, ts: 0, _key: '' };
const MARKETPLACE_CACHE_TTL = 60000;

export async function fetchMarketplaceListings(params?: MarketplaceParams): Promise<unknown[]> {
  const cacheKey = JSON.stringify(params || {});
  if (_marketplaceCache.data && _marketplaceCache._key === cacheKey && (Date.now() - _marketplaceCache.ts < MARKETPLACE_CACHE_TTL)) {
    return _marketplaceCache.data;
  }
  try {
    const qs = new URLSearchParams();
    if (params) {
      if (params.category) qs.set('category', params.category);
      if (params.featured) qs.set('featured', 'true');
      if (params.search) qs.set('search', params.search);
      if (params.sort) qs.set('sort', params.sort);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
    }
    const res = await fetch('/api/marketplace?' + qs.toString());
    if (!res.ok) return [];
    const json = await res.json();
    const listings = json.listings || [];
    _marketplaceCache = { data: listings, ts: Date.now(), _key: cacheKey };
    return listings;
  } catch {
    return [];
  }
}

export async function fetchTemplates(): Promise<unknown[]> {
  return fetchMarketplaceListings({ sort: 'uses', limit: 50 });
}

export function invalidateMarketplaceCache(): void {
  _marketplaceCache = { data: null, ts: 0, _key: '' };
}

// ===== API KEYS =====
let _apiKeysCache: CacheEntry<ApiKeyEntry[]> = { data: null, ts: 0 };

export async function fetchApiKeys(): Promise<ApiKeyEntry[]> {
  if (isFresh(_apiKeysCache)) return _apiKeysCache.data;
  try {
    const res = await fetch('/api/user/api-keys');
    if (!res.ok) return [];
    const json = await res.json();
    const keys: ApiKeyEntry[] = json.keys || [];
    _apiKeysCache = { data: keys, ts: Date.now() };
    return keys;
  } catch {
    return [];
  }
}

export function invalidateApiKeysCache(): void {
  _apiKeysCache = { data: null, ts: 0 };
}

export async function addApiKey(provider: string, key: string, label?: string | null): Promise<ApiKeyEntry> {
  const res = await fetch('/api/user/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, key, label: label || null }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Failed to add API key');
  }
  invalidateApiKeysCache();
  return json.key;
}

export async function deleteApiKey(keyId: string): Promise<boolean> {
  const res = await fetch(`/api/user/api-keys/${keyId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete API key');
  invalidateApiKeysCache();
  return true;
}

// ===== REFERRALS =====
const DEFAULT_REFERRAL_STATS: ReferralStats = {
  referral_code: '',
  referral_url: '',
  stats: { signed_up: 0, converted: 0 },
  total_builds_earned: 0,
};

export async function fetchReferralStats(): Promise<ReferralStats> {
  try {
    const res = await fetch('/api/user/referrals');
    if (!res.ok) return DEFAULT_REFERRAL_STATS;
    return await res.json();
  } catch {
    return DEFAULT_REFERRAL_STATS;
  }
}

// ===== RECENTS =====
let _recentsCache: CacheEntry<unknown[]> = { data: null, ts: 0 };

export async function fetchRecents(): Promise<unknown[]> {
  if (isFresh(_recentsCache)) return _recentsCache.data;
  try {
    const res = await fetch('/api/user/recents');
    if (!res.ok) return [];
    const json = await res.json();
    const recents = json.recents || [];
    _recentsCache = { data: recents, ts: Date.now() };
    return recents;
  } catch {
    return [];
  }
}

export async function recordView(projectId: string): Promise<void> {
  try {
    await fetch('/api/user/recents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    invalidateRecentsCache();
  } catch {
    // fire-and-forget
  }
}

export function invalidateRecentsCache(): void {
  _recentsCache = { data: null, ts: 0 };
}

// ===== CONNECTORS =====
export async function fetchConnectorStatuses(): Promise<unknown[]> {
  try {
    const res = await fetch('/api/user/connectors');
    if (!res.ok) return [];
    const json = await res.json();
    return json.connectors || [];
  } catch {
    return [];
  }
}

// ===== TEAMS =====
let _teamsCache: CacheEntry<unknown[]> = { data: null, ts: 0 };

export async function fetchTeams(): Promise<unknown[]> {
  if (isFresh(_teamsCache)) return _teamsCache.data;
  try {
    const res = await fetch('/api/teams');
    if (!res.ok) return [];
    const json = await res.json();
    const teams = json.teams || [];
    _teamsCache = { data: teams, ts: Date.now() };
    return teams;
  } catch {
    return [];
  }
}

export async function createTeam(name: string): Promise<unknown> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Failed to create team');
  }
  _teamsCache = { data: null, ts: 0 };
  return json.team;
}

// ===== HELPERS =====

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'just now';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return months + (months === 1 ? ' month ago' : ' months ago');
  if (weeks > 0) return weeks + (weeks === 1 ? ' week ago' : ' weeks ago');
  if (days > 0) return days + (days === 1 ? ' day ago' : ' days ago');
  if (hours > 0) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  if (minutes > 0) return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
  return 'just now';
}

// Deterministic gradient from a string (UUID or URL)
const GRADIENTS = [
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

export function generateGradient(str: string | null | undefined): string {
  if (!str) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function extractDomainName(url: string): string {
  try {
    const hostname = new URL(url.indexOf('://') === -1 ? 'https://' + url : url).hostname;
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return url.substring(0, 30);
  }
}

// Map API project to display shape used by ProjectsDashboard/SearchModal
export function mapProjectToDisplay(apiProject: ApiProject, currentUser: WorkspaceUser | null): DisplayProject {
  let displayStatus = 'active';
  if (apiProject.status === 'archived') displayStatus = 'draft';
  else if (apiProject.latest_build?.preview_url) displayStatus = 'deployed';

  const isOwner = currentUser && apiProject.created_by === currentUser.id;
  const ownerEmail = isOwner ? currentUser.email : (currentUser?.email || '');
  const shared = (apiProject.project_collaborators && apiProject.project_collaborators.length > 0) || !isOwner;

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
