# ARGUS — Competitive Analysis & Design Spec
**Prepared for:** Claude Code implementation  
**Date:** February 25, 2026  
**Scope:** Auth page, onboarding, workspace, model marketplace  
**Stack:** Next.js 15, Supabase, Tailwind CSS, Framer Motion  
**Brand:** JetBrains Mono, Heat Orange `#FA4500`, Off-white `#FAFAFA`, Dark auth

---

## 1. EXECUTIVE SUMMARY — Top 5 Design Decisions to Steal

### 🥇 #1 — Linear's Centered Minimal Dark Auth (STEAL EVERYTHING)
Linear has the most praised sign-in page in the industry. It uses a pure centered layout, deep dark background (`#0A0A0A`), subtle grid/gradient background texture, large brand mark at top, and a simple email-first flow. No decorative side panels — but the **atmosphere** is immaculate. For Argus, we take this atmosphere and combine it with a split-panel layout where the LEFT panel gets that same gravitas with animated ASCII art.

**What to steal:** Dark background `#0B0B0B`, email-first auth (magic link + OAuth), centered typography hierarchy, ghost button style for secondary actions.

### 🥈 #2 — Lovable's "One Prompt to App" Onboarding
Lovable immediately drops users into a prompt box. Zero friction. "What do you want to build?" is literally the first thing you see after auth. No 5-step wizards. No role selection. Just: build. The platform scaffolds everything else (Supabase, auth, routing) based on what you prompt.

**What to steal:** Prompt-first onboarding, 3 steps max (Welcome → Project Name/Template → First Prompt), immediate preview pane.

### 🥉 #3 — Figma/Framer's Multi-Project Workspace Grid
Framer's workspace dashboard (released March 2024) introduced workspace-level organization: top-left workspace switcher dropdown, left sidebar with sections (Recent, Team, Archived), main grid of project cards with thumbnail previews, hover states revealing quick actions (Edit, Duplicate, Share). Figma does the same but at massive scale.

**What to steal:** Left sidebar with collapsible sections, project cards with 16:9 thumbnail + title + last edited + collaborator avatars, NEW PROJECT card always first in grid.

### 🏅 #4 — v0's Split Chat + Live Preview Panel
v0's editor layout is the clearest implementation: left sidebar (chat history + project list), center panel (live preview iframe), right panel (code editor + file tree). The key "wow moment" is the **instant visual preview** that updates as the AI writes code. No refresh, no rebuild. Framer Motion transitions between states.

**What to steal:** Three-panel layout for Argus editor. Left: prompt history. Center: live preview. Right: code/file explorer. Collapsible panels.

### 🏅 #5 — Bolt's Model Selector UX
Bolt was first to expose model choice directly in the UI. A dropdown/tab at the top of the chat bar lets users switch between AI models (Claude, Codex, GPT-4o). This is a key differentiator — power users care deeply about which model runs their code. The selector shows model name, token cost indicator, and a brief capability tag (e.g., "Best for frontend", "Best for logic").

**What to steal:** Model selector at top of prompt bar, with model name + capability tag + cost indicator. Make it feel like choosing a tool from a toolbox.

---

## 2. PER-PLATFORM BREAKDOWN

---

### 2.1 Lovable.dev

**URL:** https://lovable.dev  
**Tagline:** "Build production-ready full-stack apps at the speed of thought"

#### Auth Page
- **Layout:** Centered, single column, dark background
- **Background:** Deep dark `#0D0D0D` or near-black, subtle warm tint
- **Logo:** Lovable heart logo + wordmark, centered at top
- **OAuth Options:** GitHub (primary, large button), Google
- **Form:** Email + password field below OAuth
- **Accent color:** Warm purple/violet gradient highlights on hover states
- **No split panel** — pure centered minimalism
- **Copy:** "Sign in to Lovable" — dead simple

#### Onboarding (3-4 Steps)
1. **Step 1:** OAuth/email auth → immediate redirect to dashboard (no intermediate welcome screen)
2. **Step 2:** Dashboard drops you into "New Project" flow: large centered prompt input: *"Describe the app you want to build..."*
3. **Step 3:** First build begins immediately — left chat panel, right live preview iframe
- **Total time to first build:** Under 60 seconds
- **What they ask:** Nothing. Your first prompt IS the onboarding.

#### Project Workspace
- **Sidebar (left):** Project list, recent projects, team switcher at top
- **Main area:** Project cards in grid layout with app screenshot thumbnails
- **Card anatomy:** Thumbnail + App name + "Last edited X ago" + collaborator count
- **Top bar:** Search + New Project button (prominent orange/accent CTA)
- **Hover state:** Edit / Duplicate / Delete context menu appears

#### Editor Layout
- **3-panel:** Left (chat history) → Center (live preview) → Right (code editor)
- **Live preview:** Actual iframe of the running app, updates in near real-time
- **Chat:** Conversation history with human/AI turns, shows which files were edited
- **File tree:** Right panel with expandable directories

#### Model Selection
- Lovable uses Claude under the hood (Anthropic partnership via Gemini integration too)
- Model selection NOT exposed to end users — it's abstracted away
- Premium users get faster model access

#### Marketplace / Gallery
- **Lovable Cloud:** Deploy with one click to Lovable's hosted infrastructure
- **No template gallery** — prompt is the starting point
- **Showcase:** Public gallery of apps built with Lovable at lovable.dev/showcase

#### "WOW" Moments
- **Bi-directional GitHub sync** — push from Lovable, pull from Cursor, push back
- **Supabase auto-scaffolding** — asks permission to create DB tables automatically
- **Visual editor mode** — click elements on the live preview to select + edit them
- **Auto-debugging** — AI detects errors and fixes them without being prompted

#### What to Steal for Argus
- Prompt-first onboarding (no setup wizard)
- Live preview iframe updates
- Auto-Supabase scaffolding UX (ask user: "Should I set up auth + database?")
- Visual element selection on live preview

---

### 2.2 Bolt.new (StackBlitz)

**URL:** https://bolt.new  
**Tagline:** "Prompt, run, edit, and deploy full-stack web apps"

#### Auth Page
- **Layout:** Centered, minimal
- **Background:** White/light mode (contrasts with dark editor)
- **OAuth Options:** GitHub (primary), Google
- **No decorative elements** — strictly functional
- **Transition:** After auth, immediately enters the editor (not a dashboard)

#### Onboarding
1. Direct to prompt interface after first login
2. Sample prompts shown as clickable chips: "Build a SaaS dashboard", "Create a todo app", "Build an e-commerce store"
3. No multi-step onboarding wizard

#### Project Workspace
- **Sidebar (left):** Project list with search, NEW PROJECT button
- **Project cards:** List view (not grid) by default — title + last edited + deploy status badge
- **Top bar:** Account menu, upgrade CTA

