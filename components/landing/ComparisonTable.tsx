"use client";

import { motion } from "framer-motion";

const ROWS = [
  { feature: "Clone real sites", argus: true, v0: false, bolt: false, cursor: false },
  { feature: "Live sandbox", argus: true, v0: true, bolt: true, cursor: false },
  { feature: "Style transform", argus: true, v0: false, bolt: false, cursor: false },
  { feature: "Pick your AI model", argus: true, v0: false, bolt: false, cursor: true },
  { feature: "Auto-fix errors", argus: true, v0: false, bolt: true, cursor: false },
  { feature: "Download React app", argus: true, v0: true, bolt: true, cursor: false },
];

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mx-auto">
    <path d="M4 9.5L7.5 13L14 5" stroke="var(--heat-100)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Dash = () => (
  <span className="block w-12 h-[2px] bg-black/10 mx-auto rounded-full" />
);

export default function ComparisonTable() {
  return (
    <section className="w-full py-48 lg:py-80 relative">
      <div className="max-w-800 mx-auto px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">
            [ COMPARISON ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-48 lg:mb-64 font-sans"
        >
          Finally, an AI that doesn&apos;t start from a blank canvas.
        </motion.h2>

        <div className="overflow-x-auto">
          <table className="w-full text-body-medium">
            <thead>
              <tr className="border-b border-[var(--landing-border)]">
                <th className="text-left py-12 pr-16 text-[var(--landing-text-secondary)] font-normal text-label-small" />
                <th className="py-12 px-12 text-center">
                  <span className="text-label-medium text-[var(--landing-text)] bg-heat-100/10 px-12 py-4 rounded-8 inline-block border border-heat-100/20">
                    Argus
                  </span>
                </th>
                <th className="py-12 px-12 text-center text-label-small text-[var(--landing-text-tertiary)] font-normal">v0</th>
                <th className="py-12 px-12 text-center text-label-small text-[var(--landing-text-tertiary)] font-normal">Bolt</th>
                <th className="py-12 px-12 text-center text-label-small text-[var(--landing-text-tertiary)] font-normal">Cursor</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`border-b border-[var(--landing-border)] ${
                    i % 2 === 0 ? "bg-black/[0.02]" : ""
                  }`}
                >
                  <td className="py-14 pr-16 text-[var(--landing-text)] text-body-medium">{row.feature}</td>
                  <td className="py-14 px-12 text-center">{row.argus ? <Check /> : <Dash />}</td>
                  <td className="py-14 px-12 text-center">{row.v0 ? <Check /> : <Dash />}</td>
                  <td className="py-14 px-12 text-center">{row.bolt ? <Check /> : <Dash />}</td>
                  <td className="py-14 px-12 text-center">{row.cursor ? <Check /> : <Dash />}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
