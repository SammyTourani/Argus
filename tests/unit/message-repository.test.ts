/**
 * Tests for MessageRepository — lib/chat/message-repository.ts
 *
 * Validates the tree-based message branching system: add, branch,
 * navigate, delete, serialize/deserialize.
 */

import { describe, it, expect } from 'vitest';
import { MessageRepository, type BranchableMessage } from '@/lib/chat/message-repository';

function makeInput(role: 'user' | 'assistant', content: string, id?: string) {
  return {
    id: id || `msg-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: Date.now(),
    parentId: null,
  } as const;
}

describe('MessageRepository', () => {
  it('starts empty', () => {
    const repo = new MessageRepository();
    expect(repo.size).toBe(0);
    expect(repo.getActivePath()).toEqual([]);
  });

  it('adds messages to the active path', () => {
    const repo = new MessageRepository();
    const msg1 = repo.addMessage(makeInput('user', 'Hello'));
    const msg2 = repo.addMessage(makeInput('assistant', 'Hi there'));

    expect(repo.size).toBe(2);
    const path = repo.getActivePath();
    expect(path).toHaveLength(2);
    expect(path[0].id).toBe(msg1.id);
    expect(path[1].id).toBe(msg2.id);
  });

  it('creates branches via createBranch', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Tell me a joke'));
    const assist1 = repo.addMessage(makeInput('assistant', 'Why did the chicken...'));
    const assist2 = repo.createBranch(user.id, makeInput('assistant', 'Knock knock...'));

    // Active path should now show the new branch
    const path = repo.getActivePath();
    expect(path).toHaveLength(2);
    expect(path[1].id).toBe(assist2.id);

    // Branch info: 2 branches total
    const info = repo.getBranchInfo(assist2.id);
    expect(info.total).toBe(2);
    expect(info.current).toBe(2); // 1-indexed, this is the second branch
  });

  it('navigates between branches with nextBranch/previousBranch', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Hello'));
    const a1 = repo.addMessage(makeInput('assistant', 'Response A'));
    const a2 = repo.createBranch(user.id, makeInput('assistant', 'Response B'));

    // Currently on a2 (second branch)
    expect(repo.getActivePath()[1].id).toBe(a2.id);

    // Navigate to previous
    const prev = repo.previousBranch(a2.id);
    expect(prev).not.toBeNull();
    expect(prev!.id).toBe(a1.id);
    expect(repo.getActivePath()[1].id).toBe(a1.id);

    // Navigate to next
    const next = repo.nextBranch(a1.id);
    expect(next).not.toBeNull();
    expect(next!.id).toBe(a2.id);
  });

  it('returns null at branch boundaries', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Hello'));
    const a1 = repo.addMessage(makeInput('assistant', 'Only response'));

    expect(repo.nextBranch(a1.id)).toBeNull();
    expect(repo.previousBranch(a1.id)).toBeNull();
  });

  it('getBranchInfo returns correct metadata', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Q'));
    repo.addMessage(makeInput('assistant', 'A1'));
    repo.createBranch(user.id, makeInput('assistant', 'A2'));
    const a3 = repo.createBranch(user.id, makeInput('assistant', 'A3'));

    const info = repo.getBranchInfo(a3.id);
    expect(info.total).toBe(3);
    expect(info.current).toBe(3);
    expect(info.siblings).toHaveLength(3);
  });

  it('deleteBranch removes a branch and its subtree', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Q'));
    const a1 = repo.addMessage(makeInput('assistant', 'A1'));
    // Add a follow-up to a1
    const followUp = repo.addMessage(makeInput('user', 'Follow up'));

    const sizeBefore = repo.size;
    repo.deleteBranch(a1.id);

    // a1 and followUp should both be deleted
    expect(repo.size).toBe(sizeBefore - 2);
    expect(repo.getMessage(a1.id)).toBeUndefined();
    expect(repo.getMessage(followUp.id)).toBeUndefined();
  });

  it('serializes and deserializes correctly', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Hello'));
    repo.addMessage(makeInput('assistant', 'Hi'));
    repo.createBranch(user.id, makeInput('assistant', 'Hey'));

    const json = repo.serialize();
    const restored = MessageRepository.deserialize(json);

    expect(restored.size).toBe(repo.size);
    expect(restored.getActivePath()).toHaveLength(repo.getActivePath().length);
  });

  it('switchBranch activates the correct path', () => {
    const repo = new MessageRepository();
    const user = repo.addMessage(makeInput('user', 'Q'));
    const a1 = repo.addMessage(makeInput('assistant', 'A1'));
    const a2 = repo.createBranch(user.id, makeInput('assistant', 'A2'));

    // Currently on a2
    expect(repo.getActivePath()[1].id).toBe(a2.id);

    // Switch to a1
    repo.switchBranch(a1.id);
    expect(repo.getActivePath()[1].id).toBe(a1.id);
  });

  it('throws on invalid parent message', () => {
    const repo = new MessageRepository();
    expect(() =>
      repo.addMessage(makeInput('user', 'test'), 'nonexistent-id'),
    ).toThrow('Parent message not found');
  });
});