#### Editor Layout
- **3-panel (WebContainer-based):**
  - Left: AI chat panel with conversation history
  - Center: Live preview (WebContainer iframe — full Node.js in browser)
  - Right: File explorer + code editor
- **Key feature:** Everything runs IN THE BROWSER via WebContainers (StackBlitz tech)
- **Terminal panel:** Collapsible terminal at bottom showing npm install, dev server logs

#### Model Selection — KEY DIFFERENTIATOR
- **Visible model switcher** at top of chat bar
- Options: Claude Sonnet (recommended), Claude Opus, legacy Bolt v1 Agent
- **UI:** Dropdown with model name + brief description + credit cost indicator
- Switching models **clears chat history** (warning shown)
- Future: Codex support announced

#### Other Features
- **Interaction Discussion Mode:** Chat WITH the AI before it writes any code — planning mode
- **Product References:** Upload images/ZIPs as context for the AI
- **Version History:** Visual timeline of all changes, one-click restore
- **Bolt Cloud:** Built-in hosting, custom domains, database management

#### "WOW" Moments
- Full Node.js running **in the browser** — no server, no wait
- Instant deploy with Bolt URL (shareable immediately)
- Discussion mode before coding — reduces wasted iterations
- Image upload for design reference

#### What to Steal for Argus
- Visible model selector with capability tags
- Discussion mode / planning mode before building
- Image upload for UI reference
- Terminal panel for power users
- Version history timeline

---

### 2.3 v0.dev (Vercel)

**URL:** https://v0.app (migrated from v0.dev)  
**Tagline:** "Your collaborative AI assistant to design, iterate, and scale full-stack apps"

#### Auth Page
- **Layout:** Vercel's standard centered auth — very minimal
- **Background:** Black (`#000000`) with subtle noise texture
- **Logo:** v0 wordmark centered, clean sans-serif
- **OAuth options:** GitHub (primary, large pill button), Google, email magic link
- **Vercel brand language:** Clean, monochromatic, high contrast
- **Tagline on auth page:** Clean single-line value prop
- **Button style:** White pill button on black — very high contrast, no ambiguity

#### Onboarding
1. After auth → redirect to v0.app (new interface as of Feb 2026)
2. Left sidebar: project history + new chat button
3. Center: Large prompt input with suggested starter prompts
4. Right: Empty preview pane (fills once you start building)
- **No explicit multi-step onboarding** — sink or swim, but it works

#### New v0 Features (Feb 2026 release)
- **Git Panel:** Create branch per chat, open PRs, deploy on merge
- **GitHub repo import:** Import existing codebase, auto-pull env vars from Vercel
- **Snowflake + AWS integrations** for data apps
- **Enterprise-grade security** + deployment protection

#### Project Workspace
- **Left sidebar:** Chat history per project, NEW CHAT button
- **Project organization:** Projects = git repos connected to Vercel
- **Deployment:** Every PR = preview deployment (Vercel magic)
- **Project cards:** Minimal list — title, last activity, branch status

#### Editor Layout
- **2-panel (simpler than Lovable/Bolt):**
  - Left: Prompt/chat history
  - Right: Preview + code tabs
- **Code tab:** Shows React/Tailwind code in editor with copy/download buttons
- **Preview tab:** Live iframe of generated component
- **Share:** Every generation gets a shareable v0.app/xxx URL

#### "WOW" Moments
- **Taste level:** v0 generates calmer, more "production-ready" looking UI vs competitors' garish defaults
- **Instant Vercel deploy:** One click from v0 → live Vercel URL
- **Figma → v0:** Paste Figma frame → get code (screenshot-to-code)
- **Git-native:** Only platform with proper git workflow baked in (PRs, branches, merges)

#### What to Steal for Argus
- GitHub PR workflow baked into the UI
- "Taste level" — enforce design system constraints so output looks good by default
- Screenshot/image → code input
- Shareable URLs for every generation
- Vercel-style black on white high-contrast auth buttons

---

### 2.4 Replit

**URL:** https://replit.com  
**Tagline:** "Build apps and sites with AI"

#### Auth Page
- **Layout:** Split panel (rare! Most competitors use centered)
- **Left panel:** Marketing copy, feature highlights, screenshot of product
- **Right panel:** Sign in form — email/password + Google + GitHub
- **Colors:** Replit orange (`#F5791F`) accent on white background
- **Brand:** Clean, friendly, approachable — targets non-developers

#### Onboarding
1. **Email/Google/GitHub** sign up
2. **"What will you build?"** role selection: Creator / Developer / Student / Enterprise
3. **Template picker** or **blank project** 
4. **First Repl** opens immediately in workspace
- Total steps: 3-4
- First build time: Under 90 seconds

#### Workspace Design
- **Top bar:** Replit logo, search, create button, account menu
- **Left sidebar:** My Repls, Recent, Teams, Templates
- **Main grid:** Project cards — each card shows: app screenshot/icon + title + language badge + visibility (public/private)
- **Card hover:** Run, Fork, Share quick actions
- **Design Mode** (2025): One-click UI generation powered by Gemini 3

#### Teams & Collaboration
- **Replit Teams:** Shared workspace, multiplayer editing (like Google Docs for code)
- **SCIM provisioning** for enterprise
- **Bitbucket + GitLab** integration (2025)
- **Enterprise analytics dashboard**

#### Template Marketplace
- **Replit Marketplace:** Thousands of community templates organized by language, framework, use case
- **Template cards:** Preview image + title + description + fork count + language tags
- **Featured templates:** Curated by Replit team, pinned at top
- **Connectors (30+):** Stripe, Figma, Notion, Salesforce, Snowflake, MCP servers

#### Model Selection
- Agent 3 (current, September 2025): Claude 3.7 Sonnet-based
- Design Mode: Gemini 3 Pro for visual/static design
- Fast Build: Speed-optimized mode for rapid prototypes
- Users cannot choose specific model — Replit abstracts it

#### "WOW" Moments
- **Design Mode:** Describe UI → interactive design in under 2 minutes, then one-click convert to React code
- **Fast Build:** Production-quality app in ~2 minutes
- **Replit Mobile App:** #1 App Store Developer Tools, build from phone
- **30+ connectors:** More integrations than any competitor
- **Multiplayer editing:** Real-time collaborative coding like Google Docs
- **One-click deploy + custom domain:** Instant from workspace

#### What to Steal for Argus
- Split-panel auth (rare differentiator)
- Template marketplace with language/framework filter
- Multiplayer cursor collaboration in the editor
- Design Mode → code conversion flow
- Connector/integration gallery (30+)

---

### 2.5 Cursor

**URL:** https://cursor.com  
**Tagline:** "The best way to code with AI"

