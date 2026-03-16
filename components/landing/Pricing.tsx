"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "No strings.",
    features: ["30 credits / month", "All 9 AI models", "Free models after credits run out", "Download as ZIP", "Community support"],
    cta: "Start for free",
    ctaHref: "/sign-up",
    highlight: false,
    planKey: null,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power builders.",
    features: [
      "300 credits / month",
      "All 9 AI models — use any model",
      "Unlimited free models after credits",
      "Priority generation queue",
      "Push to Vercel in 1 click",
      "Brand extraction mode",
      "Email support",
    ],
    cta: "Go Pro",
    ctaHref: null, // handled by checkout flow
    highlight: true,
    planKey: "pro" as const,
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
    ctaHref: null, // handled by waitlist form
    highlight: false,
    planKey: "team" as const,
    isWaitlist: true,
  },
];

export default function Pricing() {
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleProCheckout = async () => {
    setUpgradingPlan("pro");
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      if (res.status === 401) {
        // Not logged in — redirect to sign up
        window.location.href = "/sign-up";
        return;
      }
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      // Fallback: redirect to sign-up
      window.location.href = "/sign-up";
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    // In a real implementation, this would POST to an API
    // For now, just show confirmation
    setWaitlistSubmitted(true);
    setTimeout(() => setWaitlistSubmitted(false), 3000);
  };

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
          30 free credits. No credit card.
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
              } ${"isWaitlist" in plan && plan.isWaitlist ? "opacity-80" : ""}`}
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

              {/* Free tier — simple link */}
              {plan.ctaHref && (
                <Link
                  href={plan.ctaHref}
                  className="block w-full text-center py-12 rounded-12 text-label-medium transition-all bg-black/5 text-[var(--landing-text)] hover:bg-black/10 border border-[var(--landing-border)]"
                >
                  {plan.cta}
                </Link>
              )}

              {/* Pro tier — checkout button */}
              {plan.planKey === "pro" && !plan.ctaHref && (
                <button
                  onClick={handleProCheckout}
                  disabled={upgradingPlan === "pro"}
                  className="block w-full text-center py-12 rounded-12 text-label-medium transition-all bg-heat-100 text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {upgradingPlan === "pro" ? "Redirecting..." : plan.cta}
                </button>
              )}

              {/* Team tier — waitlist form */}
              {"isWaitlist" in plan && plan.isWaitlist && (
                <div>
                  {waitlistSubmitted ? (
                    <div className="w-full text-center py-12 rounded-12 text-label-medium bg-green-50 text-green-700 border border-green-200">
                      You are on the list!
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlist} className="flex gap-8">
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        required
                        className="flex-1 min-w-0 rounded-12 border border-[var(--landing-border)] bg-[var(--landing-surface)] px-12 py-10 text-body-small text-[var(--landing-text)] placeholder:text-[var(--landing-text-tertiary)] focus:outline-none focus:border-heat-100/50 transition-colors"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-12 bg-black/5 px-16 py-10 text-label-medium text-[var(--landing-text)] hover:bg-black/10 border border-[var(--landing-border)] transition-all"
                      >
                        {plan.cta}
                      </button>
                    </form>
                  )}
                </div>
              )}

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
