"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "SCRAPE",
    tagline: "Every pixel, memorized.",
    body: "Argus deep-scrapes any URL \u2014 HTML structure, CSS design tokens, brand colors, typography, spacing. Not a screenshot. A complete understanding.",
    status: [
      ["ELEMENTS", "847"],
      ["COMPONENTS", "12"],
      ["TOKENS", "EXTRACTED"],
    ],
  },
  {
    num: "02",
    title: "GENERATE",
    tagline: "Watch it build, live.",
    body: "Your chosen AI model streams React components file-by-file into a live Vite sandbox. See every import resolve. Every style apply. It's not a preview \u2014 it's the real app.",
    status: [
      ["ENGINE", "CLAUDE OPUS"],
      ["OUTPUT", "REACT + TAILWIND"],
      ["MODE", "STREAMING"],
    ],
  },
  {
    num: "03",
    title: "TRANSFORM",
    tagline: "Same structure. New identity.",
    body: "Extract a brand's design system and rebuild with a completely different aesthetic. Glassmorphism. Brutalism. Retro Wave. 8 styles, all production-ready.",
    status: [
      ["STYLES", "8 AVAILABLE"],
      ["FIDELITY", "PRODUCTION"],
      ["TOKENS", "PRESERVED"],
    ],
  },
  {
    num: "04",
    title: "SHIP",
    tagline: "Your code. Your repo. Your deploy.",
    body: "Download as a ZIP or push to Vercel in one click. 10+ React component files, Tailwind CSS, clean project structure. No lock-in. No proprietary format.",
    status: [
      ["FORMAT", "REACT + VITE"],
      ["DEPLOY", "1-CLICK VERCEL"],
      ["LOCK-IN", "NONE"],
    ],
  },
];

export default function HowItWorks() {
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
            [ PROCESS ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-48 lg:mb-64 font-sans"
        >
          How Argus works
        </motion.h2>

        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`py-32 lg:py-48 ${
                i < STEPS.length - 1 ? "border-b border-[var(--landing-border)]" : ""
              }`}
            >
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-24 lg:gap-48 items-start ${
                i % 2 === 1 ? "md:[direction:rtl]" : ""
              }`}>
                {/* Text column */}
                <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                  {/* Wideframe-style section label with divider */}
                  <div className="font-mono text-[12px] text-[var(--landing-text-tertiary)] mb-24 flex items-center gap-8">
                    <span>[ {step.num} ]</span>
                    <div className="h-[1px] w-32 bg-[var(--landing-border)]" />
                    <span>{step.title}</span>
                  </div>

                  <p className="text-title-h4 text-[var(--landing-text)] mb-12 font-sans">
                    {step.tagline}
                  </p>
                  <p className="text-body-large text-[var(--landing-text-secondary)] max-w-480">
                    {step.body}
                  </p>
                </div>

                {/* Status card column (wideframe meta-data pattern) */}
                <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                  <div className="bg-[var(--landing-surface)] border border-[var(--landing-border)] rounded-12 p-20 relative group">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-[var(--landing-border)] opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-[var(--landing-border)] opacity-50 group-hover:opacity-100 transition-opacity" />

                    {/* Step number large */}
                    <span className="font-mono text-[48px] lg:text-[64px] text-black/[0.04] leading-none block mb-12">
                      {step.num}
                    </span>

                    {/* Status list (wideframe pattern) */}
                    <ul className="font-mono text-[11px] text-[var(--landing-text-tertiary)] space-y-8 border-l border-[var(--landing-border)] pl-12">
                      {step.status.map(([key, val]) => (
                        <li key={key} className="flex justify-between max-w-240">
                          <span>{key}</span>
                          <span className="text-heat-100">{val}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
