'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type SortOption =
  | 'last-modified'
  | 'name-asc'
  | 'name-desc'
  | 'created-newest'
  | 'created-oldest';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'last-modified', label: 'Last modified' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'created-newest', label: 'Date created (newest)' },
  { value: 'created-oldest', label: 'Date created (oldest)' },
];

interface ProjectSortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function ProjectSortDropdown({ value, onChange }: ProjectSortDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  const currentLabel = sortOptions.find((o) => o.value === value)?.label ?? 'Sort';

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
      >
        <ArrowUpDown className="h-3 w-3 text-zinc-400" />
        {currentLabel}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-30 mt-1.5 w-[200px] overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
          >
            {sortOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors',
                    isSelected
                      ? 'bg-zinc-50 font-medium text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  {option.label}
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#FA4500]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
