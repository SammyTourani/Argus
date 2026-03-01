'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPINNER, MODELS } from '../constants';
import { useKeyboardNav } from '../shared/useKeyboardNav';
import type { OnboardingData } from '../types';

interface StepLaunchProps {
  data: OnboardingData;
  onFinish: (projectId: string) => void;
}

interface TerminalLine {
  text: string;
  color: string;
}

export default function StepLaunch({ data, onFinish }: StepLaunchProps) {
  const [status, setStatus] = useState<'creating' | 'success' | 'error'>('creating');
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [typingText, setTypingText] = useState('');
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [spinnerText, setSpinnerText] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('INITIALIZING...');
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const createdRef = useRef(false);

  const modelName =
    MODELS.find((m) => m.id === data.chosenModel)?.name ?? 'Claude Sonnet 4.6';

  useKeyboardNav({
    onEnter: showSuccess ? () => onFinish(projectId) : undefined,
  });

  // Braille spinner animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % SPINNER.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines, typingText, spinnerText]);

  // Terminal boot sequence + project creation
  useEffect(() => {
    if (createdRef.current && retryCount === 0) return;
    createdRef.current = true;

    let cancelled = false;
    const sleep = (ms: number) =>
      new Promise<void>((r) => {
        const t = setTimeout(r, ms);
        if (cancelled) clearTimeout(t);
      });

    const typeText = async (text: string, speed: number) => {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setTypingText(text.slice(0, i));
        await sleep(speed);
      }
    };

    const addLine = (text: string, color: string) => {
      setLines((prev) => [...prev, { text, color }]);
    };

    const showSpinner = (text: string) => {
      setSpinnerText(text);
    };

    const hideSpinner = () => {
      setSpinnerText('');
    };

    const run = async () => {
      setStatus('creating');
      setLines([]);
      setTypingText('');
      setProgress(0);

      // Phase 1: Type command
      await sleep(400);
      const cmd = `$ argus init --model ${data.chosenModel || 'claude-sonnet-4-6'}`;
      await typeText(cmd, 35);
      await sleep(200);
      addLine(cmd, 'text-white');
      setTypingText('');
      addLine('', '');
      setProgress(10);
      setProgressLabel('INITIALIZING...');

      // Phase 2: Init workspace
      await sleep(300);
      showSpinner('Initializing workspace...');
      await sleep(1000);
      if (cancelled) return;
      hideSpinner();
      addLine('\u2713 Workspace initialized', 'text-[#42C366]');
      setProgress(25);

      // Phase 3: Configure model
      await sleep(400);
      showSpinner('Configuring AI model...');
      setProgressLabel('CONFIGURING...');
      await sleep(800);
      if (cancelled) return;
      hideSpinner();
      addLine(`\u2713 Model set: ${modelName}`, 'text-[#42C366]');
      setProgress(45);

      // Phase 4: Create project (real API call)
      await sleep(300);
      showSpinner('Setting up project...');
      setProgressLabel('CREATING PROJECT...');
      setProgress(60);

      try {
        const desc = data.projectDescription.trim();
        const name = desc
          ? desc.length > 60
            ? desc.slice(0, 57) + '...'
            : desc
          : 'My First Project';

        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: desc || null,
            source_url: data.referenceUrl.trim() || null,
            default_model: data.chosenModel || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to create project' }));
          throw new Error(err.error || 'Failed to create project');
        }

        const { project } = await res.json();

        if (cancelled) return;
        hideSpinner();
        addLine(`\u2713 Project created: ${project.name}`, 'text-[#42C366]');
        setProgress(85);

        await sleep(400);
        addLine('', '');
        addLine('\u2713 All systems go', 'text-[#42C366]');
        setProgress(100);
        setProgressLabel('COMPLETE');

        setProjectName(project.name);
        setProjectId(project.id);

        await sleep(600);
        if (cancelled) return;
        setStatus('success');
        setTimeout(() => setShowSuccess(true), 300);
      } catch (err) {
        if (cancelled) return;
        hideSpinner();
        addLine(
          `\u2717 ${err instanceof Error ? err.message : 'Something went wrong'}`,
          'text-[#EF4444]'
        );
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
        setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [data, retryCount, modelName]);

  const handleRetry = useCallback(() => {
    setStatus('creating');
    setErrorMsg('');
    setRetryCount((c) => c + 1);
  }, []);

  // ─── ASCII Progress Bar ───
  const barWidth = 30;
  const filled = Math.round((progress / 100) * barWidth);
  const empty = barWidth - filled;
  const progressBar = `[${'\u2588'.repeat(filled)}${filled < barWidth ? '>' : ''}${'\u2591'.repeat(Math.max(0, empty - (filled < barWidth ? 1 : 0)))}]`;

  return (
    <div className="flex flex-col items-center w-full">
      <AnimatePresence mode="wait">
        {/* ─── Creating / Error: Terminal UI ─── */}
        {(status === 'creating' || status === 'error') && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, y: 16 }}
            animate={
              status === 'error'
                ? { opacity: 1, y: 0, x: [0, -4, 4, -4, 4, 0] }
                : { opacity: 1, y: 0 }
            }
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-xl rounded-12 overflow-hidden"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow:
                '0 25px 80px -12px rgba(0,0,0,0.5), 0 0 60px -20px rgba(250,93,25,0.06)',
            }}
          >
            {/* macOS title bar */}
            <div
              className="flex items-center gap-6 px-12 h-32"
              style={{
                background: '#0E0E13',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="w-10 h-10 rounded-full" style={{ background: '#FF5F57' }} />
              <div className="w-10 h-10 rounded-full" style={{ background: '#FEBC2E' }} />
              <div className="w-10 h-10 rounded-full" style={{ background: '#28C840' }} />
              <span
                className="ml-8 font-mono text-[11px]"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                argus — initializing
              </span>
            </div>

            {/* Terminal body */}
            <div
              ref={termRef}
              className="p-16 font-mono text-[13px] leading-relaxed overflow-y-auto max-h-[280px] min-h-[200px]"
              style={{ background: '#08080C' }}
            >
              {/* Rendered lines */}
              {lines.map((line, i) => (
                <div key={i} className={line.color}>
                  {line.text || '\u00A0'}
                </div>
              ))}

              {/* Currently typing */}
              {typingText && (
                <div className="text-white">
                  {typingText}
                  <span className="animate-typing-cursor">&nbsp;</span>
                </div>
              )}

              {/* Spinner */}
              {spinnerText && (
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#FA5D19' }}>{SPINNER[spinnerIdx]}</span>{' '}
                  {spinnerText}
                </div>
              )}
            </div>

            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-12"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)',
              }}
            />
          </motion.div>
        )}

        {/* ─── Success state ─── */}
        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Animated checkmark */}
            <div className="mb-8">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#FA5D19"
                  strokeWidth="3"
                  opacity="0.2"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#FA5D19"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{ rotate: -90, transformOrigin: 'center' }}
                />
                <motion.path
                  d="M24 42 L35 53 L56 28"
                  fill="none"
                  stroke="#FA5D19"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.5, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-bold font-mono text-white mb-3">
              ARGUS IS READY
            </h1>

            <p
              className="text-sm font-mono mb-2"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Project created:
            </p>
            <p
              className="text-lg font-bold font-mono mb-8 max-w-sm truncate"
              style={{ color: '#FA5D19' }}
            >
              {projectName}
            </p>

            {showSuccess && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => onFinish(projectId)}
                className="px-24 py-14 rounded-12 font-mono text-label-large text-white transition-all hover:opacity-90 active:scale-[0.98] heat-glow"
                style={{ background: '#FA5D19' }}
              >
                Start Building &rarr;
              </motion.button>
            )}

            {showSuccess && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 font-mono text-[11px] tracking-[0.1em] uppercase"
                style={{ color: 'rgba(255,255,255,0.12)' }}
              >
                press enter
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar (shown during creating) */}
      {status === 'creating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 font-mono text-[12px] flex items-center gap-8"
        >
          <span style={{ color: 'rgba(250, 93, 25, 0.5)' }}>{progressBar}</span>
          <span style={{ color: 'rgba(250, 93, 25, 0.4)' }}>
            {progress}%
          </span>
          <span
            className="tracking-[0.1em] uppercase"
            style={{ color: 'rgba(250, 93, 25, 0.35)' }}
          >
            {progressLabel}
          </span>
        </motion.div>
      )}

      {/* Error actions */}
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <p
            className="text-sm font-mono mb-4 max-w-sm text-center"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {errorMsg}
          </p>
          <div className="flex gap-12">
            <button
              onClick={handleRetry}
              className="px-20 py-12 rounded-12 font-mono text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#FA5D19' }}
            >
              Try again
            </button>
            <button
              onClick={() => onFinish('')}
              className="px-20 py-12 rounded-12 font-mono text-sm transition-all hover:opacity-80"
              style={{
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Skip to workspace
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
