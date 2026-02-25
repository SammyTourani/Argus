"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    num: "01",
    title: "SCRAPE",
    stat: "847 ELEMENTS",
    tagline: "Every pixel, memorized.",
    body: "Deep scrapes HTML, CSS, tokens, colors, and typography in under 2 seconds. Nothing gets missed.",
  },
  {
    num: "02",
    title: "GENERATE",
    stat: "REACT + TAILWIND",
    tagline: "Watch it build, live.",
    body: "AI streams React components into a live Vite sandbox. Real-time rendering with hot-reload.",
  },
  {
    num: "03",
    title: "TRANSFORM",
    stat: "8 STYLES",
    tagline: "Same structure. New identity.",
    body: "Rebuild in Brutalism, Glassmorphism, or 6 other aesthetics. Extract the brand system, reimagine everything.",
  },
  {
    num: "04",
    title: "AUTO-FIX",
    stat: "SELF-HEALING",
    tagline: "Errors? Already patched.",
    body: "Vite throws an error? Argus catches it, diagnoses the root cause, and patches the code — automatically.",
    span: "wide",
  },
  {
    num: "05",
    title: "MULTI-MODEL",
    stat: "4 ENGINES",
    tagline: "Your brain. Your choice.",
    body: "Claude Opus. Gemini 2.5 Pro. GPT-4o. Kimi K2. Same pipeline, your choice of intelligence.",
    span: "wide",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function GridShowcase() {
  return (
    <section className="w-full py-48 lg:py-80 relative">
      <div className="max-w-960 mx-auto px-16 lg:px-24">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">
            [ CAPABILITIES ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-32 lg:mb-48 font-mono"
        >
          What sets Argus apart
        </motion.h2>

        {/* Top row: 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-1">
          {FEATURES.slice(0, 3).map((f, i) => (
            <motion.div
              key={f.num}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="group relative bg-[var(--landing-surface)] border border-[var(--landing-border)] p-24 lg:p-28 hover:border-[var(--landing-border-hover)] transition-all"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-[var(--landing-border)] opacity-40 group-hover:opacity-100 group-hover:border-heat-100 group-hover:w-20 group-hover:h-20 transition-all duration-300" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-[var(--landing-border)] opacity-40 group-hover:opacity-100 group-hover:border-heat-100 group-hover:w-20 group-hover:h-20 transition-all duration-300" />

              <div className="flex items-center justify-between mb-16">
                <span className="font-mono text-[11px] text-heat-100 tracking-wider">
                  [{f.num}]
                </span>
                <span className="font-mono text-[10px] text-[var(--landing-text-faint)] tracking-[0.1em]">
                  {f.stat}
                </span>
              </div>

              <h3 className="font-mono text-[18px] font-bold text-[var(--landing-text)] uppercase tracking-[0.05em] mb-8">
                {f.title}
              </h3>
              <p className="text-[15px] text-[var(--landing-text)] font-medium mb-6">
                {f.tagline}
              </p>
              <p className="text-[13px] text-[var(--landing-text-secondary)] font-body leading-relaxed">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom row: 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {FEATURES.slice(3).map((f, i) => (
            <motion.div
              key={f.num}
              custom={i + 3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="group relative bg-[var(--landing-surface)] border border-[var(--landing-border)] p-24 lg:p-28 hover:border-[var(--landing-border-hover)] transition-all"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-[var(--landing-border)] opacity-40 group-hover:opacity-100 group-hover:border-heat-100 group-hover:w-20 group-hover:h-20 transition-all duration-300" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-[var(--landing-border)] opacity-40 group-hover:opacity-100 group-hover:border-heat-100 group-hover:w-20 group-hover:h-20 transition-all duration-300" />

              <div className="flex items-center justify-between mb-16">
                <span className="font-mono text-[11px] text-heat-100 tracking-wider">
                  [{f.num}]
                </span>
                <span className="font-mono text-[10px] text-[var(--landing-text-faint)] tracking-[0.1em]">
                  {f.stat}
                </span>
              </div>

              <h3 className="font-mono text-[18px] font-bold text-[var(--landing-text)] uppercase tracking-[0.05em] mb-8">
                {f.title}
              </h3>
              <p className="text-[15px] text-[var(--landing-text)] font-medium mb-6">
                {f.tagline}
              </p>
              <p className="text-[13px] text-[var(--landing-text-secondary)] font-body leading-relaxed">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
