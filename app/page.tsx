"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import AsciiCanvas from "@/components/landing/AsciiCanvas";
import GradientOrbs from "@/components/landing/GradientOrbs";
import IntroLoader from "@/components/landing/IntroLoader";
import TextScramble from "@/components/landing/TextScramble";
import LandingHeroInput from "@/components/LandingHeroInput";
import LogoMarquee from "@/components/landing/LogoMarquee";
import TerminalDemo from "@/components/landing/TerminalDemo";
import ArgusAppMockup from "@/components/landing/ArgusAppMockup";
import GridShowcase from "@/components/landing/GridShowcase";
import AsciiDivider from "@/components/landing/AsciiDivider";
import ComparisonTable from "@/components/landing/ComparisonTable";
import StatsBand from "@/components/landing/StatsBand";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

// ─── Nav ──────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--landing-bg)]/80 backdrop-blur-12">
      <nav className="max-w-960 mx-auto flex items-center justify-between px-16 lg:px-24 h-56">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <span className="text-[20px] font-mono font-bold tracking-[0.15em] uppercase text-[var(--landing-text)] group-hover:text-heat-100 transition-colors">
            ARGUS
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-16 lg:gap-24">
          <Link
            href="#pricing"
            className="text-label-small text-[var(--landing-text-secondary)] hover:text-[var(--landing-text)] transition-colors hidden sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/sign-in"
            className="text-label-small text-[var(--landing-text-secondary)] hover:text-[var(--landing-text)] transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/generation"
            className="bg-heat-100 text-white px-16 py-8 rounded-8 text-label-small font-mono hover:opacity-90 transition-opacity"
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
    <section className="relative overflow-hidden min-h-[calc(100vh-56px)] flex flex-col items-center justify-center">
      {/* ASCII fluid motion background — subtle atmosphere */}
      <AsciiCanvas density={18} opacity={0.30} interactive />

      {/* Gradient orbs */}
      <GradientOrbs />

      {/* Eye video — hero centerpiece, fills entire section */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/argus-assets/official_eye.png"
          className="w-full h-full object-cover opacity-[0.50] mix-blend-multiply"
        >
          <source src="/argus-assets/final_eye.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 max-w-680 mx-auto px-16 lg:px-24 text-center py-64 lg:py-96">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link
            href="/generation"
            className="inline-flex items-center gap-8 border border-[var(--landing-border)] rounded-full px-12 py-6 text-[11px] font-mono text-[var(--landing-text-tertiary)] hover:border-[var(--landing-border-hover)] hover:text-[var(--landing-text-secondary)] transition-colors mb-24"
          >
            <span className="w-6 h-6 rounded-full bg-heat-100 inline-block" />
            Winner &middot; Google &times; Cerebral Valley Hackathon
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-2">
              <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        {/* Headline — fixed height to prevent layout shifts during scramble */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-title-h3 sm:text-title-h2 lg:text-title-h1 text-[var(--landing-text)] font-mono mb-16 overflow-hidden min-h-[8rem] sm:min-h-[7rem] lg:min-h-[8.5rem]"
        >
          <TextScramble
            phrases={[
              "See any website. Rebuild it instantly.",
              "Your AI reverse-engineers the web.",
              "From URL to production React in seconds.",
            ]}
            speed={30}
            revealDelay={5000}
          />
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-body-large text-[var(--landing-text)] font-body mb-32 max-w-480 mx-auto opacity-80"
        >
          The AI that deconstructs any website and rebuilds it as
          production React &mdash; live, in your browser.
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
          className="mt-32 flex items-center justify-center gap-8 sm:gap-12 flex-wrap font-mono text-[11px] text-[var(--landing-text-faint)]"
        >
          <span>3,000+ sites cloned</span>
          <span className="w-3 h-3 rounded-full bg-black/10 hidden sm:block" />
          <span>10s avg build</span>
          <span className="w-3 h-3 rounded-full bg-black/10 hidden sm:block" />
          <span className="hidden sm:inline">Won Google &times; Cerebral Valley</span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-8 text-[var(--landing-text-faint)]"
      >
        <span className="font-mono text-[11px] tracking-wider">scroll</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-bounce">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </motion.div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative w-full py-96 lg:py-128 overflow-hidden">
      {/* Eye video background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/argus-assets/official_eye.png"
          className="w-full h-full object-cover opacity-[0.10] mix-blend-multiply"
        >
          <source src="/argus-assets/final_eye.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(250, 93, 25, 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 text-center max-w-600 mx-auto px-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--landing-text-tertiary)]">
            [ GET STARTED ]
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-title-h2 text-[var(--landing-text)] font-sans mb-16"
        >
          Ready to clone the web?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-body-large text-[var(--landing-text-secondary)] mb-32"
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
            className="inline-flex items-center gap-8 bg-heat-100 text-white px-24 py-14 rounded-12 text-label-large font-mono hover:opacity-90 transition-opacity"
          >
            Start building &mdash; it&apos;s free &rarr;
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <>
      {/* Intro loader — ASCII matrix converges into ARGUS */}
      <IntroLoader onComplete={() => setIntroComplete(true)} />

      <main
        className="min-h-screen text-[var(--landing-text)]"
        style={{ backgroundColor: "var(--landing-bg)" }}
      >
        <Nav />
        <Hero />
        <LogoMarquee />
        <AsciiDivider />
        <ArgusAppMockup />
        <AsciiDivider />
        <GridShowcase />
        <TerminalDemo />
        <AsciiDivider />
        <HowItWorks />
        <ComparisonTable />
        <StatsBand />
        <div id="pricing">
          <Pricing />
        </div>
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
