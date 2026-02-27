// Argus v2 Database Types
// Generated from supabase/migrations/20260224_v2_schema.sql

export type ProjectStatus = 'active' | 'archived' | 'building';
export type BuildStatus = 'pending' | 'running' | 'success' | 'failed';
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined';
export type TeamRole = 'admin' | 'member';

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

export interface ProjectWithCollaborators extends Project {
  project_collaborators?: ProjectCollaboratorWithProfile[];
  latest_build?: ProjectBuild | null;
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

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  avatar_url: string | null;
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

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string | null;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invited_by: string;
  invite_token: string | null;
  invite_email: string | null;
  invite_expires_at: string | null;
  joined_at: string | null;
  created_at: string;
}

export interface ProjectCollaboratorWithProfile extends ProjectCollaborator {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

export interface MarketplaceListing {
  id: string;
  build_id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  thumbnail_url: string | null;
  fork_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type OnboardingStep = 'welcome' | 'what_to_build' | 'choose_model' | 'first_build' | 'completed';

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
