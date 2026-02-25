"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    num: "01",
    title: "STYLE TRANSFORM",
    tagline: "Don't just clone \u2014 reimagine.",
    body: "Extract any site's brand system and rebuild it in Brutalism, Glassmorphism, or 6 other aesthetics.",
    span: "", // normal 1x1
  },
  {
    num: "02",
    title: "LIVE SANDBOX",
    tagline: "Watch it build, not load.",
    body: "Every component renders in real-time. Hot-reload. Error recovery. A full Vite environment, not a static preview.",
    span: "",
  },
  {
    num: "03",
    title: "MULTI-MODEL",
    tagline: "Your engine. Your choice.",
    body: "Gemini 2.5 Pro. Claude Opus. GPT-4o. Kimi K2. Pick your engine. Same pipeline, your choice of brain.",
    span: "",
  },
  {
    num: "04",
    title: "AUTO-FIX",
    tagline: "Self-healing code generation.",
    body: "Vite throws an error? Argus catches it, diagnoses the root cause, and patches the code \u2014 automatically.",
    span: "",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function FeatureGrid() {
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
            [ FEATURES ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-32 lg:mb-48 font-sans"
        >
          What sets Argus apart
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.num}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="landing-card bg-[var(--landing-surface)] border border-[var(--landing-border)] rounded-16 p-24 lg:p-32 relative overflow-hidden group"
            >
              {/* Corner brackets (wideframe pattern) */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-[var(--landing-border)] opacity-50 group-hover:opacity-100 group-hover:w-24 group-hover:h-24 transition-all duration-[400ms]" style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }} />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-[var(--landing-border)] opacity-50 group-hover:opacity-100 group-hover:w-24 group-hover:h-24 transition-all duration-[400ms]" style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }} />

              <span className="font-mono text-label-small text-heat-100 mb-12 block">
                [{f.num}]
              </span>
              <h3 className="font-mono text-label-large text-[var(--landing-text)] uppercase tracking-wider mb-8">
                {f.title}
              </h3>
              <p className="text-body-large text-[var(--landing-text)] font-medium mb-8">
                {f.tagline}
              </p>
              <p className="text-body-medium text-[var(--landing-text-secondary)]">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
