'use client';

import { motion } from 'framer-motion';

interface VersionDiffBadgeProps {
  count: number;
  onClick: () => void;
}

export default function VersionDiffBadge({ count, onClick }: VersionDiffBadgeProps) {
  if (count < 1) return null;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative inline-flex items-center justify-center"
      aria-label={`${count} version${count === 1 ? '' : 's'} — view history`}
      title={`${count} version${count === 1 ? '' : 's'} — click to open history`}
    >
      {/* Pulse ring when count > 1 */}
      {count > 1 && (
        <span className="absolute inset-0 rounded-full bg-[var(--editor-accent-30)] animate-ping" />
      )}

      <span className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--editor-accent-15)] border border-[var(--editor-accent-40)] hover:bg-[var(--editor-accent-25)] hover:border-[var(--editor-accent-60)] transition-colors">
        <span className="text-[10px] font-mono font-semibold text-[var(--editor-accent)] tracking-wider">
          v{count}
        </span>
      </span>
    </motion.button>
  );
}
