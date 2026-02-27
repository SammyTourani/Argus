"use client";

import { motion } from "framer-motion";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initial: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Argus rebuilt my entire portfolio in 30 seconds. The code quality is better than what I'd write myself.",
    name: "Alex Chen",
    role: "Frontend Developer",
    initial: "A",
  },
  {
    quote:
      "We cloned our competitor's landing page, customized it, and shipped in under an hour.",
    name: "Sarah Kim",
    role: "Startup Founder",
    initial: "S",
  },
  {
    quote:
      "The multi-model support is incredible. I switch between Claude and GPT depending on what I'm building.",
    name: "Marcus Johnson",
    role: "Full-Stack Engineer",
    initial: "M",
  },
  {
    quote:
      "Won our hackathon using Argus. Judges couldn't believe we built the whole thing in 4 hours.",
    name: "Priya Patel",
    role: "CS Student",
    initial: "P",
  },
];

export default function Testimonials() {
  return (
    <section
      className="w-full py-48 lg:py-80 relative"
      aria-label="Testimonials"
    >
      <div className="max-w-960 mx-auto px-16 lg:px-24">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">
            [ TESTIMONIALS ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-8 font-mono"
        >
          Builders ship faster with Argus
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-body-large text-[var(--landing-text-secondary)] text-center mb-48 lg:mb-64"
        >
          Join thousands of developers who build with Argus every day.
        </motion.p>

        {/* Testimonial grid — 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-16 border border-[var(--landing-border)] bg-[var(--landing-bg)] p-24 lg:p-32 relative group hover:border-[var(--landing-border-hover)] transition-colors"
            >
              {/* Quote mark */}
              <span
                className="absolute top-16 right-20 text-[48px] leading-none font-serif text-heat-100 opacity-15 select-none pointer-events-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>

              {/* Quote text */}
              <blockquote className="text-body-large text-[var(--landing-text)] mb-20 relative z-10 font-body leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Attribution */}
              <div className="flex items-center gap-12">
                {/* Avatar placeholder — initial */}
                <div className="w-36 h-36 rounded-full bg-heat-100/10 border border-heat-100/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-[14px] text-heat-100 font-bold">
                    {t.initial}
                  </span>
                </div>
                <div>
                  <p className="text-label-medium text-[var(--landing-text)] font-mono">
                    {t.name}
                  </p>
                  <p className="text-body-small text-[var(--landing-text-tertiary)]">
                    {t.role}
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
