'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── ASCII Eye Frames ─── */
const EYE_FRAMES = [
  `
    ╔══════════════════╗
    ║   .-""""""""-.   ║
    ║  /            \\  ║
    ║ |  .-------.  |  ║
    ║ | |  (◉)    | |  ║
    ║ |  '-------'  |  ║
    ║  \\            /  ║
    ║   '-........-'   ║
    ╚══════════════════╝
  `,
  `
    ╔══════════════════╗
    ║   .-""""""""-.   ║
    ║  /            \\  ║
    ║ |  .-------.  |  ║
    ║ | |    (◉)  | |  ║
    ║ |  '-------'  |  ║
    ║  \\            /  ║
    ║   '-........-'   ║
    ╚══════════════════╝
  `,
  `
    ╔══════════════════╗
    ║   .-""""""""-.   ║
    ║  /            \\  ║
    ║ |  .-------.  |  ║
    ║ | |   (◉)   | |  ║
    ║ |  '-------'  |  ║
    ║  \\            /  ║
    ║   '-........-'   ║
    ╚══════════════════╝
  `,
  `
    ╔══════════════════╗
    ║   .-""""""""-.   ║
    ║  /            \\  ║
    ║ |  .-------.  |  ║
    ║ | |  (◉)    | |  ║
    ║ |  '-------'  |  ║
    ║  \\            /  ║
    ║   '-........-'   ║
    ╚══════════════════╝
  `,
];

/* ─── Types ─── */
interface OnboardingData {
  projectDescription: string;
  referenceUrl: string;
  category: string;
  chosenModel: string;
}

/* ─── Categories ─── */
const CATEGORIES = [
  'SaaS',
  'E-commerce',
  'Portfolio',
  'Dashboard',
  'Blog',
  'Social',
  'Mobile App',
  'Other',
] as const;

/* ─── Models ─── */
const MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10A37F',
    description: 'Fast, versatile',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    color: '#D97757',
    description: 'Best for complex code',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    color: '#4285F4',
    description: 'Quick & free',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    color: '#4285F4',
    description: 'Most capable',
  },
];

/* ─── Progress Dots ─── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mt-12">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-colors duration-300"
          style={{
            background: i === current ? '#FA4500' : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Step 1: Welcome ─── */
function StepWelcome({ onNext }: { onNext: () => void }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % EYE_FRAMES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <pre
        className="text-sm leading-tight mb-8"
        style={{ color: '#FA4500', fontFamily: '"JetBrains Mono", monospace' }}
      >
        {EYE_FRAMES[frameIndex]}
      </pre>
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'white' }}>
        You&apos;re in.
      </h1>
      <p
        className="text-sm max-w-sm mb-10 font-mono"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        Argus is an AI-powered app builder. Describe what you want, paste a
        reference URL, and watch your app come to life in seconds.
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 rounded-lg text-sm font-medium font-mono text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: '#FA4500' }}
      >
        Let&apos;s go &rarr;
      </button>
    </div>
  );
}

