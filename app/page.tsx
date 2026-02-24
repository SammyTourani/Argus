"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import AsciiCanvas from "@/components/landing/AsciiCanvas";
import LandingHeroInput from "@/components/LandingHeroInput";
import LogoMarquee from "@/components/landing/LogoMarquee";
import TerminalDemo from "@/components/landing/TerminalDemo";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ComparisonTable from "@/components/landing/ComparisonTable";
import StatsBand from "@/components/landing/StatsBand";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

// ─── Nav ──────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background-base/80 backdrop-blur-12 border-b border-border-faint">
      <nav className="max-w-900 mx-auto flex items-center justify-between px-16 lg:px-24 h-56">
        {/* Logo */}
        <Link href="/" className="text-title-h5 text-accent-black font-sans">
          Argus
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-16 lg:gap-24">
          <Link
            href="#pricing"
            className="text-label-small text-black-alpha-48 hover:text-accent-black transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/sign-in"
            className="text-label-small text-black-alpha-48 hover:text-accent-black transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/generation"
            className="bg-accent-black text-white px-16 py-8 rounded-10 text-label-small hover:opacity-90 transition-opacity"
          >
            Get started &rarr;
          </Link>
        </div>
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-background-base">
      {/* ASCII background */}
      <AsciiCanvas density={12} opacity={0.1} interactive />

      <div className="relative z-10 max-w-680 mx-auto px-16 lg:px-24 text-center pt-64 lg:pt-96 pb-48 lg:pb-80">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link
            href="/generation"
            className="inline-flex items-center gap-8 border border-border-faint rounded-full px-12 py-6 text-label-x-small text-black-alpha-48 hover:border-border-muted hover:text-black-alpha-64 transition-colors mb-24"
          >
            <span className="w-6 h-6 rounded-full bg-heat-100 inline-block" />
            Winner &middot; Google &times; Cerebral Valley Hackathon
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-2">
              <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-title-h3 sm:text-title-h2 lg:text-title-h1 text-accent-black font-sans mb-16"
        >
          Paste a URL.
          <br />
          Get a React app.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-body-large text-black-alpha-48 mb-32 max-w-480 mx-auto"
        >
          The AI that scrapes, rebuilds, and style-transforms any website
          into production React — live.
        </motion.p>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <LandingHeroInput />
        </motion.div>

        {/* Proof line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-32 flex items-center justify-center gap-8 sm:gap-12 flex-wrap text-label-x-small text-black-alpha-24"
        >
          <span>3,000+ sites cloned</span>
          <span className="w-3 h-3 rounded-full bg-black-alpha-12 hidden sm:block" />
          <span>10s avg build</span>
          <span className="w-3 h-3 rounded-full bg-black-alpha-12 hidden sm:block" />
          <span className="hidden sm:inline">Won Google &times; Cerebral Valley</span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative w-full py-96 lg:py-128 bg-background-base overflow-hidden">
      <AsciiCanvas density={16} opacity={0.02} interactive={false} />
      <div className="relative z-10 text-center max-w-600 mx-auto px-16">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h2 text-accent-black font-sans mb-16"
        >
          Ready to clone the web?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-body-large text-black-alpha-48 mb-32"
        >
          Paste a URL. See what happens.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/generation"
            className="inline-flex items-center gap-8 bg-heat-100 text-white px-24 py-14 rounded-12 text-label-large hover:opacity-90 transition-opacity"
          >
            Start building — it&apos;s free &rarr;
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="min-h-screen bg-background-base text-accent-black">
      <Nav />
      <Hero />
      <LogoMarquee />
      <TerminalDemo />
      <FeatureGrid />
      <ComparisonTable />
      <StatsBand />
      <HowItWorks />
      <div id="pricing">
        <Pricing />
      </div>
      <FinalCTA />
      <Footer />
    </main>
  );
}
