/**
 * Context Optimizer — smart file selection for AI code generation.
 *
 * Instead of sending every project file to the AI model (wasting tokens and
 * increasing latency), this module selects only the files relevant to the
 * user's request. It supports two selection strategies:
 *
 *   1. **AI selection** — asks Gemini Flash (cheap/fast) to pick files.
 *   2. **Heuristic selection** — keyword matching, entry-point detection, and
 *      prompt-mention scanning. Used as a fallback when the AI call fails or
 *      when `useAISelection` is disabled.
 *
 * Results are cached by a normalised prompt key so repeated / similar requests
 * skip the AI round-trip entirely.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { estimateFileTokens, estimateTokens } from './token-counter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextOptimizerOptions {
  /** Maximum number of files to include in context (default: 15). */
  maxFiles?: number;
  /** Maximum total estimated tokens across all selected files (default: 50000). */
  maxTokenBudget?: number;
  /** Use Gemini Flash to select files (default: true). */
  useAISelection?: boolean;
  /** Fall back to heuristic selection if the AI call fails (default: true). */
  fallbackToHeuristic?: boolean;
}

export interface FileInfo {
  path: string;
  content: string;
  size: number;
}

export interface ContextSelection {
  /** The files chosen for inclusion in the AI context window. */
  selectedFiles: FileInfo[];
  /** Estimated total tokens for the selected files. */
  totalTokens: number;
  /** How the selection was made. */
  selectionMethod: 'ai' | 'heuristic' | 'fallback';
  /** Optional reasoning returned by the AI selector. */
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MAX_FILES = 15;
const DEFAULT_MAX_TOKEN_BUDGET = 50_000;
const DEFAULT_USE_AI = true;
const DEFAULT_FALLBACK = true;

// ---------------------------------------------------------------------------
// Prompt-based cache (in-memory, per-process)
// ---------------------------------------------------------------------------

interface CacheEntry {
  paths: string[];
  reasoning?: string;
  createdAt: number;
}

/** TTL for cached selections (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Max entries before the oldest are evicted. */
const CACHE_MAX_ENTRIES = 64;

const selectionCache = new Map<string, CacheEntry>();

/**
 * Build a stable cache key from the prompt and the sorted file list.
 * Normalises whitespace and lowercases so minor prompt reformulations hit.
 */
function cacheKey(prompt: string, filePaths: string[]): string {
  const normPrompt = prompt.toLowerCase().replace(/\s+/g, ' ').trim();
  // Include only the file-path set (sorted) so cache invalidates when files change.
  const filesHash = filePaths.slice().sort().join('|');
  return `${normPrompt}::${filesHash}`;
}

function getCachedSelection(key: string): CacheEntry | null {
  const entry = selectionCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    selectionCache.delete(key);
    return null;
  }
  return entry;
}

function setCachedSelection(key: string, paths: string[], reasoning?: string) {
  // Evict oldest entries if we're at capacity.
  if (selectionCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = selectionCache.keys().next().value;
    if (oldest !== undefined) {
      selectionCache.delete(oldest);
    }
  }
  selectionCache.set(key, { paths, reasoning, createdAt: Date.now() });
}

// ---------------------------------------------------------------------------
// AI-based selection (Gemini Flash)
// ---------------------------------------------------------------------------

/**
 * Ask Gemini Flash to pick the most relevant files for a user request.
 *
 * Returns an array of file paths or `null` if the call fails for any reason.
 */
