'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BracketCardProps {
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export default function BracketCard({
  selected = false,
  onClick,
  className = '',
  children,
}: BracketCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      animate={selected ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        group relative text-left p-20 rounded-16 transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-white/40
        ${className}
      `}
      style={{
        background: selected
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(255, 255, 255, 0.12)',
        backdropFilter: selected ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: selected ? 'none' : 'blur(12px)',
        border: selected
          ? '2px solid rgba(255, 255, 255, 1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: selected
          ? '0 8px 32px rgba(0, 0, 0, 0.15)'
          : 'none',
      }}
    >
      {/* Top-left corner bracket */}
      <div
        className={`
          absolute top-0 left-0 w-12 h-12 border-t border-l transition-all duration-300
          ${selected
            ? 'w-20 h-20 border-orange-500 opacity-100'
            : 'border-white/30 opacity-50 group-hover:opacity-100 group-hover:border-white group-hover:w-20 group-hover:h-20'
          }
        `}
      />

      {/* Bottom-right corner bracket */}
      <div
        className={`
          absolute bottom-0 right-0 w-12 h-12 border-b border-r transition-all duration-300
          ${selected
            ? 'w-20 h-20 border-orange-500 opacity-100'
            : 'border-white/30 opacity-50 group-hover:opacity-100 group-hover:border-white group-hover:w-20 group-hover:h-20'
          }
        `}
      />

      {children}
    </motion.button>
  );
}
