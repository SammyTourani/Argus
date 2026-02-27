/**
 * Chat Summarizer — compresses long conversation histories for AI context.
 *
 * When the chat history grows beyond a configurable token threshold, older
 * messages are summarised into a compact block by Gemini Flash (cheap/fast),
 * while the most recent N messages are preserved verbatim. This keeps the AI
 * grounded in what was discussed without blowing the context window.
 *
 * If the Gemini call fails, a lightweight extractive fallback is used so the
 * system never hard-fails.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { estimateTokens } from './token-counter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SummarizerOptions {
  /** Max tokens allowed for the full history block (default: 10 000). */
  maxHistoryTokens?: number;
  /** Number of most-recent messages to keep verbatim (default: 6). */
  keepRecentMessages?: number;
  /** Max tokens the summary itself should use (default: 500). */
  summaryMaxTokens?: number;
}

export interface SummarizedHistory {
  /** Compact summary of older messages, or `null` if summarisation was not needed. */
  summary: string | null;
  /** The most recent messages kept word-for-word. */
  recentMessages: Array<{ role: string; content: string }>;
  /** Estimated total tokens for summary + recent messages combined. */
  totalTokens: number;
  /** Whether summarisation was actually performed. */
  wasSummarized: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MAX_HISTORY_TOKENS = 10_000;
const DEFAULT_KEEP_RECENT = 6;
const DEFAULT_SUMMARY_MAX_TOKENS = 500;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Summarise a conversation's history so it fits within a token budget.
 *
 * The function first checks whether the full history already fits. If it does,
 * all messages are returned as-is with no summarisation. Otherwise, the oldest
 * messages are compressed into a short summary paragraph and the newest
 * `keepRecentMessages` messages are kept verbatim.
 *
 * @param messages - The full ordered conversation (oldest first).
 * @param options  - Tuning knobs for budget, recency window, and summary size.
 * @returns A {@link SummarizedHistory} ready to be injected into the AI prompt.
 */
export async function summarizeConversation(
  messages: Array<{ role: string; content: string }>,
  options?: SummarizerOptions,
): Promise<SummarizedHistory> {
  const maxHistoryTokens = options?.maxHistoryTokens ?? DEFAULT_MAX_HISTORY_TOKENS;
  const keepRecent = options?.keepRecentMessages ?? DEFAULT_KEEP_RECENT;
  const summaryMaxTokens = options?.summaryMaxTokens ?? DEFAULT_SUMMARY_MAX_TOKENS;

  // Edge case: empty or very short history.
  if (!messages || messages.length === 0) {
    return { summary: null, recentMessages: [], totalTokens: 0, wasSummarized: false };
  }

  // Estimate tokens for the entire history.
  const fullTokens = messages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0,
  );

  // If it already fits, return everything untouched.
  if (fullTokens <= maxHistoryTokens) {
    return {
      summary: null,
      recentMessages: messages,
      totalTokens: fullTokens,
      wasSummarized: false,
    };
  }

  // Split into "old" (to summarise) and "recent" (to keep verbatim).
  const recentMessages = messages.slice(-keepRecent);
  const olderMessages = messages.slice(0, -keepRecent);

  // If there are no older messages to summarise, just return recent.
  if (olderMessages.length === 0) {
    const recentTokens = recentMessages.reduce(
      (sum, m) => sum + estimateTokens(m.content),
      0,
    );
    return {
      summary: null,
      recentMessages,
      totalTokens: recentTokens,
      wasSummarized: false,
    };
  }

  // Attempt AI-powered summarisation.
  let summary = await aiSummarize(olderMessages, summaryMaxTokens);

  // Fallback: extractive summary if AI fails.
  if (!summary) {
    summary = extractiveFallback(olderMessages, summaryMaxTokens);
  }

  const summaryTokens = estimateTokens(summary);
  const recentTokens = recentMessages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0,
  );

  return {
    summary,
    recentMessages,
    totalTokens: summaryTokens + recentTokens,
    wasSummarized: true,
  };
}

// ---------------------------------------------------------------------------
// AI summarisation (Gemini Flash)
// ---------------------------------------------------------------------------

/**
 * Use Gemini Flash to summarise older conversation messages.
 *
 * @returns The summary string, or `null` if the call fails.
 */
async function aiSummarize(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[chat-summarizer] GEMINI_API_KEY not set — using extractive fallback');
    return null;
  }

  const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
  const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

  const google = createGoogleGenerativeAI({
    apiKey: process.env.AI_GATEWAY_API_KEY ?? apiKey,
    baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
  });

  // Format the messages for the summariser.
  const transcript = messages.map(
    (m) => `[${m.role}]: ${m.content}`,
  ).join('\n\n');

  const systemPrompt = `You are a conversation summariser for an AI website builder.
Condense the following conversation excerpt into a concise summary that preserves:
- What the user asked for (features, changes, fixes)
- Key decisions made
- What was built or modified (file names, component names)
- Any unresolved issues or follow-ups

Be factual and concise. Use bullet points. Do NOT include greetings or filler.
Keep the summary under ${maxTokens} tokens (roughly ${maxTokens * 4} characters).`;

  try {
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: transcript,
      maxOutputTokens: maxTokens,
      temperature: 0,
    });

    const text = result.text.trim();
    if (!text || text.length < 20) {
      console.warn('[chat-summarizer] AI returned very short summary — using fallback');
      return null;
    }

    return text;
  } catch (error) {
    console.error('[chat-summarizer] AI summarisation failed:', (error as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Extractive fallback (no network calls)
// ---------------------------------------------------------------------------

/**
 * Build a summary by extracting the first sentence from each message and
 * concatenating them. No AI call needed — purely deterministic.
 */
function extractiveFallback(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): string {
  const maxChars = maxTokens * 4; // conservative chars-per-token for prose
  const lines: string[] = ['[Conversation summary - older messages]:'];
  let charCount = lines[0].length;

  for (const msg of messages) {
    // Extract the first meaningful sentence (up to 200 chars).
    const firstSentence = extractFirstSentence(msg.content, 200);
    const line = `- [${msg.role}]: ${firstSentence}`;

    if (charCount + line.length > maxChars) break;

    lines.push(line);
    charCount += line.length + 1; // +1 for newline
  }

  return lines.join('\n');
}

/**
 * Extract the first sentence from a block of text, capped at `maxLen` chars.
 */
function extractFirstSentence(text: string, maxLen: number): string {
  // Remove code blocks to avoid noise.
  const cleaned = text.replace(/```[\s\S]*?```/g, '[code]').trim();

  // Find the end of the first sentence.
  const sentenceEnd = cleaned.search(/[.!?]\s/);
  if (sentenceEnd > 0 && sentenceEnd < maxLen) {
    return cleaned.slice(0, sentenceEnd + 1);
  }

  // No clear sentence boundary — just truncate.
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen).trimEnd() + '...';
}
