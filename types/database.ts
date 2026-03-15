// Argus Database Types
// Matches supabase/migrations/ schema exactly. Keep in sync when adding migrations.

// ─── Enums ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived' | 'building';
export type BuildStatus = 'pending' | 'generating' | 'complete' | 'failed';
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined' | 'revoked';
export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamPlan = 'free' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'cancelled';
export type OnboardingStep = 'welcome' | 'what_to_build' | 'choose_model' | 'first_build' | 'completed';
export type ApiKeyProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'deepseek' | 'mistral' | 'alibaba' | 'custom';
export type ApiKeyStatus = 'active' | 'expired' | 'revoked';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error';
export type ReferralStatus = 'pending' | 'signed_up' | 'converted';
export type MessageRole = 'user' | 'assistant' | 'system';

// ─── Core Tables ────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  subscription_id: string | null;
  builds_this_month: number;
  builds_reset_at: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  created_by: string;
  team_id: string | null;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_starred: boolean;
  is_archived: boolean;
  status: ProjectStatus;
  default_model: string | null;
  default_style: string | null;
  last_build_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectBuild {
  id: string;
  project_id: string;
  build_id: string | null;
  created_by: string;
  version_number: number;
  status: BuildStatus;
  title: string | null;
  description: string | null;
  model: string | null;
  style: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  sandbox_id: string | null;
  files_json: Record<string, unknown> | null;
  published_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuildMessage {
  id: string;
  build_id: string;
  project_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  file_changes: string[] | null;
  created_at: string;
}

// ─── Teams ──────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  plan: TeamPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string | null;
  joined_at: string;
}

// ─── Collaboration ──────────────────────────────────────────────────────────

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string | null;
  invited_by: string;
  email: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invite_token: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface ProjectCollaboratorWithProfile extends ProjectCollaborator {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

// ─── Marketplace ────────────────────────────────────────────────────────────

export interface MarketplaceListing {
  id: string;
  project_build_id: string | null;
  submitted_by: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  published_url: string | null;
  model: string | null;
  style: string | null;
  tags: string[];
  category: string | null;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  fork_count: number;
  like_count: number;
  prompt: string | null;
  use_count: number;
  gradient: string | null;
  created_at: string;
  updated_at: string;
}

// ─── User Settings ──────────────────────────────────────────────────────────

export interface OnboardingState {
  user_id: string;
  current_step: OnboardingStep;
  what_to_build: string | null;
  chosen_model: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserModelPreference {
  user_id: string;
  preferred_model: string;
  preferred_style: string;
  total_builds: number;
  last_model_used: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── BYOK & Connectors ─────────────────────────────────────────────────────

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  label: string | null;
  encrypted_key: string;
  key_mask: string;
  status: ApiKeyStatus;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserConnector {
  id: string;
  user_id: string;
  provider: string;
  status: ConnectorStatus;
  external_id: string | null;
  metadata: Record<string, unknown> | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Referrals & Activity ───────────────────────────────────────────────────

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  status: ReferralStatus;
  referral_code: string;
  signed_up_at: string | null;
  converted_at: string | null;
  builds_awarded: number;
  created_at: string;
}

export interface RecentView {
  id: string;
  user_id: string;
  project_id: string;
  viewed_at: string;
}

// ─── Legacy (backward compat) ───────────────────────────────────────────────

export interface Build {
  id: string;
  user_id: string;
  input_url: string | null;
  input_prompt: string | null;
  style: string | null;
  model: string | null;
  status: string | null;
  preview_url: string | null;
  title: string | null;
  share_token: string | null;
  project_id: string | null;
  created_at: string;
}

// ─── Webhook Idempotency ───────────────────────────────────────────────────

export interface WebhookEvent {
  event_id: string;
  event_type: string;
  processed_at: string;
}

// ─── Composite Types ────────────────────────────────────────────────────────

export interface ProjectWithCollaborators extends Project {
  project_collaborators?: ProjectCollaboratorWithProfile[];
  latest_build?: ProjectBuild | null;
}
