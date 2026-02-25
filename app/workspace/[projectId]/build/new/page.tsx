'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Wand2, ArrowRight, X, Loader2, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import TemplateLibrary, { type Template } from '@/components/workspace/TemplateLibrary';

const EXAMPLES = [
  { label: 'Clone Stripe', url: 'https://stripe.com/payments' },
  { label: 'Clone Linear', url: 'https://linear.app' },
  { label: 'Clone Vercel', url: 'https://vercel.com' },
  { label: 'Clone Figma', url: 'https://figma.com' },
];

const PROMPT_STARTERS = [
  'A SaaS landing page with pricing and testimonials',
  'A real-time analytics dashboard with charts and filters',
  'An e-commerce product catalog with cart and checkout',
  'A Kanban task manager with drag-and-drop',
];

type Mode = 'url' | 'prompt' | 'template';

function NewBuildPageInner() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Pre-fill URL from query param (e.g., coming from landing page hero)
  useEffect(() => {
    const prefilledUrl = searchParams?.get('url');
    if (prefilledUrl) {
      setUrl(decodeURIComponent(prefilledUrl));
      setMode('url');
    }
  }, [searchParams]);

  const handleCreate = async () => {
    const value = mode === 'url' ? url.trim() : prompt.trim();
    if (!value) {
      setError(mode === 'url' ? 'Enter a URL to clone' : mode === 'template' ? 'Select a template first' : 'Describe what to build');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/builds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'url'
            ? { source_url: value, prompt: `Clone this website: ${value}` }
            : { prompt: value }
        ),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create build');

      router.push(`/workspace/${projectId}/build/${data.build.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: '#080808', fontFamily: '"JetBrains Mono", monospace' }}
    >
      {/* Close */}
      <Link
        href={`/workspace/${projectId}`}
        className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
      >
        <X size={16} />
      </Link>

      {/* Brand */}
      <div className="absolute top-5 left-6 text-[#FA4500] text-sm font-bold tracking-widest">
        ARGUS
      </div>

      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            What are we building?
          </h1>
          <p className="text-zinc-500 text-sm text-center mb-8">
            Clone a website or describe what you want from scratch.
          </p>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg mb-6 mx-auto w-fit" style={{ background: '#111' }}>
            <button
              onClick={() => { setMode('url'); setError(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                mode === 'url' ? 'bg-[#FA4500] text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Link2 size={14} />
              Clone URL
            </button>
            <button
              onClick={() => { setMode('prompt'); setError(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                mode === 'prompt' ? 'bg-[#FA4500] text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Wand2 size={14} />
              Prompt
            </button>
            <button
              onClick={() => { setMode('template'); setError(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                mode === 'template' ? 'bg-[#FA4500] text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <LayoutTemplate size={14} />
              Templates
            </button>
          </div>

          {/* Template mode */}
          <AnimatePresence>
            {mode === 'template' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-6"
              >
                <TemplateLibrary
                  onSelectTemplate={(template: Template) => {
                    setPrompt(template.prompt);
                    setMode('prompt');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input area (hidden in template mode) */}
          <div className={cn('mb-3', mode === 'template' && 'hidden')}>
            {mode === 'url' ? (
              <div className="flex items-center gap-2 rounded-xl border px-4 py-3.5 transition-colors"
                style={{ background: '#111', borderColor: error ? '#EF4444' : '#222' }}>
                <Link2 size={16} className="text-zinc-600 shrink-0" />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="https://stripe.com/payments"
                  autoFocus
                  className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm outline-none"
                />
                {url && (
                  <button onClick={() => setUrl('')} className="text-zinc-600 hover:text-zinc-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border px-4 py-3.5 transition-colors"
                style={{ background: '#111', borderColor: error ? '#EF4444' : '#222' }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); setError(null); }}
                  placeholder="Describe what you want to build..."
                  rows={4}
                  autoFocus
                  className="w-full bg-transparent text-white placeholder-zinc-600 text-sm outline-none resize-none"
                />
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>

          {/* Quick starters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {mode === 'url'
              ? EXAMPLES.map(ex => (
                  <button
                    key={ex.url}
                    onClick={() => setUrl(ex.url)}
                    className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))
              : PROMPT_STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors text-left"
                  >
                    {s.length > 40 ? s.slice(0, 40) + '…' : s}
                  </button>
                ))
            }
          </div>

          {/* CTA */}
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#FA4500' }}
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating build...
              </>
            ) : (
              <>
                {mode === 'url' ? <Link2 size={16} /> : <Wand2 size={16} />}
                {mode === 'url' ? 'Clone this site' : 'Build it with AI'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function NewBuildPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FA4500] border-t-transparent" />
      </div>
    }>
      <NewBuildPageInner />
    </Suspense>
  );
}
