'use client';

import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { MessageRepository, type BranchableMessage } from '@/lib/chat/message-repository';

const STORAGE_PREFIX = 'argus_branches';

function storageKey(projectId: string, buildId: string): string {
  return `${STORAGE_PREFIX}_${projectId}_${buildId}`;
}

function loadRepo(projectId: string, buildId: string): MessageRepository {
  if (typeof window === 'undefined') return new MessageRepository();
  try {
    const raw = localStorage.getItem(storageKey(projectId, buildId));
    if (raw) return MessageRepository.deserialize(raw);
  } catch {
    // Corrupted data — start fresh
  }
  return new MessageRepository();
}

function persistRepo(projectId: string, buildId: string, repo: MessageRepository): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(projectId, buildId), repo.serialize());
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useMessageBranching(projectId: string, buildId: string) {
  const repoRef = useRef<MessageRepository>(loadRepo(projectId, buildId));
  const [messages, setMessages] = useState<BranchableMessage[]>(
    () => repoRef.current.getActivePath(),
  );

  /**
   * Flush the repo's active path into React state and persist to localStorage.
   */
  const sync = useCallback(() => {
    const path = repoRef.current.getActivePath();
    setMessages(path);
    persistRepo(projectId, buildId, repoRef.current);
  }, [projectId, buildId]);

  /**
   * Add a new message to the active conversation path.
   */
  const addMessage = useCallback(
    (
      role: 'user' | 'assistant' | 'system',
      content: string,
      metadata?: BranchableMessage['metadata'],
    ): BranchableMessage => {
      const msg = repoRef.current.addMessage({
        id: nanoid(),
        role,
        content,
        timestamp: Date.now(),
        parentId: null, // addMessage will resolve the correct parent
        metadata,
      });
      sync();
      return msg;
    },
    [sync],
  );

  /**
   * Regenerate: create a new branch for an existing assistant message.
   * Returns the parentId (the user message) and the new empty branch message
   * so the caller can stream content into it.
   */
  const regenerate = useCallback(
    (
      messageId: string,
    ): { parentId: string; branchMessage: BranchableMessage } => {
      const existing = repoRef.current.getMessage(messageId);
      if (!existing) {
        throw new Error(`Message not found: ${messageId}`);
      }

      // The parent of the existing assistant message is the user message.
      // We create a new sibling branch under that same parent.
      const parentId = existing.parentId;
      if (!parentId) {
        throw new Error('Cannot regenerate a root message');
      }

      const branchMessage = repoRef.current.createBranch(parentId, {
        id: nanoid(),
        role: existing.role,
        content: '', // Caller fills this in as the response streams
        timestamp: Date.now(),
        parentId, // Will be set by createBranch
        metadata: existing.metadata ? { ...existing.metadata } : undefined,
      });

      sync();
      return { parentId, branchMessage };
    },
    [sync],
  );

  /**
   * Switch to the previous sibling branch of the given message.
   */
  const switchToPrevious = useCallback(
    (messageId: string): void => {
      repoRef.current.previousBranch(messageId);
      sync();
    },
    [sync],
  );

  /**
   * Switch to the next sibling branch of the given message.
   */
  const switchToNext = useCallback(
    (messageId: string): void => {
      repoRef.current.nextBranch(messageId);
      sync();
    },
    [sync],
  );

  /**
   * Get branch info (1-indexed current position, total count) for a message.
   */
  const getBranchInfo = useCallback(
    (messageId: string): { current: number; total: number } => {
      const info = repoRef.current.getBranchInfo(messageId);
      return { current: info.current, total: info.total };
    },
    [],
  );

  /**
   * Convert the active path to the flat ChatMessage[] format used by ChatPanel.
   * This allows incremental migration — existing code that consumes ChatMessage[]
   * can keep working while branching is added underneath.
   */
  const toChatMessages = useCallback(
    (): Array<{
      id: string;
      role: string;
      content: string;
      timestamp: Date;
      fileChanges?: string[];
    }> => {
      return repoRef.current.getActivePath().map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        fileChanges: m.metadata?.fileChanges,
      }));
    },
    [],
  );

  /**
   * Reset the conversation entirely (new chat).
   */
  const reset = useCallback(() => {
    repoRef.current = new MessageRepository();
    sync();
  }, [sync]);

  /**
   * Direct access to a message by ID (useful for streaming updates).
   */
  const getMessage = useCallback(
    (id: string): BranchableMessage | undefined => {
      return repoRef.current.getMessage(id);
    },
    [],
  );

  /**
   * Update a message's content in-place (for streaming responses).
   * Call sync() after the stream completes to flush to React state.
   */
  const updateContent = useCallback(
    (id: string, content: string): void => {
      const msg = repoRef.current.getMessage(id);
      if (msg) {
        msg.content = content;
      }
    },
    [],
  );

  /**
   * Flush current repo state to React (call after streaming completes).
   */
  const flush = useCallback(() => {
    sync();
  }, [sync]);

  return {
    messages,
    addMessage,
    regenerate,
    switchToPrevious,
    switchToNext,
    getBranchInfo,
    toChatMessages,
    reset,
    getMessage,
    updateContent,
    flush,
  };
}
