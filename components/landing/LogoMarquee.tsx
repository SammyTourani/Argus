"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const LOGOS = [
  "anthropic", "openai", "google", "meta", "apple", "microsoft",
  "stripe", "shopify", "amazon", "uber", "airbnb", "deepmind",
  "palantir", "sentry", "snowflake", "zapier",
];

export default function LogoMarquee() {
  return (
    <section className="w-full border-b border-[var(--landing-border)] py-40 lg:py-48 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-900 mx-auto px-16 mb-20"
      >
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--landing-text-faint)] text-center">
          Trusted by builders at
        </p>
      </motion.div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-48 sm:w-96 bg-gradient-to-r from-[var(--landing-bg)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-48 sm:w-96 bg-gradient-to-l from-[var(--landing-bg)] to-transparent z-10 pointer-events-none" />
        <div className="flex animate-argus-marquee will-change-transform" style={{ width: "fit-content" }}>
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <div key={`${logo}-${i}`} className="flex-shrink-0 mx-28 lg:mx-40 flex items-center">
              <Image
                src={`/argus-assets/logos/${logo}.svg`}
                alt={logo}
                width={120}
                height={36}
                className="opacity-30 hover:opacity-50 transition-opacity h-28 lg:h-32 w-auto brightness-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
