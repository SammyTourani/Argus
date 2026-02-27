/**
 * Tests for File Locking Manager — lib/editor/locked-files.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLockedFilesManager, type LockedFilesManager } from '@/lib/editor/locked-files';

// Mock localStorage
const mockStorage = new Map<string, string>();
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage });

describe('LockedFilesManager', () => {
  let manager: LockedFilesManager;

  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
    manager = createLockedFilesManager({
      projectId: 'proj-1',
      buildId: 'build-1',
      storageKey: 'test_locked_files',
    });
  });

  it('starts with no locked files', () => {
    expect(manager.getLockedFiles()).toEqual([]);
  });

  it('locks and unlocks files', () => {
    manager.lockFile('src/app.tsx');
    expect(manager.isLocked('src/app.tsx')).toBe(true);
    expect(manager.getLockedFiles()).toEqual(['src/app.tsx']);

    manager.unlockFile('src/app.tsx');
    expect(manager.isLocked('src/app.tsx')).toBe(false);
    expect(manager.getLockedFiles()).toEqual([]);
  });

  it('toggleLock toggles between locked and unlocked', () => {
    manager.toggleLock('index.ts');
    expect(manager.isLocked('index.ts')).toBe(true);

    manager.toggleLock('index.ts');
    expect(manager.isLocked('index.ts')).toBe(false);
  });

  it('returns locked files sorted alphabetically', () => {
    manager.lockFile('z-file.ts');
    manager.lockFile('a-file.ts');
    manager.lockFile('m-file.ts');
    expect(manager.getLockedFiles()).toEqual(['a-file.ts', 'm-file.ts', 'z-file.ts']);
  });

  it('generates correct system prompt injection', () => {
    manager.lockFile('src/app.tsx');
    manager.lockFile('package.json');

    const prompt = manager.getSystemPromptInjection();
    expect(prompt).toContain('LOCKED FILES - DO NOT MODIFY');
    expect(prompt).toContain('- package.json');
    expect(prompt).toContain('- src/app.tsx');
  });

  it('returns empty string for system prompt when no files locked', () => {
    expect(manager.getSystemPromptInjection()).toBe('');
  });

  it('persists to localStorage on lock/unlock', () => {
    manager.lockFile('test.ts');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test_locked_files',
      JSON.stringify(['test.ts']),
    );
  });

  it('loads from localStorage on creation', () => {
    mockStorage.set('test_locked_files', JSON.stringify(['pre-locked.ts']));
    const loaded = createLockedFilesManager({
      projectId: 'proj-1',
      buildId: 'build-1',
      storageKey: 'test_locked_files',
    });
    expect(loaded.isLocked('pre-locked.ts')).toBe(true);
  });

  it('notifies change listeners', () => {
    const listener = vi.fn();
    manager.onChange(listener);

    manager.lockFile('file.ts');
    expect(listener).toHaveBeenCalledWith(['file.ts']);

    manager.unlockFile('file.ts');
    expect(listener).toHaveBeenCalledWith([]);
  });

  it('unsubscribe removes listener', () => {
    const listener = vi.fn();
    const unsub = manager.onChange(listener);

    manager.lockFile('a.ts');
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    manager.lockFile('b.ts');
    expect(listener).toHaveBeenCalledTimes(1); // no additional calls
  });

  it('ignores duplicate lock calls', () => {
    const listener = vi.fn();
    manager.onChange(listener);

    manager.lockFile('dup.ts');
    manager.lockFile('dup.ts'); // duplicate
    expect(listener).toHaveBeenCalledTimes(1);
    expect(manager.getLockedFiles()).toEqual(['dup.ts']);
  });
});