#### Auth Page (cursor.com/signin)
- **Layout:** Centered minimal — very VS Code-ish
- **Background:** Dark mode by default (cursor.com redesigned to dark in 2025, received mixed reviews)
- **Brand:** Minimalist, developer-first, no-frills
- **OAuth:** GitHub (primary), Google, email
- **Sign-in page criticism:** Forum feedback says dark theme has readability issues (low contrast grey text)
- **Interesting:** Cursor is a downloadable app, not web-based — auth page leads to license activation, not a web workspace

#### Layout Pattern (Inside the App)
- **VS Code fork:** Same 3-panel layout — File explorer (left) → Code editor (center) → Terminal + AI chat (right or bottom)
- **AI Chat (Composer/Agent panel):** Right-side panel, slides in from right
- **Split-panel implementation:** Left file tree | Center editor | Right AI chat
- **This is the template for Argus's editor layout**

#### "WOW" Moments
- **Agent mode:** AI takes autonomous multi-file edits across the whole codebase
- **Tab-to-complete:** Next line prediction, not just autocomplete
- **Ctrl+K:** Inline code editing — select code → describe change → AI replaces
- **@-mentions in chat:** @file, @web, @docs to inject context

#### What to Steal for Argus
- Right-side AI chat panel sliding in from right
- @-mention syntax for context injection in the prompt bar
- VS Code-style file tree in left sidebar
- Keyboard shortcut UX (Ctrl+K for inline edit)

---

### 2.6 Framer

**URL:** https://framer.com  
**Tagline:** "AI website builder"

#### Auth Page
- **Layout:** Centered, clean
- **Background:** White/light mode (contrasts with dark editor)
- **Logo:** Framer hexagonal logo + wordmark
- **OAuth:** Google (primary), email magic link
- **Design:** Apple-level polish — every pixel justified, smooth micro-animations on hover
- **Light/dark toggle** available in user settings

#### Onboarding
1. Sign up → email verification
2. **"Create your first project"** — template picker or blank canvas
3. **Workspace tour** — modal overlay with hotspot callouts pointing to key features
4. Optional: Import from Figma
- 3-4 steps total, visual and non-intrusive

#### Workspace Design (March 2024 Workspaces Update)
- **Top-left:** Workspace dropdown (switch between personal/team workspaces)
- **Left sidebar:** Recent / Drafts / Published / Archived (collapsible sections)
- **Right side of top bar:** Member count badge
- **Main grid:** Project cards with website thumbnails
- **Card anatomy:** Live thumbnail + site name + last modified + publish status badge (green dot)
- **Hover actions:** Open, Duplicate, Move to folder, Archive, Delete
- **Folder organization:** Drag-and-drop into folders

#### Multi-Project Management
- **Workspace-level:** Multiple workspaces (personal + client workspaces)
- **Folders:** Organize sites within workspace
- **Collaborators:** Invite members to specific projects or entire workspace
- **Pro Experts:** Join client projects as editors at no cost

#### Template Marketplace
- **Framer Marketplace:** Hundreds of premium and free templates
- **Categories:** Landing page, Portfolio, SaaS, Agency, E-commerce
- **Template cards:** Full-page preview thumbnail + price tag + creator name
- **Search + Filter:** By category, price (Free/Paid), style

#### "WOW" Moments
- **Real-time multiplayer:** Multiple cursors visible in the canvas simultaneously
- **CMS integration:** Blog, product listings — all within the visual editor
- **Framer Sites:** Deploy to framer.site domain instantly
- **Plugin marketplace:** Third-party plugins extend the editor
- **Responsive breakpoints:** Switch between desktop/tablet/mobile in one click

#### What to Steal for Argus
- Workspace dropdown in top-left (team/personal switch)
- Project cards with live thumbnail previews
- Folder organization system
- Hover reveal actions (Open, Duplicate, Archive)
- Template marketplace with full-page preview thumbnails
- Green publish status badge on project cards

---

### 2.7 Webflow

**URL:** https://webflow.com  
**Tagline:** "The platform to build, launch, and scale"

#### Auth Page (webflow.com/dashboard)
- **Layout:** Centered, clean, on-brand teal/dark
- **Background:** Near-black with subtle brand elements
- **OAuth:** Google, Apple, email
- **Brand:** More corporate/enterprise than other tools — teal accent (`#146EF5` blue-ish)
- **Webflow logo** centered at top

#### Onboarding
1. Sign up → role selection ("I'm a…" Freelancer / Agency / In-house team / Student)
2. **Goal selection:** What will you build? E-commerce / Portfolio / SaaS / Blog
3. **Skill level:** Beginner / Intermediate / Advanced
4. **First project:** Template selection or blank canvas
5. **Designer walkthrough:** Interactive tutorial with step indicators
- 4-5 steps (slightly long but necessary for complexity)

#### Workspace / Dashboard
- **URL:** webflow.com/dashboard
- **Workspace switcher:** Top-left dropdown (similar to Framer)
- **Main area:** Site thumbnails in grid — shows published screenshot or default illustration
- **Sidebar:** All Sites / Folders / Team Members / Settings
- **New Site button:** Top-right, always visible
- **Sort options:** Date created / Alphabetical / Last published / Last modified
- **List view toggle:** Switch between grid and list view

#### Multi-Project Organization
- **Folders:** Drag sites into folders, search within folders
- **Sort:** Ascending/descending for all sort methods
- **Multiple Workspaces:** Each has its own separate Dashboard
- **Starter Workspace:** Default workspace for new users, can create additional

#### "WOW" Moments
- **Designer fidelity:** Most powerful visual CSS editor — box model, flexbox, grid all visual
- **CMS Collections:** Structured content with visual binding
- **Webflow Interactions:** Timeline-based animations (JavaScript without JavaScript)
- **Localization:** Multi-language sites built in
- **E-commerce:** Full product/cart/checkout system built into the editor

#### What to Steal for Argus
- Workspace dropdown with multiple workspace support
- Grid/List view toggle for project management
- Sort options (Date / Alphabetical / Last published)
- Folder organization with drag-and-drop
- Per-project publish status indicator

---

### 2.8 Linear

**URL:** https://linear.app  
**Tagline:** "The issue tracker you'll actually enjoy using"

#### Auth Page — THE GOLD STANDARD
Linear's sign-in page is consistently rated as the most beautiful in the industry. It's been cited in dozens of design articles and Dribbble showcases.

**Layout:** Centered, single column, pure black background  
**Background:** `#0A0A0A` (warmer than pure black) with subtle grid or noise overlay — creates depth without clutter  
**Logo:** Large "Linear" wordmark, clean sans-serif, white on black  
**Tagline:** Single line, high-contrast, set beautifully in the center  

**Auth options:**
- Google (large pill button, white on black, border radius ~9999px)
- GitHub
- Email magic link (separate input field, not password)
- "Or continue with" divider line

