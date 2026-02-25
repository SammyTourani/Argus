'use client';

import { useState, useEffect, useCallback } from 'react';
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

/* ─── Typewriter Hook ─── */
function useTypewriter(text: string, speed: number = 80, active: boolean = true) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);
  return displayed;
}

/* ─── Progress Dots ─── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mt-12">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-colors duration-300"
          style={{ background: i === current ? '#FA4500' : 'rgba(255,255,255,0.15)' }}
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
      <p className="text-sm max-w-sm mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Argus is an AI-powered app builder. Paste a URL, describe what you want,
        and watch your app come to life in seconds.
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: '#FA4500' }}
      >
        Let&apos;s go →
      </button>
    </div>
  );
}

/* ─── Step 2: URL Cloning ─── */
function StepUrlCloning({ onNext }: { onNext: () => void }) {
  const url = useTypewriter('https://stripe.com/payments', 70, true);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Browser mockup */}
      <div className="w-full max-w-md mb-10">
        <div
          className="rounded-t-xl px-4 py-3 flex items-center gap-2"
          style={{ background: '#1A1A1A' }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
          </div>
          <div
            className="flex-1 ml-4 px-3 py-1.5 rounded-md text-xs"
            style={{
              background: '#0D0D0D',
              color: '#FA4500',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {url}
            <span className="animate-pulse">|</span>
          </div>
        </div>
        <div
          className="rounded-b-xl h-32 flex items-center justify-center"
          style={{ background: '#111' }}
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-16 h-4 rounded"
                style={{
                  background: 'rgba(250,69,0,0.15)',
                  animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-4" style={{ color: 'white' }}>
        Clone any website
      </h1>
      <p className="text-sm max-w-sm mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Paste any URL and Argus will analyze, deconstruct, and rebuild it with clean,
        editable code — powered by AI.
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: '#FA4500' }}
      >
        Got it →
      </button>
    </div>
  );
}

/* ─── Step 3: Model Selection ─── */
const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10A37F' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', provider: 'Anthropic', color: '#D97757' },
  { id: 'gemini-flash', name: 'Gemini Flash', provider: 'Google', color: '#4285F4' },
];

function StepModelSelect({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selected) {
      try { localStorage.setItem('argus_default_model', selected); } catch {}
      onNext();
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-4" style={{ color: 'white' }}>
        Pick your default model
      </h1>
      <p className="text-sm max-w-sm mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
        You can always switch later. Choose the AI model that powers your builds.
      </p>

      <div className="flex gap-4 mb-10">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => setSelected(model.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-xl transition-all"
            style={{
              background: selected === model.id ? 'rgba(250,69,0,0.1)' : 'rgba(255,255,255,0.05)',
              border: selected === model.id
                ? '2px solid #FA4500'
                : '2px solid rgba(255,255,255,0.08)',
              minWidth: 140,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: model.color }}
            >
              {model.name[0]}
            </div>
            <span className="text-sm font-medium" style={{ color: 'white' }}>
              {model.name}
            </span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {model.provider}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selected}
        className="px-8 py-3 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
        style={{ background: '#FA4500' }}
      >
        Set default →
      </button>
    </div>
  );
}

/* ─── Step 4: Ready ─── */
function StepReady({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated checkmark */}
      <div className="mb-8">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#FA4500" strokeWidth="3" opacity="0.2" />
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
            transition={{ duration: 0.4, delay: 0.5, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-4" style={{ color: 'white' }}>
        Your workspace is ready.
      </h1>
      <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Join thousands of builders using Argus.
      </p>
      <p className="text-2xl font-bold mb-10" style={{ color: '#FA4500' }}>
        3,000+ apps cloned
      </p>

      <button
        onClick={onNext}
        className="px-8 py-3 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: '#FA4500' }}
      >
        Build my first app →
      </button>
    </div>
  );
}

/* ─── Main OnboardingFlow ─── */
export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const nextStep = useCallback(async () => {
    if (step < 3) {
      // Persist step progress to server
      try {
        await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: step + 1, data: {} }),
        });
      } catch {}
      setStep((s) => s + 1);
    } else {
      // Mark onboarding complete
      try {
        await fetch('/api/user/onboarding', { method: 'PUT' });
      } catch {}
      // Set argus_onboarding_done cookie so middleware/layouts skip onboarding
      try {
        document.cookie = 'argus_onboarding_done=1; path=/; max-age=31536000; SameSite=Lax';
      } catch {}
      router.push('/workspace');
    }
  }, [step, router]);

  const steps = [
    <StepWelcome key="welcome" onNext={nextStep} />,
    <StepUrlCloning key="url" onNext={nextStep} />,
    <StepModelSelect key="model" onNext={nextStep} />,
    <StepReady key="ready" onNext={nextStep} />,
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
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
