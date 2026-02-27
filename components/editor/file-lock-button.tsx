'use client';

import { Lock, LockOpen } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface FileLockButtonProps {
  /** The file path this button controls. */
  filePath: string;
  /** Whether the file is currently locked. */
  isLocked: boolean;
  /** Callback fired when the user toggles the lock state. */
  onToggle: (filePath: string) => void;
  /** Icon size variant. */
  size?: 'sm' | 'md';
}

/* ─── Size presets ─── */

const ICON_SIZE: Record<NonNullable<FileLockButtonProps['size']>, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
};

const BUTTON_SIZE: Record<NonNullable<FileLockButtonProps['size']>, string> = {
  sm: 'p-0.5',
  md: 'p-1',
};

/* ─── Component ─── */

export default function FileLockButton({
  filePath,
  isLocked,
  onToggle,
  size = 'sm',
}: FileLockButtonProps) {
  const label = isLocked
    ? 'Unlock file'
    : 'Lock file (prevent AI modifications)';

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(filePath);
            }}
            className={cn(
              'rounded transition-colors flex-shrink-0',
              BUTTON_SIZE[size],
              isLocked
                ? 'text-orange-500 hover:text-orange-400 hover:bg-orange-500/10'
                : 'text-[#555] hover:text-[#888] hover:bg-[rgba(255,255,255,0.04)]',
            )}
            aria-label={label}
          >
            {isLocked ? (
              <Lock className={ICON_SIZE[size]} />
            ) : (
              <LockOpen className={ICON_SIZE[size]} />
            )}
          </button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={4}
            className="z-50 rounded-md bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] px-2.5 py-1.5 text-[11px] font-mono text-[#CCC] shadow-lg animate-in fade-in-0 zoom-in-95"
          >
            {label}
            <Tooltip.Arrow className="fill-[#1A1A1A]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
