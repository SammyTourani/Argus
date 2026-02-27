'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface BranchPickerProps {
  messageId: string;
  currentBranch: number;    // 0-indexed
  totalBranches: number;
  onPrevious: (messageId: string) => void;
  onNext: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
}

export default function BranchPicker({
  messageId,
  currentBranch,
  totalBranches,
  onPrevious,
  onNext,
  onRegenerate,
}: BranchPickerProps) {
  const hasBranches = totalBranches > 1;
  const isFirst = currentBranch <= 0;
  const isLast = currentBranch >= totalBranches - 1;

  return (
    <div className="flex items-center gap-1.5 mt-1">
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
        </div>
      )}

      {/* Regenerate button — always visible */}
      <button
        onClick={() => onRegenerate(messageId)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#888] hover:text-[#FA4500] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
        aria-label="Regenerate response"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Regenerate</span>
      </button>
    </div>
  );
}
