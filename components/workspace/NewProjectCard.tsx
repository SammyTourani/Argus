'use client';

import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewProjectCardProps {
  onClick: () => void;
}

export default function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-[#F5F5F5] transition-all hover:border-solid hover:border-[#FA4500] hover:bg-[#FFF8F5]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FA4500]/10 transition-colors group-hover:bg-[#FA4500]/20">
        <Plus className="h-6 w-6 text-[#FA4500]" />
      </div>
      <span className="text-[14px] font-semibold text-zinc-600 transition-colors group-hover:text-[#FA4500]">
        New Project
      </span>
    </motion.button>
  );
}