**Button design:**
- Large, full-width pill buttons (`border-radius: 9999px`)
- `background: #FFFFFF`, `color: #000000` — maximum contrast
- Icon (Google logo / GitHub mark) left-aligned in button
- Hover: subtle scale/shadow animation
- No gradients — just pure black/white contrast

**Typography:**
- Large headline: ~28-32px, medium weight, perfectly centered
- Supporting copy: ~14px, muted (`#888888`)
- Crisp, no ornamentation

**Background effect:**
- Subtle grid lines OR noise texture
- Some versions show a faint gradient spotlight radiating from center
- Gives the feeling of depth without distraction
- Very similar to Stripe's auth page aesthetic

**The "WOW":** The entire page communicates quality through restraint. Nothing is wasted. It says "this product is made by people who care deeply about craft." Every competitor looks busy in comparison.

#### What to Steal for Argus
- Pure `#0A0A0A` background for dark panels
- Full-width pill OAuth buttons with icon + label
- "Or continue with" subtle divider pattern
- Email magic link as primary auth option (passwordless)
- Large brand wordmark centered at top of form
- Noise/grid texture for background depth
- Single-line value prop below brand mark

---

### 2.9 Vercel

**URL:** https://vercel.com  
**Tagline:** "Build and deploy the best web experiences"

