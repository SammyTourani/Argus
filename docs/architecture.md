# Argus v2 — Full Product Architecture Specification

> Version: 2.0  
> Branch: `feature/argus-v2`  
> Status: Architecture / Pre-implementation  
> Stack: Next.js 15, Supabase, Tailwind, Framer Motion, Radix UI, Resend, Stripe, @vercel/sandbox, E2B

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Route Architecture](#2-route-architecture)
3. [Multi-Project Workspace](#3-multi-project-workspace)
4. [Builder Area](#4-builder-area)
5. [Team Collaboration](#5-team-collaboration)
6. [Model Marketplace](#6-model-marketplace)
7. [Onboarding State Machine](#7-onboarding-state-machine)
8. [Auth Expansion](#8-auth-expansion)
9. [Database Schema Overview](#9-database-schema-overview)
10. [API Routes](#10-api-routes)
11. [Component Tree](#11-component-tree)
12. [Realtime Architecture](#12-realtime-architecture)
13. [Billing & Pricing](#13-billing--pricing)
14. [File Structure](#14-file-structure)
15. [Migration Strategy](#15-migration-strategy)

---

## 1. Vision & Goals

### What Argus v2 Is

Argus v2 transforms from a single-session web cloner into a **Figma-style multi-project AI builder workspace**. Think: the collaborative feel of Figma + the AI generation power of v0.dev + the model flexibility of OpenRouter — all in one product.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| **Multi-Project Workspace** | Every user gets a persistent workspace with projects, builds, history |
| **Team Collaboration** | Invite teammates, assign roles, see who's online in real-time |
| **Model Marketplace** | Pick any AI model + style preset per project, see cost estimates |
| **Inspiration Gallery** | Community builds, searchable by tag/style, 1-click fork |
| **Onboarding Flow** | Guided 4-step wizard, once per user, tracks via DB |

### What Stays the Same

- E2B + Vercel sandbox execution (the "magic" core)
- Tailwind + Radix UI component system
- Supabase auth (extended with new providers)
- Stripe subscription gating

---

## 2. Route Architecture

```
/                           → Landing page (existing)
/sign-in                    → Auth (existing, extended with GitHub + Microsoft)
/sign-up                    → Auth (existing)

/onboarding                 → 4-step wizard (NEW — shown once after first signup)
  /onboarding/welcome       → Step 1: Welcome to Argus
  /onboarding/what-to-build → Step 2: What do you want to build?
  /onboarding/choose-model  → Step 3: Pick your AI model
  /onboarding/first-build   → Step 4: Your first build (auto-triggers)

/workspace                  → Project grid (NEW — replaces /dashboard)
  /workspace/[projectId]    → Project overview + build history (NEW)
  /workspace/[projectId]/build/[buildId]  → Builder (evolved from /generation)

/marketplace                → Model & style selector (NEW)
/gallery                    → Community inspiration gallery (NEW)
/dashboard                  → Kept for backward compat, redirects to /workspace
/app                        → Kept for backward compat, redirects to /workspace
```

### Route Guard Logic

```typescript
// middleware.ts
// 1. Not authed → /sign-in
// 2. Authed + onboarding incomplete → /onboarding/[current_step]
// 3. Authed + onboarding complete → allow through
```

---

## 3. Multi-Project Workspace

### `/workspace` — Project Grid

The main dashboard. Replaces the current `/dashboard` build history table.

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Argus Logo]   [Search...]   [+ New Project]   [Avatar]    │
├──────────┬──────────────────────────────────────────────────┤
│          │  ⭐ Starred                                       │
│ SIDEBAR  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│          │  │ Project  │ │ Project  │ │ Project  │         │
│ Projects │  │ Card     │ │ Card     │ │ Card     │         │
│ ─────── │  └──────────┘ └──────────┘ └──────────┘        │
│ All      │                                                   │
│ Starred ⭐│  📅 Recent                                       │
│ Shared   │  ┌──────────┐ ┌──────────┐                      │
│          │  │ Project  │ │ Project  │                       │
│ ─────── │  │ Card     │ │ Card     │                       │
│ + New    │  └──────────┘ └──────────┘                      │
└──────────┴──────────────────────────────────────────────────┘
```

#### Left Sidebar (`<WorkspaceSidebar />`)

```typescript
interface SidebarProps {
  sections: {
    label: string;
    icon: LucideIcon;
    items: SidebarItem[];
  }[];
}

// Sections:
// 1. "All Projects" — flat list of all user projects
// 2. "Starred" — filtered to is_starred=true
// 3. "Shared with me" — projects via project_collaborators where user is not owner
// 4. "Team Spaces" — if user belongs to a team (teams table)
// 5. "+ New Project" button (bottom)
```

#### Project Card (`<ProjectCard />`)

```typescript
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    thumbnail_url: string | null;     // Screenshot of last build's preview_url
    last_edited_at: string;
    status: 'active' | 'archived' | 'building';
    is_starred: boolean;
    collaborators: {                  // Up to 4 avatars shown
      id: string;
      avatar_url: string | null;
      full_name: string | null;
    }[];
    build_count: number;
  };
}

// Renders:
// - Thumbnail (16:9 ratio, screenshot of last build, or gradient placeholder)
// - Project name (bold, truncated)
// - "Last edited X ago" (timeAgo helper)
// - Collaborator avatar stack (max 4, "+N more" overflow)
// - Status badge (Active / Building / Archived)
// - ⭐ Star toggle (top-right corner)
// - Hover: shows "Open" CTA overlay
// - Right-click / ⋯ menu: Rename, Duplicate, Share, Archive, Delete
```

#### New Project Modal (`<NewProjectModal />`)

Triggered by "+ New Project" button:

```
┌─────────────────────────────┐
│  Create New Project         │
│                             │
│  Name: [________________]   │
│                             │
│  Description (optional):    │
│  [________________________] │
│                             │
│  Template:                  │
│  ○ Blank canvas             │
│  ○ Clone a website          │
│  ○ From inspiration gallery │
│                             │
│  [Cancel]  [Create →]       │
└─────────────────────────────┘
```

On "Create": insert into `projects` table, redirect to `/workspace/[newProjectId]`.

---

### `/workspace/[projectId]` — Project Overview

```
┌─────────────────────────────────────────────────────────────┐
│  ← Workspace  /  My Project Name   [Share] [Settings]       │
├──────────────────────────────────────────────────────────────┤
│  Builds                                    [+ New Build]     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Build #3 │ │ Build #2 │ │ Build #1 │                    │
│  │ (latest) │ │          │ │          │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                              │
│  Activity                                                    │
│  ● Sammy created build #3 — 2h ago                          │
│  ● Alex edited build #2 — 1d ago                            │
└──────────────────────────────────────────────────────────────┘
```

Build thumbnails = `preview_url` screenshots stored in Supabase Storage.

---

### `/workspace/[projectId]/build/[buildId]` — Builder

Evolved from current `/generation`. See Section 4.

---

## 4. Builder Area

The core generation experience, now **project-aware and persistent**.

### Top Navigation Bar

```
┌──────────────────────────────────────────────────────────────┐
│ [Argus] Workspace / Project Name / Build #3                  │
│                          [Model: Claude ▼] [Share] [Publish] │
└──────────────────────────────────────────────────────────────┘
```

Components:
- **Breadcrumb**: `Workspace → [project name] → [build title or #N]`
- **Model Selector Dropdown** (`<ModelSelector />`): opens Model Marketplace panel
- **Share Button**: generates share link (existing `share_token` logic)
- **Publish Button**: deploys to Vercel (new in v2)
- **Presence Avatars**: "3 people viewing" dots (real-time, see Section 5)

### Builder Layout

```
┌──────────┬─────────────────────────┬───────────────────────┐
│          │                         │                       │
│  CHAT    │   CODE / GENERATION     │    PREVIEW            │
│  PANEL   │   (streaming files)     │    (E2B iframe)       │
│          │                         │                       │
│  [input] │                         │                       │
└──────────┴─────────────────────────┴───────────────────────┘
```

### What's New vs v1

| Feature | v1 | v2 |
|---------|----|----|
| Build persistence | Session-only (lost on reload) | Saved to `project_builds` table |
| Model selection | Per-session dropdown | Per-project preference, overrideable per build |
| Auth | Email + Google | + GitHub + Microsoft |
| Collaboration | None | Real-time presence + roles |
| History | List in `/dashboard` | Per-project build cards |
| Publish | None | One-click Vercel deploy |

### Build State Machine

```
pending → generating → complete
                    ↘ failed
```

State stored in `project_builds.status`. Real-time updates via Supabase Realtime.

---

## 5. Team Collaboration

### Invite Flow

1. User clicks "Share" button in builder → modal opens
2. Enter teammate email + choose role (Editor / Viewer)
3. Resend sends invite email with magic link
4. Teammate clicks link → joins project as collaborator
5. Appears in collaborator avatar stack on project card

```typescript
// POST /api/projects/[projectId]/invite
interface InvitePayload {
  email: string;
  role: 'editor' | 'viewer';
}
```

### Roles & Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View builds | ✅ | ✅ | ✅ |
| Create builds | ✅ | ✅ | ❌ |
| Edit builds | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Publish | ✅ | ✅ | ❌ |
| Change settings | ✅ | ❌ | ❌ |

RLS policies in Supabase enforce these at the DB level (see migration file).

### Real-Time Presence

```typescript
// /workspace/[projectId]/build/[buildId]
// On mount, join a Supabase Realtime presence channel:

const channel = supabase.channel(`build:${buildId}`)
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    setOnlineUsers(Object.values(state).flat());
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        cursor: null,  // optional: mouse position
      });
    }
  });
```

Presence Indicator UI (`<PresenceAvatars />`):
```
● Alex  ● Sammy  +1 more   ← avatar dots in top nav
```

- Green dot = online
- Gray dot = idle (>5 min no activity)
- Tooltip on hover: "Alex is viewing this build"

### Live Cursor Sharing (Optional — Phase 2)

Broadcast mouse positions via Supabase Realtime broadcast (not presence):
```typescript
channel.send({
  type: 'broadcast',
  event: 'cursor',
  payload: { x: e.clientX, y: e.clientY, user_id: user.id }
});
```

Render foreign cursors as colored dots with name labels.

---

## 6. Model Marketplace

### Model Panel (in Builder Top Nav Dropdown)

```
┌──────────────────────────────────────┐
│ Choose AI Model                      │
│                                      │
│ ● Claude Sonnet 4.5    ~$0.003/build │
│ ○ Claude Opus 4        ~$0.015/build │
│ ○ GPT-4o               ~$0.005/build │
│ ○ GPT-4o Mini          ~$0.001/build │
│ ○ Gemini 2.5 Flash     ~$0.001/build │
│ ○ Gemini 2.5 Pro       ~$0.007/build │
│ ○ Llama 3.3 70B (Groq) ~$0.000/build │
│ ○ Mistral Large        ~$0.004/build │
│ ○ Mixtral 8x22B        ~$0.002/build │
│ ○ DeepSeek V3          ~$0.001/build │
│ ○ Qwen 2.5 72B         ~$0.001/build │
│                                      │
│ Style Preset                         │
│ [Minimal] [Bold] [Enterprise]        │
│ [Playful] [Dark] [Brutalist]         │
│                                      │
│ [Save as project default]            │
└──────────────────────────────────────┘
```

### Available Models

```typescript
export const MARKETPLACE_MODELS = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    icon: '🟠',
    cost_per_build_cents: 0.3,
    description: 'Best for complex, production-quality code',
    tier: 'pro',
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    icon: '🟠',
    cost_per_build_cents: 1.5,
    description: 'Most capable, for ambitious projects',
    tier: 'pro',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    icon: '🟢',
    cost_per_build_cents: 0.5,
    description: 'Reliable, fast, great for structured output',
    tier: 'pro',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    icon: '🟢',
    cost_per_build_cents: 0.1,
    description: 'Fast and cheap for simple builds',
    tier: 'free',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    icon: '🔵',
    cost_per_build_cents: 0.1,
    description: 'Google\'s fastest model, great value',
    tier: 'free',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    icon: '🔵',
    cost_per_build_cents: 0.7,
    description: 'Deep reasoning, long context',
    tier: 'pro',
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    icon: '🟣',
    cost_per_build_cents: 0,
    description: 'Open-source powerhouse, ultra-fast via Groq',
    tier: 'free',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    icon: '🔴',
    cost_per_build_cents: 0.4,
    description: 'European AI, strong code generation',
    tier: 'pro',
  },
  {
    id: 'mixtral-8x22b',
    name: 'Mixtral 8x22B',
    provider: 'Mistral (Groq)',
    icon: '🔴',
    cost_per_build_cents: 0.2,
    description: 'MoE architecture, efficient and capable',
    tier: 'pro',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    icon: '🐋',
    cost_per_build_cents: 0.1,
    description: 'Top OSS model for code, cheap',
    tier: 'free',
  },
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    provider: 'Alibaba (Groq)',
    icon: '🟡',
    cost_per_build_cents: 0.1,
    description: 'Multilingual, strong at frontend code',
    tier: 'free',
  },
] as const;
```

### Style Presets

```typescript
export const STYLE_PRESETS = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean whitespace, light type, no noise',
    preview_color: '#F5F5F5',
    prompt_modifier: 'Use extreme whitespace, minimal color palette (max 2 colors), thin typography, no decorative elements.',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast, thick type, strong color',
    preview_color: '#FF3B00',
    prompt_modifier: 'Use thick, oversized typography, high contrast colors, bold geometric shapes, strong visual hierarchy.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Professional, trustworthy, structured',
    preview_color: '#1E40AF',
    prompt_modifier: 'Use professional blue/gray palette, structured grid layout, clear hierarchy, trustworthy and clean.',
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun, colorful, rounded, energetic',
    preview_color: '#F59E0B',
    prompt_modifier: 'Use rounded corners, bright saturated colors, playful illustrations or icons, warm friendly tone.',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme, glows, modern SaaS',
    preview_color: '#0A0A0A',
    prompt_modifier: 'Dark background (#0a0a0a), light text, subtle glows and gradients, premium SaaS aesthetic.',
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Raw, grid-based, stark borders',
    preview_color: '#FFFFFF',
    prompt_modifier: 'Brutalist web design: thick black borders, monospaced fonts, no border-radius, raw grid layout, stark contrast.',
  },
] as const;
```

### Inspiration Gallery (`/gallery`)

Public page, no auth required to browse.

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search builds...    [Style ▼] [Category ▼] [Model ▼]    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Landing  │ │ Dashboard│ │ Portfolio│ │ E-commerce│      │
│  │ Page     │ │          │ │          │ │           │      │
│  │ [Clone ↗]│ │ [Clone ↗]│ │ [Clone ↗]│ │ [Clone ↗] │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

Gallery item = `marketplace_listings` row (see schema).

**Clone flow**: click "Clone →" → if authed: creates new project, copies build config. If not authed: redirects to `/sign-up`.

#### Category Tags

```typescript
export const GALLERY_CATEGORIES = [
  'Landing Page', 'Dashboard', 'Portfolio', 'E-commerce',
  'Blog', 'SaaS', 'Marketing', 'Documentation',
  'Mobile App', 'Admin Panel', 'Component Library', 'Other'
] as const;
```

#### Publish to Gallery

From the builder, users can click "Publish to Gallery" (Pro only):
- Requires `marketplace_listings.is_public = true`
- Screenshot auto-taken via Playwright/screenshot API
- Tags chosen from dropdown
- Listed in public gallery within 60s

---

## 7. Onboarding State Machine

Shown **once per user**, immediately after their first sign-up (not on subsequent logins).

### Steps

```
Welcome → What-to-build → Choose-model → First-build
  (1)          (2)              (3)           (4)
```

### Step Details

#### Step 1: Welcome (`/onboarding/welcome`)
```
"Welcome to Argus, [Name] 👋"
"You're about to build something incredible."
[Continue →]
```

#### Step 2: What to Build (`/onboarding/what-to-build`)
```
"What do you want to build?"

○ Clone a website
○ Build from scratch
○ Generate from a prompt
○ Explore inspiration gallery

[Continue →]
```
Saves `what_to_build` to `onboarding_state`.

#### Step 3: Choose Model (`/onboarding/choose-model`)
```
"Pick your AI model"
[Shows 3 highlighted options: Claude, GPT-4o, Llama]
"You can always change this later."
[Continue →]
```
Saves `chosen_model` to both `onboarding_state` and `user_model_preferences`.

#### Step 4: First Build (`/onboarding/first-build`)
```
"Let's build your first project!"
[URL input / prompt input — same as builder]
"Your sandbox is warming up..."
[Full builder UI loads inline]
```
On completion → `onboarding_state.completed_at = now()`, redirect to `/workspace`.

### State Tracking

```typescript
// onboarding_state table (see migration)
interface OnboardingState {
  user_id: string;
  current_step: 'welcome' | 'what_to_build' | 'choose_model' | 'first_build' | 'completed';
  what_to_build: string | null;
  chosen_model: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Guard Logic

```typescript
// In middleware.ts
const { data: onboarding } = await supabase
  .from('onboarding_state')
  .select('current_step, completed_at')
  .eq('user_id', user.id)
  .single();

// If no onboarding record OR completed_at is null → redirect to /onboarding/[step]
// Only redirect on routes within the app (not landing, auth, public)
if (!onboarding?.completed_at && !pathname.startsWith('/onboarding')) {
  return NextResponse.redirect(new URL('/onboarding/welcome', req.url));
}
```

---

## 8. Auth Expansion

### Current State
- Email + password
- Google OAuth

### v2 Additions
- GitHub OAuth
- Microsoft OAuth (Azure AD)

See `OAUTH_SETUP.md` for exact setup instructions.

### Auth Provider Matrix

| Provider | Status | Use Case |
|----------|--------|----------|
| Email | ✅ Existing | Primary |
| Google | ✅ Existing | Most popular |
| GitHub | 🆕 v2 | Developers |
| Microsoft | 🆕 v2 | Enterprise / university |

### Profile Auto-Population

The existing `handle_new_user()` trigger already handles this. Additions needed:

```sql
-- In handle_new_user(), also initialize onboarding_state:
INSERT INTO public.onboarding_state (user_id, current_step)
VALUES (new.id, 'welcome')
ON CONFLICT (user_id) DO NOTHING;
```

---

## 9. Database Schema Overview

Full SQL in `supabase/migrations/20260224_v2_schema.sql`.

### New Tables

| Table | Purpose |
|-------|---------|
| `projects` | Multi-project workspace (main new entity) |
| `teams` | Optional team container |
| `team_members` | Users → teams with roles |
| `project_collaborators` | Users → projects with roles (direct invite) |
| `project_builds` | Links existing `builds` to projects |
| `marketplace_listings` | Public gallery entries |
| `onboarding_state` | Per-user onboarding progress |
| `user_model_preferences` | Default model + style per user |

### Entity Relationships

```
auth.users (Supabase managed)
  │
  ├─ profiles (1:1)
  ├─ onboarding_state (1:1)
  ├─ user_model_preferences (1:1)
  ├─ projects (1:many, via created_by)
  │     ├─ project_builds (1:many)
  │     │     └─ builds (FK, existing table)
  │     └─ project_collaborators (1:many)
  │           └─ profiles (FK)
  └─ team_members (1:many)
        └─ teams (1:many projects via team_id)
```

---

## 10. API Routes

### New Endpoints

```
POST   /api/projects                         → create project
GET    /api/projects                         → list user's projects
GET    /api/projects/[projectId]             → get project details
PATCH  /api/projects/[projectId]             → update project (name, starred, etc.)
DELETE /api/projects/[projectId]             → delete project (owner only)

POST   /api/projects/[projectId]/builds      → create build under project
GET    /api/projects/[projectId]/builds      → list project builds

POST   /api/projects/[projectId]/invite      → invite collaborator
DELETE /api/projects/[projectId]/collaborators/[userId] → remove collaborator

GET    /api/gallery                          → list public gallery items
POST   /api/gallery/publish                  → publish build to gallery (Pro)

GET    /api/onboarding                       → get user's onboarding state
PATCH  /api/onboarding                       → update onboarding step

GET    /api/marketplace/models               → list available models + pricing
POST   /api/user/model-preferences           → save preferred model/style
```

### Modified Endpoints

```
POST   /api/create-ai-sandbox-v2             → now accepts projectId, buildId
POST   /api/generate-ai-code-stream          → now saves to project_builds on completion
POST   /api/apply-ai-code-stream             → now saves files to project_builds
```

---

## 11. Component Tree

```
app/
├── workspace/
│   ├── page.tsx                    → <WorkspacePage /> (project grid)
│   ├── layout.tsx                  → <WorkspaceLayout /> (sidebar + topnav)
│   └── [projectId]/
│       ├── page.tsx                → <ProjectPage /> (build list)
│       └── build/
│           └── [buildId]/
│               └── page.tsx        → <BuilderPage /> (evolved /generation)
│
├── marketplace/
│   └── page.tsx                    → <MarketplacePage />
│
├── gallery/
│   └── page.tsx                    → <GalleryPage />
│
└── onboarding/
    ├── layout.tsx
    ├── welcome/page.tsx
    ├── what-to-build/page.tsx
    ├── choose-model/page.tsx
    └── first-build/page.tsx

components/
├── workspace/
│   ├── WorkspaceSidebar.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectGrid.tsx
│   ├── NewProjectModal.tsx
│   └── ProjectContextMenu.tsx
│
├── builder/
│   ├── BuilderTopNav.tsx
│   ├── ModelSelector.tsx           (dropdown + marketplace panel)
│   ├── PresenceAvatars.tsx
│   ├── ShareModal.tsx
│   ├── PublishButton.tsx
│   └── BuildStatusBadge.tsx
│
├── collaboration/
│   ├── InviteModal.tsx
│   ├── CollaboratorList.tsx
│   └── RoleBadge.tsx
│
├── gallery/
│   ├── GalleryGrid.tsx
│   ├── GalleryCard.tsx
│   ├── GalleryFilters.tsx
│   └── PublishToGalleryModal.tsx
│
└── onboarding/
    ├── OnboardingLayout.tsx
    ├── StepIndicator.tsx
    ├── WelcomeStep.tsx
    ├── WhatToBuildStep.tsx
    ├── ChooseModelStep.tsx
    └── FirstBuildStep.tsx
```

---

## 12. Realtime Architecture

### Supabase Realtime Channels

| Channel | Event | Purpose |
|---------|-------|---------|
| `build:{buildId}` | `presence` | Who's viewing the build |
| `build:{buildId}` | `broadcast:cursor` | Live cursor positions |
| `build:{buildId}` | `postgres_changes:project_builds` | Build status updates |
| `project:{projectId}` | `postgres_changes:project_builds` | New builds added |

### Presence Flow

```typescript
// hooks/usePresence.ts
export function usePresence(buildId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`build:${buildId}`, {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        setOnlineUsers(Object.values(state).flat());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Show toast: "Alex joined"
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Update list
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [buildId]);

  return { onlineUsers };
}
```

---

## 13. Billing & Pricing

### Plan Structure (v2)

| Feature | Free | Pro ($29/mo) | Team ($79/mo) |
|---------|------|-------------|---------------|
| Projects | 3 | Unlimited | Unlimited |
| Builds/month | 3 | Unlimited | Unlimited |
| Models | Free models only | All models | All models |
| Collaborators | 0 | 2 | Unlimited |
| Publish to Gallery | ❌ | ✅ | ✅ |
| Custom domains | ❌ | ❌ | ✅ (Phase 2) |
| Priority sandbox | ❌ | ✅ | ✅ |

### Stripe Integration (Existing + New)

- Add `team` plan to Stripe with `STRIPE_TEAM_PRICE_ID`
- Pro plan: unchanged
- Team plan: creates `teams` record on subscription, adds owner as `team_members` with `owner` role

---

## 14. File Structure

```
argus/
├── app/
│   ├── workspace/              ← NEW
│   ├── gallery/                ← NEW
│   ├── marketplace/            ← NEW
│   ├── onboarding/             ← NEW
│   ├── dashboard/              ← KEEP (redirects to /workspace)
│   ├── generation/             ← KEEP (redirects to /workspace/[id]/build/[id])
│   └── app/                    ← KEEP (redirects to /workspace)
│
├── components/
│   ├── workspace/              ← NEW
│   ├── builder/                ← NEW (extract from generation/page.tsx)
│   ├── collaboration/          ← NEW
│   ├── gallery/                ← NEW
│   └── onboarding/             ← NEW
│
├── hooks/
│   ├── usePresence.ts          ← NEW
│   ├── useProject.ts           ← NEW
│   └── useOnboarding.ts        ← NEW
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← KEEP
│   │   └── server.ts           ← KEEP
│   ├── models.ts               ← NEW (MARKETPLACE_MODELS const)
│   ├── presets.ts              ← NEW (STYLE_PRESETS const)
│   └── permissions.ts          ← NEW (role-based access checks)
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql   ← EXISTING
        └── 20260224_v2_schema.sql   ← NEW
```

---

## 15. Migration Strategy

### Phase 1 — Foundation (Week 1-2)
1. Run `20260224_v2_schema.sql` migration
2. Add GitHub + Microsoft OAuth (see `OAUTH_SETUP.md`)
3. Build onboarding flow (4 steps)
4. Build `/workspace` project grid

### Phase 2 — Builder Integration (Week 3-4)
1. Evolve `/generation` → `/workspace/[projectId]/build/[buildId]`
2. Add project context to sandbox creation
3. Save build state to `project_builds`
4. Add model marketplace panel

### Phase 3 — Collaboration (Week 5-6)
1. Invite flow + Resend emails
2. Supabase Realtime presence
3. RLS enforcement testing
4. Role-based UI conditionals

### Phase 4 — Gallery & Polish (Week 7-8)
1. Build `/gallery` page
2. Publish flow (Pro gate)
3. Inspiration clone flow
4. Performance audit + animations (Framer Motion)

### Backward Compatibility

All existing routes (`/dashboard`, `/app`, `/generation`) redirect to their v2 equivalents. No existing user data is lost — `builds` table is preserved, `project_builds` links new projects to old builds.

---

*Last updated: 2026-02-24 | Feature branch: `feature/argus-v2`*
