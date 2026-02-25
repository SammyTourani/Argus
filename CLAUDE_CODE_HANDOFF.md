# Argus v2 — Claude Code Handoff Document
**Last updated:** 2026-02-25 | **Branch:** `feature/argus-v2` | **Commits ahead of main:** 57

---

## What This Project Is

Argus is an AI web-app builder / website cloner. Users paste a URL → Argus screenshots it, extracts the design system, and generates production-quality React components. Think Lovable.ai / Bolt.new but for cloning existing sites. Won Google × Cerebral Valley Hackathon, 3K+ users.

**Live production URL:** https://argus-six-omega.vercel.app  
**PR awaiting merge:** https://github.com/SammyTourani/Argus/pull/2  
**Repo:** https://github.com/SammyTourani/Argus  
**Local path:** `/Users/sammytourani/.openclaw/workspace/argus`

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + design system in `styles/design-system/` |
| UI | Radix UI primitives, shadcn components in `components/ui/shadcn/` |
| Animations | Framer Motion |
| Auth | Supabase Auth (email/password, magic link, Google, GitHub, Microsoft OAuth) |
| Database | Supabase (PostgreSQL + RLS) |
| Deployment | Vercel (auto-deploy on push) |
| Payments | Stripe (Checkout + webhooks) |
| Monitoring | Sentry |

---

## Critical Next.js 16 Rules (READ FIRST)

1. **`proxy.ts` not `middleware.ts`** — Next.js 16 renamed middleware to proxy. The file is at `/proxy.ts` and exports `export async function proxy(...)`. NEVER recreate `middleware.ts` — it will break the Vercel build with "Both middleware and proxy detected" error.
2. **Async params** — All route handlers that receive `params` must type them as `Promise`: `{ params }: { params: Promise<{ projectId: string }> }` and then `const { projectId } = await params`.
3. **`await cookies()`** — In all server components and route handlers using cookies, must `await cookies()` (not `cookies()` synchronously).
4. **`useSearchParams()` in Suspense** — Any page using `useSearchParams()` must be split into an inner component and a default export that wraps the inner in `<Suspense>`. Pattern: see `app/account/page.tsx`.

---

## Auth & Supabase Client Pattern

**Server components / route handlers:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
)
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Client components:**
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

---

## Database Schema (v2)

All migrations live in `supabase/migrations/`. There are 3 migration files:
- `001_initial_schema.sql` — original schema (profiles, builds tables)
- `20260224_v2_schema.sql` — v2 schema (all new tables below, **must be applied to Supabase**)
- `20260225_rls_policies.sql` — security hardening, RLS gap fixes (**must be applied to Supabase**)

### Key tables (v2):
| Table | Purpose | Key columns |
|---|---|---|
| `projects` | User projects | `id`, `created_by` (NOT `user_id`), `name`, `description`, `status` |
| `project_builds` | Build runs per project (NOT `builds`) | `id`, `project_id`, `created_by`, `status`, `html_content`, `preview_url`, `sandbox_id` |
| `build_messages` | AI chat messages per build | `id`, `build_id`, `project_id`, `user_id`, `role`, `content` |
| `project_collaborators` | Team members on a project | `project_id`, `user_id`, `role` |
| `teams` / `team_members` | Team workspaces | standard |
| `marketplace_listings` | Community templates | `id`, `user_id`, `title`, `category` |
| `onboarding_state` | User onboarding progress | `user_id`, `completed_steps`, `completed_at` |
| `user_model_preferences` | Default AI model per user | `user_id`, `preferred_model`, `preferred_style` |
| `profiles` | User profiles | `id`, `email`, `full_name`, `avatar_url` |

**⚠️ Common mistakes to avoid:**
- Table is `project_builds` NOT `builds`
- Column is `created_by` NOT `user_id` in projects and project_builds
- Both migrations MUST be applied to Supabase before any DB features work

---

## Route Map

### Protected page routes (require auth, guarded by `proxy.ts`)
```
/workspace                          → Project grid dashboard
/workspace/[projectId]              → Project detail + ActivityFeed
/workspace/[projectId]/build/[id]  → 3-panel builder (main app)
/workspace/[projectId]/build/new    → Template picker → start build
/workspace/[projectId]/settings     → GitHub integration, collaborators
/workspace/invite/[token]           → Invite acceptance flow
/account                            → Profile, billing, model defaults
/generation                         → Old builder (legacy, preserved)
/onboarding                         → Onboarding flow (guarded by cookie)
```

### Public page routes
```
/                         → Landing page
/sign-in                  → Auth (split-panel, OAuth + email + magic link)
/sign-up                  → Auth
/forgot-password          → Password reset (Supabase resetPasswordForEmail)
/gallery                  → Inspiration gallery (12 hardcoded showcase cards)
/marketplace              → Model marketplace (8 AI models + 6 style presets)
/builds/[token]           → Public build share link
/privacy, /terms          → Legal pages
```

