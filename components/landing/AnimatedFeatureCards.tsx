"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

// ─── Card 1: Instant Scraping ─────────────────────────────────────────
function ScrapingAnimation() {
  const [nodes, setNodes] = useState<{ id: number; label: string; x: number; y: number; opacity: number }[]>([]);
  const frameRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const ELEMENT_LABELS = ["<nav>", "<h1>", "<div>", "<img>", "<btn>", "<p>", "<svg>", "<a>", "<li>", "<span>", "<section>", "<form>"];

  useEffect(() => {
    let frame = 0;
    const maxNodes = 12;

    intervalRef.current = setInterval(() => {
      frame++;
      if (frame <= maxNodes) {
        setNodes((prev) => [
          ...prev,
          {
            id: frame,
            label: ELEMENT_LABELS[(frame - 1) % ELEMENT_LABELS.length],
            x: 20 + ((frame - 1) % 3) * 80,
            y: 20 + Math.floor((frame - 1) / 3) * 50,
            opacity: 1,
          },
        ]);
      } else if (frame > maxNodes + 8) {
        // Reset loop
        frame = 0;
        setNodes([]);
      }
    }, 350);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0E0E13] rounded-8 overflow-hidden p-16">
      {/* URL bar */}
      <div className="flex items-center gap-8 mb-16 bg-[#16161D] rounded-6 px-12 py-6">
        <span className="font-mono text-[10px] text-[#555]">URL</span>
        <span className="font-mono text-[11px] text-heat-100/80">https://stripe.com</span>
      </div>

      {/* Extracted nodes */}
      <div className="grid grid-cols-3 gap-6">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-[#1A1A24] border border-[#2A2A38] rounded-4 px-8 py-4 text-center"
          >
            <span className="font-mono text-[10px] text-heat-100/70">{node.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute bottom-12 right-12 font-mono text-[10px] text-[#555]">
        {nodes.length} / 847 elements
      </div>
    </div>
  );
}

// ─── Card 2: Live Generation ──────────────────────────────────────────
function GenerationAnimation() {
  const [lines, setLines] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const CODE = [
    "const Hero = () => {",
    "  return (",
    "    <section className={cn(",
    "      'min-h-screen',",
    "      'bg-gradient-to-br',",
    "      'from-slate-950',",
    "      'to-indigo-900'",
    "    )}>",
    "      <h1>Financial</h1>",
    "      <h1>infrastructure</h1>",
    "      <p>for the internet</p>",
    "    </section>",
    "  );",
    "};",
  ];

  useEffect(() => {
    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (idx < CODE.length) {
        setLines((prev) => [...prev, CODE[idx]]);
        idx++;
      } else {
        // Reset
        setTimeout(() => {
          idx = 0;
          setLines([]);
        }, 2000);
      }
    }, 300);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0E0E13] rounded-8 overflow-hidden p-16">
      <div className="font-mono text-[10px] text-[#555] uppercase tracking-wider mb-12">
        Hero.tsx
      </div>
      <pre className="font-mono text-[10px] leading-[1.8] overflow-hidden max-h-[180px]">
        {lines.map((line, i) => (
          <motion.div
            key={`${i}-${line}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[#A0A0B0]"
          >
            <span className="text-[#444] mr-8 inline-block w-12 text-right">{i + 1}</span>
            {line}
          </motion.div>
        ))}
        <span className="text-heat-100 animate-cursor-blink">|</span>
      </pre>

      {/* Status */}
      <div className="absolute bottom-12 left-16 right-16 flex items-center gap-8">
        <span className="w-5 h-5 rounded-full bg-[#28C840] animate-pulse-green" />
        <span className="font-mono text-[10px] text-[#555]">Streaming...</span>
      </div>
    </div>
  );
}

// ─── Card 3: Style Transform ──────────────────────────────────────────
function StyleTransformAnimation() {
  const STYLES = [
    { name: "BRUTALISM", bg: "bg-yellow-400", text: "text-black", border: "border-4 border-black", font: "font-mono font-black uppercase" },
    { name: "GLASSMORPHISM", bg: "bg-white/10 backdrop-blur-sm", text: "text-white", border: "border border-white/20", font: "font-body" },
    { name: "MINIMALIST", bg: "bg-white", text: "text-black", border: "border border-black/10", font: "font-body font-light" },
    { name: "RETRO WAVE", bg: "bg-gradient-to-br from-purple-900 to-pink-600", text: "text-pink-200", border: "border border-pink-400/30", font: "font-mono italic" },
  ];

  const [styleIdx, setStyleIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStyleIdx((prev) => (prev + 1) % STYLES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const style = STYLES[styleIdx];

  return (
    <div className="relative w-full h-full bg-[#0E0E13] rounded-8 overflow-hidden p-16">
      <div className="font-mono text-[10px] text-[#555] uppercase tracking-wider mb-12 flex justify-between">
        <span>STYLE TRANSFORM</span>
        <span className="text-heat-100/70">{style.name}</span>
      </div>

      {/* Mini component preview */}
      <motion.div
        key={styleIdx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`rounded-8 p-16 ${style.bg} ${style.border} transition-all`}
      >
        <div className={`${style.text} ${style.font} text-[13px] mb-4`}>
          Financial infrastructure
        </div>
        <div className={`${style.text} opacity-60 text-[10px] ${style.font}`}>
          for the internet
        </div>
        <div className="flex gap-6 mt-12">
          <div className={`px-8 py-3 rounded-4 text-[9px] ${style.font} ${style.text} ${style.border} opacity-70`}>
            Products
          </div>
          <div className={`px-8 py-3 rounded-4 text-[9px] ${style.font} ${style.text} ${style.border} opacity-70`}>
            Pricing
          </div>
        </div>
      </motion.div>

      {/* Style cycle dots */}
      <div className="absolute bottom-12 left-16 flex gap-4">
        {STYLES.map((_, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-full transition-colors ${
              i === styleIdx ? "bg-heat-100" : "bg-[#2A2A38]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function AnimatedFeatureCards() {
  return (
    <section className="w-full py-48 lg:py-80 relative">
      <div className="max-w-960 mx-auto px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">
            [ IN ACTION ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-32 lg:mb-48 font-mono"
        >
          Don&apos;t imagine it. Watch it.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            className="flex flex-col"
          >
            <div className="h-[240px] lg:h-[280px] mb-16">
              <ScrapingAnimation />
            </div>
            <h3 className="font-mono text-[14px] font-bold text-[var(--landing-text)] uppercase tracking-wider mb-4">
              Instant Scraping
            </h3>
            <p className="text-[13px] text-[var(--landing-text-secondary)] font-body">
              Every element extracted, categorized, and ready for rebuilding.
            </p>
            <span className="font-mono text-[10px] text-heat-100/60 mt-8 tracking-wider">
              [1.2s SCRAPE TIME]
            </span>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="h-[240px] lg:h-[280px] mb-16">
              <GenerationAnimation />
            </div>
            <h3 className="font-mono text-[14px] font-bold text-[var(--landing-text)] uppercase tracking-wider mb-4">
              Live Generation
            </h3>
            <p className="text-[13px] text-[var(--landing-text-secondary)] font-body">
              React components stream into a live Vite sandbox in real-time.
            </p>
            <span className="font-mono text-[10px] text-heat-100/60 mt-8 tracking-wider">
              [STREAMING]
            </span>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="h-[240px] lg:h-[280px] mb-16">
              <StyleTransformAnimation />
            </div>
            <h3 className="font-mono text-[14px] font-bold text-[var(--landing-text)] uppercase tracking-wider mb-4">
              Style Transform
            </h3>
            <p className="text-[13px] text-[var(--landing-text-secondary)] font-body">
              Same structure, new identity. 8 aesthetics, one click.
            </p>
            <span className="font-mono text-[10px] text-heat-100/60 mt-8 tracking-wider">
              [8 STYLES]
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
