# Argus — AI Web App Builder

Argus is a Lovable/Bolt competitor: users describe what they want to build, an AI generates a full web app, and they iterate via chat. Live at [buildargus.dev](https://buildargus.dev).

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- **Auth & DB:** Supabase (GitHub OAuth + email, Postgres, RLS)
- **Payments:** Stripe (checkout sessions, billing portal, webhooks)
- **AI:** AI SDK (`streamText`) with Anthropic, OpenAI, Google, Groq providers
- **Sandboxes:** E2B / Vercel Sandbox for live code preview
- **Email:** Resend
- **Rate Limiting:** Upstash Redis
- **Error Tracking:** Sentry
- **Encryption:** AES-256-GCM for BYOK API key storage

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run test:unit    # Unit tests only
npm run test:api     # API route tests only
npm run test:e2e     # Playwright E2E tests
```

## Directory Structure

```
app/                    # Next.js App Router pages and API routes
  api/                  # ~25 API route handlers
  (auth)/               # Auth pages (sign-in, sign-up)
  workspace/            # Main workspace app (project dashboard, editor)
  onboarding/           # New user onboarding flow
  marketplace/          # Community templates & listings
  admin/                # Admin panel

components/
  workspace-v2/         # Workspace UI (ported from HTML prototype, uses vanilla DOM)
  editor/               # Code editor components
  landing/              # Landing page components
  shared/               # Reusable components (effects/, icons/, layout/, ui/)
  ui/                   # shadcn/ui primitives

lib/
  ai/                   # AI provider setup, model configs, BYOK key resolver
  api/                  # Shared API helpers (auth, response, error handling)
  config/               # Centralized env config (env.ts)
  workspace/            # Workspace API layer + state (typed, extracted from workspace-v2)
  supabase/             # Supabase client factories (server.ts, client.ts, middleware.ts)
  stripe/               # Stripe client + webhook helpers
  subscription/         # Subscription gating logic
  sandbox/              # E2B/Vercel sandbox management
  crypto.ts             # AES-256-GCM encryption for BYOK keys
  models.ts             # AI model definitions (IDs, names, providers)
  ratelimit.ts          # Upstash rate limiter
  validation.ts         # Input validation helpers

types/
  database.ts           # TypeScript types matching Supabase schema exactly

supabase/
  migrations/           # SQL migrations (source of truth for DB schema)

hooks/                  # React hooks
```

## Key Patterns

### Supabase Client

- **Server (API routes):** `import { createClient } from '@/lib/supabase/server'`
- **Client (React):** `import { createClient } from '@/lib/supabase/client'`
- **Middleware:** `import { updateSession } from '@/lib/supabase/middleware'`
- Do NOT create inline `createSupabaseServer()` functions — use the shared factory.

### API Routes

```typescript
import { createClient } from '@/lib/supabase/server';
import { requireAuth, ApiError } from '@/lib/api';
import { success, error, handleError } from '@/lib/api';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);  // throws ApiError(401) if not authed
    // ... your logic
    return success(data);
  } catch (err) {
    return handleError(err, 'GET /api/your-route');
  }
}
```

### Environment Variables

All env vars are centralized in `lib/config/env.ts`. Use `env.supabase.url` instead of `process.env.NEXT_PUBLIC_SUPABASE_URL`. Server-only vars throw if accessed on the client.

### Database Types

`types/database.ts` must match `supabase/migrations/` exactly. When adding a migration, update the types file to match.

### Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/ratelimit';
const limit = await checkRateLimit(`user:${userId}`, 'operationName');
```

### BYOK (Bring Your Own Key)

Users can add their own API keys. Keys are encrypted with AES-256-GCM via `lib/crypto.ts` and stored in `user_api_keys`. The resolver at `lib/ai/user-key-resolver.ts` maps model prefixes to providers.

## Known Tech Debt

- **workspace-v2 components** use vanilla DOM manipulation instead of React patterns (ported from HTML prototype). Many still have `@ts-nocheck`.
- **Dual CSS:** Tailwind for most of the app, but workspace-v2 has its own CSS file (`workspace-v2.css`).
- **Some large components** need splitting: EditorPage (~860 lines), GitSyncButton (~800 lines).
- **Test coverage** is minimal (~2.8% by file count). Tests live in `tests/`.

## Database

### Core Tables
- `profiles` — User profiles (extends Supabase auth.users)
- `projects` — User projects
- `project_builds` — Build versions per project
- `build_messages` — Chat history per build
- `project_collaborators` — Invite-based collaboration
- `teams` / `team_members` — Team management
- `marketplace_listings` — Published templates
- `onboarding_state` — Onboarding progress
- `user_model_preferences` — Default AI model/style
- `user_api_keys` — Encrypted BYOK keys
- `user_connectors` — External service connections
- `referrals` — Referral tracking
- `recent_views` — Recently viewed projects

### RLS
All tables have Row Level Security policies. Users can only access their own data or data shared via collaborators/teams.
