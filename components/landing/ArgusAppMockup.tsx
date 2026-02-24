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
  { role: "ai" as const, text: "Scanning stripe.com..." },
  { role: "ai" as const, text: "Found 847 elements across 12 components. Extracting brand palette, typography scale, and layout grid..." },
  { role: "ai" as const, text: "Generating React + Tailwind CSS..." },
];

const CODE_LINES = [
  { text: 'import React from "react";', type: "import" },
  { text: "", type: "blank" },
  { text: "export default function Hero() {", type: "keyword" },
  { text: "  return (", type: "keyword" },
  { text: '    <section className="min-h-screen', type: "jsx" },
  { text: "      bg-gradient-to-br from-indigo-950", type: "string" },
  { text: '      to-slate-900">', type: "string" },
  { text: '      <nav className="flex items-center', type: "jsx" },
  { text: '        justify-between px-8 py-4">', type: "string" },
  { text: '        <span className="text-2xl', type: "jsx" },
  { text: '          font-bold text-white">', type: "string" },
  { text: "          Stripe", type: "text" },
  { text: "        </span>", type: "jsx" },
  { text: '        <div className="flex gap-6">', type: "jsx" },
  { text: "          {/* Navigation */}", type: "comment" },
  { text: "        </div>", type: "jsx" },
  { text: "      </nav>", type: "jsx" },
  { text: '      <div className="max-w-4xl mx-auto', type: "jsx" },
  { text: '        text-center pt-32 px-4">', type: "string" },
  { text: '        <h1 className="text-6xl font-bold', type: "jsx" },
  { text: '          text-white mb-6">', type: "string" },
  { text: "          Financial infrastructure", type: "text" },
  { text: "        </h1>", type: "jsx" },
  { text: "      </div>", type: "jsx" },
  { text: "    </section>", type: "jsx" },
  { text: "  );", type: "keyword" },
  { text: "}", type: "keyword" },
];

const FILE_TREE = [
  { name: "src/", indent: 0, isDir: true },
  { name: "components/", indent: 1, isDir: true },
  { name: "Hero.tsx", indent: 2, isDir: false, active: true },
  { name: "Nav.tsx", indent: 2, isDir: false },
  { name: "Features.tsx", indent: 2, isDir: false },
  { name: "Pricing.tsx", indent: 2, isDir: false },
  { name: "Footer.tsx", indent: 2, isDir: false },
  { name: "App.tsx", indent: 1, isDir: false },
  { name: "index.css", indent: 1, isDir: false },
];

const COLOR_MAP: Record<string, string> = {
  import: "#C792EA",
  keyword: "#82AAFF",
  jsx: "#C8C8D0",
  string: "#C3E88D",
  text: "#D4D4D4",
  comment: "#546E7A",
  blank: "",
};

