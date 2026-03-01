# Argus — Deep Audit + Visual & Feature Architecture Planning Session

## What This Session Is

This is a **planning session only**. Do NOT write any code. Do NOT make any file changes. We are going to deeply audit what Argus currently is, understand every single piece of it, and then plan how to take it to the next level — visually, architecturally, and as a product.

I'm going to provide you with screenshots of our competitors (Lovable, Bolt, v0, Orchids) so you can see exactly the level of polish and UX we need to match and exceed. Do NOT start planning until you've seen those screenshots and done your full audit.

## What Argus Actually Is — The Core Product

Argus is an AI website builder. But here's what matters — the proprietary technology, the thing that actually makes Argus special and the thing we're selling, is:

1. **Firecrawl integration** — we can scrape and clone websites almost exactly
2. **The AI model pipeline** — multiple model support (Claude, GPT-4o, Gemini, DeepSeek, Llama, Mistral, Qwen) for code generation
3. **Self-healing builds** — the AI can detect issues in its own output and fix them automatically
4. **Near-exact website cloning** — paste a URL, get a working clone. That's the magic trick.

That's the core product. Everything else — the UI, the dashboard, the workspace, the templates, the team features — all of that exists to **sell and deliver** that core product. We need to build everything around it so that we're turning it from "yes, that's the service" into figuring out how we go about selling this product and marketing this product and making this user interface accessible to people online.

## What I Need You To Do — Step By Step

### Step 1: Deep Audit of Argus As It Exists Right Now

Go through the entire codebase. Read every page, every component, every API route. I need you to understand:

- **Every route that exists** and what it does (there are ~19 page routes right now)
- **Every component** and whether it's actually used or orphaned
- **The full backend** — API routes, Supabase schema, what's wired up and what isn't
- **What features actually work** end-to-end vs what's half-built or just UI shells
- **The build pipeline** — how does a user go from "I want a website" to "here's your deployed site"
- **The current user flow** — sign up → onboarding → workspace → create project → build → deploy
- **What's broken, what's janky, what's placeholder**

There are existing research docs in the repo but they may be outdated and may not reflect the current actual state of the codebase:
- `ARGUS_MARKET_RESEARCH.md` (819 lines)
- `COMPETITIVE_ANALYSIS.md` (982 lines)
- `ARGUS_COMPETITIVE_ANALYSIS.md` (1454 lines)
- `ARGUS_V2_ARCHITECTURE.md` (982 lines)

Read them for context but **verify everything against the actual code**. Previous sessions have hallucinated features that don't exist. I need ground truth from the codebase, not assumptions.

### Step 2: Understand What We Have vs What We're Missing

After the audit, I want a clear picture:

**What we HAVE that works:**
- (you tell me after auditing)

**What we HAVE that's half-built or broken:**
- (you tell me)

**What we're completely MISSING that competitors have:**
- (you tell me — compare against the screenshots I'll provide)

**What we SHOULD build vs what we SHOULDN'T waste time on:**
- (you tell me — prioritized, honest)

### Step 3: Plan the Full Product Architecture

This is where I need you to think like a product architect, not just a coder. We need to figure out the full architecture of what Argus should be — all the different features and tabs and interactions and the full information architecture.

Here's my brain dump of what I'm thinking:

**The onboarding flow** — this needs to exist and feel premium. When someone signs up for the first time, they should go through a short, beautiful onboarding that sets up their workspace and gets them excited.

**The main home page after login should be chat-first** — very similar to how Lovable does it. Very similar to our landing page too where the chat box is front and center. Here's the thing — we actually had this before, a very long time ago. Our original design had the actual chat box in the middle of the page. It had this scroll feature design at the bottom where you could search up a website and the results would come at the bottom. You could click it and choose which one you want to do a direct web scrape of. That was a beautiful UI and I feel like that should be the main home page experience.

**The sidebar** should give you access to:
- Your project directory / workspace (all your projects)
- Team integration
- Templates (not "marketplace" — just templates. Pre-built starting points people can clone and customize)
- Settings / account

**The workspace** is where all your projects live — grid of project cards with previews, search, sort, filter.

**The builder/editor** is the core experience — this is where the AI builds your site. Chat interface on one side, live preview on the other. Code editor accessible. This is where the magic happens and it needs to feel powerful and smooth.

**Templates** — not a "model marketplace." Just a gallery of pre-built templates people can start from. Clean and simple.

**Team features** — collaboration, sharing projects, inviting team members.

There are all these different things that we need to build and we could build but as of right now we don't have all these systems fully built out. I feel like there's still a huge gap in the features that we can integrate into this app that we haven't integrated yet.

### Step 4: Plan the Visual Design Direction

The front-end is poorly done right now. A previous session tried to do a "terminal hacker aesthetic" redesign and it looks like a program from 2005 — everything in monospace, flat white cards, no imagery, no richness, no polish. That's NOT what I want.

What I want is:
- **Modern, polished SaaS product** — think Lovable, v0, Linear, Vercel dashboard level of polish
- **The landing page aesthetic can INSPIRE the dashboard** but should NOT be applied literally. The landing page has ASCII art, matrix rain, scanline effects — those are marketing theatrics. The dashboard should be clean, spacious, and premium with maybe subtle nods to the brand (orange accent, occasional monospace label) but NOT terminal cosplay
- **Rich visual hierarchy** — proper font sizes, weights, spacing. Not everything in 13px monospace
- **Imagery and previews** — project cards should show actual thumbnails/previews, not plain white boxes with a single letter
- **Depth and polish** — subtle shadows, proper border radius, hover states that feel luxurious, smooth transitions
- **The screenshots I'm about to provide are the target quality level** — study them carefully

When you look at the competitor screenshots, pay attention to:
- How they handle the sidebar navigation
- The prompt/chat-first experience on the home page
- Project cards and how they show previews
- The overall color palette and spacing
- How they balance information density with breathing room
- The builder/editor layout
- Settings pages

## Important Notes

- **This is PLANNING ONLY.** Output a comprehensive plan document. Do not write code.
- **Be brutally honest** about the current state. If something is bad, say it's bad. If something is unnecessary, say so.
- **Revert the uncommitted changes first.** Run `git checkout -- .` and `git clean -fd` to get back to the last committed state before auditing. There are 15 modified files and 1 new file from a failed visual redesign attempt that should be discarded. The new file `components/shared/cursor-glow.tsx` should also be deleted. The untracked files `ARGUS_MARKET_RESEARCH.md` and `COMPETITIVE_ANALYSIS.md` should be KEPT (don't clean those).
- **Don't hallucinate features.** If a page is just a redirect stub, say so. If an API route returns mock data, say so. Ground truth only.
- **Think like you're building a company, not just a UI.** The architecture decisions we make here determine whether Argus can compete with $100M+ funded competitors.
- **I have the visual coding stack available** — Playwright, chrome-devtools MCP, Figma MCP, viewpo-mcp for multi-viewport testing. When we move to implementation (in a future session), we will use these tools to visually verify every change.

## Tech Stack (for reference)
- Next.js 16 + React 19
- Tailwind CSS v4
- Supabase (auth, database, storage)
- Framer Motion for animations
- Radix UI primitives
- Stripe for billing
- Sentry for error tracking
- Vercel for deployment

## What I'll Provide After You Read This

Screenshots of:
- Lovable (home, workspace, builder, settings)
- Bolt (home, workspace, builder)
- v0 by Vercel (home, generation, projects)
- Orchids (home, builder)
- Our own Argus landing page (so you can see the brand identity)

Wait for me to upload these before you start the planning work.
