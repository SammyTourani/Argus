'use client';

import { useState, useCallback } from 'react';
import { Rocket, Loader2, Check, Copy, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileEntry } from './CodePanel';

/* ─── Types ─── */
type DeployState = 'idle' | 'deploying' | 'success' | 'error';

interface ProgressStep {
  label: string;
  done: boolean;
  active: boolean;
}

interface PublishButtonProps {
  projectId: string;
  buildId: string;
  projectName?: string;
  sandboxUrl?: string;
  files: FileEntry[];
  onPublishSuccess: (url: string) => void;
}

/* ─── Component ─── */
export default function PublishButton({
  projectId,
  buildId,
  projectName,
  sandboxUrl: _sandboxUrl,
  files,
  onPublishSuccess,
}: PublishButtonProps) {
  const [state, setState] = useState<DeployState>('idle');
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [steps, setSteps] = useState<ProgressStep[]>([
    { label: 'Preparing files...', done: false, active: false },
    { label: 'Creating deployment...', done: false, active: false },
    { label: 'Building...', done: false, active: false },
    { label: 'Live!', done: false, active: false },
  ]);

  const advanceStep = useCallback((stepIndex: number) => {
    setSteps((prev) =>
      prev.map((s, i) => ({
        ...s,
        done: i < stepIndex,
        active: i === stepIndex,
      }))
    );
  }, []);

  const markAllDone = useCallback(() => {
    setSteps((prev) => prev.map((s) => ({ ...s, done: true, active: false })));
  }, []);

  const handlePublish = useCallback(async () => {
    if (state === 'deploying') return;
    if (files.length === 0) {
      setErrorMessage('No files to deploy. Generate code first.');
      setState('error');
      return;
    }

    setState('deploying');
    setErrorMessage('');
    setDeployUrl(null);

    // Step 0: Preparing files
    advanceStep(0);
    await new Promise((r) => setTimeout(r, 400));

    // Step 1: Creating deployment
    advanceStep(1);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildId,
          projectId,
          projectName,
          files,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Deployment failed (${res.status})`);
      }

      // Step 2: Building
      advanceStep(2);
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Live!
      advanceStep(3);
      await new Promise((r) => setTimeout(r, 300));
      markAllDone();

      const url = data.deploymentUrl ?? '';
      setDeployUrl(url);
      setState('success');
      onPublishSuccess(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Deployment failed. Please try again.');
      setState('error');
    }
  }, [state, files, buildId, projectId, projectName, advanceStep, markAllDone, onPublishSuccess]);

  const handleCopyUrl = useCallback(async () => {
    if (!deployUrl) return;
    await navigator.clipboard.writeText(deployUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [deployUrl]);

  const handleRetry = useCallback(() => {
    setState('idle');
    setErrorMessage('');
    setDeployUrl(null);
    setSteps([
      { label: 'Preparing files...', done: false, active: false },
      { label: 'Creating deployment...', done: false, active: false },
      { label: 'Building...', done: false, active: false },
      { label: 'Live!', done: false, active: false },
    ]);
  }, []);

  /* ─── Idle / Error state: button ─── */
  if (state === 'idle' || state === 'error') {
    return (
      <div className="relative flex flex-col items-end gap-1.5">
        <button
          onClick={state === 'error' ? handleRetry : handlePublish}
          disabled={false}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white transition-colors ${
            state === 'error'
              ? 'bg-red-600/80 hover:bg-red-600'
              : 'bg-[#FA4500] hover:bg-[#E63F00]'
          }`}
        >
          {state === 'error' ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}
          {state === 'error' ? 'Retry' : 'Publish'}
        </button>
        <AnimatePresence>
          {state === 'error' && errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-2 right-0 w-56 bg-[#1A0000] border border-red-900/50 rounded-lg p-2.5 z-50 shadow-xl"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono text-red-300 leading-relaxed">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ─── Deploying state ─── */
  if (state === 'deploying') {
    return (
      <div className="relative flex flex-col items-end gap-1.5">
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white bg-[#FA4500]/60 cursor-not-allowed"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Deploying...
        </button>

        {/* Progress steps dropdown */}
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-full mt-2 right-0 w-48 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 z-50 shadow-2xl"
        >
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {step.done ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : step.active ? (
                    <Loader2 className="w-3 h-3 text-[#FA4500] animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                  )}
                </div>
                <span
                  className={`text-[11px] font-mono ${
                    step.done
                      ? 'text-green-400'
                      : step.active
                      ? 'text-[#FA4500]'
                      : 'text-[#555]'
                  } ${
                    // Last step "Live!" in green when done/active
                    i === steps.length - 1 && (step.done || step.active)
                      ? '!text-green-400'
                      : ''
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Success state ─── */
  return (
    <div className="relative flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1">
        {/* Copy URL */}
        <button
          onClick={handleCopyUrl}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#888] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
          title="Copy deployment URL"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Open link */}
        {deployUrl && (
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-green-400 hover:text-green-300 border border-green-900/40 hover:border-green-700/60 transition-colors"
            title="Open deployed app"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
        )}

        {/* Re-deploy button */}
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white bg-green-700 hover:bg-green-600 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Live
        </button>
      </div>
    </div>
  );
}
