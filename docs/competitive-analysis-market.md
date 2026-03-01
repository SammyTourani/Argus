# Argus Competitive Analysis — AI Website Builder / Cloner Market
**Last Updated: February 25, 2026**

---

## Table of Contents
1. [Market Overview](#market-overview)
2. [Tier 1: Direct Competitors (AI Website/App Builders)](#tier-1-direct-competitors)
   - [Lovable](#1-lovable)
   - [Bolt.new](#2-boltnew)
   - [v0.dev](#3-v0dev)
   - [Replit](#4-replit)
   - [Cursor](#5-cursor)
   - [Windsurf](#6-windsurf)
3. [Tier 2: Adjacent Competitors](#tier-2-adjacent-competitors)
   - [Framer](#7-framer)
   - [Webflow](#8-webflow)
   - [Wix ADI / Wix Studio](#9-wix-adi--wix-studio)
   - [Hostinger AI Builder](#10-hostinger-ai-website-builder)
   - [Durable AI](#11-durable-ai)
   - [10Web AI Builder](#12-10web-ai-builder)
4. [Tier 3: Emerging / Niche](#tier-3-emerging--niche)
   - [Tempo Labs](#13-tempo-labs)
   - [Softgen](#14-softgen)
   - [Galileo AI (now Google Stitch)](#15-galileo-ai)
   - [Uizard](#16-uizard)
5. [Pricing Comparison Matrix](#pricing-comparison-matrix)
6. [Feature Comparison Matrix](#feature-comparison-matrix)
7. [Strategic Insights for Argus](#strategic-insights-for-argus)

---

## Market Overview

The AI website/app builder market has exploded in 2025-2026. Key dynamics:

- **Total addressable market**: Estimated $15B+ by 2027 for AI-assisted development tools
- **Leader**: Lovable.dev at $200M ARR, $6.6B valuation (Dec 2025 Series B)
- **Key trend**: Convergence toward "vibe coding" — natural language to full-stack apps
- **Pricing models diverging**: Credit/message-based (Lovable), token-based (Bolt, v0), effort-based (Replit), fixed monthly + credits (Cursor, Windsurf)
- **Tech stack convergence**: React + Tailwind + shadcn/ui + Supabase has become the de facto standard across Lovable, Bolt, v0, and Softgen

---

## Tier 1: Direct Competitors

---

### 1. LOVABLE
**URL**: lovable.dev (formerly GPT Engineer)
**Valuation**: $6.6B (Dec 2025, Series B of $330M led by Accel)
**ARR**: $200M | **MAU**: 2.3M | **Paying subscribers**: 180K | **Team size**: ~45
**Stack**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase

#### A. Product Architecture (Page Map)

| Route / Page | Description |
|---|---|
| `/` | Marketing homepage with demo video, social proof, CTA |
| `/pricing` | Pricing page (Free, Pro $25, Business $50, Enterprise custom) |
| `/templates` | Template gallery — pre-built app templates to fork |
| `/guides` | Tutorial/docs hub with use-case guides |
| `/blog` | Company blog with changelogs, tutorials, product updates |
| `/login` / `/signup` | Auth flow (Google, GitHub, email) |
| `/dashboard` | Main workspace — project grid, create new, search |
| `/project/:id` | Builder interface (chat + preview + code) |
| `/project/:id/settings` | Project settings (domain, GitHub, Supabase config) |
| `/settings/account` | Profile, email, avatar |
| `/settings/billing` | Subscription management, credit usage, top-up |
| `/settings/team` | Team members, roles, workspace sharing |
| `/videos` | Video tutorial gallery (Supabase integration, etc.) |

**Navigation**: Top navbar (logo, projects, docs, pricing) + sidebar in builder (chat, file tree, settings)

#### B. Core Builder Experience

- **Layout**: 2-panel split — Chat (left ~40%) + Live Preview (right ~60%)
- **Chat/prompt interface**: Full conversational AI chat with message history. Accepts text prompts, image uploads, and file references
- **Code editor**: "Dev Mode" accessible to all paid users — switch between prompt/preview/code views. Full code editor with syntax highlighting
- **Live preview**: Real-time iframe rendering. Changes stream in as AI writes code
- **Edit application**:
  - **Chat Mode**: Conversational agent that reasons about changes before applying (10x smarter in 2.0)
  - **Visual Edits**: Click any element in preview to edit text, colors, spacing, layout directly
  - **Dev Mode**: Direct code editing with GitHub sync
- **Version history**: "Versioning 2.0" — bookmark important versions, improved history view, one-click restore to any previous state. Uses GitHub commits under the hood
- **Undo**: Instant rollback per-prompt. Can revert to any historical state

#### C. Project Management

- **Dashboard**: Grid of project cards with thumbnails, project name, last modified date
- **Organization**: Flat list (no folders/tags). Search by name
- **Project cards**: Show live screenshot thumbnail, name, visibility (public/private), last edit time
- **Team workspaces**: Shared workspace for up to 20 collaborators on Free/Pro plans

#### D. Collaboration & Sharing

- **Real-time multiplayer**: Up to 20 concurrent users editing same project (Lovable 2.0)
- **Role-based access**: Admin, Editor roles in team workspace
- **Sharing**: Public projects visible to anyone. Private projects on paid plans
- **Comments/feedback**: Not natively built-in (rely on GitHub PRs/issues)
- **Team workspace**: Included on Business plan with SSO

#### E. Integrations

- **GitHub**: Two-way sync — every Lovable change auto-commits to GitHub. Changes pushed to GitHub reflect in Lovable. Branching support
- **Supabase**: Native first-class integration — auto-creates database tables, auth, storage. Managed Supabase instance or connect your own
- **Deployment**: One-click deploy to lovable.app subdomain. Custom domains on paid plans. Can self-host via GitHub export
- **Figma**: No direct Figma import (can paste screenshots)
- **Package management**: AI handles npm packages automatically
- **Stripe**: Via Supabase Edge Functions
- **Clerk**: Auth integration via API

#### F. Settings & Account

- **Profile**: Name, email, avatar
- **Billing**: Subscription tier, credit balance, usage history, top-up credits
- **API keys**: Supabase connection settings, custom API keys in project settings
- **Team management**: Invite by email, role assignment, workspace settings
- **Notifications**: Email notifications for team activity
- **Theme**: Light/dark mode

#### G. Pricing Strategy

| Plan | Price | Credits | Key Features |
|---|---|---|---|
| **Free** | $0/mo | 5/day (30/mo max) | Public projects, GitHub sync, lovable.app deploy |
| **Pro** | $25/mo | 100/mo + 5 daily (150 total) | Private projects, custom domains, Dev Mode, credit rollover, top-ups |
| **Business** | $50/mo | 100/mo + SSO | Team workspace, role-based access, design templates, personal projects |
| **Enterprise** | Custom | Custom | Dedicated support, onboarding, SCIM, audit logs, publishing controls |

- Credits are message-based (1 credit = 1 AI interaction regardless of complexity)
- On-demand top-ups available for Pro+ plans

#### H. AI Models

- **Default (Feb 2026)**: Gemini 3 Flash
- **Available**: Claude Sonnet 4.5/4.6, Claude Opus 4.5/4.6, GPT-5.2, Gemini 3 Flash, Deepseek, Groq, Mistral
- **Model selection**: Automatic based on task complexity, with some user selection capability
- **Chat Mode uses**: Claude Opus for reasoning tasks

#### I. Unique Differentiators

- **Strengths**: Largest user base (2.3M MAU), best Supabase integration, strongest full-stack generation, real multiplayer editing, security scanning
- **Weaknesses**: Credit-burning "looping" bug (AI gets stuck fixing same error), no native mobile app generation, no Figma import, limited to web apps only
- **Unique features**: Visual Edits (click-to-edit on preview), Security Scan before publish, Versioning 2.0 with bookmarks

---

### 2. BOLT.NEW
**URL**: bolt.new (by StackBlitz)
**Milestone**: 1M+ websites built/deployed in first 5 months (March 2025)
**Stack**: WebContainers (in-browser Node.js), supports Astro, Vite, Next.js, Svelte, Vue, Remix

#### A. Product Architecture (Page Map)

| Route / Page | Description |
|---|---|
| `/` | Homepage — chat input with model selector, recent projects, template gallery |
| `/pricing` | Pricing page (Free, Pro $20-$200, Teams $30/user, Enterprise) |
| `/blog` | Product blog with changelogs |
| `/enterprise` | Enterprise landing page |
| `/chat/:id` | Builder interface (chat + editor + preview) |
| `/~/settings` | Account settings, billing, model preferences |
| `/~/pricing` | In-app pricing page |

**Navigation**: Minimal — homepage doubles as dashboard. Top bar in builder has project name, deploy button, settings gear

#### B. Core Builder Experience

- **Layout**: 3-panel — Chat sidebar (left) + Code Editor (center) + Live Preview (right). Tabs for Preview/Code/Database at top of main panel
- **Chat/prompt interface**: Chatbox at bottom of left panel. Supports text prompts, file uploads, screenshots. "Plan Mode" outlines full project before writing code
- **Code editor**: Full in-browser IDE powered by WebContainers. File tree, syntax highlighting, terminal access
- **Live preview**: Real-time rendering in right panel. Responsive testing (mobile/tablet/desktop toggle)
- **Visual Inspector**: Click any element in preview to open inspector — adjust text, spacing, colors, button placement directly
- **Edit application**: Streaming code generation. AI reads errors from terminal/console and auto-fixes
- **Version history**: Full versioned backups in Bolt Cloud. One-click preview of older versions before restoring. Frontend rollback available (database rollback coming soon)
- **Persistent sidebar**: Auth, Functions, Storage, Analytics, Domains tabs

#### C. Project Management

- **Dashboard**: Homepage shows recent projects as cards. Minimal — no folders, tags, or advanced search
- **Project cards**: Thumbnail, name, last edited
- **Settings per project**: Domain, deployment target, backups, security audit

#### D. Collaboration & Sharing

- **Real-time editing**: Teams plan enables multiplayer real-time editing
- **Role-based permissions**: Admin controls, team-level roles
- **Sharing**: Share via URL. Public/private project visibility
- **Comments**: Not documented as a built-in feature
- **Enterprise**: Enterprise-grade protections, audit trails

#### E. Integrations

- **GitHub**: Built-in integration — push/pull code. Download as clean zip
- **Deployment**: Bolt Cloud (built-in) or Netlify (one-click switch). Buy/connect custom domains inside Bolt
- **Supabase**: Built-in database tab (V2). Auth, storage, functions all in sidebar
- **Netlify**: First-class integration with deployment guides
- **Figma**: Not natively supported
- **Package management**: AI installs npm packages, manages package.json

#### F. Settings & Account

- **Profile**: Account info, email
- **Billing**: Token balance, subscription tier, usage tracking
- **Model defaults**: Set default AI model for new projects
- **Team management**: Member management, billing, admin controls on Teams plan

#### G. Pricing Strategy

| Plan | Price | Tokens | Key Features |
|---|---|---|---|
| **Free** | $0/mo | 1M/mo (300K daily cap) | Basic access, public projects |
| **Pro** | $20/mo | 10M/mo | Private projects, all models, Bolt Cloud deploy |
| **Pro 50** | $50/mo | 26M/mo | Same features, more tokens |
| **Pro 100** | $100/mo | 55M/mo | Same features, more tokens |
| **Pro 200** | $200/mo | 120M/mo | Same features, more tokens |
| **Teams** | $30/user/mo | 26M/user | Shared workspace, admin controls, real-time collab |
| **Enterprise** | Custom | Custom | Enterprise security, compliance, dedicated support |

- Token-based pricing (input + output tokens consumed per AI interaction)
- Tokens from paid subs roll over for 1 additional month (since July 2025)
- Separately purchased token reloads carry forward indefinitely
- Annual billing saves 10%

#### H. AI Models

- **Primary**: Claude Agent (Anthropic Claude model family)
- **Options**: Haiku 4.5 (fast/cheap), Sonnet 4.5/4.6 (balanced), Opus 4.5/4.6 (powerful)
- **Legacy**: v1 Agent available as fallback
- **Selection**: Dropdown in chatbox. Can set default model in personal settings

#### I. Unique Differentiators

- **Strengths**: WebContainers (full Node.js in browser — no server needed), multi-framework support (not locked to React), built-in Bolt Cloud hosting with analytics, Visual Inspector, Plan Mode
- **Weaknesses**: Token-based pricing can burn fast on complex projects, no native Figma import, less polished UX than Lovable
- **Unique features**: In-browser terminal/filesystem via WebContainers, built-in analytics dashboard, Security Audit tab, database management directly in builder, Plan Mode for cost-efficient building

---

### 3. V0.DEV
**URL**: v0.app (by Vercel)
**Stack**: Next.js, React, Tailwind CSS, shadcn/ui. Deep Vercel ecosystem integration

#### A. Product Architecture (Page Map)

| Route / Page | Description |
|---|---|
| `/` | Homepage — featured projects, templates, trending |
| `/chat/:id` | Builder/chat interface — main workspace |
| `/pricing` | Pricing page |
| `/docs` | Documentation hub |
| `/docs/pricing` | Detailed pricing/credit breakdown |
| `/docs/teams` | Team features docs |
| `/docs/sharing` | Sharing capabilities docs |
| `/docs/enterprise` | Enterprise features |
| `/t/:id` | Shared project/template view |
| `/community` | Community showcase of generated projects |

**Navigation**: Minimal top bar with search, new chat, account. Left sidebar with chat history

#### B. Core Builder Experience

- **Layout**: Chat-centric — single panel chat with "Blocks" (rendered preview) inline in conversation. Code view available per block
- **Chat/prompt interface**: Full conversational interface. Accepts text, images (including Figma screenshots for Premium+), URLs. Supports multi-turn iteration
- **Code editor**: Code view per generated block — shows React/Next.js code with shadcn/ui components
- **Live preview**: "Blocks" render inline in chat as interactive iframes. Can be full-screened
- **Edit application**: Conversational iteration — "make the button bigger", "change the color scheme", etc. Each iteration generates new code version
- **Version history**: Each chat turn creates a new version. Can fork from any point in conversation. Duplicate chat to create personal copy
- **AutoFix**: Streaming post-processor that scans for errors and best-practice violations during generation

#### C. Project Management

- **Dashboard**: Chat history list (like ChatGPT). Recent chats, search
- **Organization**: Chats organized chronologically. Can star/pin important ones
- **Project concept**: "Projects" bundle multiple chats and resources together on Team/Enterprise plans
- **Templates**: Community-shared templates and project starters

#### D. Collaboration & Sharing

- **Sharing permissions**: Private, Team, Unlisted, Public visibility levels
- **Team workspace**: Shared projects, chats, and resources on Team plan
- **Collaboration**: "Can view" (read-only) or "Duplicate" (copy to own account) permissions
- **Real-time co-editing**: Available on Team plans
- **Team templates**: Create reusable component templates for team consistency

#### E. Integrations

- **Vercel**: One-click deploy to Vercel. Automatic SSL, CDN, serverless functions
- **GitHub**: Export generated code to repository
- **Figma**: Import designs on Premium+ plans — paste Figma URLs or upload screenshots
- **Supabase**: Knowledge of Supabase, Drizzle, and other backend services. Can generate integration code
- **Platform API**: REST API for building custom AI builders on top of v0 (prompt -> project -> code -> deploy)
- **Package management**: Generates code using npm packages, shadcn/ui components

#### F. Settings & Account

- **Profile**: Account info linked to Vercel account
- **Billing**: Credit balance, usage tracking, top-up purchases
- **Team settings**: Member management, shared credits, permissions
- **Enterprise**: SSO (SAML), training opt-out, dedicated support

#### G. Pricing Strategy

| Plan | Price | Credits | Key Features |
|---|---|---|---|
| **Free** | $0/mo | $5 in credits | Basic generation, community access |
| **Premium** | $20/mo | $20 in credits | Figma import, larger file uploads, API access |
| **Team** | $30/user/mo | Shared credits | Team workspace, shared projects/templates, collaboration |
| **Enterprise** | Custom | Custom | SSO, training opt-out, priority performance, dedicated support |

- Token-based credit system (cost per generation depends on input/output tokens)
- Each component generation: $0.30-$2.00 depending on complexity
- Purchased credits roll over (don't expire)
- Models: v0-1.0-md, v0-1.5-lg (up to 512K context)

#### H. AI Models

- **Proprietary**: v0-1.0-md, v0-1.5-lg — custom models built by Vercel
- **Context**: Up to 512,000 tokens for v0-1.5-lg
- **No user model selection** — Vercel controls which model variant handles each request
- **Approach**: Composite — retrieval + frontier LLM + AutoFix post-processor

#### I. Unique Differentiators

- **Strengths**: Best shadcn/ui component generation, tightest Vercel deployment integration, Platform API for building custom AI builders, highest code quality (production-ready React/Next.js), enterprise-grade
- **Weaknesses**: More frontend-focused than Lovable/Bolt (weaker full-stack), expensive per generation, credits burn fast, less intuitive UX for non-developers
- **Unique features**: Platform API (build your own AI builder), AutoFix streaming post-processor, Figma import, community showcase/templates, 512K context window

---

### 4. REPLIT
**URL**: replit.com
**Key event**: Repls renamed to "Apps" in 2025. Agent v2 (Feb), Agent 3 (Sep), Design Mode (Nov 2025)
**Stack**: Multi-language (Python, JS, TS, Java, C++, Go, etc.), React default frontend

#### A. Product Architecture (Page Map)

| Route / Page | Description |
|---|---|
| `/` | Homepage — featured apps, trending, categories |
| `/pricing` | Pricing page |
| `/create` | New project creation — choose Agent or blank App |
| `/@username` | User profile with published apps |
| `/@username/:app` | App workspace / IDE |
| `/build/*` | Landing pages for specific use cases (web-app-builder, etc.) |
| `/discover/*` | Discovery pages comparing competitors |
| `/products/design` | Design Mode landing page |
| `/import` | Replit Import — import from Figma, Lovable, Bolt |
| `/settings` | Account settings |
| `/teams` | Team management |

**Navigation**: Left sidebar (Home, My Apps, Deployments, Teams, Settings), top bar with search

#### B. Core Builder Experience

- **Layout**: Multi-panel IDE — File tree (left) + Code Editor (center) + Preview/Console (right) + Chat/Agent panel (sidebar or overlay)
- **Chat/prompt interface**: Agent panel — describe your app, upload screenshots/files, Agent creates full project. Supports multi-turn conversation
- **Code editor**: Full IDE with syntax highlighting, autocomplete, terminal, debugger. Multi-language support
- **Live preview**: Real-time rendering panel. Updates on save/run
- **Design Mode**: Visual editor — select elements in preview, edit text directly, adjust styles (padding, colors, background) with visual controls. Import from Figma
- **Edit application**: Agent autonomously writes code, installs packages, runs commands, tests, iterates. Can work 200+ minutes autonomously
- **Version history**: Git integration. Agent creates commits. Checkpoint system with effort-based billing

#### C. Project Management

- **Dashboard**: "My Apps" grid — cards with app name, language, last modified, deployment status
- **Organization**: Folders via teams. Tags for deployed vs. development
- **Search**: Search across all apps
- **Templates**: Extensive template library. Can fork any public app

#### D. Collaboration & Sharing

- **Multiplayer**: Real-time collaborative coding. See other cursors. Built-in chat
- **Core plan**: Collaboration for up to 5 people
- **Pro plan**: Up to 15 builders, role-based access control
- **Sharing**: Publish apps publicly. Share workspace link for collaboration
- **Comments**: Built-in chat during collaboration

#### E. Integrations

- **Figma**: Two-way — import from Figma (Replit Import), export to Figma (Figma plugin)
- **Deployment**: Replit hosting (one-click), custom domains with SSL/HTTPS
- **Database**: Built-in databases + 30+ one-click Connectors (PostgreSQL, MongoDB, etc.)
- **GitHub**: Import from GitHub repos
- **API integrations**: One-click add xAI (Grok), OpenAI, Anthropic, Google, Perplexity, Firebase, Slack, SendGrid
- **Secrets management**: Built-in secrets/env management with sync and security scanning

#### F. Settings & Account

- **Profile**: Username, avatar, bio, linked accounts
- **Billing**: Credit balance, usage breakdown (AI, compute, data, deployments), plan management
- **Secrets**: Environment variable management per app
- **Team management**: Member management, role-based access, billing
- **Deployment settings**: Domain, scaling, database config

#### G. Pricing Strategy

| Plan | Price | Credits | Key Features |
|---|---|---|---|
| **Starter** | $0/mo | Limited trial | 10 dev apps, basic workspace (1 vCPU, 2 GiB), limited Agent |
| **Core** | $25/mo ($20 annual) | $25/mo usage | Full Agent access, private apps, deploy/host, collab for 5 |
| **Pro** | $100/mo+ (for teams) | $40/user/mo | Up to 15 builders, RBAC, private deploys, priority support |
| **Enterprise** | Custom | Custom | SSO, advanced privacy, compliance, deep integration |

- **Effort-based pricing**: Agent charges based on complexity of task, not fixed per-interaction
- Simple changes: ~$0.25 or less per checkpoint
- Complex builds: Can cost $3+ per prompt
- **Pay-as-you-go overage** when credits exhausted
- Heavy users report $100-$300/month extra beyond base plan

#### H. AI Models

- Agent 3 (latest) — proprietary model/pipeline
- Uses frontier models under the hood (Claude, GPT)
- **No user model selection** — Replit manages model routing
- Supports generating code in 20+ languages

#### I. Unique Differentiators

- **Strengths**: True multi-language support (not just JS/React), most autonomous Agent (200+ min autonomous work), built-in hosting + database + secrets, Figma two-way integration, Design Mode visual editing, best for non-web-app projects (Python, backend, etc.)
- **Weaknesses**: Effort-based pricing unpredictable and potentially expensive, IDE can feel overwhelming, slower generation than Lovable/Bolt, learning curve
- **Unique features**: Design Mode (Figma-like visual editor), 30+ one-click service connectors, multi-language, Replit Import (from Figma/Lovable/Bolt), cross-platform app building, pre-deployment security screening

---

### 5. CURSOR
**URL**: cursor.com
**Type**: AI-native IDE (VS Code fork) — not a hosted builder, but a code editor with AI agents
**Key release**: Cursor 2.0 (late 2025)

#### A. Product Architecture (Page Map)

| Page / Feature | Description |
|---|---|
| Desktop app | VS Code-based IDE — file tree, editor, terminal, extensions |
| Composer panel | Multi-file AI editing panel with diff view |
| Agent panel | Autonomous agent that can run commands, browse, test |
| Chat sidebar | Conversational AI chat about codebase |
| Tab completion | Inline AI autocomplete (multi-line) |
| Settings | Account, model preferences, rules, billing |
| Background agents | Run autonomous tasks in background |
| Visual Editor | Drag-and-drop + point-and-prompt for web apps |
| Browser panel | Built-in Chromium for testing web apps |

**Navigation**: VS Code layout with additional Composer/Agent/Chat panels

#### B. Core Builder Experience

- **Layout**: VS Code layout — File tree (left) + Code Editor (center) + Optional panels (right/bottom). Agent panel dockable
- **Composer**: Describe a task in natural language, Composer reads relevant files, makes changes, shows diff across ALL affected files before applying
- **Agent Mode**: Full autonomy — accesses terminal, runs commands (npm install, pytest, migrations), launches browser to test, reads errors and fixes iteratively
- **Tab completion**: Multi-line predictive coding. Anticipates imports, predicts next edit location
- **Visual Editor**: Drag-and-drop in rendered web app. Property sliders. "Point and prompt" — click element and describe change
- **Background Agents**: Run multi-step tasks autonomously while you work on something else (Pro+ and above)
- **Parallel Agents**: Run multiple agents simultaneously

#### C. Project Management

- Not a hosted platform — opens local/remote repos
- No project dashboard — uses file system
- `.cursorrules` files for project-level AI instructions

#### D. Collaboration & Sharing

- **Shared chats**: Available on Teams plan
- **Centralized billing**: Team-wide billing management
- **RBAC**: Role-based access control on Teams
- **SSO**: On Teams/Enterprise
- **No real-time multiplayer** — not a hosted IDE

#### E. Integrations

- **GitHub**: Standard git integration (same as VS Code)
- **Extensions**: Full VS Code extension marketplace
- **MCP**: Model Context Protocol support for external tool integration
- **Browser**: Built-in Chromium for agent testing
- **Terminal**: Full terminal access for agents
- **Deployment**: No built-in deployment — use Vercel, Netlify, etc. manually

#### F. Settings & Account

- **Models**: Select from Claude, GPT, Gemini, Cursor's own model, etc.
- **Billing**: Credit balance, usage tracking, plan management
- **Rules**: `.cursorrules` for project instructions, global rules for preferences
- **Privacy**: Options for code privacy (no training on code)

#### G. Pricing Strategy

| Plan | Price | Credits | Key Features |
|---|---|---|---|
| **Hobby** | $0/mo | 50 premium req + 500 free model req | Limited agent, limited Tab |
| **Pro** | $20/mo ($16 annual) | $20 credit pool | Full Tab, Auto Mode, all models |
| **Pro+** | $60/mo | ~3x Pro credits | Background agents, 3x agent capacity |
| **Ultra** | $200/mo | Highest credits | Maximum limits |
| **Teams** | $40/user/mo ($32 annual) | Shared credits | RBAC, SSO, shared chats, centralized billing |
| **Enterprise** | Custom | Custom | SCIM, audit logs, pooled credits |

- **Credits drain at different rates per model** (cheaper models = more usage per dollar)
- 7-day free Pro trial for new users
- .edu emails get free Pro for 1 year

#### H. AI Models

- Cursor's own "Composer" model (4x faster than similar models)
- Claude Sonnet 4.5/4.6, Claude Opus 4.5/4.6
- GPT-5, GPT-4o
- Gemini models
- Free models (for Hobby tier)
- **Full user model selection** — choose per-request or set default

#### I. Unique Differentiators

- **Strengths**: Best for professional developers. Multi-file diff review. Background/parallel agents. VS Code compatibility (all extensions work). Visual Editor for web apps. Most model choice
- **Weaknesses**: Not a hosted builder (no deploy/hosting). Requires technical expertise. Desktop-only (no browser access). No project management/dashboard
- **Unique features**: Background agents, parallel agents, built-in browser with DOM forwarding to agent, point-and-prompt visual editor, `.cursorrules` for AI instructions, VS Code extension compatibility

---

### 6. WINDSURF
**URL**: windsurf.com (formerly Codeium)
**Key release**: Rebranded from Codeium to Windsurf in April 2025
**Type**: AI-native IDE + plugins

#### A. Product Architecture (Page Map)

| Page / Feature | Description |
|---|---|
| Desktop app (Windsurf Editor) | Full IDE with Cascade agent |
| VS Code plugin | Autocomplete + chat (not full Cascade) |
| JetBrains plugin | Same as VS Code plugin |
| Cascade panel | Multi-step agentic coding panel |
| Tab/Supercomplete | Inline AI completions |
| Memory panel | Persistent knowledge of your coding patterns |
| Deploy | Built-in deployment (limited) |

**Navigation**: IDE layout similar to VS Code with Cascade panel

#### B. Core Builder Experience

- **Layout**: IDE with Cascade panel docked to side — file tree, editor, terminal, preview
- **Cascade**: Multi-file reasoning, repository-scale comprehension, multi-step task execution. Can rename functions across files, debug iteratively by running terminal commands, analyze errors, try fixes
- **Turbo Mode**: AI executes terminal commands autonomously without confirmation
- **Memory**: Persistent knowledge layer that learns your coding style, patterns, APIs
- **Tab/Supercomplete**: Fast inline completions
- **MCP Integrations**: GitHub, Slack, Stripe, Figma, databases, internal APIs

#### C-F. (Similar to Cursor — IDE-based, not a hosted platform)

- No hosted project management
- Collaboration through shared workspace settings on Teams
- Standard git integration

#### G. Pricing Strategy

| Plan | Price | Credits | Key Features |
|---|---|---|---|
| **Free** | $0/mo | 25 credits/mo | Unlimited SWE-1 Lite, 1 deploy/day |
| **Pro** | $15/mo | 500 credits/mo (~$20 value) | SWE-1 model, 5 deploys/day |
| **Teams** | $30/user/mo | 500 credits/user | Admin tools, billing controls, priority support |
| **Enterprise** | $60+/user/mo | 1000 credits (200+ seats) | RBAC, SSO, hybrid deployment, ZDR defaults |

- 1 credit = $0.04
- Can connect own API key (bypasses Windsurf credits)

#### H. AI Models

- SWE-1 (proprietary) — primary model
- SWE-1 Lite — free tier model
- Can use own API keys for third-party models

#### I. Unique Differentiators

- **Strengths**: Cheapest Pro plan ($15/mo vs Cursor $20), Memory feature (learns your style), MCP integrations, Turbo Mode, BYOK (bring your own API key)
- **Weaknesses**: Full agentic experience only in Windsurf Editor (not in plugins), less mature than Cursor, smaller community
- **Unique features**: Memory (persistent coding style learning), Turbo Mode (autonomous terminal), MCP integrations (Slack, Stripe, Figma, etc.), cheapest entry price, hybrid/self-hosted deployment options

---

## Tier 2: Adjacent Competitors

---

### 7. FRAMER
**URL**: framer.com
**Valuation**: $2B (Aug 2025, Series D of $100M)
**Type**: Visual website builder with AI generation — no-code, design-focused

#### A. Product Architecture

- Marketing site with pricing, templates, showcase, blog
- Dashboard with projects grid
- Visual editor (Figma-like canvas)
- Built-in CMS
- Publishing/hosting

#### B. Core Builder Experience

- **Visual canvas editor** — Figma-like drag-and-drop interface
- **AI generation**: Type a prompt, get a complete page layout in seconds
- **On-page editing**: Edit live pages directly in browser
- **Components**: Reusable design components with variants
- **Animations**: Built-in animation/interaction builder
- **Code overrides**: Custom React code for advanced behavior
- **No chat-based AI iteration** — AI generates initial layout, then manual visual editing

#### G. Pricing Strategy

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0/mo | 10 CMS collections, 1,000 pages, framer.site domain |
| **Basic** | $10/mo | Custom domain, 30 pages, 1 CMS collection |
| **Pro** | $30/mo | 150 pages, 10 CMS collections, staging, analytics, roles |
| **Scale** | $100/mo (annual only) | 300 pages, 20 CMS collections, A/B testing, premium CDN |
| **Enterprise** | Custom | Custom limits, dedicated support, enterprise security |

#### I. Unique Differentiators

- **Strengths**: Most polished design output, best for marketing/portfolio sites, strong animation tooling, built-in CMS, excellent performance
- **Weaknesses**: Not for web apps (no backend logic), AI limited to layout generation (no iterative chat), no database integration, no code export
- **Unique features**: Figma-quality visual editor, native animation builder, built-in CMS with localization, on-page editing

---

### 8. WEBFLOW
**URL**: webflow.com
**Type**: Professional no-code website builder with emerging AI features

#### A. Product Architecture

- Marketing site with extensive learning resources (Webflow University)
- Visual Designer (main editor) — responsive visual CSS editor
- CMS for dynamic content
- E-commerce engine
- Hosting/publishing
- Workspace for team collaboration
- AI Assistant (conversational)
- App Gen (AI code generation, announced Nov 2025)

#### G. Pricing Strategy

| Plan | Price | Key Features |
|---|---|---|
| **Starter** | $0/mo | Webflow.io domain, 2 pages, 20 CMS collections, AI Assistant |
| **Basic** | $14/mo (annual) | Custom domain, 150 pages, SSL, CDN |
| **CMS** | $23/mo | 2,000 CMS items, 50GB bandwidth |
| **Business** | $39/mo | 10,000 CMS items, 400K visits, scalable limits |
| **Enterprise** | Custom | Custom everything |
| **Workspace** | $16-19/seat/mo | Team collaboration |

#### I. Unique Differentiators

- **Strengths**: Most powerful visual CSS control, best CMS for content sites, strong e-commerce, enterprise-ready, massive learning community (Webflow University), brand-aware AI
- **Weaknesses**: Steep learning curve, expensive for full features, AI features still nascent (App Gen in beta), no AI chat-to-build experience yet, slow to adopt AI
- **Unique features**: Visual CSS designer (pixel-perfect control), Webflow University (education ecosystem), built-in e-commerce, App Gen (AI application generation in Webflow environment), brand-aware AI that follows your design system

---

### 9. WIX ADI / WIX STUDIO
**URL**: wix.com
**Type**: Mass-market website builder with AI-assisted creation

#### A. Product Architecture

- Wix ADI (AI Design Intelligence) — answer questions, AI generates site
- Wix Editor — traditional drag-and-drop
- Wix Studio — professional builder for agencies
- 15+ AI tools integrated throughout platform

#### G. Pricing Strategy

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0/mo | Wix branding, limited features |
| **Light** | $17/mo | Custom domain, basic features |
| **Core** | $29/mo | More storage, analytics |
| **Business** | $36/mo | E-commerce, payments |
| **Business Elite** | $159/mo | VIP support, unlimited bandwidth |
| **Enterprise** | $299+/mo | Custom solutions |

#### I. Unique Differentiators

- **Strengths**: Largest user base of any website builder, most templates, integrated e-commerce/payments, AI image generator, AI SEO assistant, mobile app
- **Weaknesses**: Generated code is not exportable, vendor lock-in, AI generation produces generic designs, slow performance vs. competitors, limited developer control
- **Unique features**: AI image creator, portfolio auto-organizer, Semrush SEO integration, 800+ templates, built-in app marketplace

---

### 10. HOSTINGER AI WEBSITE BUILDER
**URL**: hostinger.com/ai-website-builder
**Type**: Budget hosting company with AI site generation

#### G. Pricing Strategy

| Plan | Price | Key Features |
|---|---|---|
| **Website Builder** | $2.99-6.99/mo (with hosting) | AI generation, drag-and-drop, free domain, SSL |
| **Business** | $6.99/mo | E-commerce, 600 products, 0% fees, Printful integration |
| **Hostinger Horizons** | AI credit-based | AI app builder (newer product) |

#### I. Unique Differentiators

- **Strengths**: Cheapest option by far, fastest loading speeds, AI logo maker, AI image generator (unlimited free), includes hosting + domain
- **Weaknesses**: Very basic sites only, limited customization, no code export, no developer features, template-dependent
- **Unique features**: Under $3/mo with hosting included, Printful integration for print-on-demand, AI email marketing (Hostinger Reach)

---

### 11. DURABLE AI
**URL**: durable.com
**Type**: AI business website generator with CRM/invoicing

#### G. Pricing Strategy

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0/mo | Basic website, Durable branding |
| **Launch** | $22/mo (annual) | Custom domain, expanded AI tools |

#### I. Unique Differentiators

- **Strengths**: 30-second website generation, built-in CRM + invoicing + analytics, AI marketing suite (Google Ads copy, social posts, blog), 4.8-star Trustpilot
- **Weaknesses**: Very basic sites, targeted only at small businesses/service providers, limited customization, no developer features, can't build apps
- **Unique features**: All-in-one business platform (website + CRM + invoicing + marketing), AI business partner concept, Stripe invoicing integration

---

### 12. 10WEB AI BUILDER
**URL**: 10web.io
**Type**: AI WordPress website builder with hosting

#### G. Pricing Strategy

| Plan | Price | Key Features |
|---|---|---|
| **AI Starter** | $10/mo (annual) | 10K visitors, AI generation, WordPress hosting |
| **AI Premium** | $15/mo (annual) | 50K visitors, AI Co-Pilot, more storage |
| **AI Ultimate** | $23/mo (annual) | 100K visitors, WooCommerce, full optimization |

- 7-day free trial on all plans

#### I. Unique Differentiators

- **Strengths**: WordPress-based (familiar ecosystem), AI + hosting bundle, Google Cloud infrastructure, 90+ PageSpeed scores, Elementor-based editor
- **Weaknesses**: Rigid templates, limited customization, slow customer service, WordPress-locked (no other frameworks), basic marketing tools
- **Unique features**: WordPress + AI hybrid, WooCommerce pre-configured, managed hosting with speed optimization, AI Co-Pilot for content

---

## Tier 3: Emerging / Niche

---

### 13. TEMPO LABS
**URL**: tempo.new (YC-backed)
**Type**: Visual IDE for React — collaboration between designers, PMs, and developers

#### Key Details

- **Visual React editor**: Familiar design tool UX but functions as an IDE under the hood
- **Figma plugin**: AI-powered Figma-to-React code conversion
- **AI code generation**: Generate 60-80% of frontend React code
- **Drag-and-drop**: Edit React code visually
- **Local dev integration**: Developers can edit code in VS Code alongside Tempo
- **Pre-built SaaS templates**: Stripe, Polar, Supabase, Convex+Clerk integrations
- **Expo support**: React Native mobile apps
- **Agent+ service**: Human engineers + AI build 1-3 features/week

#### Pricing

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0/mo | Basic access, limited AI prompts |
| **Pro** | $30/mo | 50 GPT-4/Claude Sonnet prompts |
| **Agent+** | Custom | Human-assisted AI feature building |

#### Differentiators

- **Unique**: Bridge between design tool and IDE. Non-developers can visually edit real React code. The only tool that lets PMs/designers directly edit production React components
- **Weakness**: Narrow focus (React only), small community, limited backend capabilities

---

### 14. SOFTGEN
**URL**: softgen.ai
**Type**: AI full-stack builder with "Costco pricing" model

#### Key Details

- **AI agent "Cascade"**: Dialogue-first approach — asks clarifying questions, creates formal development plan before writing code
- **Stack**: React, Next.js, Tailwind CSS, shadcn/ui + Supabase/Firebase backend + Vercel deploy
- **Code ownership**: 100% — export to GitHub, host anywhere
- **Integrations**: Stripe, Lemon Squeezy, Resend

#### Pricing

| Plan | Price | Key Features |
|---|---|---|
| **Annual Membership** | $33/year | Platform access + wholesale AI token pricing (30-50% cheaper) |

- **"Costco model"**: Flat annual fee + pay-as-you-go at wholesale token rates
- No monthly subscription — most affordable long-term option

#### Differentiators

- **Unique**: Cheapest AI builder for heavy users. Dialogue-first development planning. Full-stack with code ownership
- **Weakness**: Small team, less polished UX, newer/less proven, limited community

---

### 15. GALILEO AI (now Google Stitch)
**URL**: galileo.ai (acquired by Google in 2025)
**Type**: AI UI design generation (text/image to UI)

#### Key Details

- **Acquired by Google** in 2025, rebranded as Google Stitch
- **Generation modes**: Text-to-UI, Image-to-UI (wireframe/sketch to high-fidelity)
- **Style transfer**: Apply visual style from uploaded image to new designs
- **AI illustrations**: Auto-generated graphics matching theme
- **Code export**: Direct HTML/CSS export (enhanced post-Google acquisition)
- **Figma integration**: Export designs directly to Figma

#### Pricing (pre-acquisition)

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0/mo | Limited generations |
| **Standard** | $19/mo | 1,200 credits (10 credits per image generation) |
| **Pro** | $39/mo | 3,000 credits |

**Note**: Pricing likely changing post-Google acquisition

#### Differentiators

- **Unique**: Pure design generation (not code-first). Google/Gemini integration. Best for generating design mockups from text
- **Weakness**: Design-only (not a builder), now absorbed into Google ecosystem, unclear standalone future

---

### 16. UIZARD
**URL**: uizard.io
**Type**: AI-powered design-to-code prototyping tool

#### Key Details

- **Autodesigner**: Generate complete user flows with mockups/wireframes from text prompts
- **Sketch-to-wireframe**: Upload hand-drawn sketches, convert to digital wireframes
- **Screenshot-to-design**: Convert screenshots into editable designs
- **Interactive prototyping**: Build clickable prototypes
- **9 AI tools** on the platform
- **Code export**: React + CSS per component (not full pages)

#### Pricing

| Plan | Price | Key Features |
|---|---|---|
| **Free** | $0/mo | 3 AI generations/mo, 2 projects, Autodesigner 1.5 only |
| **Pro** | $25/mo | Unlimited AI generations, Autodesigner 2.0 |
| **Business** | Custom | Team features, advanced export |

#### Differentiators

- **Unique**: Sketch-to-wireframe (hand-drawn to digital). Screenshot-to-editable-design. Best for rapid prototyping/wireframing
- **Weakness**: Component-level code export only (not full page), design-focused not development-focused, limited backend capabilities, older AI engine on free tier

---

## Pricing Comparison Matrix

| Competitor | Free Tier | Entry Paid | Pro/Standard | Team | Enterprise | Pricing Model |
|---|---|---|---|---|---|---|
| **Lovable** | 5/day msgs | $25/mo (100 msgs) | $50/mo (Business) | Included in Business | Custom | Message-based |
| **Bolt.new** | 1M tokens/mo | $20/mo (10M tokens) | $50-200/mo | $30/user/mo | Custom | Token-based |
| **v0.dev** | $5 credits | $20/mo ($20 credits) | - | $30/user/mo | Custom | Credit/token-based |
| **Replit** | Limited trial | $25/mo ($25 credits) | $100/mo (teams) | Included in Pro | Custom | Effort-based |
| **Cursor** | 50 premium req | $20/mo ($20 credits) | $60/mo (Pro+) | $40/user/mo | Custom | Credit-based (model-dependent drain) |
| **Windsurf** | 25 credits/mo | $15/mo (500 credits) | - | $30/user/mo | $60+/user/mo | Credit-based ($0.04/credit) |
| **Framer** | 1,000 pages | $10/mo | $30/mo (Pro) | Included in Pro | Custom | Fixed monthly |
| **Webflow** | 2 pages | $14/mo | $23-39/mo | $16-19/seat/mo | Custom | Fixed monthly + usage |
| **Wix** | Basic site | $17/mo | $29-36/mo | Via Studio | $299+/mo | Fixed monthly |
| **Hostinger** | - | $2.99/mo (with hosting) | $6.99/mo | - | - | Fixed monthly |
| **Durable** | Basic site | $22/mo | - | - | - | Fixed monthly |
| **10Web** | - (7-day trial) | $10/mo | $15/mo | - | $23/mo | Fixed monthly |
| **Tempo** | Limited | $30/mo | Agent+ (custom) | - | - | Fixed + prompt limits |
| **Softgen** | - | $33/year + usage | - | - | - | Annual + pay-as-you-go tokens |
| **Uizard** | 3 gen/mo | $25/mo | Custom | - | - | Fixed monthly |

---

## Feature Comparison Matrix

| Feature | Lovable | Bolt.new | v0.dev | Replit | Cursor | Windsurf |
|---|---|---|---|---|---|---|
| **Chat-to-build** | Yes | Yes | Yes | Yes | Yes (Composer) | Yes (Cascade) |
| **Visual editor** | Visual Edits | Visual Inspector | Blocks inline | Design Mode | Visual Editor | No |
| **Code editor** | Dev Mode | Full IDE | Code view | Full IDE | Full IDE | Full IDE |
| **Live preview** | Real-time | Real-time | Inline blocks | Real-time | In-editor browser | Via terminal |
| **Multi-framework** | React only | React, Vue, Svelte, etc. | React/Next.js | 20+ languages | Any language | Any language |
| **GitHub integration** | Two-way sync | Push/pull | Export | Import | Standard git | Standard git |
| **Database** | Supabase native | Built-in DB tab | Via code gen | 30+ connectors | Via code | Via code |
| **Auth** | Via Supabase/Clerk | Built-in auth tab | Via code gen | Built-in | Via code | Via code |
| **Deploy** | One-click (lovable.app) | Bolt Cloud / Netlify | Vercel one-click | Replit hosting | Manual | Limited (5/day Pro) |
| **Custom domain** | Paid plans | Yes (buy in-app) | Via Vercel | Yes | N/A | N/A |
| **Multiplayer** | Up to 20 users | Teams plan | Team plan | Built-in multiplayer | Teams plan | Teams plan |
| **Figma import** | No | No | Premium+ | Yes (two-way) | No | Via MCP |
| **Model selection** | Auto + manual | Claude family | No (proprietary) | No (proprietary) | Full selection | SWE-1 + BYOK |
| **Version history** | Versioning 2.0 | Bolt Cloud backups | Chat-based | Git + checkpoints | Git | Git |
| **Security scan** | Pre-publish scan | Security audit tab | No | Pre-deploy screening | No | No |
| **Mobile apps** | No (responsive web) | No | No | Yes (cross-platform) | Via code | Via code |
| **Hosting included** | Yes | Yes | Yes (Vercel) | Yes | No | Limited |
| **Analytics** | No | Built-in | Via Vercel | No | No | No |
| **Plan Mode** | Chat Mode (reasons first) | Plan Mode | No | Agent plans tasks | No | No |

---

## Strategic Insights for Argus

### 1. Market Gaps to Exploit

**a) Website Cloning / Import**: No competitor has a strong "clone existing website" feature. This is Argus's potential blue ocean. The closest is Replit Import (Figma/Lovable/Bolt) and v0's Figma import, but nobody does URL-to-clone.

**b) Figma-to-Code Gap**: Only Replit and v0 have Figma import. Lovable and Bolt (the two biggest) do not. Strong Figma integration is underserved.

**c) Multi-Model Selection**: Bolt limits to Claude family. v0 and Replit offer no user model choice. Only Cursor and Windsurf offer full model selection. An AI builder with transparent multi-model selection (Claude, GPT, Gemini, open-source) is differentiated.

**d) Transparent Pricing**: Every competitor has confusing pricing (tokens, credits, messages, effort-based). A simpler, more transparent pricing model would stand out.

**e) Code Quality Verification**: Only Lovable and Bolt have security scanning. No competitor offers automated testing, accessibility checking, or performance auditing as part of the build flow.

### 2. Must-Have Features (Table Stakes)

Based on market convergence, Argus MUST have:
- Chat-based AI building with conversational iteration
- Live preview (real-time rendering)
- One-click deployment with custom domain support
- GitHub integration (at minimum push/export)
- Supabase or equivalent database integration
- Version history with rollback
- Visual editing (click elements to modify)
- Responsive preview (mobile/tablet/desktop)
- React + Tailwind + shadcn/ui as default stack

### 3. Differentiation Strategy

**Argus's potential positioning**: "The AI website builder that starts from what already exists"

Key differentiators to build:
1. **URL-to-Clone**: Paste any URL, AI clones the design and generates editable code
2. **Screenshot/Figma/Sketch Import**: Multiple input methods beyond text prompts
3. **Multi-Model Transparency**: Let users choose Claude, GPT, Gemini, or open-source models with visible cost per model
4. **Quality Gates**: Automated accessibility, performance, and security checks before deploy
5. **Smart Pricing**: Flat monthly with generous limits (no confusing token/credit systems)

### 4. Pricing Recommendation

The market clusters around $20-25/mo for individual Pro plans. Argus should consider:
- **Free**: 3-5 projects, limited AI interactions, public only
- **Pro**: $19/mo (undercut competition) — unlimited projects, generous AI limits, custom domains
- **Team**: $29/user/mo — collaboration, shared workspace
- **Enterprise**: Custom

### 5. Competitive Threats

- **Lovable**: Market leader with 2.3M MAU, $200M ARR, massive momentum. Hard to out-feature, but beatable on specific use cases (cloning, import)
- **Bolt.new V2**: Most complete all-in-one product (DB, auth, analytics, hosting, domain purchasing all built-in). Setting the standard for what "complete" means
- **v0.dev + Vercel**: Platform API means other companies can build on v0. Could commoditize the builder layer
- **Replit**: Most versatile (multi-language, multi-platform). If they improve UX, they could dominate
- **Cursor/Windsurf**: Not direct competitors today but could add hosted deployment and become builders overnight

### 6. Timing Advantage

The market is still early. Key proof points:
- Bolt hit 1M websites in 5 months (Oct 2024 - Mar 2025) — demand is massive
- Lovable went from $75M to $200M ARR in ~6 months — growth is explosive
- Most products are still v1/v2 — UX is still rough across the board
- No clear winner for "website cloning/importing" use case
- Enterprise market is barely touched by AI builders

---

*This analysis was compiled on February 25, 2026, using publicly available information from product websites, documentation, pricing pages, blog posts, and third-party reviews.*