### Redirect stubs (do NOT delete)
```
/app        → redirects to /workspace
/builder    → redirects to /workspace
/dashboard  → redirects to /workspace
```

### API routes (35 total)
```
POST   /api/projects                                     → create project
GET    /api/projects                                     → list user's projects
GET/PATCH/DELETE /api/projects/[projectId]               → single project CRUD
GET/POST /api/projects/[projectId]/builds                → list/create builds
GET/PATCH /api/projects/[projectId]/builds/[buildId]     → single build CRUD
GET/POST /api/projects/[projectId]/builds/[buildId]/messages → chat messages
GET/POST/DELETE /api/projects/[projectId]/collaborators  → team management
DELETE /api/projects/[projectId]/collaborators/[id]      → remove collaborator
GET    /api/projects/[projectId]/summary                 → AI context summary
POST   /api/deploy                                       → Vercel deploy
POST   /api/github/sync                                  → sync to GitHub
GET    /api/github/import                                → import from GitHub
POST   /api/generate-ai-code-stream                      → main AI generation (streaming, auth required)
POST   /api/analyze-edit-intent                          → visual editor AI analysis (auth required)
POST   /api/create-ai-sandbox                            → E2B sandbox creation
POST   /api/create-ai-sandbox-v2                         → E2B sandbox v2
POST   /api/stripe/create-checkout-session               → Stripe checkout
POST   /api/stripe/billing-portal                        → Stripe customer portal
POST   /api/stripe/webhook                               → Stripe webhook handler
GET/POST /api/user/onboarding                            → onboarding state
GET/POST /api/user/preferences                           → model preferences
GET    /api/auth/callback, /api/auth/confirm             → Supabase OAuth callbacks
```

---

## Component Map

### Builder components (`components/builder/`)
| Component | Purpose |
|---|---|
| `ChatPanel.tsx` | Left panel — AI chat, message history, file updates |
| `PreviewPanel.tsx` | Center panel — live iframe preview, accepts `iframeRef` prop |
| `CodePanel.tsx` | Right panel — generated code display |
| `BuilderNav.tsx` | Top bar with project name, model badge, back link, `publishSlot` prop |
| `ModelSelector.tsx` | AI model dropdown in builder |
| `VisualEditor.tsx` | Click-to-edit overlay on iframe — element inspector, text/style/layout tabs |
| `BuildStatusBar.tsx` | Bottom bar — live status (Generating → Applying → Done), file count, duration |
| `VersionHistoryPanel.tsx` | Version history sidebar with restore/checkpoint |
| `VersionDiffBadge.tsx` | Pulsing badge showing unsaved version |
| `PublishButton.tsx` | 4-state deploy button (idle → deploying → deployed → error) |
| `DeploySuccessBanner.tsx` | Auto-dismiss success banner after deploy with countdown |
| `GitSyncButton.tsx` | GitHub sync action button |
| `KeyboardShortcuts.tsx` | ⌘/ help modal listing all keyboard shortcuts |

**Keyboard shortcuts wired in builder:**
- `⌘/` → toggle KeyboardShortcuts modal
- `⌘⇧E` → toggle code panel visibility
- `⌘⇧V` → toggle VisualEditor
- `Escape` → close any open modal

### Workspace components (`components/workspace/`)
| Component | Purpose |
|---|---|
| `WorkspaceSidebar.tsx` | Sidebar nav with mobile drawer (hamburger button on mobile) |
| `ProjectCard.tsx` | Project card in dashboard grid |
| `NewProjectCard.tsx` | "New project" CTA card |
| `NewProjectDialog.tsx` | Create project modal → POST /api/projects |
| `TemplateLibrary.tsx` | 10 template starters for new builds |
| `ActivityFeed.tsx` | Realtime build/deploy activity timeline (Supabase subscription) |
| `ShareDialog.tsx` | Share project link dialog |
| `InviteButton.tsx` | Invite collaborator button |
| `TeamPresence.tsx` | Realtime team avatars |
| `GitHubConnectButton.tsx` | GitHub OAuth connection flow |

### UI components
- `components/ui/Toast.tsx` — Global toast system (`ToastProvider`, `useToast()` hook, stacked, auto-dismiss)
- `components/ui/shadcn/` — All shadcn primitives
- `components/auth/AuthLayout.tsx` — Split-panel auth wrapper
- `components/auth/MatrixAsciiPanel.tsx` — Animated dark panel for auth pages

### Onboarding
- `components/onboarding/OnboardingFlow.tsx` — Multi-step flow, sets `argus_onboarding_done` cookie on complete

---

## Context Persistence (builder)

The builder uses a dual-layer persistence strategy:
1. **localStorage** — immediate, offline-first. Key: `argus_build_messages_${buildId}`
2. **Supabase `build_messages` table** — cross-device sync via `/api/projects/[id]/builds/[id]/messages`

