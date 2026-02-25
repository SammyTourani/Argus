/**
 * Per-user conversation state registry.
 *
 * Replaces the old `global.conversationState` pattern which shared a single
 * conversation across ALL users — a multi-tenant data-leakage risk.
 *
 * Module-scoped Map survives across requests within the same serverless
 * instance but is isolated per-user.
 */

import type { ConversationState } from '@/types/conversation';

/** Default stale-entry timeout: 2 hours */
const CONVERSATION_TTL_MS = 2 * 60 * 60 * 1000;

const conversationStates = new Map<string, ConversationState>();

/**
 * Get (or lazily create) the conversation state for a given user.
 * Automatically evicts stale entries older than 2 hours.
 */
export function getConversationState(userId: string): ConversationState {
  const existing = conversationStates.get(userId);
  if (existing && Date.now() - existing.lastUpdated < CONVERSATION_TTL_MS) {
    return existing;
  }

  const fresh: ConversationState = {
    conversationId: `conv-${Date.now()}`,
    startedAt: Date.now(),
    lastUpdated: Date.now(),
    context: {
      messages: [],
      edits: [],
      projectEvolution: { majorChanges: [] },
      userPreferences: {},
    },
  };
  conversationStates.set(userId, fresh);

  // Evict stale entries while we're here
  for (const [uid, state] of conversationStates) {
    if (Date.now() - state.lastUpdated > CONVERSATION_TTL_MS) {
      conversationStates.delete(uid);
    }
  }

  return fresh;
}

/**
 * Explicitly set (replace) the conversation state for a user.
 */
export function setConversationState(userId: string, state: ConversationState): void {
  conversationStates.set(userId, state);
}

/**
 * Delete the conversation state for a user.
 */
export function clearConversationState(userId: string): void {
  conversationStates.delete(userId);
}

export { conversationStates };