async function aiSelectFiles(
  prompt: string,
  files: FileInfo[],
  conversationHistory: Array<{ role: string; content: string }>,
  maxFiles: number,
): Promise<{ paths: string[]; reasoning: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[context-optimizer] GEMINI_API_KEY not set — skipping AI selection');
    return null;
  }

  const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
  const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

  const google = createGoogleGenerativeAI({
    apiKey: process.env.AI_GATEWAY_API_KEY ?? apiKey,
    baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
  });

  // Build a compact file manifest: path + estimated tokens (size proxy).
  const fileList = files.map((f) => {
    const tokens = estimateFileTokens(f.content, f.path);
    return `  ${f.path}  (${tokens} tokens)`;
  }).join('\n');

  // Include the tail of conversation history for additional context.
  const recentHistory = conversationHistory.slice(-4).map(
    (m) => `[${m.role}]: ${m.content.slice(0, 200)}`,
  ).join('\n');

  const systemPrompt = `You are a file-relevance selector for an AI website builder called Argus.
Given a user request, a conversation history excerpt, and a list of project files with estimated token sizes, select the most relevant files that the AI will need to READ or MODIFY to fulfil the request.

Rules:
- Return at most ${maxFiles} files.
- Always include files the user explicitly mentions by name.
- Prefer source files (.tsx, .jsx, .ts, .js, .css) over config unless the request is about config.
- Always include package.json if the request involves adding dependencies.
- Always include layout/entry-point files (App.tsx, page.tsx, layout.tsx, index.tsx) when the request could affect page structure.
- Include parent components that import a target component (for context).
- Exclude: node_modules, lock files, images, .git, .next, dist, build artifacts.

Respond with ONLY a valid JSON object in this exact format (no markdown fences, no extra text):
{"files":["path/to/file1","path/to/file2"],"reasoning":"brief explanation"}`;

  const userMessage = `User request: "${prompt}"

Recent conversation:
${recentHistory || '(none)'}

Available project files:
${fileList}

Select the relevant files.`;

  try {
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: userMessage,
      maxOutputTokens: 1024,
      temperature: 0,
    });

    const raw = result.text.trim();
    // Strip markdown fences if the model wraps them anyway.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.files)) {
      console.warn('[context-optimizer] AI response missing "files" array');
      return null;
    }

    // Validate that every returned path actually exists in our file list.
    const validPaths = new Set(files.map((f) => f.path));
    const selectedPaths: string[] = parsed.files.filter(
      (p: string) => validPaths.has(p),
    );

    if (selectedPaths.length === 0) {
      console.warn('[context-optimizer] AI returned no valid file paths');
      return null;
    }

    return {
      paths: selectedPaths.slice(0, maxFiles),
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('[context-optimizer] AI selection failed:', (error as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Heuristic-based selection
// ---------------------------------------------------------------------------

/** File patterns that should always be excluded from context. */
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.git\//,
  /\.next\//,
  /dist\//,
  /build\//,
  /\.ico$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.webp$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.mp[34]$/,
  /\.map$/,
];

/** Config files that are always useful for context. */
const ALWAYS_INCLUDE = [
  'package.json',
  'tsconfig.json',
];

/** Entry-point patterns — higher priority in heuristic scoring. */
const ENTRY_POINT_PATTERNS = [
  /\/page\.(tsx|jsx|ts|js)$/,
  /\/layout\.(tsx|jsx|ts|js)$/,
  /\/index\.(tsx|jsx|ts|js)$/,
  /App\.(tsx|jsx|ts|js)$/,
  /main\.(tsx|jsx|ts|js)$/,
];

/**
 * Score a file for relevance to a user prompt using keyword heuristics.
 *
 * Higher score = more relevant.
 */
function scoreFile(file: FileInfo, promptLower: string, promptWords: string[]): number {
  const pathLower = file.path.toLowerCase();
  const fileName = file.path.split('/').pop() || '';
  const fileNameLower = fileName.toLowerCase();
  const baseName = fileNameLower.replace(/\.(tsx|jsx|ts|js|css|scss|json|html)$/, '');

  let score = 0;

  // 1. File explicitly mentioned by name in the prompt (highest signal).
  if (promptLower.includes(fileNameLower) || promptLower.includes(baseName)) {
    score += 100;
  }

  // 2. Keywords from the prompt appear in the file path.
  for (const word of promptWords) {
    if (word.length < 3) continue; // skip tiny words
    if (pathLower.includes(word)) {
      score += 20;
    }
  }

  // 3. Entry-point bonus.
  if (ENTRY_POINT_PATTERNS.some((re) => re.test(file.path))) {
    score += 15;
  }

  // 4. Source code files get a small baseline boost over config.
  if (/\.(tsx|jsx|ts|js|css|scss|svelte|vue)$/.test(fileName)) {
    score += 5;
  }

  // 5. Config files that are always useful.
  if (ALWAYS_INCLUDE.some((name) => file.path.endsWith(name))) {
    score += 10;
  }

  // 6. Penalise very large files slightly (they eat token budget fast).
  const tokens = estimateFileTokens(file.content, file.path);
  if (tokens > 5000) {
    score -= 5;
  }

  return score;
}

/**
 * Select files using keyword-matching heuristics. No network calls.
 */
function heuristicSelectFiles(
  prompt: string,
  files: FileInfo[],
  maxFiles: number,
): string[] {
  const promptLower = prompt.toLowerCase();
  const promptWords = promptLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  // Filter out excluded files.
  const candidates = files.filter(
    (f) => !EXCLUDE_PATTERNS.some((re) => re.test(f.path)),
  );

  // Score and sort.
  const scored = candidates.map((f) => ({
    file: f,
    score: scoreFile(f, promptLower, promptWords),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Always-include files go first (if they exist in the candidate set).
  const alwaysIncludePaths: string[] = [];
  for (const pattern of ALWAYS_INCLUDE) {
    const match = candidates.find((f) => f.path.endsWith(pattern));
    if (match) {
      alwaysIncludePaths.push(match.path);
    }
  }

  // Merge: always-include first, then top-scored (deduped).
  const selected = new Set<string>(alwaysIncludePaths);
  for (const item of scored) {
    if (selected.size >= maxFiles) break;
    selected.add(item.file.path);
  }

  return Array.from(selected);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Select the most relevant project files for an AI code-generation request.
 *
 * 1. Checks the in-memory cache for a previous selection with the same prompt
 *    and file set.
 * 2. If `useAISelection` is enabled, asks Gemini Flash to pick files.
 * 3. Falls back to heuristic selection if the AI call fails or is disabled.
 * 4. Trims the result set to fit within `maxTokenBudget`.
 *
 * @param userPrompt          - The user's natural-language request.
 * @param allFiles            - Every file in the project (path + content + size).
 * @param conversationHistory - Recent chat messages for additional context.
 * @param options             - Tuning knobs (max files, token budget, etc.).
 * @returns A {@link ContextSelection} with the chosen files and metadata.
 */
export async function selectRelevantContext(
  userPrompt: string,
  allFiles: FileInfo[],
  conversationHistory: Array<{ role: string; content: string }>,
  options?: ContextOptimizerOptions,
): Promise<ContextSelection> {
  const maxFiles = options?.maxFiles ?? DEFAULT_MAX_FILES;
  const maxTokenBudget = options?.maxTokenBudget ?? DEFAULT_MAX_TOKEN_BUDGET;
  const useAI = options?.useAISelection ?? DEFAULT_USE_AI;
  const fallback = options?.fallbackToHeuristic ?? DEFAULT_FALLBACK;

  // Pre-filter excluded paths so downstream logic never sees them.
  const eligibleFiles = allFiles.filter(
    (f) => !EXCLUDE_PATTERNS.some((re) => re.test(f.path)),
  );

  const key = cacheKey(userPrompt, eligibleFiles.map((f) => f.path));

  // ------ Cache check ------
  const cached = getCachedSelection(key);
  if (cached) {
    console.log('[context-optimizer] Cache hit — reusing previous selection');
    return buildSelection(cached.paths, eligibleFiles, 'ai', cached.reasoning);
  }

  // ------ AI selection ------
  let selectedPaths: string[] | null = null;
  let reasoning: string | undefined;
  let method: ContextSelection['selectionMethod'] = 'heuristic';

  if (useAI) {
    const aiResult = await aiSelectFiles(
      userPrompt,
      eligibleFiles,
      conversationHistory,
      maxFiles,
    );

    if (aiResult) {
      selectedPaths = aiResult.paths;
      reasoning = aiResult.reasoning;
      method = 'ai';
      setCachedSelection(key, selectedPaths, reasoning);
    }
  }

  // ------ Heuristic fallback ------
  if (!selectedPaths) {
    if (!useAI || fallback) {
      selectedPaths = heuristicSelectFiles(userPrompt, eligibleFiles, maxFiles);
      method = useAI ? 'fallback' : 'heuristic';
    } else {
      // No AI result and fallback is disabled — return empty.
      return {
        selectedFiles: [],
        totalTokens: 0,
        selectionMethod: 'fallback',
        reasoning: 'AI selection failed and heuristic fallback is disabled.',
      };
    }
  }

  // ------ Trim to token budget ------
  const result = trimToBudget(selectedPaths, eligibleFiles, maxTokenBudget);

  return {
    selectedFiles: result.files,
    totalTokens: result.totalTokens,
    selectionMethod: method,
    reasoning,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a {@link ContextSelection} from a list of paths.
 */
function buildSelection(
  paths: string[],
  allFiles: FileInfo[],
  method: ContextSelection['selectionMethod'],
  reasoning?: string,
): ContextSelection {
  const fileMap = new Map(allFiles.map((f) => [f.path, f]));
  const selected: FileInfo[] = [];
  let totalTokens = 0;

  for (const p of paths) {
    const info = fileMap.get(p);
    if (info) {
      selected.push(info);
      totalTokens += estimateFileTokens(info.content, info.path);
    }
  }

  return { selectedFiles: selected, totalTokens, selectionMethod: method, reasoning };
}

/**
 * Accept files in order until the cumulative token count exceeds the budget.
 */
function trimToBudget(
  paths: string[],
  allFiles: FileInfo[],
  budget: number,
): { files: FileInfo[]; totalTokens: number } {
  const fileMap = new Map(allFiles.map((f) => [f.path, f]));
  const files: FileInfo[] = [];
  let totalTokens = 0;

  for (const p of paths) {
    const info = fileMap.get(p);
    if (!info) continue;

    const tokens = estimateFileTokens(info.content, info.path);
    if (totalTokens + tokens > budget && files.length > 0) {
      // We already have at least one file — stop adding to stay in budget.
      break;
    }

    files.push(info);
    totalTokens += tokens;
  }

  return { files, totalTokens };
}