API failures are non-blocking (localStorage is source of truth for the session).

---

## Security Layer

### Rate limiting (`lib/ratelimit.ts`)
Uses Upstash Redis (already configured in `.env.local`). Sliding window limits:
- `generate-ai-code-stream`: 10 requests/min per user
- `deploy`: 3 requests/hour per user
- `projects POST`: 20 requests/hour per user
- `analyze-edit-intent`: 10 requests/min per user

### Input validation (`lib/validation.ts`)
- Prompts: HTML stripped, max 10,000 chars
- Model IDs: validated against allowlist of 20 models
- Project names: HTML stripped, max 100 chars
- Descriptions: HTML stripped, max 500 chars

### Auth protection
- `generate-ai-code-stream` and `analyze-edit-intent` require `getUser()` auth check (these were unprotected before v2, anyone could burn API credits)
- All `/api/projects/*`, `/api/deploy`, `/api/stripe/*`, `/api/github/*` require auth

---

## Environment Variables Required

All should already be in `.env.local`. Key ones:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (at least one required)
ANTHROPIC_API_KEY=           # Claude models
OPENAI_API_KEY=              # GPT models
GOOGLE_GENERATIVE_AI_API_KEY= # Gemini models

# Deploy
VERCEL_TOKEN=                # for one-click deploy feature
NEXT_PUBLIC_APP_URL=https://buildargus.com  # ⚠️ NOT YET SET IN VERCEL

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
SENTRY_AUTH_TOKEN=
```

---

## What's NOT Yet Done (Before Going Live)

These are **manual actions in dashboards** — all code is complete:

1. **Apply DB migrations** — Go to Supabase SQL Editor, run:
   - `supabase/migrations/20260224_v2_schema.sql` (v2 schema)
   - `supabase/migrations/20260225_rls_policies.sql` (security hardening)

2. **Enable GitHub OAuth** — Supabase → Auth → Providers → GitHub → enable + add OAuth App credentials

3. **Activate Stripe** — dashboard.stripe.com → activate live mode

4. **Set Vercel env var** — Add `NEXT_PUBLIC_APP_URL=https://buildargus.com` in Vercel project settings

5. **Merge PR #2** — https://github.com/SammyTourani/Argus/pull/2 → confirms Vercel auto-deploy succeeds

---

## Known Polish Issues (Not Blockers)

- CTA button text is slightly left-aligned in some auth forms (should add `justify-center` / `text-center`)
- Forgot-password page lacks the matrix animated background of sign-in/sign-up pages
- Marketplace model card badges overlap text slightly ("Pro" badge covers "Anthropic")
- Gallery and Marketplace use hardcoded data (acceptable for MVP)

---

## How to Run Locally

```bash
cd /Users/sammytourani/.openclaw/workspace/argus
npm run dev       # starts on localhost:3000 (or 3001 if 3000 in use)
npx tsc --noEmit  # TypeScript check — must exit 0 before any commit
```

Current TypeScript status: ✅ **0 errors**
Current Vercel status: ✅ **READY** (latest deploy `dpl_RgkeGZz1`)

---

## Design System

- **Brand color:** `#FA4500` (orange-red) — used as `text-heat-100` / `bg-heat-100` in landing, `text-[#FA4500]` / `bg-[#FA4500]` in builder/workspace
- **Builder/workspace bg:** `#0A0A0A` (near black)
- **Builder text:** zinc color scale
- **Font (builder):** JetBrains Mono
- **Font (workspace/landing):** system sans + monospaced for code/labels
- **Accent for hover/border:** zinc-700/800 range

---

## Reasoning Behind Key Decisions

**Why `proxy.ts`?** Next.js 16 deprecated `middleware.ts` and renamed it to `proxy.ts`. The exported function is still called `middleware` internally but the file MUST be named `proxy.ts`. Having both causes a fatal Vercel build error.

**Why `project_builds` not `builds`?** `builds` was the original v1 table. v2 introduced `project_builds` with the `created_by` foreign key. Some legacy code referenced `builds` — all fixed in audit commit `0706598`.

**Why dual-layer context persistence?** localStorage is instant and works offline. Supabase sync is async and handles cross-device access. If Supabase fails, the session still works.

**Why `publishSlot` prop in BuilderNav?** Keeps the nav component composable — the deploy button is injected as a slot rather than hardcoded, so BuilderNav doesn't need to import deploy logic.

**Why Upstash for rate limiting?** The Redis credentials were already in `.env.local` from the Argus SaaS setup. Zero new infrastructure needed.

**Why `iframeRef` threading?** The VisualEditor needs to inject a script into the preview iframe to enable click-to-inspect. The ref is created in the builder page and passed down to both `PreviewPanel` (for the actual iframe) and `VisualEditor` (for the inspector script).

**Why `created_by` not `user_id`?** `created_by` is more semantically precise for a project ownership model — it's the user who created the resource, not just any `user_id` field.
