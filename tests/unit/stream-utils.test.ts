/**
 * Tests for stream utilities — lib/ai/stream-utils.ts
 *
 * Validates truncation detection (unclosed tags, code blocks, braces)
 * and continuation prompt generation.
 */

import { describe, it, expect } from 'vitest';
import {
  detectTruncation,
  buildContinuationPrompt,
  extractFileOperations,
} from '@/lib/ai/stream-utils';

describe('Stream Utils — detectTruncation', () => {
  it('no truncation on complete content', () => {
    const content = '<file path="app.tsx">const x = 1;</file>';
    const result = detectTruncation(content);
    expect(result.isTruncated).toBe(false);
    expect(result.truncationType).toBe('none');
  });

  it('detects unclosed <file> tag', () => {
    const content = '<file path="app.tsx">const x = 1;';
    const result = detectTruncation(content);
    expect(result.isTruncated).toBe(true);
    expect(result.allTypes).toContain('unclosed-tag');
  });

  it('detects unclosed code block (odd backticks)', () => {
    const content = 'Here is code:\n```typescript\nconst x = 1;\n';
    const result = detectTruncation(content);
    expect(result.isTruncated).toBe(true);
    expect(result.allTypes).toContain('unclosed-code-block');
  });

  it('balanced code blocks are not truncated', () => {
    const content = '```ts\nconst x = 1;\n```\n';
    const result = detectTruncation(content);
    expect(result.allTypes).not.toContain('unclosed-code-block');
  });

  it('empty content is not truncated', () => {
    const result = detectTruncation('');
    expect(result.isTruncated).toBe(false);
  });

  it('detects unclosed boltAction tags', () => {
    const content = '<boltAction type="file">some content';
    const result = detectTruncation(content);
    expect(result.isTruncated).toBe(true);
    expect(result.allTypes).toContain('unclosed-tag');
  });
});

describe('Stream Utils — buildContinuationPrompt', () => {
  it('returns start-from-beginning prompt for empty content', () => {
    const prompt = buildContinuationPrompt('');
    expect(prompt).toContain('beginning');
  });

  it('includes trailing context in the prompt', () => {
    const content = '<file path="index.tsx">const App = () => { return <div>';
    const prompt = buildContinuationPrompt(content, 200);
    expect(prompt).toContain('CONTEXT START');
    expect(prompt).toContain('CONTEXT END');
    expect(prompt).toContain('index.tsx');
  });

  it('limits context to the specified char count', () => {
    const longContent = 'x'.repeat(2000);
    const prompt = buildContinuationPrompt(longContent, 100);
    // The context section should contain at most 100 chars of trailing content
    const contextMatch = prompt.match(/---CONTEXT START---\n([\s\S]*?)\n---CONTEXT END---/);
    expect(contextMatch).toBeTruthy();
    expect(contextMatch![1].length).toBeLessThanOrEqual(100);
  });
});

describe('Stream Utils — extractFileOperations', () => {
  it('extracts a complete file operation', () => {
    const content = '<file path="app.tsx">export default function App() {}</file>';
    const ops = extractFileOperations(content);
    expect(ops).toHaveLength(1);
    expect(ops[0].filePath).toBe('app.tsx');
    expect(ops[0].isComplete).toBe(true);
  });

  it('marks incomplete file blocks', () => {
    const content = '<file path="app.tsx">export default function App()';
    const ops = extractFileOperations(content);
    expect(ops).toHaveLength(1);
    expect(ops[0].isComplete).toBe(false);
  });

  it('extracts multiple file operations', () => {
    const content = [
      '<file path="a.ts">const a = 1;</file>',
      '<file path="b.ts">const b = 2;</file>',
    ].join('\n');
    const ops = extractFileOperations(content);
    expect(ops).toHaveLength(2);
  });
});
