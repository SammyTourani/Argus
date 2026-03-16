'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Rocket,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  History,
  Clock,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DeployStatusPoller, deployStateToStepIndex } from '@/lib/deploy/status-poller';
import type { DeployStatus } from '@/lib/deploy/status-poller';
import type { FileEntry } from './CodePanel';
import DeployHistory from './DeployHistory';
import CustomDomainInput from './CustomDomainInput';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';

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

/* ─── Helpers ─── */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
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
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [deployDuration, setDeployDuration] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const pollerRef = useRef<DeployStatusPoller | null>(null);
  const deployStartRef = useRef<number>(0);

  // Environment selector (stub for future preview environments)
  const [environment] = useState<'production'>('production');

  const [steps, setSteps] = useState<ProgressStep[]>([
    { label: 'Preparing files...', done: false, active: false },
    { label: 'Creating deployment...', done: false, active: false },
    { label: 'Building...', done: false, active: false },
    { label: 'Live!', done: false, active: false },
  ]);

  // Cleanup poller on unmount
  useEffect(() => {
    return () => {
      pollerRef.current?.stop();
    };
  }, []);

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

  /** Handle real-time status updates from the poller */
  const handlePollerUpdate = useCallback(
    (status: DeployStatus) => {
      // Update URL as soon as available (even before READY)
      if (status.url && !deployUrl) {
        setDeployUrl(status.url);
      }

      const stepIndex = deployStateToStepIndex(status.state);

      if (status.state === 'READY') {
        // Deployment is live
        markAllDone();
        const duration = Date.now() - deployStartRef.current;
        setDeployDuration(duration);
        const finalUrl = status.url ?? deployUrl ?? '';
        setDeployUrl(finalUrl);
        setState('success');
        onPublishSuccess(finalUrl);
      } else if (status.state === 'ERROR' || status.state === 'CANCELED') {
        setErrorMessage(status.errorMessage ?? 'Deployment failed');
        setState('error');
      } else if (stepIndex >= 0) {
        advanceStep(stepIndex);
      }
    },
    [deployUrl, advanceStep, markAllDone, onPublishSuccess]
  );

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
    setDeploymentId(null);
    setDeployDuration(null);
    deployStartRef.current = Date.now();

    // Stop any existing poller
    pollerRef.current?.stop();

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
        if (res.status === 403 && data.code === 'DEPLOY_GATED') {
          setShowUpgradePrompt(true);
          setState('idle');
          return;
        }
        throw new Error(data.error ?? `Deployment failed (${res.status})`);
      }

      // Show URL immediately even if deployment is still building
      if (data.deploymentUrl) {
        setDeployUrl(data.deploymentUrl);
      }

      const depId = data.deploymentId;
      setDeploymentId(depId);

      // Start real-time polling if we have a deployment ID
      if (depId) {
        advanceStep(2); // Move to "Building..." step
        const poller = new DeployStatusPoller(depId);
        pollerRef.current = poller;
        poller.poll(handlePollerUpdate);
      } else {
        // No deployment ID from API — use the old approach (simulated steps)
        advanceStep(2);
        await new Promise((r) => setTimeout(r, 800));
        advanceStep(3);
        await new Promise((r) => setTimeout(r, 300));
        markAllDone();

        const url = data.deploymentUrl ?? '';
        const duration = Date.now() - deployStartRef.current;
        setDeployDuration(duration);
        setDeployUrl(url);
        setState('success');
        onPublishSuccess(url);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Deployment failed. Please try again.'
      );
      setState('error');
    }
  }, [
    state,
    files,
    buildId,
    projectId,
    projectName,
    advanceStep,
    markAllDone,
    onPublishSuccess,
    handlePollerUpdate,
  ]);

  const handleCopyUrl = useCallback(async () => {
    if (!deployUrl) return;
    await navigator.clipboard.writeText(deployUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [deployUrl]);

  const handleRetry = useCallback(() => {
    pollerRef.current?.stop();
    setState('idle');
    setErrorMessage('');
    setDeployUrl(null);
    setDeploymentId(null);
    setDeployDuration(null);
    setShowDomainInput(false);
    setShowUpgradePrompt(false);
    setSteps([
      { label: 'Preparing files...', done: false, active: false },
      { label: 'Creating deployment...', done: false, active: false },
      { label: 'Building...', done: false, active: false },
      { label: 'Live!', done: false, active: false },
    ]);
  }, []);

  const handleRollback = useCallback(
    (_buildId: string) => {
      // After rollback, reset to idle so user can see the result
      handleRetry();
    },
    [handleRetry]
  );

  /* ─── Idle / Error state: button ─── */
  if (state === 'idle' || state === 'error') {
    return (
      <div className="relative flex flex-col items-end gap-1.5">
        {showUpgradePrompt && (
          <UpgradePrompt
            feature="deploy"
            currentTier="free"
            dark={true}
            onDismiss={() => setShowUpgradePrompt(false)}
          />
        )}
        <div className="flex items-center gap-1">
          {/* Environment selector stub */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-mono text-[var(--editor-fg-dim)] border border-[var(--editor-border-faint)] bg-[var(--editor-bg-surface)]">
            <Globe className="w-3 h-3" />
            <span className="capitalize">{environment}</span>
          </div>

          {/* History button */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-sans text-[var(--editor-fg-muted)] hover:text-white border border-[var(--editor-border)] hover:border-[var(--editor-border-hover)] transition-colors"
            title="View deploy history"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {/* Publish / Retry button */}
          <button
            onClick={state === 'error' ? handleRetry : handlePublish}
            disabled={false}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-white transition-colors',
              state === 'error'
                ? 'bg-red-600/80 hover:bg-red-600'
                : 'bg-[var(--editor-accent)] hover:bg-[var(--editor-accent-hover)]'
            )}
          >
            {state === 'error' ? (
              <RefreshCw className="w-3.5 h-3.5" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            {state === 'error' ? 'Retry' : 'Publish'}
          </button>
        </div>

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
                <p className="text-[11px] font-sans text-red-300 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deploy History Panel */}
        <DeployHistory
          projectId={projectId}
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onRollback={handleRollback}
        />
      </div>
    );
  }

  /* ─── Deploying state ─── */
  if (state === 'deploying') {
    return (
      <div className="relative flex flex-col items-end gap-1.5">
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-white bg-[var(--editor-accent-60)] cursor-not-allowed"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Deploying...
        </button>

        {/* Progress steps dropdown */}
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-full mt-2 right-0 w-56 bg-[var(--editor-bg-elevated)] border border-[var(--editor-border)] rounded-xl p-3 z-50 shadow-2xl shadow-black/50"
        >
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {step.done ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : step.active ? (
                    <Loader2 className="w-3 h-3 text-[var(--editor-accent)] animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--editor-border)]" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-sans',
                    step.done
                      ? 'text-green-400'
                      : step.active
                      ? 'text-[var(--editor-accent)]'
                      : 'text-[var(--editor-fg-dim)]',
                    i === steps.length - 1 &&
                      (step.done || step.active) &&
                      '!text-green-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Show URL immediately if available (before READY) */}
          {deployUrl && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--editor-border-faint)]">
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--editor-fg-tertiary)] hover:text-white transition-colors truncate"
                title={deployUrl}
              >
                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{deployUrl.replace('https://', '')}</span>
              </a>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── Success state ─── */
  return (
    <div className="relative flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1">
        {/* History button */}
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-sans text-[var(--editor-fg-muted)] hover:text-white border border-[var(--editor-border)] hover:border-[var(--editor-border-hover)] transition-colors"
          title="View deploy history"
        >
          <History className="w-3.5 h-3.5" />
        </button>

        {/* Copy URL */}
        <button
          onClick={handleCopyUrl}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-[var(--editor-fg-muted)] hover:text-white border border-[var(--editor-border)] hover:border-[var(--editor-border-hover)] transition-colors"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-green-400 hover:text-green-300 border border-green-900/40 hover:border-green-700/60 transition-colors"
            title="Open deployed app"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
        )}

        {/* Live button + deploy again */}
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-white bg-green-700 hover:bg-green-600 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Live
        </button>
      </div>

      {/* Duration + Domain card (shown below the buttons) */}
      <AnimatePresence>
        {(deployDuration || deployUrl) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-2 right-0 w-64 z-50 flex flex-col gap-2"
          >
            {/* Duration badge */}
            {deployDuration && (
              <div className="flex items-center justify-end gap-1.5">
                <Clock className="w-3 h-3 text-[var(--editor-fg-dim)]" />
                <span className="text-[10px] font-mono text-[var(--editor-fg-dim)]">
                  Deployed in {formatDuration(deployDuration)}
                </span>
              </div>
            )}

            {/* Custom domain input stub */}
            {showDomainInput ? (
              <CustomDomainInput currentUrl={deployUrl ?? undefined} />
            ) : (
              <button
                onClick={() => setShowDomainInput(true)}
                className="flex items-center gap-1.5 text-[10px] font-sans text-[var(--editor-fg-ghost)] hover:text-[var(--editor-fg-muted)] transition-colors self-end"
              >
                <Globe className="w-3 h-3" />
                Add custom domain
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy History Panel */}
      <DeployHistory
        projectId={projectId}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRollback={handleRollback}
      />
    </div>
  );
}
