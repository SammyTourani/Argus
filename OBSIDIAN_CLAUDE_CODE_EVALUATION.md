# Obsidian + Claude Code Personal OS — Evaluation for OpenClaw Integration

**Date:** 2026-02-26
**Source:** [@RoundtableSpace](https://x.com/RoundtableSpace/status/2026345125534703860) (condensed from [Greg Isenberg's 10-step framework](https://x.com/gregisenberg/status/2026036464287412412), 6.9K likes)
**Podcast:** ["How I Use Obsidian + Claude Code to Run My Life"](https://podcasts.apple.com/mw/podcast/how-i-use-obsidian-claude-code-to-run-my-life/id1593424985?i=1000751070268) with Internet Vin
**Starter Kit:** [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm)

---

## The Workflow (Summary)

1. Write everything in markdown in Obsidian vault
2. Link notes with `[[wikilinks]]` to mirror how you think
3. Install Obsidian CLI so Claude Code can read vault + link graph
4. CLAUDE.md at vault root defines identity, structure, available commands
5. Custom slash commands: `/context`, `/trace`, `/connect`, `/ideas`, `/graduate`, `/ghost`, `/challenge`
6. Strict rule: **human writes the vault, agents read/suggest/execute**
7. Goal cascade: 3-Year Vision → Yearly Goals → Projects → Monthly → Weekly → Daily
8. Claude surfaces patterns you've been unconsciously circling

---

## Current OpenClaw Memory Stack vs. This Approach

| Feature | Obsidian+Claude Code Workflow | OpenClaw Current State | Gap? |
|---------|-------------------------------|----------------------|------|
| Markdown-first storage | Obsidian vault | `workspace/memory/*.md` + `MEMORY.md` | No gap — already markdown-first |
| Knowledge graph / linking | `[[wikilinks]]` + backlinks | MCP Memory (45 entities, **0 relations**) | **Yes** — MCP graph has no relations |
| AI context file | CLAUDE.md at vault root | CLAUDE.md (project-level) + MEMORY.md + SOUL.md + USER.md | No gap — arguably more complete |
| Slash commands | 15+ custom commands | 43 skills + custom commands | No gap — more extensive |
| Goal cascade | Built-in `/project`, `/review` | pending-tasks.md + heartbeat-state.json | **Partial gap** — no structured goal hierarchy |
| Pattern surfacing | `/trace`, `/connect` | Not implemented | **Yes** — no cross-note pattern analysis |
| Daily/weekly/monthly reviews | `/daily`, `/weekly`, `/monthly` | Nightly cron + manual | **Partial** — automated but not structured |
| Human writes, agent reads | Core philosophy | Mixed — agent writes daily logs | **Design divergence** |
| Persistent cross-session context | Vault is always there | MEMORY.md + MCP Memory | No gap |
| Semantic search | Not built-in (Obsidian search is text-based) | Not implemented (identified as gap Feb 22) | Shared gap |

---

## Prior Internal Assessment (Feb 22, `research/memory-ui-research.md`)

The prior research doc rated Obsidian integration as **"NEVER"** for this stack:

> "Obsidian is a human-facing tool. Its value is bidirectional linking and graph view (you navigate visually). For an AI agent, none of this matters. The agent doesn't navigate a graph view. It searches."

**This assessment was correct for the narrow question of "should the agent use Obsidian?"** — but it missed the broader insight from the Isenberg workflow: **Obsidian is for the human, Claude Code is for the agent, and the vault is the shared interface.**

The workflow isn't about making the agent use Obsidian. It's about making the *human's* note-taking system machine-readable so the agent gets better context.

---

## Recommendation: Don't Add Obsidian — Backport the Good Ideas

### Why NOT to add Obsidian

1. **Sammy doesn't use Obsidian** — no vault exists on this system. Adopting a new PKM tool is a lifestyle change, not a config change.
2. **The markdown files already exist** — `workspace/memory/`, MEMORY.md, daily logs. The format is identical.
3. **Obsidian CLI adds no agent value** — it exposes file ops and search that `grep`/`rg`/`find` already provide.
4. **Maintenance overhead** — syncing an Obsidian vault with OpenClaw's workspace creates a second source of truth.
5. **The Feb 22 research is correct** — for agent use, structured search (FTS5, semantic) beats graph navigation.

### What TO backport from this workflow

These ideas from the Isenberg/Vin workflow would improve OpenClaw **without Obsidian**:

#### 1. Fix the MCP Knowledge Graph (Priority: HIGH)
The MCP Memory server has **45 entities and 0 relations**. This makes it a flat key-value store, not a graph. Adding relations between entities (e.g., `Argus --uses--> Supabase`, `RBC Borealis --internship-at--> RBC`) would enable the kind of cross-domain pattern matching that `/connect` does in the Obsidian workflow.

**Action:** Write a script that reads existing entities and creates logical relations between them.

#### 2. Build `/trace` and `/connect` Skills (Priority: MEDIUM)
- `/trace <topic>` — search all daily logs + MEMORY.md for how an idea evolved over time
- `/connect <domain-a> <domain-b>` — find intersection points between two topics across notes

These are grep+LLM operations, not graph operations. They work on flat markdown files.

#### 3. Add Goal Cascade to MEMORY.md (Priority: MEDIUM)
Structure goals hierarchically:
```
## Goal Cascade
### 3-Year Vision: [...]
### 2026 Goals: [...]
### Active Projects: [linked to goals]
### This Month: [...]
### This Week: [...]
```
The pending-tasks.md already tracks tasks — linking them to higher-level goals adds the "why."

#### 4. Secure the MCP Memory Data (Priority: HIGH)
The knowledge graph data lives in the **npx cache** at `~/.npm/_npx/.../dist/memory.jsonl`. A cache clean destroys it. Set `MEMORY_FILE_PATH` env var to a stable location like `~/.openclaw/data/memory.jsonl`.

#### 5. Structured Review Cadence (Priority: LOW)
Add `/weekly-review` and `/monthly-review` skills that pull data from daily logs and generate structured retrospectives. The nightly cron already runs — extend it.

---

## What Sammy Could Do If He Wants the Full Experience

If Sammy personally wants to adopt Obsidian as his note-taking app (independent of OpenClaw):

1. Install Obsidian (free, local-first)
2. Point vault root at `~/.openclaw/workspace/` (or a symlinked subset)
3. Add CLAUDE.md with the slash command definitions
4. Use Obsidian for writing, Claude Code for execution
5. Install the [Agent Client plugin](https://forum.obsidian.md/t/new-plugin-agent-client-bring-claude-code-codex-gemini-cli-inside-obsidian/108448) to embed Claude Code in Obsidian sidebar

This is a **personal productivity choice**, not an infrastructure decision. It doesn't require code changes to Argus or OpenClaw.

---

## TL;DR

| Decision | Verdict |
|----------|---------|
| Install Obsidian for OpenClaw agents? | **No** — agents don't benefit from it |
| Install Obsidian for Sammy personally? | **Maybe** — personal choice, recommend trying it |
| Backport slash command ideas? | **Yes** — `/trace` and `/connect` are valuable |
| Fix MCP Memory relations? | **Yes** — high priority, enables graph queries |
| Secure MCP Memory storage path? | **Yes** — critical, data is fragile |
| Add goal cascade? | **Yes** — structures existing tasks around purpose |
| Adopt the "human writes, agent reads" rule? | **Worth considering** — cleaner separation of concerns |

---

## Sources

- [@RoundtableSpace tweet](https://x.com/RoundtableSpace/status/2026345125534703860) (289 likes, 246 bookmarks)
- [Greg Isenberg 10-step thread](https://x.com/gregisenberg/status/2026036464287412412) (6.9K likes, 14.9K bookmarks)
- [Podcast: How I Use Obsidian + Claude Code to Run My Life](https://podcasts.apple.com/mw/podcast/how-i-use-obsidian-claude-code-to-run-my-life/id1593424985?i=1000751070268)
- [ballred/obsidian-claude-pkm starter kit](https://github.com/ballred/obsidian-claude-pkm)
- [Axton Liu: Obsidian x Claude Code Workflows](https://www.axtonliu.ai/newsletters/ai-2/posts/obsidian-claude-code-workflows)
- [XDA: Claude Code Inside Obsidian](https://www.xda-developers.com/claude-code-inside-obsidian-and-it-was-eye-opening/)
- Internal: `research/memory-ui-research.md` (Feb 22 prior assessment)
