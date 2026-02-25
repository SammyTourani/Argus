'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MODELS as SHARED_MODELS } from '@/lib/models';

const MODELS = SHARED_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  provider: m.provider,
  description: m.description,
  costPer1k: m.costPer1k,
  badge: m.badge,
  badgeColor: m.badgeColor,
  dotColor: m.color,
  capabilities: m.tags,
}));

const STYLE_PRESETS = [
  { id: 'minimal', name: 'Minimal', description: 'Clean whitespace, subtle shadows', swatchColor: '#F8F8F8', swatchBorder: '#E0E0E0' },
  { id: 'bold', name: 'Bold', description: 'High contrast, strong typography', swatchColor: '#000000', swatchBorder: '#000000' },
  { id: 'enterprise', name: 'Enterprise', description: 'Professional, structured, accessible', swatchColor: '#1E3A5F', swatchBorder: '#1E3A5F' },
  { id: 'playful', name: 'Playful', description: 'Rounded, pastel colors, friendly', swatchColor: '#FF85A1', swatchBorder: '#FF85A1' },
  { id: 'dark', name: 'Dark', description: 'Dark mode first, neon accents', swatchColor: '#0A0A0A', swatchBorder: '#333333' },
  { id: 'brutalist', name: 'Brutalist', description: 'Raw, bold, unconventional layout', swatchColor: '#FFFF00', swatchBorder: '#000000' },
] as const;

export default function MarketplacePage() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [selectedStyle, setSelectedStyle] = useState('minimal');

  const applyDefaults = useCallback(() => {
    try {
      localStorage.setItem('argus_default_model', selectedModel);
      localStorage.setItem('argus_default_style', selectedStyle);
    } catch {}
    // Persist to server
    fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_model_id: selectedModel, default_style_preset: selectedStyle }),
    });
  }, [selectedModel, selectedStyle]);

  const selectedModelObj = MODELS.find(m => m.id === selectedModel);
  const selectedStyleObj = STYLE_PRESETS.find(s => s.id === selectedStyle);

  return (
    <div className="min-h-screen bg-white pb-24" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Top nav */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-zinc-100 bg-white/90 backdrop-blur-sm px-8">
        <Link href="/workspace" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          ← Workspace
        </Link>
        <span className="mx-3 text-zinc-200">/</span>
        <span className="text-sm font-semibold text-zinc-900">Model Marketplace</span>
      </div>

      {/* Header */}
      <div className="px-8 pt-10 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-zinc-900"
        >
          Choose your stack
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-zinc-500 mt-2 text-sm"
        >
          Pick the AI model and style that fits your project. Different tools for different jobs.
        </motion.p>
      </div>

      {/* Models */}
      <div className="px-8 pb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-5">AI Models</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODELS.map((model, i) => {
            const isSelected = selectedModel === model.id;
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  'relative cursor-pointer rounded-xl border p-5 transition-all duration-200',
                  isSelected
                    ? 'border-[#FA4500] border-2 shadow-[0_0_0_1px_rgba(250,69,0,0.1)]'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                )}
              >
                {/* Selected check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#FA4500]"
                  >
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </motion.div>
                )}

                {/* Badge */}
                {model.badge && (
                  <span className={cn('absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white', model.badgeColor ?? 'bg-zinc-500')}>
                    {model.badge}
                  </span>
                )}

                {/* Provider dot + name */}
                <div className={cn('flex items-center gap-2', model.badge ? 'mt-6' : 'mt-0')}>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: model.dotColor }} />
                  <span className="text-xs text-zinc-400">{model.provider}</span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-zinc-900 leading-tight">{model.name}</h3>
                <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed line-clamp-2">{model.description}</p>

                {/* Capabilities */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {model.capabilities.map(cap => (
                    <span key={cap} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Cost */}
                <div className="mt-4 flex items-center gap-1 text-xs text-zinc-400">
                  <DollarSign size={11} />
                  {model.costPer1k === 0 ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : (
                    <span>${model.costPer1k}/1k tokens</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Style Presets */}
      <div className="px-8 pb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-5">Style Preset</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STYLE_PRESETS.map((preset, i) => {
            const isSelected = selectedStyle === preset.id;
            return (
              <motion.button
                key={preset.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedStyle(preset.id)}
                className={cn(
                  'flex min-w-[130px] flex-col rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer shrink-0',
                  isSelected ? 'border-[#FA4500] border-2' : 'border-zinc-200 hover:border-zinc-300'
                )}
              >
                <div className="relative">
                  <div
                    className="h-10 w-10 rounded-lg"
                    style={{ backgroundColor: preset.swatchColor, border: `1px solid ${preset.swatchBorder}` }}
                  />
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FA4500]"
                    >
                      <Check size={9} strokeWidth={3} className="text-white" />
                    </motion.div>
                  )}
                </div>
                <span className="mt-3 text-sm font-semibold text-zinc-900">{preset.name}</span>
                <span className="mt-0.5 text-[11px] text-zinc-400 leading-snug">{preset.description}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sticky apply bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-100 bg-white/95 backdrop-blur-sm px-8 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{selectedModelObj?.name}</span>
            <span className="mx-2 text-zinc-300">·</span>
            <span className="capitalize">{selectedStyleObj?.name} style</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/gallery" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Browse gallery →
            </Link>
            <button
              onClick={applyDefaults}
              className="rounded-lg bg-[#FA4500] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] transition-colors"
            >
              Apply as defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
