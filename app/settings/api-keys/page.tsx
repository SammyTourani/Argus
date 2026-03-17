'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Loader2, Trash2, Info } from 'lucide-react';
import { fetchApiKeys, addApiKey, deleteApiKey } from '@/lib/workspace/api';
import { useToast } from '@/components/ui/Toast';
import type { ApiKeyEntry } from '@/lib/workspace/api';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'xai', label: 'xAI' },
  { value: 'groq', label: 'Groq' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'custom', label: 'Custom' },
];

export default function SettingsApiKeysPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState('openai');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const data = await fetchApiKeys();
      setKeys(data);
    } catch {
      toast.error('Could not load API keys.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setAdding(true);
    try {
      const entry = await addApiKey(newProvider, newKey.trim(), newLabel.trim() || null);
      setKeys(prev => [...prev, entry]);
      setNewKey('');
      setNewLabel('');
      setShowAdd(false);
      toast.success('API key added.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add key.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId);
    try {
      await deleteApiKey(keyId);
      setKeys(prev => prev.filter(k => k.id !== keyId));
      toast.success('API key deleted.');
    } catch {
      toast.error('Failed to delete key.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          API keys are tied to your account, not a specific workspace. They&apos;re encrypted at rest and never displayed in full after saving.
        </p>
      </div>

      {/* Key List */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">API Keys ({keys.length})</h2>
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#FA4500] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e03e00] transition-colors"
            >
              <Plus size={14} /> Add key
            </button>
          )}
        </div>

        {keys.length === 0 && !showAdd ? (
          <p className="text-sm text-zinc-400 text-center py-8">No API keys added yet. Add one to use your own AI provider keys.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {keys.map(key => (
              <div key={key.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{key.label || key.provider}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 uppercase">{key.provider}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{key.key_mask}</p>
                </div>

                {confirmDeleteId === key.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(key.id)}
                      disabled={deletingId === key.id}
                      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === key.id ? '...' : 'Delete'}
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(key.id)}
                    className="p-1.5 rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete key"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Provider</label>
                <select
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#FA4500]"
                >
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Label (optional)</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. Production key"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:border-[#FA4500] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">API Key</label>
              <input
                type="password"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-mono focus:border-[#FA4500] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={adding || !newKey.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#FA4500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e03e00] disabled:opacity-60 transition-colors"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Save key
              </button>
              <button onClick={() => { setShowAdd(false); setNewKey(''); setNewLabel(''); }} className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