export default function ArgusAppMockup() {
  const [phase, setPhase] = useState(0); // 0: idle, 1: typing msg, 2: AI responding, 3: code streaming, 4: preview
  const [chatIdx, setChatIdx] = useState(0);
  const [codeLineIdx, setCodeLineIdx] = useState(0);
  const [fileTreeVisible, setFileTreeVisible] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start animation
  useEffect(() => {
    const startTimer = setTimeout(() => setPhase(1), 800);
    return () => clearTimeout(startTimer);
  }, []);

  // Phase sequencing
  useEffect(() => {
    if (phase === 1) {
      timerRef.current = setTimeout(() => {
        setChatIdx(1);
        setPhase(2);
      }, 1500);
    } else if (phase === 2) {
      let idx = 1;
      intervalRef.current = setInterval(() => {
        idx++;
        if (idx < CHAT_MESSAGES.length) {
          setChatIdx(idx);
        }
        if (idx === 2) {
          setFileTreeVisible(true);
        }
        if (idx >= CHAT_MESSAGES.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setPhase(3), 600);
        }
      }, 1200);
    } else if (phase === 3) {
      let line = 0;
      intervalRef.current = setInterval(() => {
        line++;
        setCodeLineIdx(line);
        setBuildProgress(Math.round((line / CODE_LINES.length) * 100));
        if (line >= CODE_LINES.length) {
          clearInterval(intervalRef.current!);
          setBuildProgress(100);
          setTimeout(() => setPhase(4), 800);
        }
      }, 100);
    } else if (phase === 4) {
      timerRef.current = setTimeout(() => {
        setPhase(0);
        setChatIdx(0);
        setCodeLineIdx(0);
        setFileTreeVisible(false);
        setBuildProgress(0);
        setTimeout(() => setPhase(1), 1000);
      }, 5000);
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

            {/* Two-panel layout */}
            <div className="flex min-h-[420px] lg:min-h-[500px]">
              {/* Left: Chat + File tree */}
              <div className="w-[38%] bg-[#0E0E13] border-r border-[#1F1F28] flex flex-col">
                {/* Tab bar */}
                <div className="flex items-center border-b border-[#1F1F28] px-12">
                  <div className="font-mono text-[10px] text-heat-100/80 border-b border-heat-100 py-8 px-8">
                    CHAT
                  </div>
                  <div className="font-mono text-[10px] text-[#555] py-8 px-8">
                    LOGS
                  </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 p-12 lg:p-16 space-y-10 overflow-hidden">
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

                {/* File tree */}
                <AnimatePresence>
                  {fileTreeVisible && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.4 }}
                      className="border-t border-[#1F1F28] p-12"
                    >
                      <div className="font-mono text-[9px] text-[#555] uppercase tracking-[0.15em] mb-8 flex items-center justify-between">
                        <span>EXPLORER</span>
                        <span className="text-[#444]">{FILE_TREE.filter(f => !f.isDir).length} files</span>
                      </div>
                      {FILE_TREE.map((f, i) => (
                        <motion.div
                          key={f.name}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`font-mono text-[11px] py-[3px] rounded-4 px-4 -mx-4 ${
                            f.active ? "bg-[#1A1A24] text-heat-100" : ""
                          }`}
                          style={{ paddingLeft: f.indent * 12 + 4 }}
                        >
                          <span className={f.isDir ? "text-[#FA5D19]/50" : f.active ? "text-heat-100" : "text-[#777]"}>
                            {f.isDir ? "▸ " : "  "}{f.name}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat input */}
                <div className="border-t border-[#1F1F28] px-12 py-8">
                  <div className="flex items-center gap-8 bg-[#0A0A0F] rounded-6 px-10 py-6 border border-[#1F1F28]">
                    <span className="font-mono text-[10px] text-[#444]">Type a message...</span>
                  </div>
                </div>
              </div>

              {/* Right: Code / Preview */}
              <div className="w-[62%] bg-[#0A0A0F] relative overflow-hidden flex flex-col">
                {/* Right panel tab bar */}
                <div className="flex items-center border-b border-[#1F1F28] px-12 bg-[#0E0E13]">
                  <div className={`font-mono text-[10px] py-8 px-8 border-b ${
                    phase < 4 ? "text-heat-100/80 border-heat-100" : "text-[#555] border-transparent"
                  }`}>
                    CODE
                  </div>
                  <div className={`font-mono text-[10px] py-8 px-8 border-b ${
                    phase === 4 ? "text-heat-100/80 border-heat-100" : "text-[#555] border-transparent"
                  }`}>
                    PREVIEW
                  </div>
                  {phase >= 3 && (
                    <div className="ml-auto font-mono text-[9px] text-[#555]">
                      Hero.tsx
                    </div>
                  )}
                </div>

                {/* Code streaming */}
                {phase >= 3 && phase < 4 && (
                  <div className="flex-1 p-12 lg:p-16 overflow-hidden">
                    <pre className="font-mono text-[11px] leading-[1.8] overflow-hidden">
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

                {/* Preview phase */}
                {phase === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex-1 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-16 lg:p-24 flex flex-col relative overflow-hidden">
                      {/* Subtle grid overlay */}
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                          backgroundSize: "40px 40px",
                        }}
                      />
                      <div className="relative z-10 flex items-center justify-between mb-24">
                        <span className="text-white font-mono text-[14px] font-bold tracking-wider">stripe</span>
                        <div className="flex gap-16">
                          <span className="text-white/50 text-[11px] font-mono hover:text-white/80 transition-colors cursor-default">Products</span>
                          <span className="text-white/50 text-[11px] font-mono hover:text-white/80 transition-colors cursor-default">Solutions</span>
                          <span className="text-white/50 text-[11px] font-mono hover:text-white/80 transition-colors cursor-default">Pricing</span>
                          <span className="text-white/50 text-[11px] font-mono hidden lg:block hover:text-white/80 transition-colors cursor-default">Docs</span>
                        </div>
                      </div>
                      <div className="relative z-10 flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <motion.h3
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-white text-[18px] lg:text-[24px] font-bold mb-6 leading-tight"
                          >
                            Financial infrastructure
                            <br />
                            for the internet
                          </motion.h3>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/40 text-[11px] font-mono max-w-[280px] mx-auto mb-16"
                          >
                            Millions of companies use Stripe to accept payments, send payouts, and grow their revenue.
                          </motion.p>
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex gap-8 justify-center"
                          >
                            <span className="bg-[#635BFF] text-white px-12 py-6 rounded-6 text-[11px] font-mono font-medium">
                              Start now →
                            </span>
                            <span className="border border-white/20 text-white/70 px-12 py-6 rounded-6 text-[11px] font-mono">
                              Contact sales
                            </span>
                          </motion.div>
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
                  <div className="bg-[#0E0E13] px-12 py-6 border-t border-[#1F1F28] flex items-center gap-8">
                    <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: phase === 4 ? "#28C840" : "#FA5D19" }} />
                    <div className="flex-1 h-2 bg-[#1A1A24] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: phase === 4 ? "#28C840" : "#FA5D19" }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${buildProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-[#666] tabular-nums min-w-32 text-right">
                      {phase === 4 ? "Done" : `${buildProgress}%`}
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
