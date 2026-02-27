'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface GalleryItem {
  id: string;
  name: string;
  category: string;
  creator: string;
  model: string;
  gradient: string;
  desc: string;
}

const CATEGORIES = [
  'All', 'Landing Pages', 'SaaS', 'Dashboard', 'E-commerce', 'Portfolio', 'Mobile',
] as const;

type Category = typeof CATEGORIES[number];

interface GalleryClientProps {
  items: GalleryItem[];
}

export default function GalleryClient({ items }: GalleryClientProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filteredGallery = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter(item => item.category === activeCategory);
  }, [activeCategory, items]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Top nav */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-zinc-100 bg-white/90 backdrop-blur-sm px-8">
        <Link href="/workspace" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          ← Workspace
        </Link>
        <span className="mx-3 text-zinc-200">/</span>
        <span className="text-sm font-semibold text-zinc-900">Inspiration Gallery</span>
      </div>

      {/* Header */}
      <div className="px-8 pt-10 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-zinc-900"
        >
          Built with Argus
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-zinc-500 mt-2 text-sm"
        >
          Explore projects built by the community. Find inspiration and clone apps instantly.
        </motion.p>

        {/* Filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeCategory === category
                  ? 'bg-[#FA4500] text-white border border-[#FA4500]'
                  : 'border border-zinc-200 text-zinc-600 hover:border-zinc-300'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="columns-1 gap-4 px-8 pb-12 md:columns-2 lg:columns-3">
        {filteredGallery.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
              <Search size={28} className="text-zinc-400" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">No apps in this category yet</h3>
            <p className="mt-1.5 text-sm text-zinc-500">
              Be the first to build something in <span className="font-medium text-zinc-700">{activeCategory}</span>.
            </p>
            <Link
              href="/workspace"
              className="mt-5 rounded-lg bg-[#FA4500] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98]"
            >
              Start building →
            </Link>
          </motion.div>
        )}
        {filteredGallery.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div className={cn(
              "relative aspect-video w-full rounded-t-xl bg-gradient-to-br",
              item.gradient
            )}>
              {/* Clone overlay */}
              <Link
                href={`/workspace?clone=${item.id}`}
                className="absolute inset-x-0 bottom-0 flex h-1/2 items-end bg-gradient-to-t from-black/80 p-4 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Plus size={14} /> Clone this →
                </span>
              </Link>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-zinc-900 leading-tight">{item.name}</h3>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{item.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400">By {item.creator}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
                  {item.model}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
