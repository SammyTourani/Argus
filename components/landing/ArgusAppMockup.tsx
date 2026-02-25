"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Animated mockup of the Argus app interface.
 * Two-panel layout: Chat + File tree (left) | Code + Preview (right).
 * Polished to match Linear-quality product demos.
 */

const CHAT_MESSAGES = [
  { role: "user" as const, text: "Clone https://stripe.com" },
  { role: "ai" as const, text: "Scanning stripe.com... Found 1,247 DOM elements." },
  { role: "ai" as const, text: "Brand extracted: #635BFF primary, #0A2540 text, GT America + Inter fonts, 8px radius system." },
  { role: "ai" as const, text: "Layout: sticky nav, GDP counter, hero with gradient swoosh, dual CTA, logo marquee (8 brands)." },
  { role: "ai" as const, text: "Decomposing into 14 React components..." },
  { role: "ai" as const, text: "Generating React 19 + Tailwind CSS..." },
];

const CODE_LINES = [
  { text: 'import React from "react";', type: "import" },
  { text: 'import { motion } from "framer-motion";', type: "import" },
  { text: "", type: "blank" },
  { text: 'const STRIPE_PURPLE = "#635BFF";', type: "variable" },
  { text: 'const NAV_LINKS = ["Products", "Solutions",', type: "variable" },
  { text: '  "Developers", "Resources", "Pricing"];', type: "string" },
  { text: "", type: "blank" },
  { text: "export default function StripeLanding() {", type: "keyword" },
  { text: "  return (", type: "keyword" },
  { text: '    <div className="min-h-screen bg-white', type: "jsx" },
  { text: '      relative overflow-hidden">', type: "string" },
  { text: "      {/* Gradient swoosh */}", type: "comment" },
  { text: '      <div className="absolute -top-20', type: "jsx" },
  { text: "        -right-10 w-[65%] h-[70%]", type: "string" },
  { text: "        bg-gradient-to-bl from-amber-300", type: "string" },
  { text: "        via-rose-400 to-violet-500", type: "string" },
  { text: '        rounded-full blur-3xl opacity-40', type: "string" },
  { text: '        rotate-[-15deg]" />', type: "string" },
  { text: "", type: "blank" },
  { text: '      <nav className="relative z-10 flex', type: "jsx" },
  { text: "        items-center justify-between", type: "string" },
  { text: '        px-8 py-4 border-b border-gray-100">', type: "string" },
  { text: '        <span className="text-xl font-bold', type: "jsx" },
  { text: '          text-[#0A2540] italic">', type: "string" },
  { text: "          stripe", type: "text" },
  { text: "        </span>", type: "jsx" },
  { text: '        <div className="flex gap-6', type: "jsx" },
  { text: '          text-sm text-gray-500">', type: "string" },
  { text: "          {NAV_LINKS.map(link => (", type: "keyword" },
  { text: "            <a key={link}>{link}</a>", type: "jsx" },
  { text: "          ))}", type: "keyword" },
  { text: "        </div>", type: "jsx" },
  { text: '        <button className="bg-[#635BFF]', type: "jsx" },
  { text: '          text-white px-4 py-2', type: "string" },
  { text: '          rounded-full text-sm">', type: "string" },
  { text: "          Contact sales &rarr;", type: "text" },
  { text: "        </button>", type: "jsx" },
  { text: "      </nav>", type: "jsx" },
  { text: "", type: "blank" },
  { text: '      <p className="text-xs text-gray-400', type: "jsx" },
  { text: '        mt-8 ml-8 tracking-wider">', type: "string" },
  { text: "        Global GDP on Stripe: 1.60328%", type: "text" },
  { text: "      </p>", type: "jsx" },
  { text: "", type: "blank" },
  { text: '      <section className="relative z-10', type: "jsx" },
  { text: '        max-w-4xl mx-auto text-center pt-16">', type: "string" },
  { text: '        <h1 className="text-5xl font-bold', type: "jsx" },
  { text: '          text-[#0A2540] leading-tight">', type: "string" },
  { text: "          Financial infrastructure", type: "text" },
  { text: "          to grow your revenue.", type: "text" },
  { text: "        </h1>", type: "jsx" },
  { text: '        <p className="text-lg text-gray-500', type: "jsx" },
  { text: '          mt-6 max-w-2xl mx-auto">', type: "string" },
  { text: "          Accept payments, offer financial", type: "text" },
  { text: "          services and implement custom", type: "text" },
  { text: "          revenue models.", type: "text" },
  { text: "        </p>", type: "jsx" },
  { text: '        <div className="flex gap-3', type: "jsx" },
  { text: '          justify-center mt-8">', type: "string" },
  { text: '          <button className="bg-[#635BFF]', type: "jsx" },
  { text: "            text-white px-6 py-3", type: "string" },
  { text: '            rounded-full font-medium">', type: "string" },
  { text: "            Get started &rarr;", type: "text" },
  { text: "          </button>", type: "jsx" },
  { text: '          <button className="border', type: "jsx" },
  { text: "            border-gray-300 px-6 py-3", type: "string" },
  { text: '            rounded-full font-medium">', type: "string" },
  { text: "            Sign up with Google", type: "text" },
  { text: "          </button>", type: "jsx" },
  { text: "        </div>", type: "jsx" },
  { text: "      </section>", type: "jsx" },
  { text: "    </div>", type: "jsx" },
  { text: "  );", type: "keyword" },
  { text: "}", type: "keyword" },
];

