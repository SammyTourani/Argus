// Workspace types for multi-project dashboard

export interface Collaborator {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  status: 'active' | 'building' | 'archived';
  is_starred: boolean;
  created_by: string;
  github_repo_url?: string | null;
  project_collaborators?: {
    profiles: Collaborator;
  }[];
}

export interface Build {
  id: string;
  project_id: string;
  input_url: string | null;
  input_prompt: string | null;
  model: string | null;
  status: string;
  preview_url: string | null;
  created_at: string;
  title: string | null;
  version_number?: number;
}

export type WorkspaceView = 'all' | 'starred' | 'shared';
