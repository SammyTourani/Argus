'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Copy, Check } from 'lucide-react';

interface BranchPickerProps {
  messageId: string;
  currentBranch: number;    // 0-indexed
  totalBranches: number;
  onPrevious: (messageId: string) => void;
  onNext: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  /** Message content for copy action */
  content?: string;
}

export default function BranchPicker({
  messageId,
  currentBranch,
  totalBranches,
  onPrevious,
  onNext,
  onRegenerate,
  content,
}: BranchPickerProps) {
  const [copied, setCopied] = useState(false);
  const hasBranches = totalBranches > 1;
  const isFirst = currentBranch <= 0;
  const isLast = currentBranch >= totalBranches - 1;

  const handleCopy = useCallback(async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
      {/* Branch navigation — only visible when multiple branches exist */}
      {hasBranches && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPrevious(messageId)}
            disabled={isFirst}
            className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous branch"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#888]" />
          </button>

          <span className="font-mono text-[11px] text-[#888] tabular-nums select-none min-w-[28px] text-center">
            {currentBranch + 1}/{totalBranches}
          </span>

          <button
            onClick={() => onNext(messageId)}
            disabled={isLast}
            className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next branch"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#888]" />
          </button>

          <div className="w-px h-3 bg-[rgba(255,255,255,0.08)] mx-0.5" />
        </div>
      )}

      {/* Action bar — Copy + Regenerate */}
      <button
        onClick={handleCopy}
        disabled={!content}
        className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 transition-colors"
        aria-label="Copy message"
        title="Copy"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 text-[#888]" />
        )}
      </button>

      <button
        onClick={() => onRegenerate(messageId)}
        className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] text-[#888] hover:text-[#FA4500] transition-colors"
        aria-label="Regenerate response"
        title="Regenerate"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
}