#### Sign-In Page (vercel.com/login)
- **Layout:** Split-panel! Left side = Vercel marketing/brand, Right side = auth form
- **Left panel:** Dark background with animated deployment graph or globe visualization
- **Right panel:** Clean white with centered auth form
- **OAuth:** GitHub (most prominent — Vercel's core audience), GitLab, Bitbucket, email
- **Brand color:** Black (`#000000`) and white — no accent color on auth page
- **Typography:** Geist font family (Vercel's open-source font)

#### Dashboard Design
- **Top bar:** Vercel logo, Team switcher, Search, Account menu
- **Left sidebar (new v0 era):** Projects, Deployments, Analytics, Storage, Integrations, Settings
- **Project cards:** 
  - Dark card with subtle border
  - Shows: project name + git repo + last deployment time + branch name
  - Status indicators: green check (success), yellow (building), red (failed)
  - Deployment preview button

#### "WOW" Moments
- **Deployment speed:** Industry-leading build times — projects deploy in seconds
- **Analytics built-in:** Web analytics for every project, no extra setup
- **Edge Network visualization:** Dashboard shows global CDN hits on a real-time map
- **Bot Protection, DDoS, Firewall** — enterprise security as a checkbox, not afterthought
- **Incremental Static Regeneration** preview in dashboard

#### What to Steal for Argus
- Split-panel auth (Vercel does this!) — validation that split-panel works
- Project cards with deployment status badge (green/yellow/red)
- Team switcher at top
- Global analytics visualization

---

## 3. AUTH PAGE RECOMMENDATIONS FOR ARGUS

### Final Design Spec: Split-Panel Animated Dark Auth

**Overall concept:** Two panels. Left = the ART. Right = the GATE. When switching sign-in ↔ sign-up, both panels execute a full-panel flip (3D card flip on Y-axis via Framer Motion). The experience feels like you're accessing a secret. Maximum drama.

---

### Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│  LEFT PANEL (55%)           │  RIGHT PANEL (45%)               │
│  Dark: #0A0A0A              │  Slightly lighter: #111111        │
│                             │                                   │
│  [ASCII Canvas Animation]   │  [Brand Mark]                     │
│                             │  ARGUS                            │
│  ■ ■ ■ █ ░ ▓ ░ ■ ■         │                                   │
│  ▓ ░ ■ ■ █ ■ ░ ▓ ░         │  [Value Prop]                     │
│  ░ ▓ ░ █ ■ ░ ▓ ░ ■         │  Build web apps. Instantly.       │
│                             │                                   │
│  [Bottom-left tagline]      │  ──── or ────                     │
│  "Build the web.            │                                   │
│   Instantly."               │  [GitHub Button]                  │
│                             │  [Google Button]                  │
│  [Argus ASCII wordmark]     │                                   │
│                             │  [Email Input]                    │
│                             │  [Continue →]                     │
│                             │                                   │
│                             │  Don't have an account? Sign up   │
└────────────────────────────────────────────────────────────────┘
```

---

### Left Panel — ASCII Canvas Animation

**Component name:** `<ArgusAsciiCanvas />`

**Implementation (HTML Canvas + requestAnimationFrame):**
```
Characters: Use a mix of:
  - Block elements: ■ □ ▪ ▫ ▬ ▭ ▮ ▯
  - Box drawing: ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ │ ─
  - Braille patterns: ⠁ ⠂ ⠃ ⠄ ⠅ (feels like code/data)
  - Sparse alphanumeric: 0 1 A R G U S (brand letters fade in/out)

Color scheme:
  - Primary chars: #FA4500 (Argus orange) at varying opacity (0.1 → 0.9)
  - Secondary chars: #FFFFFF at opacity 0.03 → 0.12
  - Background: #080808 (slightly warmer than pure black)

Animation behavior:
  - Characters change every 80-120ms (randomized per cell)
  - Some columns "pulse" — a bright orange column sweeps left-to-right every 3-4s
  - The word "ARGUS" materializes from random chars once on load, then dissolves
  - Mouse-parallax: subtle shift of char density toward cursor position
  - Overall feel: a live data feed, not Matrix rain — more ordered, more orange

Canvas size: fills entire left panel, no margins
Character grid: 40 columns × 25 rows on desktop
Font: JetBrains Mono, 14px, tight line-height (1.0)
```

**Bottom-left overlay text (absolute position):**
```
Font: JetBrains Mono
Line 1: "BUILD THE WEB." — #FA4500, 12px, letter-spacing: 0.2em
Line 2: "INSTANTLY." — #FFFFFF at 40% opacity, 12px
Padding: 32px from edges
```

**Subtle left-panel extras:**
- Top-left: Argus logo (small, white) at 32px from corner
- Vertical line divider between panels: 1px, `rgba(255, 255, 255, 0.08)`

---

### Right Panel — Auth Form

**Background:** `#111111` (slightly lighter than left panel for visual hierarchy)  
**Border-left:** `1px solid rgba(255, 255, 255, 0.06)`

**Component structure:**

```tsx
<div className="right-panel">
  {/* Brand */}
  <div className="brand-section">
    <ArgusLogo size={32} color="#FA4500" />
    <span className="brand-name font-mono">ARGUS</span>
  </div>

  {/* Heading */}
  <h1>Welcome back</h1>  // or "Create account" for sign-up
  <p>Build web apps at the speed of thought</p>

  {/* OAuth Buttons */}
  <OAuthButton provider="github" />
  <OAuthButton provider="google" />

  {/* Divider */}
  <Divider label="or continue with email" />

  {/* Email Input */}
  <EmailInput placeholder="you@company.com" />
  <SubmitButton>Continue →</SubmitButton>

  {/* Toggle */}
  <p>
    Don't have an account?{" "}
    <button onClick={togglePanel}>Sign up</button>
  </p>
</div>
```

**Color specs:**
| Element | Color | Notes |
|---------|-------|-------|
| Panel background | `#111111` | |
| Heading text | `#FFFFFF` | 24px, JetBrains Mono, weight 600 |
| Sub-heading | `#888888` | 14px, JetBrains Mono |
| OAuth buttons | `#1C1C1C` border `#333333` | Pill shape, `border-radius: 8px` |
| OAuth button hover | `#2A2A2A` | Subtle lift |
| OAuth button text | `#FFFFFF` | 14px |
| Divider line | `#2A2A2A` | |
| Divider text | `#666666` | |
| Email input bg | `#1A1A1A` | border: `1px solid #2E2E2E` |
| Email input focus border | `#FA4500` | Orange glow: `0 0 0 3px rgba(250,69,0,0.15)` |
| Email input text | `#FFFFFF` | |
| Email placeholder | `#555555` | |
| Submit button bg | `#FA4500` | |
| Submit button hover | `#E63F00` | Slightly darker orange |
| Submit button text | `#FFFFFF` | |
| Toggle link | `#FA4500` | Underline on hover |

**Input specs:**
```
border-radius: 8px
padding: 12px 16px
font-family: JetBrains Mono
font-size: 14px
width: 100%
height: 48px
transition: all 200ms ease
```

**OAuth button specs:**
```
border-radius: 8px
padding: 12px 16px
display: flex
align-items: center
gap: 10px
width: 100%
height: 48px
cursor: pointer
transition: background 150ms ease, transform 100ms ease
hover: transform: translateY(-1px)
active: transform: translateY(0)
```

---

### Panel Flip Animation (Sign-in ↔ Sign-up)

**Trigger:** User clicks "Sign up" / "Sign in" toggle link

**Animation type:** 3D Y-axis card flip using Framer Motion AnimatePresence

```tsx
// Key implementation concept
const variants = {
  enter: (direction: 1 | -1) => ({
    rotateY: direction > 0 ? 90 : -90,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
  },
  exit: (direction: 1 | -1) => ({
    rotateY: direction > 0 ? -90 : 90,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: [0.55, 0, 1, 0.45] }
  })
};

// The RIGHT panel gets perspective + rotateY
// The LEFT panel does a COUNTER-ROTATION (opposite direction, slower)
// Parent: perspective: 1200px
```

**Left panel during flip:**
- Simultaneously fades different columns of ASCII characters
- Orange sweep animation triggers on flip completion
- Word "ARGUS" assembles again from random chars

**Timing:**
- Exit: 300ms (cubic-bezier easing out)
- Enter: 500ms (spring easing)
- Left panel: 800ms total (slower, more dramatic)

**Copy changes (sign-in → sign-up):**
```
Sign in:  "Welcome back"        → Sign up: "Start building"
Sign in:  "Build at the speed of thought" → Sign up: "Your next app starts here"
Sign in:  "Don't have an account? Sign up" → Sign up: "Already building? Sign in"
```

---

### Mobile Auth (< 768px)
- Stack vertically: Brand mark at top → Auth form → "Continue with email" at bottom
- Left panel (ASCII): Hide completely on mobile OR show as a 120px header strip with scrolling ASCII
- Background: `#0D0D0D` (darker, full screen)
- Pill OAuth buttons: full width

---

## 4. ONBOARDING FLOW RECOMMENDATIONS

### Philosophy: Prompt-First, Zero Friction

Lovable proved it: the best onboarding IS the product. Drop users into the experience. No 5-step wizards. No role selection. No tour. Just: **what do you want to build?**

Argus onboarding = 3 screens. Total time to first build: under 45 seconds.

---

### Step 1: Welcome Screen (2 seconds, auto-advance OR skip)

**Trigger:** First login only (check `user.onboarding_complete` flag in Supabase)

**Layout:** Full-screen takeover (modal overlay, blurred dashboard behind)

**Content:**
```
[Center of screen]

[Argus logo, animates in with Framer Motion spring]

ARGUS
_____________
A R G U S
(ASCII art version, character-by-character reveal)

[Subheading, fadeIn 200ms delay]
"Your AI web app builder."

[Progress dots: ● ○ ○]

[Large CTA button]
"Let's build something →"
[Secondary: "Skip setup" link]
```

**Animation:**
- Background: blurred version of empty workspace
- Logo: scale 0 → 1 with spring physics (damping: 10, stiffness: 100)
- Brand name: character-by-character typewriter (JetBrains Mono, 24ms per char)
- Auto-advance after 2.5s if user doesn't interact (or click to skip)

---

### Step 2: Name Your First Project (10 seconds)

**Component:** `<OnboardingProjectStep />`

```
[Modal, centered, ~480px wide]

"Name your first project"
[14px muted: "You can always change this later"]

[Large text input, auto-focused]
placeholder: "e.g. 'My Startup Dashboard'"
font: JetBrains Mono, 20px

[Below input — quick suggestions as chips:]
  [  📊 Dashboard  ]  [  🛒 E-commerce  ]  [  📝 Blog  ]  [  🤖 AI Tool  ]

[Progress: ● ● ○]

[CTA: "Create Project →"]
[Back link]
```

**Behavior:**
- Auto-focus input on mount
- Clicking a chip fills the input
- "Create Project" creates a Supabase record and advances
- Hitting Enter key advances

---

### Step 3: First Prompt (THE MOMENT)

**This is the product. This is where onboarding ends and using Argus begins.**

```
[Full editor layout loads]
[Left panel: chat history (empty)]
[Center panel: preview pane (blank, dark)]
[Right panel: file tree (empty)]

[OVERLAY on center panel — semi-transparent dark overlay]
[Large centered prompt input, glowing orange border]

  "What should I build for you?"
  
  [Text area, placeholder rotating through:]
    "Build me a SaaS dashboard with user auth..."
    "Create a landing page for my startup..."
    "Make an AI-powered note-taking app..."
    "Build a project management tool like Linear..."
  
  [Submit: "Build it →" button, orange, full-width below input]
  
  [Below submit, smaller:]
  "Or start from a template:"
  [3 template cards: SaaS / Portfolio / Internal Tool]
```

**Animation:**
- Editor loads behind the overlay (skeleton state, then actual UI)
- Overlay has `backdrop-filter: blur(8px)` and `background: rgba(0,0,0,0.6)`
- When user submits first prompt → overlay fades out (300ms)
- AI begins generating → progress bar in left panel
- First file appears in right panel
- Preview iframe begins loading

**Mark onboarding complete:**
```javascript
await supabase
  .from('users')
  .update({ onboarding_complete: true, first_project_id: projectId })
  .eq('id', user.id)
```

---

### Onboarding State Machine

```
AUTH → WELCOME_SCREEN (2.5s) → PROJECT_NAME → FIRST_PROMPT → EDITOR
         [skip]                  [back]         [back]
```

**What we DON'T collect:**
- ❌ Role/job title (Webflow does this, wastes time)
- ❌ Team size
- ❌ How they heard about us
- ❌ Use case selection
- ❌ Any setting/preference

**What we DO collect:**
- ✅ Project name (required for workspace)
- ✅ First prompt (immediately starts building)

---

### Post-Onboarding: Contextual In-App Guidance

Instead of a front-loaded tour, use contextual tooltips:
- First time user opens file tree → tooltip: "Your project files live here"
- First time user connects Supabase → tooltip: "Your database is ready"
- First deployment → full-screen celebration modal (confetti, shareable link)

---

## 5. PRODUCT WORKSPACE RECOMMENDATIONS (Figma-style)

### Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ TOP NAV (56px)                                                   │
│ [ARGUS logo] [Workspace dropdown ▼] [Search] ... [+ New] [Avatar]│
├───────────────┬─────────────────────────────────────────────────┤
│ SIDEBAR (240px)│ MAIN CONTENT AREA                              │
│                │                                                 │
│ ▸ Recent       │  [Grid or List of Project Cards]               │
│ ▸ All Projects │                                                 │
│ ▸ Shared       │                                                 │
│ ▸ Templates    │                                                 │
│                │                                                 │
│ ─────────────  │                                                 │
│ ▸ Team Alpha   │                                                 │
│   ▸ Project X  │                                                 │
│   ▸ Project Y  │                                                 │
│                │                                                 │
│ ─────────────  │                                                 │
│ ▸ Settings     │                                                 │
│ ▸ Invite Team  │                                                 │
│ ▸ Upgrade      │                                                 │
└───────────────┴─────────────────────────────────────────────────┘
```

---

### Top Navigation Bar

**Height:** 56px  
**Background:** `#0E0E0E` (dark, matching auth page)  
**Border-bottom:** `1px solid rgba(255,255,255,0.06)`

**Elements left → right:**
1. **Argus Logo mark** (small, 28px, orange) + "ARGUS" wordmark (JetBrains Mono)
2. **Workspace Dropdown** — `[Sammy's Workspace ▼]` — clicking reveals:
   - Personal workspace
   - Any team workspaces
   - `+ Create new workspace`
   - Divider + "Manage workspaces"
3. **Search bar** (center-ish) — `⌘K` shortcut, placeholder: "Search projects..."
   - Opens a command palette (like Linear's Cmd+K)
4. **RIGHT SIDE:**
   - `+ New Project` button — `#FA4500` background, white text, 34px height, `border-radius: 6px`
   - Notifications bell icon
   - Avatar with dropdown (Profile, Settings, Sign out)

---

### Left Sidebar

**Width:** 240px  
**Background:** `#0A0A0A`  
**Border-right:** `1px solid rgba(255,255,255,0.05)`

**Section structure:**
```
[USER AVATAR + NAME]    ← 44px header row
Sammy T.
─────────────────────
⊞  Dashboard
📁  Recent
⬡  All Projects
👥  Shared with me
★  Starred

─────────────────────
WORKSPACES
  ▶ Personal
  ▶ Team Alpha
     ▶ Landing Pages
     ▶ Client Work
  + New Workspace

─────────────────────
LIBRARY
🧩  Templates
💡  Inspiration

─────────────────────
⚙  Settings
💬  Feedback
⬆  Upgrade to Pro
```

**Sidebar item styles:**
```css
.sidebar-item {
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  color: #888;
  font-size: 13px;
  font-family: JetBrains Mono;
  cursor: pointer;
}
.sidebar-item:hover {
  background: rgba(255,255,255,0.04);
  color: #FFFFFF;
}
.sidebar-item.active {
  background: rgba(250,69,0,0.12);
  color: #FA4500;
}
```

---

### Project Cards (Grid View)

**Grid:** `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`  
**Gap:** 20px  
**Card dimensions:** ~280px × 200px total

```
┌──────────────────────────────┐
│  [THUMBNAIL — 280×160px]     │  ← 16:9 screenshot of app OR gradient placeholder
│  [Status badge: ● Live]      │  ← top-right corner of thumbnail, absolute
│  ─────────────────────────── │
│  Project Name                │  ← 14px, #FFFFFF, JetBrains Mono, truncated
│  Last edited 2h ago • 3 👤  │  ← 12px, #555, inline collaborator dots
└──────────────────────────────┘
```

**Card hover state:**
- `box-shadow: 0 8px 32px rgba(0,0,0,0.5)`
- `transform: translateY(-2px)`
- `transition: all 200ms ease`
- Overlay appears with 3 quick-action buttons:
  ```
  [Open →] [Duplicate] [⋮ More]
  ```

**"NEW PROJECT" card (always first position):**
```
┌──────────────────────────────┐
│                              │
│      +                       │  ← Centered + icon, 40px, #FA4500
│   New Project                │
│                              │
└──────────────────────────────┘
```
- Border: `2px dashed rgba(250,69,0,0.3)`
- Background: `rgba(250,69,0,0.04)`
- Hover: `rgba(250,69,0,0.08)`, border solid

**Card color specs:**
| Element | Value |
|---------|-------|
| Card background | `#161616` |
| Card border | `1px solid rgba(255,255,255,0.06)` |
| Card hover border | `rgba(255,255,255,0.12)` |
| Thumbnail bg (no screenshot) | gradient: `linear-gradient(135deg, #1A1A1A, #222)` |
| Thumbnail placeholder text | `#FA4500` at 20% opacity (project name in ASCII) |

**Status badges:**
```
● Live        → green #22C55E background, #111 text
● Building... → orange #FA4500 pulsing
● Draft       → #444 background, #888 text
● Error       → red #EF4444
```

---

### List View (Toggle)

**Toggle:** Top-right of content area: `⊞ Grid` `≡ List` buttons

**List row anatomy (48px height):**
```
[Favicon/Thumbnail 32px] | [Project Name] | [Status] | [Last modified] | [Team] | [...]
```

---

### Project Card Thumbnail System

**Priority 1:** Live screenshot (take screenshot on deploy via Puppeteer/playwright)  
**Priority 2:** User-uploaded thumbnail  
**Priority 3:** Generated gradient with project initials (ASCII art of project name)

**Thumbnail gradient formula:**
```javascript
const colors = ['#FA4500', '#FF6B35', '#FF8C42', '#E63F00'];
const gradient = `linear-gradient(
  ${hash(projectName) % 180}deg,
  ${colors[hash(projectName) % 4]},
  #0A0A0A
)`;
```

---

### Workspace Switcher Modal

**Trigger:** Click workspace dropdown in top nav

```
┌────────────────────────────────┐
│ 🏠 Personal                ✓  │  ← current
│ 👥 Team Alpha                 │
│ 👥 Client Workspace           │
│ ─────────────────────────────  │
│ + Create new workspace         │
│ ⚙ Workspace settings          │
└────────────────────────────────┘
```

---

### Team Collaboration Features

**Invite modal** (`/workspace/invite`):
```
Invite teammates to [Workspace Name]

[Email input]  [Role dropdown: Admin/Editor/Viewer]  [Send Invite]

Pending invites:
• bob@company.com (Editor) [Resend] [Cancel]

Current members:
• Sammy T. (Admin — You)
• [Avatar] Jane D. (Editor)
```

**Real-time presence** (like Figma):
- Show avatar circles in top-right of editor when teammates are in same project
- Max 3 shown, `+N` overflow
- Click avatar → see their cursor position

---

## 6. MODEL MARKETPLACE RECOMMENDATIONS

### Philosophy: The "App Store" for AI Brains

Argus should have a model selector that feels like choosing a tool from a weapon rack — each model has a personality, a cost, a speed, and a best use case. This is a KEY differentiator.

---

### Model Selector (In Editor — Prompt Bar)

**Component name:** `<ModelSelector />`  
**Location:** Top of chat/prompt input area, left-aligned  
**Default state:** Shows current model name + tiny indicator

```
[Claude 3.7 Sonnet ▼]  [prompt input field..........................]  [Build →]
```

**Dropdown UI (click to expand):**
```
┌────────────────────────────────────────────────────────────────┐
│ Choose your AI                                          [×]    │
├────────────────────────────────────────────────────────────────┤
│ RECOMMENDED                                                    │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ● Claude 3.7 Sonnet                      [SELECTED]      │  │
│ │   Best all-around · Fast · Great at UI   🔥 Popular      │  │
│ │   Cost: 1x · Speed: ●●●●○                               │  │
│ └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│ POWER                                                          │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ○ Claude Opus 4                                          │   │
│ │   Best for complex apps · Slower · Most capable          │   │
│ │   Cost: 3x · Speed: ●●○○○                               │   │
│ └─────────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ○ GPT-4o                                                 │   │
│ │   Great for OpenAI integrations · Reliable               │   │
│ │   Cost: 2x · Speed: ●●●○○                               │   │
│ └─────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────┤
│ SPEED                                                          │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ○ Gemini Flash 2.0                                       │   │
│ │   Fastest builds · Great for iterations · Lower accuracy │   │
│ │   Cost: 0.5x · Speed: ●●●●●                             │   │
│ └─────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────┤
│ SPECIALTY                                                      │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ○ DeepSeek R1 [BETA]                                     │   │
│ │   Exceptional reasoning · Best for algorithms            │   │
│ │   Cost: 1.5x · Speed: ●●●○○                             │   │
│ └─────────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 🔒 Llama 3.3 70B [PRO]                                   │   │
│ │   Open source · Privacy-first · Self-hostable            │   │
│ │   Cost: 0x · Speed: ●●●●○                               │   │
│ └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Model card specs:**
- Background: `#1A1A1A`
- Border: `1px solid #2E2E2E`
- Selected: border `#FA4500`, background `rgba(250,69,0,0.08)`
- Hover: background `#202020`
- Border-radius: `8px`
- Padding: `12px 16px`

---

### Model Marketplace (Full Page)

**Route:** `/marketplace` or accessible from sidebar

**Layout:** Similar to App Store / VS Code Extension Marketplace

```
┌──────────────────────────────────────────────────────────────────┐
│ Model Marketplace                                                 │
│ Supercharge your builds with specialized AI models               │
├───────────────────────────────────────────────────────────────────┤
│ [Search models...]    [Filter: All ▼] [Category: All ▼] [Sort ▼]  │
├───────────────────────────────────────────────────────────────────┤
│ FEATURED THIS WEEK                                                │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │                  [Claude 3.7 Sonnet BANNER]                 │   │
│ │  Best-in-class UI generation. Perfect for Argus workflows.  │   │
│ └────────────────────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────────┤
│ CATEGORIES                                                        │
│  [🎨 UI/Frontend]  [⚡ Speed]  [🧠 Reasoning]  [🔒 Privacy-first] │
│  [📊 Data]         [🤖 Agents] [💰 Free]       [🔬 Research]      │
├───────────────────────────────────────────────────────────────────┤
│ ALL MODELS (grid: 3 columns)                                      │
│                                                                   │
│  [Model Card]    [Model Card]    [Model Card]                     │
│  [Model Card]    [Model Card]    [Model Card]                     │
└───────────────────────────────────────────────────────────────────┘
```

**Full Model Card (marketplace):**
```
┌────────────────────────────────────┐
│ [Provider logo — Anthropic/OpenAI] │
│                                    │
│ Claude 3.7 Sonnet                  │  ← 16px, white, JetBrains Mono
│ by Anthropic                       │  ← 12px, muted
│                                    │
│ "Best for building polished UIs    │
│  with complex state management"    │  ← 13px, muted, 2 lines max
│                                    │
│ ────────────────────────────────── │
│ ⚡ Speed: ●●●●○                    │
│ 💡 Best for: Frontend, APIs        │
│ 💰 Cost: 1x credit                 │
│                                    │
│ [Set as Default]  [Try Now]        │
└────────────────────────────────────┘
```

---

### Inspiration Gallery

**Route:** `/gallery` or `/explore`

**What it is:** A curated showcase of apps built with Argus — like Lovable's showcase or Dribbble for AI-built apps.

**Layout:** Masonry grid (like Pinterest/Dribbble)

```
┌────────────────────────────────────────────────────────────────┐
│ Explore what's possible with Argus                              │
│ [Search...] [Tag: All ▼] [Sort: Trending ▼]                    │
├────────────────────────────────────────────────────────────────┤
│                    [MASONRY GRID]                               │
│                                                                 │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│ │ [App     │  │ [App     │  │ [App     │  │ [App     │       │
│ │ Screenshot│  │ Screenshot│  │ Screenshot│  │ Screenshot│     │
│ │ varying  │  │          │  │ tall     │  │          │       │
│ │ heights] │  │ tall]    │  │          │  │ medium]  │       │
│ │          │  │          │  │          │  │          │       │
│ │ App Name │  │ App Name │  │ App Name │  │ App Name │       │
│ │ @creator │  │ @creator │  │ @creator │  │ @creator │       │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────────────────────────────────────────┘
```

**Gallery card hover:**
- Overlay with: "Clone this app →" button (orange, prominent)
- Like/bookmark count
- Model used badge

**Filter tags:**
- Dashboard, SaaS, Landing Page, Portfolio, E-commerce, Tool, Game, AI App, API, Internal Tool

---

### Pricing / Credits for Models

**Approach (like Bolt.new):** Token-based credits system

| Plan | Credits/mo | Description |
|------|-----------|-------------|
| Free | 100 | GPT-4o Mini + Gemini Flash only |
| Pro ($20/mo) | 2,000 | All models including Claude Sonnet |
| Scale ($50/mo) | 8,000 | Claude Opus + priority queue |
| Team ($99/mo) | 25,000 | All models + team features + collaboration |

**Credit indicator** (visible in top nav):
```
⬡ 847 credits remaining
```
Clicking shows breakdown and upgrade prompt.

---

## 7. ADDITIONAL IMPLEMENTATION NOTES

### Typography System
```css
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-sans: 'Inter', -apple-system, sans-serif; /* UI chrome only */

/* Use mono for: brand mark, headings, code, input fields, buttons */
/* Use sans for: body text, descriptions, tooltips */
```

### Color System (Complete)
```css
/* Brand */
--argus-orange: #FA4500;
--argus-orange-dark: #E63F00;
--argus-orange-light: #FF6B35;
--argus-orange-glow: rgba(250, 69, 0, 0.15);
--argus-orange-subtle: rgba(250, 69, 0, 0.06);

/* Dark palette (auth + workspace) */
--bg-00: #080808;    /* Darkest — ASCII canvas */
--bg-01: #0A0A0A;   /* Dark — sidebar, Linear-style */
--bg-02: #0E0E0E;   /* Top nav */
--bg-03: #111111;   /* Auth right panel */
--bg-04: #161616;   /* Cards, modals */
--bg-05: #1A1A1A;   /* Inputs, dropdowns */
--bg-06: #202020;   /* Hover states */
--bg-07: #2A2A2A;   /* Active states */

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #AAAAAA;
--text-muted: #666666;
--text-disabled: #444444;

/* Borders */
--border-subtle: rgba(255,255,255,0.05);
--border-default: rgba(255,255,255,0.08);
--border-strong: rgba(255,255,255,0.15);

/* Light mode (landing page only) */
--lp-bg: #FAFAFA;
--lp-text: #0A0A0A;
--lp-accent: #FA4500;
```

### Animation Principles
```
1. Spring physics for UI transitions (Framer Motion spring)
   - Stiffness: 100-300 (faster/snappier for micro-interactions)
   - Damping: 20-30 (no bounce for professional feel)
   - Mass: 0.8 (slightly snappy)

2. Ease curves:
   - Entering: ease-out [0, 0, 0.2, 1] — fast start, gentle end
   - Exiting: ease-in [0.4, 0, 1, 1] — gentle start, fast exit
   - Auth flip: custom [0.23, 1, 0.32, 1] (elastic)

3. Durations:
   - Micro (hover): 100-150ms
   - Component (mount/unmount): 200-300ms
   - Page/panel transitions: 400-600ms
   - ASCII canvas: continuous (60fps)

4. GPU-accelerated only:
   - transform (translate, scale, rotate)
   - opacity
   - filter (blur)
   NEVER animate: width, height, padding, margin, top, left
```

### Key Component Names (for Claude Code reference)
```
<ArgusAsciiCanvas />          — Left panel animated art
<AuthSplitLayout />           — Parent container for auth
<AuthSignInForm />            — Right panel sign-in content
<AuthSignUpForm />            — Right panel sign-up content
<AuthPanelFlip />             — AnimatePresence wrapper for flip
<WorkspaceDashboard />        — Main workspace view
<ProjectCard />               — Individual project card
<NewProjectCard />            — "+" placeholder card
<ProjectGrid />               — Grid container
<WorkspaceSidebar />          — Left navigation sidebar
<WorkspaceSwitcher />         — Top-left dropdown
<ModelSelector />             — Prompt bar model chooser
<ModelMarketplace />          — Full marketplace page
<ModelCard />                 — Individual model card
<InspirationGallery />        — Masonry showcase
<OnboardingWelcome />         — Step 1
<OnboardingProjectName />     — Step 2
<OnboardingFirstPrompt />     — Step 3
<EditorLayout />              — 3-panel editor
<EditorChatPanel />           — Left: conversation history
<EditorPreviewPane />         — Center: iframe preview
<EditorCodePanel />           — Right: file tree + code
<CreditIndicator />           — Top nav credit display
<CollaboratorAvatars />       — Presence indicators
```

---

## 8. REFERENCE SCREENSHOTS / URLS

| Platform | Auth Page | Dashboard |
|----------|-----------|-----------|
| Linear | https://linear.app/signin | — |
| Vercel | https://vercel.com/login | https://vercel.com/dashboard |
| Lovable | https://lovable.dev (sign in) | https://lovable.dev/projects |
| Bolt | https://bolt.new (sign in) | https://bolt.new/~/home |
| v0 | https://v0.app (sign in) | https://v0.app |
| Replit | https://replit.com/login | https://replit.com/~/ |
| Framer | https://framer.com (sign in) | https://framer.com/projects |
| Webflow | https://webflow.com/dashboard | https://webflow.com/dashboard |
| Cursor | https://cursor.com/signin | https://cursor.com/settings |

---

## 9. PRIORITIZED IMPLEMENTATION ORDER

### Phase 1 (Auth + First Impression)
1. `<ArgusAsciiCanvas />` — ASCII animation component
2. `<AuthSplitLayout />` — split panel container
3. `<AuthSignInForm />` + `<AuthSignUpForm />`
4. `<AuthPanelFlip />` — panel flip animation
5. Supabase Auth integration (magic link + Google + GitHub)

### Phase 2 (Workspace)
1. `<WorkspaceDashboard />` shell
2. `<WorkspaceSidebar />` + `<WorkspaceSwitcher />`
3. `<ProjectCard />` + `<ProjectGrid />`
4. `<NewProjectCard />`
5. Top navigation bar

### Phase 3 (Onboarding)
1. `<OnboardingWelcome />` — animated reveal
2. `<OnboardingProjectName />` — project creation
3. `<OnboardingFirstPrompt />` — first build overlay

### Phase 4 (Editor)
1. `<EditorLayout />` — 3-panel shell
2. `<ModelSelector />` — model picker in prompt bar
3. `<EditorChatPanel />` — conversation UI
4. `<EditorPreviewPane />` — iframe preview
5. `<EditorCodePanel />` — file tree + code view

### Phase 5 (Marketplace)
1. `<ModelMarketplace />` page
2. `<ModelCard />` component
3. `<InspirationGallery />` masonry grid
4. `<CreditIndicator />` + credit system

---

*This document was produced through exhaustive competitive research of Lovable.dev, Bolt.new, v0.dev, Replit, Cursor, Framer, Webflow, Linear, and Vercel. Every recommendation is based on documented patterns from these platforms combined with Argus's specific brand identity (JetBrains Mono, #FA4500, dark auth, ASCII animations). Hand this directly to Claude Code as the implementation brief.*