/* ─── Step 2: What are you building? ─── */
function StepWhatToBuild({
  data,
  onUpdate,
  onNext,
}: {
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const canContinue = data.projectDescription.trim().length > 0;

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
        What are you building?
      </h1>
      <p
        className="text-sm max-w-md mb-8 font-mono"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        Tell us about your project so Argus can get you started faster.
      </p>

      {/* Project description */}
      <div className="w-full max-w-md mb-5 text-left">
        <label
          className="block text-xs font-mono mb-2"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Describe your project in a sentence
        </label>
        <textarea
          value={data.projectDescription}
          onChange={(e) => onUpdate({ projectDescription: e.target.value })}
          placeholder="e.g. A dashboard for tracking my SaaS metrics..."
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-lg text-sm font-mono text-white placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-[#FA4500]/50 transition-all"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Reference URL */}
      <div className="w-full max-w-md mb-6 text-left">
        <label
          className="block text-xs font-mono mb-2"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Have a reference site? Paste the URL
          <span className="ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            (optional)
          </span>
        </label>
        <input
          type="url"
          value={data.referenceUrl}
          onChange={(e) => onUpdate({ referenceUrl: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-4 py-3 rounded-lg text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#FA4500]/50 transition-all"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Category chips */}
      <div className="w-full max-w-md mb-8 text-left">
        <label
          className="block text-xs font-mono mb-3"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                onUpdate({ category: data.category === cat ? '' : cat })
              }
              className="px-4 py-2 rounded-full text-xs font-mono transition-all"
              style={{
                background:
                  data.category === cat
                    ? 'rgba(250, 69, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                border:
                  data.category === cat
                    ? '1px solid #FA4500'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                color: data.category === cat ? '#FA4500' : 'rgba(255,255,255,0.5)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="px-8 py-3 rounded-lg text-sm font-medium font-mono text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: '#FA4500' }}
      >
        Continue &rarr;
      </button>
    </div>
  );
}

/* ─── Step 3: Model Selection ─── */
function StepModelSelect({
  data,
  onUpdate,
  onNext,
}: {
  data: OnboardingData;
  onUpdate: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const handleConfirm = () => {
    if (data.chosenModel) {
      try {
        localStorage.setItem('argus_default_model', data.chosenModel);
      } catch {}
      onNext();
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
        Pick your default model
      </h1>
      <p
        className="text-sm max-w-sm mb-10 font-mono"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        You can always switch later. Choose the AI model that powers your
        builds.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-md">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onUpdate({ chosenModel: model.id })}
            className="flex flex-col items-center gap-2 p-5 rounded-xl transition-all"
            style={{
              background:
                data.chosenModel === model.id
                  ? 'rgba(250,69,0,0.1)'
                  : 'rgba(255,255,255,0.05)',
              border:
                data.chosenModel === model.id
                  ? '2px solid #FA4500'
                  : '2px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: model.color }}
            >
              {model.name[0]}
            </div>
            <span
              className="text-sm font-medium font-mono"
              style={{ color: 'white' }}
            >
              {model.name}
            </span>
            <span
              className="text-[11px] font-mono"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {model.provider}
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {model.description}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!data.chosenModel}
        className="px-8 py-3 rounded-lg text-sm font-medium font-mono text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: '#FA4500' }}
      >
        Set default &rarr;
      </button>
    </div>
  );
}

/* ─── Step 4: Ready + Auto-Create Project ─── */
function StepReady({
  data,
  onFinish,
}: {
  data: OnboardingData;
  onFinish: (projectId: string) => void;
}) {
  const [status, setStatus] = useState<'creating' | 'success' | 'error'>(
    'creating'
  );
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current && retryCount === 0) return;
    createdRef.current = true;

    async function createProject() {
      try {
        // Derive project name from description
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
        setProjectName(project.name);
        setProjectId(project.id);
        setStatus('success');
      } catch (err) {
        console.error('[Onboarding] project creation failed:', err);
        setErrorMsg(
          err instanceof Error ? err.message : 'Something went wrong'
        );
        setStatus('error');
      }
    }

    createProject();
  }, [data, retryCount]);

  return (
    <div className="flex flex-col items-center text-center">
      {status === 'creating' && (
        <>
          {/* Spinner */}
          <div className="mb-8">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              className="animate-spin"
              style={{ animationDuration: '1.2s' }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(250,69,0,0.15)"
                strokeWidth="3"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#FA4500"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="120"
                strokeDashoffset="80"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-4 font-mono"
            style={{ color: 'white' }}
          >
            Setting up your project...
          </h1>
          <p
            className="text-sm font-mono"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            This will only take a moment.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          {/* Animated checkmark */}
          <div className="mb-8">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#FA4500"
                strokeWidth="3"
                opacity="0.2"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#FA4500"
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
                stroke="#FA4500"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.5,
                  ease: 'easeInOut',
                }}
              />
            </svg>
          </div>

          <h1
            className="text-3xl font-bold mb-3 font-mono"
            style={{ color: 'white' }}
          >
            Your workspace is ready.
          </h1>
          <p
            className="text-sm mb-2 font-mono"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Project created:
          </p>
          <p
            className="text-lg font-bold mb-8 font-mono max-w-sm truncate"
            style={{ color: '#FA4500' }}
          >
            {projectName}
          </p>

          <button
            onClick={() => onFinish(projectId)}
            className="px-8 py-3 rounded-lg text-sm font-medium font-mono text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#FA4500' }}
          >
            Start building &rarr;
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          {/* Error icon */}
          <div className="mb-8">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
                opacity="0.3"
              />
              <motion.line
                x1="28"
                y1="28"
                x2="52"
                y2="52"
                stroke="#EF4444"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.line
                x1="52"
                y1="28"
                x2="28"
                y2="52"
                stroke="#EF4444"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
            </svg>
          </div>

          <h1
            className="text-2xl font-bold mb-3 font-mono"
            style={{ color: 'white' }}
          >
            Something went wrong
          </h1>
          <p
            className="text-sm mb-6 font-mono max-w-sm"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {errorMsg}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStatus('creating');
                setErrorMsg('');
                setRetryCount((c) => c + 1);
              }}
              className="px-6 py-3 rounded-lg text-sm font-medium font-mono text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#FA4500' }}
            >
              Try again
            </button>
            <button
              onClick={() => onFinish('')}
              className="px-6 py-3 rounded-lg text-sm font-medium font-mono transition-all hover:opacity-80"
              style={{
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Skip to workspace
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main OnboardingFlow ─── */
export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  // Centralized onboarding data
  const [data, setData] = useState<OnboardingData>({
    projectDescription: '',
    referenceUrl: '',
    category: '',
    chosenModel: '',
  });

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  // Map UI step index to the text-enum step names the API expects
  const STEP_NAMES = [
    'welcome',
    'what_to_build',
    'choose_model',
    'first_build',
  ] as const;

  // Persist step progress + data to server
  const persistStep = useCallback(
    async (stepIndex: number) => {
      try {
        const stepData: Record<string, unknown> = {};

        // Attach relevant data based on which step was just completed
        if (stepIndex >= 1) {
          stepData.projectDescription = data.projectDescription;
          stepData.referenceUrl = data.referenceUrl;
          stepData.category = data.category;
          stepData.what_to_build = data.projectDescription;
        }
        if (stepIndex >= 2) {
          stepData.chosenModel = data.chosenModel;
          stepData.chosen_model = data.chosenModel;
        }

        await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: STEP_NAMES[stepIndex],
            data: stepData,
          }),
        });
      } catch (err) {
        console.error('[Onboarding] Failed to persist step:', err);
      }
    },
    [data]
  );

  const nextStep = useCallback(async () => {
    if (step < 3) {
      await persistStep(step);
      setStep((s) => s + 1);
    }
  }, [step, persistStep]);

  const handleFinish = useCallback(
    async (projectId: string) => {
      // Mark onboarding complete
      try {
        await fetch('/api/user/onboarding', { method: 'PUT' });
      } catch {}

      // Set cookie so middleware/layouts skip onboarding
      try {
        document.cookie =
          'argus_onboarding_done=1; path=/; max-age=31536000; SameSite=Lax';
      } catch {}

      if (projectId) {
        router.push(`/workspace/${projectId}/build/new`);
      } else {
        router.push('/workspace');
      }
    },
    [router]
  );

  const steps = [
    <StepWelcome key="welcome" onNext={nextStep} />,
    <StepWhatToBuild
      key="what"
      data={data}
      onUpdate={updateData}
      onNext={nextStep}
    />,
    <StepModelSelect
      key="model"
      data={data}
      onUpdate={updateData}
      onNext={nextStep}
    />,
    <StepReady key="ready" data={data} onFinish={handleFinish} />,
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 font-mono"
      style={{ background: '#080808', zIndex: 50 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full max-w-xl"
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      <ProgressDots current={step} total={4} />
    </div>
  );
}
