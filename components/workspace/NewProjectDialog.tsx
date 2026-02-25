'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, FileCode, LayoutTemplate } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type StartFrom = 'blank' | 'url' | 'template';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startFrom, setStartFrom] = useState<StartFrom>('blank');
  const [cloneUrl, setCloneUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be signed in');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          user_id: user.id,
          status: 'active',
          is_starred: false,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (data) {
        onOpenChange(false);
        router.push(`/workspace/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartFrom('blank');
    setCloneUrl('');
    setError(null);
  };

  const startOptions: { value: StartFrom; label: string; icon: typeof Globe; desc: string }[] = [
    { value: 'blank', label: 'Blank canvas', icon: FileCode, desc: 'Start from scratch' },
    { value: 'url', label: 'Clone a website', icon: Globe, desc: 'Enter a URL to clone' },
    { value: 'template', label: 'From template', icon: LayoutTemplate, desc: 'Choose a starter' },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-zinc-900">
                      New Project
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Project Name */}
                    <div>
                      <label htmlFor="project-name" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="project-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My awesome project"
                        autoFocus
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#FA4500] focus:outline-none focus:ring-2 focus:ring-[#FA4500]/20"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="project-desc" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                        Description <span className="text-zinc-400">(optional)</span>
                      </label>
                      <textarea
                        id="project-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What are you building?"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#FA4500] focus:outline-none focus:ring-2 focus:ring-[#FA4500]/20"
                      />
                    </div>

                    {/* Start from */}
                    <div>
                      <label className="mb-2 block text-[13px] font-medium text-zinc-700">
                        Start from
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {startOptions.map((opt) => {
                          const Icon = opt.icon;
                          const selected = startFrom === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStartFrom(opt.value)}
                              className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-center transition-all ${
                                selected
                                  ? 'border-[#FA4500] bg-[#FFF8F5]'
                                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                              }`}
                            >
                              <Icon className={`h-5 w-5 ${selected ? 'text-[#FA4500]' : 'text-zinc-400'}`} />
                              <span className={`text-[12px] font-medium ${selected ? 'text-[#FA4500]' : 'text-zinc-600'}`}>
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* URL input (conditional) */}
                    {startFrom === 'url' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label htmlFor="clone-url" className="mb-1.5 block text-[13px] font-medium text-zinc-700">
                          URL to clone
                        </label>
                        <input
                          id="clone-url"
                          type="url"
                          value={cloneUrl}
                          onChange={(e) => setCloneUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#FA4500] focus:outline-none focus:ring-2 focus:ring-[#FA4500]/20"
                        />
                      </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                      <p className="text-[13px] text-red-500">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
                        >
                          Cancel
                        </button>
                      </Dialog.Close>
                      <button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="rounded-lg bg-[#FA4500] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#e03e00] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-sm"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Project'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