/* Compact file tree — only show key files to avoid overlapping chat */
const FILE_TREE = [
  { name: "src/", indent: 0, isDir: true },
  { name: "components/", indent: 1, isDir: true },
  { name: "StripeLanding.tsx", indent: 2, isDir: false, active: true },
  { name: "Nav.tsx", indent: 2, isDir: false },
  { name: "Hero.tsx", indent: 2, isDir: false },
  { name: "App.tsx", indent: 1, isDir: false },
];

const COLOR_MAP: Record<string, string> = {
  import: "#C792EA",
  keyword: "#82AAFF",
  jsx: "#C8C8D0",
  string: "#C3E88D",
  text: "#D4D4D4",
  comment: "#546E7A",
  variable: "#FFCB6B",
  blank: "",
};

/* Compile step labels for the loader */
const COMPILE_STEPS = [
  "Resolving imports...",
  "Transforming JSX → JavaScript...",
  "Extracting Tailwind classes...",
  "Tree-shaking unused modules...",
  "Bundling 14 components...",
  "Optimizing assets...",
  "Rendering preview...",
];

export default function ArgusAppMockup() {
  const [phase, setPhase] = useState(0); // 0: idle, 1: typing msg, 2: AI responding, 3: code streaming, 4: preview
  const [chatIdx, setChatIdx] = useState(0);
  const [codeLineIdx, setCodeLineIdx] = useState(0);
  const [fileTreeVisible, setFileTreeVisible] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeContainerRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-start animation
  useEffect(() => {
    const startTimer = setTimeout(() => setPhase(1), 800);
    return () => clearTimeout(startTimer);
  }, []);

  // Auto-scroll code as it streams
  useEffect(() => {
    if (codeContainerRef.current && codeLineIdx > 0) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [codeLineIdx]);

  // Auto-scroll chat as messages appear
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatIdx]);

  // Auto-scroll preview during Phase 4 to show full Stripe page
  useEffect(() => {
    if (phase !== 4) return;
    const el = previewScrollRef.current;
    if (!el) return;
    let frame: number;
    const startDelay = 1800;
    const scrollDuration = 6000;
    const startTime = performance.now();
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const tick = (now: number) => {
      const elapsed = now - startTime - startDelay;
      if (elapsed < 0) { frame = requestAnimationFrame(tick); return; }
      const progress = Math.min(elapsed / scrollDuration, 1);
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = ease(progress) * maxScroll;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Compile step animation
  useEffect(() => {
    if (!isCompiling) {
      setCompileStep(0);
      return;
    }
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < COMPILE_STEPS.length) {
        setCompileStep(step);
      } else {
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isCompiling]);

  // Phase sequencing
  useEffect(() => {
    if (phase === 1) {
      timerRef.current = setTimeout(() => {
        setChatIdx(1);
        setPhase(2);
      }, 1200);
    } else if (phase === 2) {
      let idx = 1;
      intervalRef.current = setInterval(() => {
        idx++;
        if (idx < CHAT_MESSAGES.length) {
          setChatIdx(idx);
        }
        if (idx === 3) {
          setFileTreeVisible(true);
        }
        if (idx >= CHAT_MESSAGES.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setPhase(3), 400);
        }
      }, 900);
    } else if (phase === 3) {
      let line = 0;
      intervalRef.current = setInterval(() => {
        line++;
        setCodeLineIdx(line);
        setBuildProgress(Math.round((line / CODE_LINES.length) * 100));
        if (line >= CODE_LINES.length) {
          clearInterval(intervalRef.current!);
          setBuildProgress(100);
          setIsCompiling(true);
          timerRef.current = setTimeout(() => {
            setIsCompiling(false);
            setPhase(4);
          }, 1800);
        }
      }, 70);
    } else if (phase === 4) {
      // Extended preview time — auto-scrolls through the full Stripe page
      timerRef.current = setTimeout(() => {
        setPhase(0);
        setChatIdx(0);
        setCodeLineIdx(0);
        setFileTreeVisible(false);
        setBuildProgress(0);
        setIsCompiling(false);
        setCompileStep(0);
        setTimeout(() => setPhase(1), 1000);
      }, 10000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  return (
    <section className="w-full py-48 lg:py-80 relative">
      <div className="max-w-960 mx-auto px-16 lg:px-24">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-24"
        >
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">
            [ LIVE PREVIEW ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-8 font-mono"
        >
          See it build in real time
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-body-large text-[var(--landing-text-secondary)] font-body text-center mb-32 lg:mb-48 max-w-480 mx-auto"
        >
          Chat with Argus on the left. Watch React components stream into a live Vite sandbox on the right.
        </motion.p>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div
            className="rounded-16 overflow-hidden border border-[#2A2A30] relative"
            style={{
              boxShadow: "0 32px 100px -20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03) inset",
            }}
          >
            {/* macOS title bar */}
            <div className="flex items-center gap-8 px-16 py-12 bg-[#18181D] border-b border-[#2A2A30] relative">
              <div className="flex gap-7">
                <span className="w-11 h-11 rounded-full bg-[#FF5F57]" />
                <span className="w-11 h-11 rounded-full bg-[#FEBC2E]" />
                <span className="w-11 h-11 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[#0F0F14] rounded-8 px-16 py-5 flex items-center gap-8 max-w-320 w-full border border-[#2A2A30]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#555] flex-shrink-0">
                    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="0.75" />
                  </svg>
                  <span className="font-mono text-[11px] text-[#666] truncate">
                    buildargus.com/app
                  </span>
                </div>
              </div>
              {/* Status indicator */}
              <div className="flex items-center gap-6 min-w-48 justify-end">
                {phase >= 1 && phase < 4 && (
                  <span className="w-6 h-6 rounded-full bg-heat-100 animate-pulse" />
                )}
                {phase === 4 && (
                  <span className="w-6 h-6 rounded-full bg-[#28C840]" />
                )}
              </div>
            </div>

            {/* Two-panel layout — fixed height prevents layout shifts during animation */}
            <div className="flex h-[420px] lg:h-[500px]">
              {/* Left: Chat + File tree */}
              <div className="w-[38%] bg-[#0E0E13] border-r border-[#1F1F28] flex flex-col min-h-0">
                {/* Tab bar */}
                <div className="flex items-center border-b border-[#1F1F28] px-12 flex-shrink-0">
                  <div className="font-mono text-[10px] text-heat-100/80 border-b border-heat-100 py-8 px-8">
                    CHAT
                  </div>
                  <div className="font-mono text-[10px] text-[#555] py-8 px-8">
                    LOGS
                  </div>
                </div>

                {/* Chat area — flex-1 with min-h-0 for proper scroll containment */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 p-12 lg:p-16 space-y-10 overflow-y-auto overflow-x-hidden min-h-0"
                >
                  <AnimatePresence>
                    {CHAT_MESSAGES.slice(0, chatIdx + (phase >= 1 ? 1 : 0)).map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`${msg.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[90%]"}`}
                      >
                        {msg.role === "ai" && (
                          <div className="flex items-center gap-4 mb-3">
                            <span className="w-4 h-4 rounded-full bg-heat-100/40" />
                            <span className="font-mono text-[9px] text-[#666] uppercase tracking-wider">Argus</span>
                          </div>
                        )}
                        <div
                          className={`rounded-8 px-10 py-7 text-[11px] font-mono leading-relaxed ${
                            msg.role === "user"
                              ? "bg-[#1A1A24] text-[#E0E0E0] border border-[#2A2A38]"
                              : "bg-[#12121A] text-[#A0A0B0]"
                          }`}
                        >
                          {msg.text}
                          {i === chatIdx && phase <= 2 && (
                            <span className="animate-cursor-blink ml-1 text-heat-100">|</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* File tree — compact, max-height capped */}
                <AnimatePresence>
                  {fileTreeVisible && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-[#1F1F28] px-12 py-8 flex-shrink-0 overflow-hidden"
                      style={{ maxHeight: 100 }}
                    >
                      <div className="font-mono text-[9px] text-[#555] uppercase tracking-[0.15em] mb-4 flex items-center justify-between">
                        <span>EXPLORER</span>
                        <span className="text-[#444]">14 files</span>
                      </div>
                      {FILE_TREE.map((f, i) => (
                        <div
                          key={f.name}
                          className={`font-mono text-[10px] py-[2px] rounded-4 px-4 -mx-4 ${
                            f.active ? "bg-[#1A1A24] text-heat-100" : ""
                          }`}
                          style={{ paddingLeft: f.indent * 10 + 4 }}
                        >
                          <span className={f.isDir ? "text-[#FA5D19]/50" : f.active ? "text-heat-100" : "text-[#777]"}>
                            {f.isDir ? "▸ " : "  "}{f.name}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat input */}
                <div className="border-t border-[#1F1F28] px-12 py-8 flex-shrink-0">
                  <div className="flex items-center gap-8 bg-[#0A0A0F] rounded-6 px-10 py-6 border border-[#1F1F28]">
                    <span className="font-mono text-[10px] text-[#444]">Type a message...</span>
                  </div>
                </div>
              </div>

              {/* Right: Code / Preview */}
              <div className="w-[62%] bg-[#0A0A0F] relative overflow-hidden flex flex-col">
                {/* Right panel tab bar */}
                <div className="flex items-center border-b border-[#1F1F28] px-12 bg-[#0E0E13] flex-shrink-0">
                  <div className={`font-mono text-[10px] py-8 px-8 border-b transition-colors ${
                    phase >= 3 && phase < 4 && !isCompiling ? "text-heat-100/80 border-heat-100" : "text-[#555] border-transparent"
                  }`}>
                    CODE
                  </div>
                  <div className={`font-mono text-[10px] py-8 px-8 border-b transition-colors ${
                    phase === 4 ? "text-heat-100/80 border-heat-100" : isCompiling ? "text-[#888] border-[#444]" : "text-[#555] border-transparent"
                  }`}>
                    PREVIEW
                  </div>
                  {phase >= 3 && (
                    <div className="ml-auto font-mono text-[9px] text-[#555]">
                      StripeLanding.tsx
                    </div>
                  )}
                </div>

                {/* Code streaming — scrollable container */}
                {phase >= 3 && phase < 4 && !isCompiling && (
                  <div
                    ref={codeContainerRef}
                    className="flex-1 p-12 lg:p-16 overflow-y-auto overflow-x-hidden min-h-0"
                    style={{ scrollBehavior: "smooth" }}
                  >
                    <pre className="font-mono text-[11px] leading-[1.8]">
                      {CODE_LINES.slice(0, codeLineIdx).map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.1 }}
                          className="flex"
                        >
                          <span className="text-[#333] w-20 text-right mr-12 select-none flex-shrink-0 tabular-nums">
                            {i + 1}
                          </span>
                          <span style={{ color: COLOR_MAP[line.type] || "#C8C8D0" }}>
                            {line.text}
                          </span>
                        </motion.div>
                      ))}
                      {codeLineIdx < CODE_LINES.length && (
                        <span className="text-heat-100 animate-cursor-blink">▊</span>
                      )}
                    </pre>
                  </div>
                )}

                {/* Compiling transition — step-by-step loader */}
                {isCompiling && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] px-24"
                  >
                    {/* Vite logo shimmer */}
                    <div className="relative mb-16">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M29.5 6.1L17 29.2c-.4.7-1.4.7-1.7 0L2.5 6.1c-.4-.8.2-1.7 1.1-1.5L16 8l12.4-3.4c.9-.2 1.5.7 1.1 1.5z" fill="url(#vite-grad)" />
                        <defs>
                          <linearGradient id="vite-grad" x1="2" y1="4" x2="17" y2="29">
                            <stop stopColor="#41D1FF" />
                            <stop offset="1" stopColor="#BD34FE" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(189,52,254,0.3) 0%, transparent 70%)" }}
                        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>

                    <span className="font-mono text-[12px] text-[#ccc] mb-12">Vite ⚡ Compiling</span>

                    {/* Step-by-step compile progress */}
                    <div className="w-full max-w-240 space-y-4">
                      {COMPILE_STEPS.slice(0, compileStep + 1).map((step, i) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-6 font-mono text-[9px]"
                        >
                          {i < compileStep ? (
                            <span className="text-[#28C840] flex-shrink-0">✓</span>
                          ) : (
                            <motion.span
                              className="w-3 h-3 rounded-full bg-[#BD34FE] flex-shrink-0"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            />
                          )}
                          <span className={i < compileStep ? "text-[#666]" : "text-[#aaa]"}>
                            {step}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Preview phase — Full Stripe page with auto-scroll */}
                {phase === 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div ref={previewScrollRef} className="flex-1 overflow-hidden">
                      <div className="bg-white">
                        {/* ===== HERO SECTION with curved ribbons ===== */}
                        <div className="relative overflow-hidden pb-3 lg:pb-5">
                          {/* Slim curved ribbon bands — arc from upper-right to lower-left */}
                          <motion.svg
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            viewBox="0 0 600 300"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient id="r1" x1="350" y1="0" x2="50" y2="300" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#FFC94D" />
                                <stop offset="100%" stopColor="#FF8C42" />
                              </linearGradient>
                              <linearGradient id="r2" x1="420" y1="0" x2="120" y2="300" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#FF8A5C" />
                                <stop offset="100%" stopColor="#F04DA5" />
                              </linearGradient>
                              <linearGradient id="r3" x1="490" y1="0" x2="200" y2="300" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#E84FAD" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                              </linearGradient>
                              <linearGradient id="r4" x1="550" y1="0" x2="280" y2="300" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#A855F7" />
                                <stop offset="100%" stopColor="#6D8EF7" />
                              </linearGradient>
                            </defs>
                            <path d="M 330,0 Q 200,150 50,300 L 100,300 Q 250,150 380,0 Z" fill="url(#r1)" opacity="0.8" />
                            <path d="M 400,0 Q 270,150 120,300 L 170,300 Q 320,150 450,0 Z" fill="url(#r2)" opacity="0.75" />
                            <path d="M 470,0 Q 340,150 190,300 L 240,300 Q 390,150 520,0 Z" fill="url(#r3)" opacity="0.7" />
                            <path d="M 530,0 Q 400,150 260,300 L 310,300 Q 450,150 575,0 Z" fill="url(#r4)" opacity="0.65" />
                          </motion.svg>

                          {/* White nav bar — solid background so ribbons don't overlap text */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.0, duration: 0.3 }}
                            className="relative z-10 bg-white flex items-center justify-between px-6 lg:px-10 py-3 lg:py-5 border-b border-[#e3e8ee]/30"
                          >
                            <span className="text-[10px] lg:text-[12px] font-bold text-[#0A2540] tracking-[-0.02em]">stripe</span>
                            <div className="flex gap-4 lg:gap-7 items-center">
                              {["Products", "Solutions", "Developers", "Resources", "Pricing"].map((link) => (
                                <span key={link} className="text-[4.5px] lg:text-[6px] text-[#425466] hidden lg:flex items-center gap-[1px] whitespace-nowrap">
                                  {link}
                                  {link !== "Pricing" && (
                                    <svg width="4" height="4" viewBox="0 0 10 10" fill="none" className="opacity-40">
                                      <path d="M3 4L5 6L7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                  )}
                                </span>
                              ))}
                              <span className="text-[4.5px] lg:text-[6px] text-[#0A2540] border border-[#0A2540]/15 rounded-full px-3 lg:px-4 py-[1.5px] hidden lg:block">Sign in</span>
                              <span className="text-[4.5px] lg:text-[6px] text-white bg-[#635BFF] rounded-full px-3 lg:px-4 py-[1.5px] font-medium">Contact sales &rsaquo;</span>
                            </div>
                          </motion.div>

                          {/* GDP counter */}
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05, duration: 0.3 }} className="relative z-10 px-6 lg:px-10 pt-2 lg:pt-4">
                            <span className="text-[4px] lg:text-[5.5px] text-[#425466]/60 tracking-wide">
                              Global GDP running on Stripe: <span className="text-[#635BFF] font-medium">1.60328240%</span>
                            </span>
                          </motion.div>

                          {/* Hero content */}
                          <div className="relative z-10 px-6 lg:px-10 pt-3 lg:pt-6">
                            <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="text-[11px] lg:text-[15px] font-semibold text-[#0A2540] leading-[1.15] tracking-[-0.01em] mb-1 lg:mb-2" style={{ maxWidth: "50%" }}>
                              Financial infrastructure to grow your revenue.
                            </motion.h3>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }} className="text-[4.5px] lg:text-[6px] text-[#425466] leading-[1.5] mb-2 lg:mb-4" style={{ maxWidth: "46%" }}>
                              Accept payments, offer financial services and implement custom revenue models &ndash; from your first transaction to your billionth.
                            </motion.p>
                            <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }} className="flex gap-2 lg:gap-3 items-center">
                              <span className="bg-[#635BFF] text-white px-4 lg:px-6 py-[2px] lg:py-[4px] rounded-full text-[4.5px] lg:text-[6px] font-medium">Get started &rsaquo;</span>
                              <span className="border border-[#e3e8ee] text-[#0A2540] bg-white px-4 lg:px-6 py-[2px] lg:py-[4px] rounded-full text-[4.5px] lg:text-[6px] font-medium flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <svg width="5" height="5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                Sign up with Google
                              </span>
                            </motion.div>
                          </div>
                        </div>

                        {/* ===== LOGO MARQUEE ===== */}
                        <div className="bg-[#f6f9fc] border-y border-[#e3e8ee]/40 px-6 lg:px-10 py-2 lg:py-3 flex items-center justify-between">
                          {["Skip", "NVIDIA", "JOBBER", "Ford", "1Password", "Google", "Shopify"].map((b) => (
                            <span key={b} className="text-[4px] lg:text-[5px] font-bold text-[#0A2540]/20 uppercase tracking-wider">{b}</span>
                          ))}
                        </div>

                        {/* ===== PAYMENTS + BILLING SECTION ===== */}
                        <div className="px-6 lg:px-10 py-4 lg:py-6">
                          <div className="flex gap-3 lg:gap-4">
                            {/* Payments card */}
                            <div className="flex-1 rounded-[4px] lg:rounded-[8px] bg-gradient-to-br from-[#f6f9fc] to-[#eef2f7] p-3 lg:p-4 border border-[#e3e8ee]/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[4.5px] lg:text-[6.5px] font-semibold text-[#0A2540] leading-[1.3]">Accept and optimise payments globally</span>
                                <svg width="6" height="6" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 ml-1"><path d="M2 2L8 2L8 8" stroke="#635BFF" strokeWidth="1.2" strokeLinecap="round" /></svg>
                              </div>
                              <div className="flex gap-2">
                                {/* Mini phone */}
                                <div className="w-[30%] bg-white rounded-[3px] border border-[#e3e8ee]/60 p-1.5 shadow-sm">
                                  <div className="w-full aspect-[3/4] bg-gradient-to-b from-[#FF9A5C]/20 to-[#FF6B4A]/10 rounded-[2px] mb-1 flex items-center justify-center">
                                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 8h8" stroke="#FF6B4A" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                  </div>
                                  <span className="text-[4px] lg:text-[5px] font-bold text-[#0A2540] block text-center">&euro;26.89</span>
                                  <span className="text-[3px] lg:text-[3.5px] text-[#425466]/50 block text-center">Tap to pay</span>
                                </div>
                                {/* Mini checkout */}
                                <div className="flex-1 bg-white rounded-[3px] border border-[#e3e8ee]/60 p-2 shadow-sm">
                                  <span className="text-[3.5px] lg:text-[4.5px] font-medium text-[#0A2540] block mb-1">Checkout</span>
                                  <div className="space-y-[3px]">
                                    <div className="h-[6px] bg-[#f6f9fc] rounded-[1.5px] border border-[#e3e8ee]/50" />
                                    <div className="flex gap-1">
                                      <div className="flex-1 h-[6px] bg-[#f6f9fc] rounded-[1.5px] border border-[#e3e8ee]/50" />
                                      <div className="flex-1 h-[6px] bg-[#f6f9fc] rounded-[1.5px] border border-[#e3e8ee]/50" />
                                    </div>
                                  </div>
                                  <div className="flex gap-1 mt-1.5">
                                    <div className="flex-1 bg-[#635BFF] rounded-[2px] py-[2px] text-center"><span className="text-[3px] lg:text-[4px] text-white font-medium">▶ link</span></div>
                                    <div className="flex-1 bg-black rounded-[2px] py-[2px] text-center"><span className="text-[3px] lg:text-[4px] text-white font-medium">Pay</span></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Billing card */}
                            <div className="flex-1 rounded-[4px] lg:rounded-[8px] bg-gradient-to-br from-[#f6f9fc] to-[#eef2f7] p-3 lg:p-4 border border-[#e3e8ee]/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[4.5px] lg:text-[6.5px] font-semibold text-[#0A2540] leading-[1.3]">Enable any billing model</span>
                                <svg width="6" height="6" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 ml-1"><path d="M2 2L8 2L8 8" stroke="#635BFF" strokeWidth="1.2" strokeLinecap="round" /></svg>
                              </div>
                              {/* Pro Plan card */}
                              <div className="bg-white rounded-[3px] border border-[#e3e8ee]/60 p-2 shadow-sm mb-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="w-3 h-3 rounded-full bg-[#635BFF]/15 flex items-center justify-center"><span className="text-[3px] text-[#635BFF] font-bold">Q</span></div>
                                  <div>
                                    <span className="text-[3.5px] lg:text-[4.5px] font-semibold text-[#0A2540] block leading-none">Pro Plan</span>
                                    <span className="text-[3px] lg:text-[3.5px] text-[#425466]/50">Billed monthly</span>
                                  </div>
                                </div>
                                <span className="text-[3px] lg:text-[4px] text-[#0A2540] font-medium block mb-0.5">Usage meter</span>
                                <div className="h-[3px] bg-[#e3e8ee]/60 rounded-full overflow-hidden">
                                  <div className="h-full w-[65%] bg-gradient-to-r from-[#FF6B4A] to-[#FFC94D] rounded-full" />
                                </div>
                              </div>
                              {/* Bar chart */}
                              <div className="bg-white rounded-[3px] border border-[#e3e8ee]/60 p-2 shadow-sm">
                                <span className="text-[3px] lg:text-[4px] text-[#0A2540] font-medium block mb-1">Tokens (30d)</span>
                                <div className="flex items-end gap-[1px] h-[18px]">
                                  {[40,55,35,65,50,70,45,80,60,90,55,75,85,60,95,70,50,88,72,65].map((h, i) => (
                                    <div key={i} className="flex-1 bg-[#635BFF]/50 rounded-t-[0.5px]" style={{ height: `${h}%` }} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ===== 3 FEATURE CARDS — Agentic, Card Issuing, Borderless ===== */}
                        <div className="px-6 lg:px-10 pb-4 lg:pb-6">
                          <div className="grid grid-cols-3 gap-2 lg:gap-3">
                            {/* Agentic commerce */}
                            <div className="rounded-[4px] lg:rounded-[8px] bg-gradient-to-br from-[#f6f9fc] to-[#eef2f7] p-2.5 lg:p-3.5 border border-[#e3e8ee]/50">
                              <span className="text-[4px] lg:text-[5.5px] font-semibold text-[#0A2540] block mb-1.5 leading-[1.3]">Monetise through agentic commerce</span>
                              <div className="bg-white rounded-[2px] border border-[#e3e8ee]/60 p-1.5">
                                <div className="bg-[#f6f9fc] rounded-[2px] px-1.5 py-0.5 mb-1 inline-block"><span className="text-[3px] lg:text-[3.5px] text-[#0A2540]">Looking for basics in M</span></div>
                                <div className="bg-[#f0f0ff] rounded-[2px] px-1.5 py-0.5 inline-block"><span className="text-[3px] lg:text-[3.5px] text-[#0A2540]">Here are comfy picks...</span></div>
                                <div className="flex gap-1 mt-1">
                                  <div className="flex-1 bg-[#f6f9fc] rounded-[1px] aspect-square" />
                                  <div className="flex-1 bg-[#f6f9fc] rounded-[1px] aspect-square" />
                                </div>
                              </div>
                            </div>
                            {/* Card issuing — gradient VISA card */}
                            <div className="rounded-[4px] lg:rounded-[8px] bg-gradient-to-br from-[#f6f9fc] to-[#eef2f7] p-2.5 lg:p-3.5 border border-[#e3e8ee]/50">
                              <span className="text-[4px] lg:text-[5.5px] font-semibold text-[#0A2540] block mb-1.5 leading-[1.3]">Create a card issuing programme</span>
                              <div className="w-full aspect-[1.6/1] rounded-[3px] bg-gradient-to-br from-[#F9A8D4] via-[#C084FC] to-[#93C5FD] shadow-sm flex flex-col justify-between p-1.5">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-2 bg-[#FFD700]/70 rounded-[1px]" />
                                  <svg width="5" height="5" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" stroke="white" strokeWidth="0.8" opacity="0.7" /><path d="M4 3.5C4 3.5 6.5 5 4 6.5" stroke="white" strokeWidth="0.6" opacity="0.7" /></svg>
                                </div>
                                <span className="text-[4px] lg:text-[5px] font-bold text-white/90 self-end">VISA</span>
                              </div>
                            </div>
                            {/* Borderless money */}
                            <div className="rounded-[4px] lg:rounded-[8px] bg-gradient-to-br from-[#f6f9fc] to-[#eef2f7] p-2.5 lg:p-3.5 border border-[#e3e8ee]/50">
                              <span className="text-[4px] lg:text-[5.5px] font-semibold text-[#0A2540] block mb-1.5 leading-[1.3]">Access borderless money movement</span>
                              <div className="bg-white rounded-[2px] border border-[#e3e8ee]/60 p-1.5">
                                <svg viewBox="0 0 80 40" className="w-full h-[20px]" fill="none">
                                  {[{x:5,y:30},{x:12,y:25},{x:20,y:28},{x:28,y:15},{x:35,y:20},{x:42,y:10},{x:50,y:18},{x:58,y:8},{x:65,y:22},{x:72,y:12},{x:78,y:5}].map((p,i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={i % 3 === 0 ? "#635BFF" : i % 3 === 1 ? "#FF6B4A" : "#e3e8ee"} opacity="0.7" />
                                  ))}
                                  <path d="M5,30 Q40,5 78,5" stroke="#635BFF" strokeWidth="0.8" strokeDasharray="2 1" fill="none" />
                                </svg>
                                <span className="text-[3px] lg:text-[4px] text-[#0A2540] font-medium">$257 USDB</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ===== CONNECT SECTION — Accounts Table ===== */}
                        <div className="px-6 lg:px-10 pb-4 lg:pb-6">
                          <div className="rounded-[4px] lg:rounded-[8px] bg-gradient-to-br from-[#f6f9fc] to-[#eef2f7] p-3 lg:p-4 border border-[#e3e8ee]/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[4.5px] lg:text-[6.5px] font-semibold text-[#0A2540]">Embed payments in your platform</span>
                              <svg width="6" height="6" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 2L8 8" stroke="#635BFF" strokeWidth="1.2" strokeLinecap="round" /></svg>
                            </div>
                            <div className="bg-white rounded-[3px] border border-[#e3e8ee]/60 overflow-hidden shadow-sm">
                              <div className="px-2 py-1 border-b border-[#e3e8ee]/40 bg-[#f6f9fc]/50">
                                <span className="text-[3.5px] lg:text-[4.5px] font-semibold text-[#0A2540]">Connected Accounts</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1 px-2 py-0.5 border-b border-[#e3e8ee]/30">
                                {["Account", "Country", "Balance", "Volume"].map((h) => (
                                  <span key={h} className="text-[3px] lg:text-[3.5px] text-[#425466]/50 font-medium">{h}</span>
                                ))}
                              </div>
                              {[
                                { name: "Vital Flow", country: "Canada", bal: "CA$11,270", vol: "CA$96,610" },
                                { name: "Daybreak Yoga", country: "US", bal: "CA$2,028", vol: "CA$10,640" },
                                { name: "Sacred Space", country: "UK", bal: "CA$1,683", vol: "CA$33,168" },
                                { name: "Harmony Flow", country: "US", bal: "CA$41,760", vol: "CA$397,804" },
                              ].map((row) => (
                                <div key={row.name} className="grid grid-cols-4 gap-1 px-2 py-[2px] border-b border-[#e3e8ee]/15 last:border-0">
                                  <div className="flex items-center gap-1">
                                    <div className="w-[5px] h-[5px] rounded-full bg-gradient-to-br from-[#635BFF]/40 to-[#8B5CF6]/40" />
                                    <span className="text-[3px] lg:text-[4px] text-[#0A2540] font-medium truncate">{row.name}</span>
                                  </div>
                                  <span className="text-[3px] lg:text-[4px] text-[#425466]">{row.country}</span>
                                  <span className="text-[3px] lg:text-[4px] text-[#0A2540]">{row.bal}</span>
                                  <span className="text-[3px] lg:text-[4px] text-[#0A2540]">{row.vol}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* ===== STATS SECTION — "The backbone of global commerce" ===== */}
                        <div className="bg-gradient-to-b from-[#f6f9fc] to-[#f0eef7] px-6 lg:px-10 py-5 lg:py-8 text-center">
                          <h4 className="text-[7px] lg:text-[10px] font-semibold text-[#0A2540] mb-3 lg:mb-4 leading-[1.2]">
                            The backbone<br />of global commerce
                          </h4>
                          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#635BFF]/20 to-transparent mb-3 lg:mb-4" />
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { num: "135+", label: "currencies supported" },
                              { num: "US$1.4tn", label: "payments volume" },
                              { num: "99.999%", label: "historical uptime" },
                              { num: "200M+", label: "active subscriptions" },
                            ].map((s) => (
                              <div key={s.num}>
                                <span className="text-[6px] lg:text-[9px] font-bold text-[#0A2540]/25 block">{s.num}</span>
                                <span className="text-[3px] lg:text-[4px] text-[#425466]/60 leading-[1.3]">{s.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Idle / waiting state */}
                {phase < 3 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-mono text-[32px] text-[#1A1A24] mb-8">{"{ }"}</div>
                      <span className="font-mono text-[11px] text-[#444]">
                        {phase >= 2 ? "Analyzing..." : "Waiting for input..."}
                      </span>
                      {phase >= 2 && (
                        <div className="mt-12 flex justify-center">
                          <span className="inline-block w-12 h-12 border-2 border-[#2A2A38] border-t-heat-100 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Build progress bar */}
                {phase >= 3 && (
                  <div className="bg-[#0E0E13] px-12 py-6 border-t border-[#1F1F28] flex items-center gap-8 flex-shrink-0">
                    <span
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: phase === 4 ? "#28C840" : isCompiling ? "#FEBC2E" : "#FA5D19",
                      }}
                    />
                    <div className="flex-1 h-2 bg-[#1A1A24] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: phase === 4 ? "#28C840" : isCompiling ? "#FEBC2E" : "#FA5D19",
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${buildProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-[#666] tabular-nums min-w-48 text-right">
                      {phase === 4 ? "Done" : isCompiling ? "Compiling..." : `${buildProgress}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
