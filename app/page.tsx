'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Brain,
  Monitor,
  Palette,
  MessageSquare,
  Link2,
  Sparkles,
  Download,
  ArrowRight,
  Play,
  Check,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

/* ─── Animation Variants ────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    delay,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  },
})

/* ─── Data ──────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Cloning',
    description:
      'Scrape any website and rebuild it with AI. Choose from GPT-5, Claude Opus 4.6, Gemini 2.5 Pro, or Kimi K2.',
  },
  {
    icon: Monitor,
    title: 'Live Sandbox Preview',
    description:
      'Generated code runs in a real sandboxed Vite environment. See your clone come alive with hot-reload.',
  },
  {
    icon: Palette,
    title: '8 Design Styles',
    description:
      'Glassmorphism, Neumorphism, Brutalism, Minimalist, Dark Mode, Gradient Rich, 3D Depth, Retro Wave.',
  },
  {
    icon: MessageSquare,
    title: 'Iterative AI Chat',
    description:
      'After generation, chat with AI to refine your clone. Edit specific elements, add features, change styles.',
  },
]

const steps = [
  {
    num: '01',
    icon: Link2,
    title: 'Enter any URL',
    description:
      'Paste any website URL into Argus. From simple landing pages to complex web applications.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'AI scrapes & rebuilds',
    description:
      'Firecrawl extracts the design system, AI agents analyze the layout and rebuild it from scratch.',
  },
  {
    num: '03',
    icon: Download,
    title: 'Edit & download',
    description:
      'Iterate with AI chat to perfect your clone. Export the code or deploy directly to production.',
  },
]

const logos = [
  'Anthropic',
  'Google DeepMind',
  'Y Combinator',
  'Vercel',
  'Stripe',
  'GitHub',
  'OpenAI',
]

const faqs = [
  {
    q: 'Is Argus free to use?',
    a: 'Yes. You get 3 free builds per month, forever. No credit card required.',
  },
  {
    q: 'What websites can Argus clone?',
    a: 'Any publicly accessible website. Argus works best with marketing pages, landing pages, and product websites.',
  },
  {
    q: 'Which AI models does Argus use?',
    a: 'Claude Opus 4.6 (best quality), Gemini 2.5 Pro (fast), GPT-4o, and Kimi K2 (speed). You choose.',
  },
  {
    q: 'Can I edit the cloned website?',
    a: 'Yes. After generation, use the iterative AI chat to modify elements, add features, or change styles.',
  },
  {
    q: 'How do I get the code?',
    a: 'Export the generated code directly from the sandbox preview. Pro users can also deploy directly.',
  },
  {
    q: "What's included in Pro?",
    a: 'Unlimited builds, priority sandbox (faster generation), all features, iterative AI editing, and brand style extension.',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      '3 builds per month',
      'All 8 design styles',
      'All AI models',
      'Sandbox preview',
      'Code export',
    ],
    cta: 'Start for free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    badge: 'Most Popular',
    features: [
      'Unlimited builds',
      'Priority sandbox',
      'All features included',
      'Iterative AI chat',
      'Brand style extension',
    ],
    cta: 'Start Pro trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: 'Coming soon',
    period: '',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Shared projects',
      'Admin dashboard',
      'Priority support',
    ],
    cta: 'Notify me',
    highlighted: false,
    disabled: true,
  },
]

/* ─── Page Component ────────────────────────────────────────────────── */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: 'rgba(8,8,8,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-[18px] font-bold tracking-tight text-white"
            >
              Argus
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#pricing"
                className="text-[14px] transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')
                }
              >
                Pricing
              </a>
              <a
                href="https://github.com/SammyTourani/Argus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] transition-colors duration-200 inline-flex items-center gap-1"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')
                }
              >
                GitHub
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-[14px] px-4 py-2 transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-[14px] font-medium text-white px-5 py-2.5 rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: '#FA4500',
                boxShadow: '0 0 20px rgba(250,69,0,0.25)',
              }}
            >
              Get started
              <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Background effects */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(250,69,0,0.08), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 pt-24 pb-20 md:pt-32 md:pb-28 px-6"
        >
          <div className="max-w-[800px] mx-auto text-center">
            {/* Announcement badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium uppercase tracking-wider mb-8"
              style={{
                border: '1px solid rgba(250,69,0,0.3)',
                background: 'rgba(250,69,0,0.06)',
                color: '#FA4500',
              }}
            >
              <span>&#10022;</span>
              AI-Powered Website Cloning &middot; Powered by Claude Opus 4.6
              <ArrowRight size={12} />
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.2)}
              className="text-[48px] md:text-[88px] font-bold leading-[0.95] mb-6"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span className="text-white">Clone any website.</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #FA4500, #FF7240)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ship it in seconds.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp(0.4)}
              className="text-[16px] md:text-[18px] leading-[1.6] max-w-[560px] mx-auto mb-10"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Enter any URL. Argus scrapes it, extracts the design system, and
              rebuilds it in a sandboxed environment — powered by Claude, Gemini,
              and Kimi K2.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              {...fadeUp(0.5)}
              className="flex items-center justify-center gap-4 flex-wrap mb-8"
            >
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white px-6 py-3 rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: '#FA4500',
                  boxShadow: '0 0 24px rgba(250,69,0,0.3)',
                }}
              >
                Start for free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white px-6 py-3 rounded-xl transition-all duration-200"
                style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')
                }
              >
                Watch demo
                <Play size={14} fill="white" />
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              {...fadeUp(0.6)}
              className="flex items-center justify-center gap-6 flex-wrap text-[13px]"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {[
                '3,000+ websites cloned',
                'No credit card required',
                'Free tier available',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={13} style={{ color: '#FA4500' }} />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Hero Browser Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="max-w-[900px] mx-auto mt-16"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 80px rgba(250,69,0,0.08)',
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div
                  className="flex-1 mx-2 px-3 py-1 rounded-md font-mono text-[12px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  https://stripe.com
                </div>
              </div>

              {/* Argus UI mockup */}
              <div className="p-6 md:p-8">
                {/* URL input bar */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <div
                    className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg font-mono text-[13px]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    https://stripe.com
                  </div>
                  <div
                    className="px-3 py-2.5 rounded-lg text-[13px] font-medium"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    Glassmorphism
                  </div>
                  <div
                    className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white"
                    style={{ background: '#FA4500' }}
                  >
                    Generate
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 text-[12px]">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Generating clone...
                    </span>
                    <span style={{ color: '#FA4500' }}>78%</span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, #FA4500, #FF7240)',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: '78%' }}
                      transition={{ duration: 2, delay: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Preview placeholder */}
                <div
                  className="rounded-xl aspect-[16/8] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(250,69,0,0.03))',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="text-center z-10">
                    <div
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: 'rgba(250,69,0,0.1)' }}
                    >
                      <Sparkles size={20} style={{ color: '#FA4500' }} />
                    </div>
                    <p
                      className="text-[14px] font-medium"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Live preview rendering...
                    </p>
                    <p
                      className="text-[12px] mt-1"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      Sandboxed Vite environment with hot-reload
                    </p>
                  </div>
                  {/* Frosted backdrop lines */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)',
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Logos Bar ──────────────────────────────────────────── */}
      <section className="py-16 overflow-hidden relative">
        <p
          className="text-center text-[13px] uppercase tracking-widest mb-8"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          Trusted by builders at
        </p>
        <div
          className="relative"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          }}
        >
          <div className="flex animate-marquee whitespace-nowrap">
            {[...logos, ...logos].map((logo, i) => (
              <span
                key={i}
                className="mx-12 text-[15px] font-medium"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </section>

      {/* ─── Features Section ───────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[40px] md:text-[52px] font-bold leading-tight mb-4 text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Everything you need to
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #FA4500, #FF7240)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                rebuild the web
              </span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-[17px] max-w-[500px] mx-auto"
              style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}
            >
              Argus combines web scraping, AI generation, and sandboxed
              execution into one seamless workflow.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2 },
                }}
                className="p-7 rounded-2xl cursor-default transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(250,69,0,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(250,69,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(250,69,0,0.1)' }}
                >
                  <feature.icon size={20} style={{ color: '#FA4500' }} />
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p
                  className="text-[15px] leading-[1.6]"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[40px] md:text-[52px] font-bold leading-tight mb-4 text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              From URL to clone
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #FA4500, #FF7240)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                in three steps
              </span>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className="relative p-7 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span
                  className="text-[64px] font-bold absolute top-4 right-6 leading-none select-none"
                  style={{ color: 'rgba(250,69,0,0.08)' }}
                >
                  {step.num}
                </span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(250,69,0,0.1)' }}
                >
                  <step.icon size={20} style={{ color: '#FA4500' }} />
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p
                  className="text-[15px] leading-[1.6]"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {step.description}
                </p>
                {/* Connector arrow (hidden on last item and mobile) */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10"
                    style={{ color: 'rgba(255,255,255,0.15)' }}
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ Section ────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── Pricing Section ────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[40px] md:text-[52px] font-bold leading-tight mb-4 text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Simple, transparent pricing.
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-[17px]"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Start free. Scale when you&apos;re ready.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                className="relative p-7 rounded-2xl flex flex-col"
                style={{
                  background: plan.highlighted
                    ? 'rgba(250,69,0,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: plan.highlighted
                    ? '1px solid rgba(250,69,0,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: plan.highlighted
                    ? '0 0 40px rgba(250,69,0,0.15)'
                    : 'none',
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold text-white"
                    style={{ background: '#FA4500' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="text-[14px] font-medium mb-2"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-bold text-white"
                      style={{
                        fontSize:
                          plan.price === 'Coming soon' ? '22px' : '40px',
                        color:
                          plan.price === 'Coming soon'
                            ? 'rgba(255,255,255,0.25)'
                            : 'white',
                      }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className="text-[15px]"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-[14px]"
                      style={{
                        color: plan.disabled
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <Check
                        size={15}
                        style={{
                          color: plan.disabled
                            ? 'rgba(255,255,255,0.12)'
                            : '#42C366',
                        }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.disabled ? (
                  <button
                    disabled
                    className="w-full text-center py-3 rounded-xl text-[14px] font-medium cursor-not-allowed"
                    style={{
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {plan.cta}
                  </button>
                ) : plan.highlighted ? (
                  <Link
                    href="/sign-up"
                    className="block w-full text-center py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: '#FA4500',
                      boxShadow: '0 0 20px rgba(250,69,0,0.25)',
                    }}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    href="/sign-up"
                    className="block w-full text-center py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.3)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.15)')
                    }
                  >
                    {plan.cta}
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA Section ──────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 relative">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(250,69,0,0.1), transparent)',
          }}
        />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="max-w-[600px] mx-auto text-center relative z-10"
        >
          <motion.h2
            variants={itemVariants}
            className="text-[36px] md:text-[48px] font-bold leading-tight mb-4 text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Ready to clone the web?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-[17px] mb-10"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Start with 3 free builds. No credit card required.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 text-[16px] font-medium text-white px-8 py-4 rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: '#FA4500',
                boxShadow: '0 0 30px rgba(250,69,0,0.3)',
              }}
            >
              Start building for free
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer
        className="py-8 px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span
              className="text-[14px] font-bold text-white"
            >
              Argus
            </span>
            <span
              className="text-[13px]"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Built with Claude Opus 4.6 &middot; &copy; 2026 Argus
            </span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Pricing', href: '#pricing', external: false },
              { label: 'Privacy', href: '/privacy', external: false },
              { label: 'Terms', href: '/terms', external: false },
              {
                label: 'GitHub',
                href: 'https://github.com/SammyTourani/Argus',
                external: true,
              },
              {
                label: 'Twitter',
                href: 'https://x.com/sammytourani',
                external: true,
              },
              { label: 'Sign in', href: '/sign-in', external: false },
            ].map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')
                  }
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── FAQ Accordion Component ────────────────────────────────────── */

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[700px] mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-[40px] md:text-[52px] font-bold leading-tight mb-4 text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Frequently asked questions
          </motion.h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="space-y-2"
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: openIndex === i ? 'rgba(255,255,255,0.03)' : 'transparent',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors duration-200"
              >
                <span className="text-[15px] font-medium text-white pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className="shrink-0 transition-transform duration-200"
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p
                      className="px-6 pb-5 text-[14px] leading-[1.7]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
