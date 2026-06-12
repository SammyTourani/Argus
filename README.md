# Argus

AI web app builder. Describe what you want to build, and an AI generates a full web app from your prompt (or clones an existing site from a URL). You then iterate through chat against a live, sandboxed preview.

Live at [buildargus.dev](https://buildargus.dev).

It is in the same product space as Lovable and Bolt: prompt in, working web app out, refine by conversation.

## Features

- **Prompt-to-app generation.** Describe an app in natural language and Argus generates a full web app, streaming the result back as it builds.
- **Clone from URL.** Point Argus at an existing site and it reconstructs a working app from it (web scraping via Firecrawl).
- **Iterate via chat.** Keep refining the generated app through a chat interface, with build history preserved per project.
- **Live sandboxed previews.** Generated code runs in an isolated cloud sandbox (Vercel Sandbox or E2B) so you can see the app running as it changes.
- **Multi-LLM orchestration with fallback.** Routes across Anthropic, OpenAI, Google, and Groq through the Vercel AI SDK, falling back across providers.
- **Bring Your Own Key (BYOK).** Users can supply their own provider API keys. Keys are encrypted at rest with AES-256-GCM and resolved per model at request time.
- **Accounts and billing.** Supabase auth (GitHub OAuth + email) and Stripe billing (checkout sessions, billing portal, webhooks) with plan-based gating.
- **Teams and collaboration.** Invite-based project collaborators and team management.
- **Marketplace.** Publish and browse community templates.
- **Production plumbing.** Upstash Redis rate limiting, Resend transactional email, and Sentry error tracking.

## Tech Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| AI | Vercel AI SDK v5 (`ai`) with `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/groq` |
| Auth & DB | Supabase (GitHub OAuth + email, Postgres, Row Level Security) |
| Payments | Stripe (checkout, billing portal, webhooks) |
| Sandboxes | Vercel Sandbox / E2B for live preview |
| Scraping | Firecrawl (URL-to-app cloning) |
| Rate limiting | Upstash Redis |
| Email | Resend |
| Error tracking | Sentry |
| Encryption | AES-256-GCM for BYOK key storage |
| Styling | Tailwind CSS with a custom design-token system |

The codebase is roughly 70k lines of TypeScript with 49 API route handlers and 13 SQL migrations.

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (Postgres + auth)
- API keys for at least one AI provider (Anthropic, OpenAI, Google, or Groq)
- A sandbox provider (Vercel Sandbox or E2B) for live previews

Stripe, Upstash, Resend, Sentry, and Firecrawl are needed for billing, rate limiting, email, error tracking, and URL cloning respectively.

### Setup

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.example .env.local
# Fill in the values — see .env.example for the full list and notes

# 3. Apply database migrations
# Migrations live in supabase/migrations/ (source of truth for the schema)

# 4. Run the dev server
npm run dev
```

The app runs at http://localhost:3000.

See [docs/setup-local.md](docs/setup-local.md) and [docs/setup-infrastructure.md](docs/setup-infrastructure.md) for full local and infrastructure setup, and [docs/oauth-setup.md](docs/oauth-setup.md) for GitHub OAuth.

### Environment Variables

All environment variables are listed in [.env.example](.env.example) and read through a single typed config at `lib/config/env.ts`. Server-only variables throw if accessed on the client. You need Supabase, at least one AI provider, and a sandbox provider to run the core flow; the rest enable billing, email, rate limiting, and observability.

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (all tests)
npm run test:unit  # Unit tests
npm run test:api   # API route tests
npm run test:e2e   # Playwright E2E tests
```

## Project Structure

```
app/                 # Next.js App Router pages and 49 API route handlers
  api/               # Generation, sandboxes, billing/webhooks, auth, marketplace, admin
  (auth)/            # Sign-in / sign-up
  workspace/         # Main builder workspace
  onboarding/        # New-user onboarding
  marketplace/       # Community templates
  admin/             # Admin panel
components/          # UI (landing, editor, shared, shadcn/ui primitives, workspace-v2)
lib/
  ai/                # Provider setup, model configs, BYOK key resolver
  api/               # Shared API helpers (auth, response, error handling)
  config/env.ts      # Centralized, typed environment config
  supabase/          # Supabase client factories (server, client, middleware)
  stripe/            # Stripe client + webhook helpers
  subscription/      # Plan-based gating
  sandbox/           # E2B / Vercel sandbox management
  crypto.ts          # AES-256-GCM encryption for BYOK keys
  models.ts          # AI model definitions (ids, names, providers)
  ratelimit.ts       # Upstash rate limiter
  validation.ts      # Input validation helpers
types/database.ts    # TypeScript types mirroring the Supabase schema
supabase/migrations/ # SQL migrations (13) — source of truth for the DB schema
e2b-template/        # E2B sandbox template
hooks/               # React hooks
styles/              # Tailwind + design-system tokens
```

There is more detail in [docs/architecture.md](docs/architecture.md) and [CLAUDE.md](CLAUDE.md).

## Status and Known Limitations

Argus is a real, deployed application, but it is a solo-built product and carries some known tech debt:

- The `components/workspace-v2/` UI was ported from an HTML prototype and uses vanilla DOM manipulation rather than React patterns; many of those files still carry `@ts-nocheck`.
- Workspace-v2 ships its own CSS file alongside the app's Tailwind design system (dual styling).
- A few large components could be split up.
- Automated test coverage is minimal; tests live in `tests/`.

## License

[MIT](LICENSE)
