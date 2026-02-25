"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "No strings.",
    features: ["3 builds / 30 days", "All 8 style transforms", "Download as ZIP", "Community support"],
    cta: "Start for free",
    ctaHref: "/generation",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power builders.",
    features: [
      "Unlimited builds",
      "All AI models (GPT-4o, Claude, Gemini, Kimi)",
      "Priority generation queue",
      "Push to Vercel in 1 click",
      "Brand extraction mode",
      "Email support",
    ],
    cta: "Go Pro",
    ctaHref: "/generation",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "Coming soon.",
    features: [
      "Everything in Pro",
      "5 team members",
      "Shared project library",
      "Custom AI model config",
      "SSO & audit logs",
      "Dedicated support",
    ],
    cta: "Join waitlist",
    ctaHref: "#",
    highlight: false,
    disabled: true,
  },
];

export default function Pricing() {
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
            [ PRICING ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h3 lg:text-title-h2 text-center text-[var(--landing-text)] mb-8 font-sans"
        >
          3 free builds. No credit card.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-body-large text-[var(--landing-text-secondary)] text-center mb-48 lg:mb-64"
        >
          Start building for free. Upgrade when you need more.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-16 p-24 lg:p-32 border relative ${
                plan.highlight
                  ? "border-heat-100/30 bg-[var(--landing-surface)] shadow-[0_0_40px_-10px_rgba(250,93,25,0.12)]"
                  : "border-[var(--landing-border)] bg-[var(--landing-surface)]"
              } ${plan.disabled ? "opacity-60" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-heat-100 text-white text-label-x-small px-12 py-4 rounded-full font-mono">
                  Most popular
                </span>
              )}

              <h3 className="text-title-h4 text-[var(--landing-text)] mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-title-h2 text-[var(--landing-text)]">{plan.price}</span>
                <span className="text-body-medium text-[var(--landing-text-secondary)]">{plan.period}</span>
              </div>
              <p className="text-body-medium text-[var(--landing-text-secondary)] mb-24">{plan.description}</p>

              <Link
                href={plan.ctaHref}
                className={`block w-full text-center py-12 rounded-12 text-label-medium transition-all ${
                  plan.highlight
                    ? "bg-heat-100 text-white hover:opacity-90"
                    : "bg-black/5 text-[var(--landing-text)] hover:bg-black/10 border border-[var(--landing-border)]"
                } ${plan.disabled ? "pointer-events-none" : ""}`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-24 space-y-10">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-8 text-body-medium text-[var(--landing-text-secondary)]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-2">
                      <path
                        d="M3 8.5L6.5 12L13 4"
                        stroke={plan.highlight ? "var(--heat-100)" : "rgba(26,26,26,0.3)"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
