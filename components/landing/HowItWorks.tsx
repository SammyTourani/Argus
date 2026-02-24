"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "SCRAPE",
    tagline: "Every pixel, memorized.",
    body: "Argus deep-scrapes any URL — HTML structure, CSS design tokens, brand colors, typography, spacing. Not a screenshot. A complete understanding.",
  },
  {
    num: "02",
    title: "GENERATE",
    tagline: "Watch it build, live.",
    body: "Your chosen AI model streams React components file-by-file into a live Vite sandbox. See every import resolve. Every style apply. It's not a preview — it's the real app.",
  },
  {
    num: "03",
    title: "TRANSFORM",
    tagline: "Same structure. New identity.",
    body: "Extract a brand's design system and rebuild with a completely different aesthetic. Glassmorphism. Brutalism. Retro Wave. 8 styles, all production-ready.",
  },
  {
    num: "04",
    title: "SHIP",
    tagline: "Your code. Your repo. Your deploy.",
    body: "Download as a ZIP or push to Vercel in one click. 10+ React component files, Tailwind CSS, clean project structure. No lock-in. No proprietary format.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full py-48 lg:py-80 bg-background-base">
      <div className="max-w-800 mx-auto px-16 lg:px-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h2 text-center text-accent-black mb-48 lg:mb-64 font-sans"
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
                i < STEPS.length - 1 ? "border-b border-border-faint" : ""
              }`}
            >
              <div className="flex gap-24 lg:gap-48">
                {/* Step number */}
                <div className="flex-shrink-0">
                  <span className="font-mono text-title-h1 text-heat-20 leading-none block">
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono text-label-large text-heat-100 uppercase tracking-widest mb-8">
                    {step.title}
                  </h3>
                  <p className="text-title-h4 text-accent-black mb-12 font-sans">
                    {step.tagline}
                  </p>
                  <p className="text-body-large text-black-alpha-48 max-w-560">
                    {step.body}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
