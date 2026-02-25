'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const GALLERY = [
  { id: '1', name: 'SaaS Landing Page', category: 'Landing Pages', creator: 'Sammy T.', model: 'Claude Sonnet', gradient: 'from-orange-400 to-red-600', desc: 'Clean SaaS landing with pricing and testimonials' },
  { id: '2', name: 'Analytics Dashboard', category: 'Dashboard', creator: 'Alex K.', model: 'GPT-4o', gradient: 'from-blue-500 to-purple-600', desc: 'Real-time analytics dashboard with charts' },
  { id: '3', name: 'E-commerce Store', category: 'E-commerce', creator: 'Maria S.', model: 'Claude Sonnet', gradient: 'from-pink-400 to-rose-600', desc: 'Full product catalog with cart and checkout' },
  { id: '4', name: 'Portfolio Site', category: 'Portfolio', creator: 'James L.', model: 'Gemini Flash', gradient: 'from-green-400 to-teal-600', desc: 'Minimal portfolio with project showcases' },
  { id: '5', name: 'Social Network', category: 'SaaS', creator: 'Priya M.', model: 'DeepSeek R1', gradient: 'from-violet-500 to-purple-700', desc: 'Twitter-like social platform with feeds' },
  { id: '6', name: 'Task Manager', category: 'SaaS', creator: 'Tom B.', model: 'Llama 3.3', gradient: 'from-yellow-400 to-orange-500', desc: 'Kanban-style project management tool' },
  { id: '7', name: 'Food Delivery App', category: 'Mobile', creator: 'Lisa C.', model: 'GPT-4o', gradient: 'from-red-400 to-orange-600', desc: 'Restaurant ordering with live tracking' },
  { id: '8', name: 'Crypto Tracker', category: 'Dashboard', creator: 'Raj P.', model: 'Claude Sonnet', gradient: 'from-yellow-500 to-amber-600', desc: 'Portfolio tracker with price alerts' },
  { id: '9', name: 'Blog Platform', category: 'SaaS', creator: 'Sara N.', model: 'Gemini Flash', gradient: 'from-sky-400 to-blue-600', desc: 'CMS with markdown editor and comments' },
  { id: '10', name: 'Booking System', category: 'SaaS', creator: 'Mike R.', model: 'Mistral', gradient: 'from-emerald-400 to-green-600', desc: 'Appointment scheduler with calendar sync' },
  { id: '11', name: 'AI Chat Interface', category: 'SaaS', creator: 'Yuki T.', model: 'Claude Opus', gradient: 'from-indigo-400 to-violet-600', desc: 'Custom ChatGPT interface with personas' },
  { id: '12', name: 'Learning Platform', category: 'SaaS', creator: 'Omar H.', model: 'DeepSeek R1', gradient: 'from-cyan-400 to-blue-500', desc: 'Course platform with video + quizzes' },
];

const CATEGORIES = [
  'All', 'Landing Pages', 'SaaS', 'Dashboard', 'E-commerce', 'Portfolio', 'Mobile',
] as const;

type Category = typeof CATEGORIES[number];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filteredGallery = useMemo(() => {
    if (activeCategory === 'All') return GALLERY;
    return GALLERY.filter(item => item.category === activeCategory);
  }, [activeCategory]);

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
