"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    // TODO: integrate Resend for actual email capture
    setSubmitted(true);
    toast.success("You're on the list! We'll keep you posted.");
    setEmail("");
  }

  return (
    <section
      className="w-full py-48 lg:py-64 border-t border-[var(--landing-border)]"
      aria-label="Newsletter signup"
    >
      <div className="max-w-480 mx-auto px-16 lg:px-24 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--landing-text-faint)] mb-12"
        >
          Join 500+ builders
        </motion.p>

        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-title-h4 text-[var(--landing-text)] font-mono mb-8"
        >
          Stay in the loop
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-body-medium text-[var(--landing-text-secondary)] mb-24"
        >
          Product updates, new features, and build inspiration. No spam.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex gap-8"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 min-w-0 bg-[var(--landing-bg)] border border-[var(--landing-border)] rounded-10 px-14 py-10 text-body-medium text-[var(--landing-text)] placeholder:text-[var(--landing-text-faint)] focus:outline-none focus:border-heat-100/50 transition-colors font-mono"
          />
          <button
            type="submit"
            className="flex-shrink-0 bg-heat-100 text-white px-16 py-10 rounded-10 text-label-medium font-mono hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {submitted ? "Subscribed" : "Get updates"}
          </button>
        </motion.form>

        {submitted && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-body-small text-heat-100 font-mono"
          >
            You&apos;re in. Watch your inbox.
          </motion.p>
        )}
      </div>
    </section>
  );
}
