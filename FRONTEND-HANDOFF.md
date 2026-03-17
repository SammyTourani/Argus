# Frontend Handoff: Sandbox Resume + Screenshot System

> This document was generated for the frontend agent building the new workspace UI.
> It describes backend changes that are already implemented and the API contracts
> the frontend must integrate with.

## What Changed (Backend — Already Done)

### 1. Instant Project Resume

A new endpoint `POST /api/resume-sandbox` replaces the old flow of always calling
`POST /api/create-ai-sandbox-v2` when opening an existing project. It uses a 3-tier
strategy:

- **Tier 1 (~1s):** Reconnects to a paused/running E2B sandbox (sandbox state is preserved)
- **Tier 2 (~3-8s):** Creates a new sandbox from a pre-built template and injects files from the database
- **Tier 3 (~15-30s):** Full rebuild (old behavior, fallback only)

Sandboxes are now **paused** instead of killed when the user leaves. Paused sandboxes
cost nothing and persist indefinitely.

### 2. Accurate Screenshots

Screenshots are now captured **server-side** after every successful build. The backend
calls `/api/capture-screenshot` with the sandbox preview URL (not the source URL).
The frontend no longer needs to trigger screenshot capture.

### 3. Complete File Snapshots

`project_builds.files_json` now includes config files (vite.config.js, tailwind.config.js,
postcss.config.js, index.html, package.json) — not just user-generated code. This makes
project restoration reliable.

### 4. Sandbox ID Tracking

`project_builds.sandbox_id` and `project_builds.preview_url` are now populated after
sandbox creation. This enables Tier 1 resume (reconnecting to existing sandboxes).

---

## API Contracts

### `POST /api/resume-sandbox`

**Use this instead of `POST /api/create-ai-sandbox-v2` when opening an EXISTING project.**

Only use `create-ai-sandbox-v2` for brand-new projects that have no builds yet.

**Request:**
```json
{
  "projectId": "uuid-of-project",
  "buildId": "uuid-of-build (optional, defaults to latest build)"
}
```

**Response:**
```json
{
  "success": true,
  "sandboxId": "e2b-sandbox-id",
  "url": "https://sandboxId-5173.e2b.dev",
  "resumeTier": 1,
  "resumeTimeMs": 842
}
```

- `resumeTier`: 1 = instant reconnect, 2 = template rebuild, 3 = full rebuild
- `resumeTimeMs`: actual time the resume took (for telemetry/UX)
- `url`: set this as the iframe `src` for the live preview

**Error response:**
```json
{
  "error": "No builds found for this project"
}
```

### `POST /api/create-ai-sandbox-v2`

**Now accepts optional `projectId` and `buildId` in the body** (for sandbox ID tracking):
```json
{
  "url": "https://example.com",
  "prompt": "Clone this site",
  "model": "gemini-2.5-flash",
  "projectId": "uuid",
  "buildId": "uuid"
}
```

### `POST /api/kill-sandbox`

Still works the same, but now **pauses** the sandbox instead of killing it.
The user's sandbox can be resumed later via `resume-sandbox`.

### Screenshots

**No frontend code needed.** The backend (`apply-ai-code-stream`) now triggers
a screenshot capture of the sandbox URL after every successful build. Thumbnails
update automatically in `project_builds.thumbnail_url` and `projects.thumbnail_url`.

**What to remove from the old EditorPage.tsx (if still present):**
- Lines that save `scrapeData.screenshot` as the project thumbnail (clone builds)
- Lines that call `POST /api/capture-screenshot` from the client

---

## Frontend Integration Guide

### Opening an Existing Project

```typescript
// Step 1: Load data from DB immediately (show UI instantly)
const [buildRes, messagesRes] = await Promise.all([
  fetch(`/api/projects/${projectId}/builds/${buildId}`),
  fetch(`/api/projects/${projectId}/builds/${buildId}/messages`),
]);
const { build } = await buildRes.json();
const { messages } = await messagesRes.json();

// Immediately display:
// - File tree from build.files_json.files (array of { path, content })
// - Chat history from messages
// - Show "Connecting to preview..." in the iframe area

// Step 2: Resume the sandbox
const resumeRes = await fetch('/api/resume-sandbox', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId, buildId: build.id }),
});
const { sandboxId, url, resumeTier, resumeTimeMs } = await resumeRes.json();

// Step 3: Show the live preview
// Set iframe src to `url`

// Loading UX by tier:
//   resumeTier 1: Should feel instant (< 1s), minimal/no loading indicator
//   resumeTier 2: Show "Restoring project..." (3-8s)
//   resumeTier 3: Show "Setting up environment..." with progress (15-30s)
```

### Creating a New Project

Use the existing `POST /api/create-ai-sandbox-v2` flow. Pass `projectId` and `buildId`
in the body so the sandbox ID gets tracked:

```typescript
const res = await fetch('/api/create-ai-sandbox-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: sourceUrl,        // optional, for clone builds
    prompt: userPrompt,    // optional
    model: selectedModel,
    projectId,
    buildId,
  }),
});
```

### Page Unload / Navigation Away

The sandbox auto-pauses on inactivity (30 min timeout). You can optionally send
a beacon to pause it immediately:

```typescript
// On page unload or navigation away from workspace
navigator.sendBeacon('/api/kill-sandbox');
// This pauses (not kills) the sandbox — it can be resumed later
```

### File Tree from files_json

`build.files_json` has this shape:
```typescript
{
  files: Array<{ path: string; content: string }>,
  timestamp: string  // ISO date
}
```

The `files` array includes everything needed to reconstruct the project:
- Source files (src/App.jsx, src/components/*.jsx, etc.)
- Config files (vite.config.js, tailwind.config.js, postcss.config.js)
- package.json (with all dependencies)
- index.html

Use this to populate the file tree and editor panels immediately while the
sandbox resumes in the background.

---

## Key Files (Backend)

| File | What it does |
|------|-------------|
| `app/api/resume-sandbox/route.ts` | 3-tier sandbox resume endpoint |
| `app/api/create-ai-sandbox-v2/route.ts` | Sandbox creation (now tracks sandbox_id) |
| `app/api/apply-ai-code-stream/route.ts` | Code application (now captures screenshots + complete files_json) |
| `app/api/kill-sandbox/route.ts` | Pauses sandbox (was: kills) |
| `lib/sandbox/providers/e2b-provider.ts` | E2B provider with pause/resume support |
| `config/app.config.ts` | E2B config (templateId, preferPause, lifecycle) |
| `e2b-template/` | Custom E2B template (needs manual build) |

---

## Database Schema (Relevant Fields)

### `project_builds`
- `sandbox_id` (TEXT, nullable) — E2B sandbox ID for reconnection
- `preview_url` (TEXT, nullable) — Sandbox preview URL
- `files_json` (JSONB, nullable) — Complete file snapshot `{ files: [...], timestamp }`
- `thumbnail_url` (TEXT, nullable) — Screenshot of the built project
- `status` (TEXT) — 'pending' | 'generating' | 'complete' | 'failed'

### `projects`
- `thumbnail_url` (TEXT, nullable) — Latest build screenshot (auto-synced via DB trigger)
