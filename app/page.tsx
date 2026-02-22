'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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
  Star,
} from 'lucide-react'

/* ─── Animation Helpers ───────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    delay,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  },
})

const inView = { once: true, amount: 0.1 }
const inViewSm = { once: true, amount: 0.05 }

/* ─── Data ────────────────────────────────────────────────────────── */

const companyLogos = [
  { name: 'Y Combinator', color: '#F26522' },
  { name: 'Vercel', color: '#ffffff' },
  { name: 'Stripe', color: '#635BFF' },
  { name: 'GitHub', color: '#ffffff' },
  { name: 'OpenAI', color: '#00A67E' },
  { name: 'Anthropic', color: '#D4A574' },
  { name: 'Google', color: '#4285F4' },
  { name: 'Meta', color: '#0668E1' },
  { name: 'Supabase', color: '#3ECF8E' },
  { name: 'Linear', color: '#5E6AD2' },
]

const stats = [
  { value: '3,000+', label: 'Websites cloned' },
  { value: '< 60s', label: 'Average build time' },
  { value: '8', label: 'Design styles' },
  { value: 'Claude + Gemini', label: 'AI providers supported' },
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

const testimonials = [
  {
    quote:
      'Cloned our competitor\'s Figma landing in 48 seconds. Used the Glassmorphism output as our new design system base.',
    name: 'Jake R.',
    role: 'Indie Hacker',
  },
  {
    quote:
      'We use Argus for rapid client prototypes. What used to take 4 hours now takes 2 minutes. Our clients think we\'re wizards.',
    name: 'Priya M.',
    role: 'Freelance Developer',
  },
  {
    quote:
      'The multi-model support is underrated. I switch between Claude and Gemini based on the site complexity. Both nail it.',
    name: 'Tom H.',
    role: 'Frontend Lead',
  },
  {
    quote:
      'Built 3 competitor analysis mockups in one afternoon. Saved us from hiring a designer for the discovery phase.',
    name: 'Sarah K.',
    role: 'Product Manager',
  },
  {
    quote:
      'The iterative chat feature is what sold me on Pro. I can just say "make the navbar sticky" and it works.',
    name: 'Marcus T.',
    role: 'Full Stack Dev',
  },
  {
    quote:
      'Finally, an AI tool that actually understands design systems. Not just a screenshot — it extracts the actual CSS values.',
    name: 'Aiko L.',
    role: 'Design Engineer',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    monthly: '$0',
    annual: '$0',
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
    monthly: '$29',
    annual: '$23',
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
    monthly: 'Coming soon',
    annual: 'Coming soon',
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

const stylePills = [
  'Glassmorphism',
  'Neumorphic',
  'Brutalist',
  'Minimal',
  'Dark Mode',
  'Gradient',
  '3D',
  'Retro',
]

/* ─── Page Component ──────────────────────────────────────────────── */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const [annual, setAnnual] = useState(false)

  // Demo animation — 10s cycle
  const [demoElapsed, setDemoElapsed] = useState(0)
  const DEMO_CYCLE = 10000
  const demoUrl = 'https://stripe.com'
  const demoCode = `<div class="card glass">\n  <h2>Accept Payments</h2>\n  <p>Global processing</p>\n  <button class="btn-primary">\n    Get Started →\n  </button>\n</div>`

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoElapsed((prev) => (prev + 100) % DEMO_CYCLE)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const demoStage =
    demoElapsed < 2000 ? 0 : demoElapsed < 4000 ? 1 : demoElapsed < 8000 ? 2 : 3
  const typedUrl = demoUrl.slice(
    0,
    Math.floor((Math.min(demoElapsed, 2000) / 2000) * demoUrl.length)
  )
  const demoProgress =
    demoStage >= 1 ? Math.min(100, ((demoElapsed - 2000) / 2000) * 100) : 0
  const visibleCode =
    demoStage >= 2
      ? demoCode.slice(
          0,
          Math.floor(((demoElapsed - 4000) / 4000) * demoCode.length)
        )
      : ''

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
          <Link
            href="/"
            className="text-[18px] font-bold tracking-tight text-white"
          >
            Argus
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="hidden md:inline text-[14px] px-3 py-2 transition-colors duration-200 hover:text-white"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Pricing
            </a>
            <Link
              href="/sign-in"
              className="text-[14px] px-4 py-2 transition-colors duration-200 hover:text-white"
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
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium uppercase tracking-wider mb-8"
              style={{
                border: '1px solid rgba(250,69,0,0.3)',
                background: 'rgba(250,69,0,0.08)',
                color: '#FA4500',
              }}
            >
              <span>&#10022;</span>
              AI-Powered Website Cloning &middot; Now with Claude Opus 4.6
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.2)}
              className="text-[48px] md:text-[88px] leading-[0.95] mb-6"
              style={{ letterSpacing: '-0.04em', fontWeight: 800 }}
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

            {/* Subtitle */}
            <motion.p
              {...fadeUp(0.4)}
              className="text-[16px] md:text-[18px] leading-[1.6] max-w-[560px] mx-auto mb-10"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Enter any URL. Argus scrapes it, extracts the design system, and
              rebuilds it in a sandboxed environment — powered by Claude, Gemini,
              and Kimi K2.
            </motion.p>

            {/* CTAs */}
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
              <button
                onClick={() =>
                  document
                    .getElementById('demo')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white px-6 py-3 rounded-xl transition-all duration-200 hover:border-white/30"
                style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                }}
              >
                <Play size={14} fill="white" />
                Watch demo
              </button>
            </motion.div>

            {/* Trust signals */}
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
                    className="px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    Glassmorphism
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(255,255,255,0.3)">
                      <path d="M2 4l3 3 3-3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <div
                    className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white"
                    style={{ background: '#FA4500' }}
                  >
                    Generate
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 text-[12px]">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Scraping... Analyzing design... Building components
                    </span>
                    <span style={{ color: '#FA4500' }}>76%</span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full animate-hero-progress"
                      style={{
                        background:
                          'linear-gradient(90deg, #FA4500, #FF7240)',
                      }}
                    />
                  </div>
                </div>

                {/* Glassmorphism payment card preview */}
                <div
                  className="rounded-xl p-6 md:p-8"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-[18px]">💳</span>
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      Payment Details
                    </span>
                    <span
                      className="ml-auto text-[11px] px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(99,91,255,0.15)',
                        color: '#635BFF',
                      }}
                    >
                      Stripe-inspired
                    </span>
                  </div>

                  {/* Card number */}
                  <div
                    className="px-4 py-3 rounded-lg mb-3"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      className="text-[11px] mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      Card Number
                    </div>
                    <div
                      className="font-mono text-[14px]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      ●●●● ●●●● ●●●● 4242
                    </div>
                  </div>

                  {/* Expiry + CVV */}
                  <div className="flex gap-3 mb-5">
                    <div
                      className="flex-1 px-4 py-3 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div
                        className="text-[11px] mb-1"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        Expiry
                      </div>
                      <div
                        className="text-[14px]"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        12/27
                      </div>
                    </div>
                    <div
                      className="flex-1 px-4 py-3 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div
                        className="text-[11px] mb-1"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        CVV
                      </div>
                      <div
                        className="text-[14px]"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        ●●●
                      </div>
                    </div>
                  </div>

                  {/* Pay button */}
                  <div
                    className="rounded-lg py-3 text-center text-[14px] font-semibold text-white"
                    style={{ background: '#635BFF' }}
                  >
                    Pay $99.00
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────── */}
      <section
        className="py-8 px-6"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          opacity: 1,
        }}
      >
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center px-4 ${
                i < stats.length - 1
                  ? 'md:border-r md:border-white/[0.06]'
                  : ''
              }`}
            >
              <div className="text-[28px] md:text-[36px] font-bold text-white leading-tight">
                {stat.value}
              </div>
              <div
                className="text-[13px] mt-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Logo Marquee ─────────────────────────────────────── */}
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
          <div className="flex animate-argus-marquee whitespace-nowrap">
            {[...companyLogos, ...companyLogos].map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex items-center gap-2 mx-8 shrink-0"
              >
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ background: logo.color, opacity: 0.6 }}
                />
                <span
                  className="text-[13px] font-semibold"
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[32px] md:text-[52px] font-bold leading-tight mb-4 text-white"
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
            viewport={inView}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Card 1: AI-Powered Cloning */}
            <motion.div
              variants={itemVariants}
              className="p-7 rounded-2xl cursor-default group transition-all duration-300 hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(250,69,0,0.08)]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(250,69,0,0.1)' }}
              >
                <Brain size={20} style={{ color: '#FA4500' }} />
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                AI-Powered Cloning
              </h3>
              <p
                className="text-[15px] leading-[1.6] mb-4"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Scrape any website and rebuild it with AI. Choose from Claude
                Opus 4.6, Gemini 2.5 Pro, or Kimi K2.
              </p>
              <div
                className="rounded-lg px-4 py-3 font-mono text-[12px] overflow-x-auto"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ color: '#FA4500' }}>clone</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>(</span>
                <span style={{ color: '#4ADE80' }}>
                  &quot;https://stripe.com&quot;
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>, {'{'} </span>
                <span style={{ color: '#60A5FA' }}>style</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>: </span>
                <span style={{ color: '#4ADE80' }}>
                  &quot;glassmorphism&quot;
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>, </span>
                <span style={{ color: '#60A5FA' }}>model</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>: </span>
                <span style={{ color: '#4ADE80' }}>
                  &quot;claude&quot;
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {' '}
                  {'}'})
                </span>
              </div>
            </motion.div>

            {/* Card 2: Live Sandbox Preview */}
            <motion.div
              variants={itemVariants}
              className="p-7 rounded-2xl cursor-default group transition-all duration-300 hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(250,69,0,0.08)]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(250,69,0,0.1)' }}
              >
                <Monitor size={20} style={{ color: '#FA4500' }} />
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Live Sandbox Preview
              </h3>
              <p
                className="text-[15px] leading-[1.6] mb-4"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Generated code runs in a real sandboxed Vite environment. See
                your clone come alive with hot-reload.
              </p>
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-green" />
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: '#4ADE80' }}
                  >
                    Live
                  </span>
                </div>
                <span
                  className="text-[12px] font-mono"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  localhost:5173 — Sandboxed Vite + Hot Reload
                </span>
              </div>
            </motion.div>

            {/* Card 3: 8 Design Styles */}
            <motion.div
              variants={itemVariants}
              className="p-7 rounded-2xl cursor-default group transition-all duration-300 hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(250,69,0,0.08)]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(250,69,0,0.1)' }}
              >
                <Palette size={20} style={{ color: '#FA4500' }} />
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                8 Design Styles
              </h3>
              <p
                className="text-[15px] leading-[1.6] mb-4"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                From Glassmorphism to Brutalism — pick the aesthetic that fits
                your vision.
              </p>
              <div className="flex flex-wrap gap-2">
                {stylePills.map((pill) => (
                  <span
                    key={pill}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(250,69,0,0.08)',
                      border: '1px solid rgba(250,69,0,0.2)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Card 4: Iterative AI Chat */}
            <motion.div
              variants={itemVariants}
              className="p-7 rounded-2xl cursor-default group transition-all duration-300 hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(250,69,0,0.08)]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(250,69,0,0.1)' }}
              >
                <MessageSquare size={20} style={{ color: '#FA4500' }} />
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Iterative AI Chat
              </h3>
              <p
                className="text-[15px] leading-[1.6] mb-4"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                After generation, chat with AI to refine your clone. Edit
                elements, add features, change styles.
              </p>
              <div className="space-y-2">
                <div
                  className="rounded-lg px-3 py-2 text-[12px] max-w-[80%]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  &ldquo;Make the header blue&rdquo;
                </div>
                <div
                  className="rounded-lg px-3 py-2 text-[12px] max-w-[85%] ml-auto"
                  style={{
                    background: 'rgba(250,69,0,0.1)',
                    border: '1px solid rgba(250,69,0,0.15)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Done! The header gradient has been updated. ✓
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Animated Demo ────────────────────────────────────── */}
      <section id="demo" className="py-24 md:py-32 px-6">
        <div className="max-w-[900px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="text-center mb-12"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[32px] md:text-[52px] font-bold leading-tight mb-3 text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Watch Argus work
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-[17px]"
              style={{ color: '#FA4500' }}
            >
              Real builds, in real time
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.5 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.08)',
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
                  argus.build/builder
                </div>
              </div>

              {/* Demo content */}
              <div className="p-6 md:p-8 min-h-[240px]">
                {/* Stage indicators */}
                <div className="flex items-center gap-3 mb-6">
                  {['URL Input', 'Scraping', 'Building', 'Complete'].map(
                    (label, i) => (
                      <div key={label} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full transition-colors duration-300"
                          style={{
                            background:
                              demoStage >= i
                                ? '#FA4500'
                                : 'rgba(255,255,255,0.1)',
                          }}
                        />
                        <span
                          className="text-[11px] font-medium transition-colors duration-300"
                          style={{
                            color:
                              demoStage === i
                                ? 'rgba(255,255,255,0.7)'
                                : 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Stage 0: URL typing */}
                {demoStage === 0 && (
                  <div className="space-y-3">
                    <div
                      className="text-[12px] font-medium mb-2"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Enter target URL
                    </div>
                    <div
                      className="px-4 py-3 rounded-lg font-mono text-[14px]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <span style={{ color: '#FA4500' }}>{typedUrl}</span>
                      <span className="animate-cursor-blink" style={{ color: '#FA4500' }}>
                        |
                      </span>
                    </div>
                  </div>
                )}

                {/* Stage 1: Progress */}
                {demoStage === 1 && (
                  <div className="space-y-3">
                    <div
                      className="text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Scraping stripe.com... Extracting design tokens...
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-100"
                        style={{
                          width: `${demoProgress}%`,
                          background:
                            'linear-gradient(90deg, #FA4500, #FF7240)',
                        }}
                      />
                    </div>
                    <div
                      className="text-right text-[13px] font-mono"
                      style={{ color: '#FA4500' }}
                    >
                      {Math.floor(demoProgress)}%
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {[
                        'Colors extracted',
                        'Typography mapped',
                        'Layout analyzed',
                        'Components identified',
                      ].map((item, i) => (
                        <span
                          key={item}
                          className="text-[11px] px-2 py-1 rounded-full transition-opacity duration-300"
                          style={{
                            background: 'rgba(250,69,0,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                            opacity: demoProgress > i * 25 ? 1 : 0.3,
                          }}
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage 2: Code generation */}
                {demoStage === 2 && (
                  <div>
                    <div
                      className="text-[12px] font-medium mb-2"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      Generating component code...
                    </div>
                    <pre
                      className="rounded-lg p-4 font-mono text-[12px] overflow-hidden"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.5)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {visibleCode}
                      <span
                        className="animate-cursor-blink"
                        style={{ color: '#FA4500' }}
                      >
                        |
                      </span>
                    </pre>
                  </div>
                )}

                {/* Stage 3: Complete */}
                {demoStage === 3 && (
                  <div className="text-center py-6">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: 'rgba(250,69,0,0.15)' }}
                    >
                      <Check size={24} style={{ color: '#FA4500' }} />
                    </div>
                    <div className="text-[18px] font-semibold text-white mb-2">
                      Build complete!
                    </div>
                    <div
                      className="text-[14px] mb-4"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      stripe.com cloned in 47 seconds
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[14px] font-medium"
                      style={{ color: '#FA4500' }}
                    >
                      View your build <ArrowRight size={14} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[32px] md:text-[52px] font-bold leading-tight mb-4 text-white"
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
            viewport={inView}
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
                {/* Connector arrow */}
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

      {/* ─── Testimonials ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={inViewSm}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[32px] md:text-[52px] font-bold leading-tight mb-4 text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              What developers are saying
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-[17px]"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Real feedback from real builders
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={inViewSm}
                transition={{
                  duration: 0.5,
                  delay: i * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="p-6 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: '3px solid rgba(250,69,0,0.4)',
                }}
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      fill="#FA4500"
                      stroke="none"
                    />
                  ))}
                </div>
                <p
                  className="text-[14px] leading-[1.7] mb-4"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="text-[14px] font-medium text-white">
                    {t.name}
                  </div>
                  <div
                    className="text-[13px]"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {t.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ──────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="text-center mb-6"
          >
            <motion.h2
              variants={itemVariants}
              className="text-[32px] md:text-[52px] font-bold leading-tight mb-4 text-white"
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

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span
              className="text-[14px] font-medium transition-colors duration-200"
              style={{
                color: annual
                  ? 'rgba(255,255,255,0.35)'
                  : 'rgba(255,255,255,0.9)',
              }}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200"
              style={{
                background: annual
                  ? '#FA4500'
                  : 'rgba(255,255,255,0.15)',
              }}
              aria-label="Toggle annual billing"
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: annual ? 'translateX(22px)' : 'translateX(4px)',
                }}
              />
            </button>
            <span
              className="text-[14px] font-medium transition-colors duration-200"
              style={{
                color: annual
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.35)',
              }}
            >
              Annual{' '}
              <span style={{ color: '#FA4500' }}>(save 20%)</span>
            </span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {pricingPlans.map((plan) => {
              const price = annual ? plan.annual : plan.monthly
              const isComingSoon = price === 'Coming soon'
              return (
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
                          fontSize: isComingSoon ? '22px' : '40px',
                          color: isComingSoon
                            ? 'rgba(255,255,255,0.25)'
                            : 'white',
                        }}
                      >
                        {price}
                      </span>
                      {plan.period && !isComingSoon && (
                        <span
                          className="text-[15px]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {plan.period}
                        </span>
                      )}
                    </div>
                    {annual && plan.name === 'Pro' && (
                      <div
                        className="text-[12px] mt-1"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        Billed yearly at $276
                      </div>
                    )}
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
                      className="block w-full text-center py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:border-white/30"
                      style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────── */}
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
          viewport={inView}
          className="max-w-[600px] mx-auto text-center relative z-10"
        >
          <motion.h2
            variants={itemVariants}
            className="text-[32px] md:text-[48px] font-bold leading-tight mb-4 text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Ready to clone the web?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-[17px] mb-10"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Start with 3 free builds today. No credit card, no bullshit.
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
          <motion.p
            variants={itemVariants}
            className="text-[13px] mt-6"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Loved by 3,000+ developers &middot; No credit card required
          </motion.p>
        </motion.div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer
        className="py-12 px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Left: Logo + tagline + social */}
            <div>
              <div className="text-[18px] font-bold text-white mb-2">
                Argus
              </div>
              <p
                className="text-[14px] leading-[1.6] mb-4"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                The AI-powered website cloner.
                <br />
                Built by{' '}
                <a
                  href="https://x.com/sammytourani"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  @sammytourani
                </a>
                .
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/SammyTourani/Argus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity duration-200 hover:opacity-80"
                  aria-label="GitHub"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="rgba(255,255,255,0.4)"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/sammytourani"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity duration-200 hover:opacity-80"
                  aria-label="Twitter"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="rgba(255,255,255,0.4)"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Center: Product links */}
            <div>
              <h4
                className="text-[13px] font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Product
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Builder', href: '/builder' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Sign In', href: '/sign-in' },
                  { label: 'Sign Up', href: '/sign-up' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] transition-colors duration-200 hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Company links */}
            <div>
              <h4
                className="text-[13px] font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Company
              </h4>
              <ul className="space-y-2.5">
                {[
                  {
                    label: 'GitHub',
                    href: 'https://github.com/SammyTourani/Argus',
                    external: true,
                  },
                  { label: 'Privacy', href: '/privacy', external: false },
                  { label: 'Terms', href: '/terms', external: false },
                  {
                    label: 'Changelog',
                    href: '#pricing',
                    external: false,
                  },
                ].map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] transition-colors duration-200 hover:text-white"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[14px] transition-colors duration-200 hover:text-white"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-6 text-center text-[13px]"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            &copy; 2026 Argus &middot; Built with Claude Opus 4.6 &middot;
            Deployed on Vercel
          </div>
        </div>
      </footer>
    </div>
  )
}
