"use client";

import { motion } from "framer-motion";

/**
 * macOS-style browser chrome mockup with product demo video inside.
 * Inspired by Raycast.com's product showcase pattern.
 */
export default function BrowserMockup() {
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
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-8 font-sans"
        >
          See it build in real time
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-body-large text-[var(--landing-text-secondary)] text-center mb-32 lg:mb-48 max-w-480 mx-auto"
        >
          Chat with Argus on the left. Watch React components stream into a live Vite sandbox on the right.
        </motion.p>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="bracket-frame"
        >
          {/* Monospace status label above */}
          <div className="flex items-center justify-between mb-12">
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--landing-text-faint)]">
              [ REACT + TAILWIND ]
            </span>
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--landing-text-faint)]">
              28.4s
            </span>
          </div>

          <div
            className="rounded-12 overflow-hidden border border-[var(--landing-border)]"
            style={{
              boxShadow: "0 25px 80px -12px rgba(0, 0, 0, 0.6), 0 0 60px -20px rgba(250, 93, 25, 0.08)",
            }}
          >
            {/* macOS title bar */}
            <div className="flex items-center gap-8 px-16 py-10 bg-[#111115] border-b border-[var(--landing-border)]">
              <div className="flex gap-7">
                <span className="w-12 h-12 rounded-full bg-[#FF5F57]" />
                <span className="w-12 h-12 rounded-full bg-[#FEBC2E]" />
                <span className="w-12 h-12 rounded-full bg-[#28C840]" />
              </div>
              {/* URL bar */}
              <div className="flex-1 flex justify-center">
                <div className="bg-[#0A0A0F] rounded-6 px-12 py-4 flex items-center gap-6 max-w-320 w-full">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#555] flex-shrink-0">
                    <path d="M2 6C2 3.79 3.79 2 6 2s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4Z" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="0.75" />
                  </svg>
                  <span className="font-mono text-[11px] text-[#666] truncate">
                    buildargus.com/app
                  </span>
                </div>
              </div>
              <div className="w-48" /> {/* spacer to balance traffic lights */}
            </div>

            {/* Video content */}
            <div className="relative bg-[#0A0A0F] aspect-[16/9]">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/argus-assets/argus.mp4" type="video/mp4" />
              </video>
              {/* Subtle vignette overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 60%, rgba(5, 5, 8, 0.4) 100%)",
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
