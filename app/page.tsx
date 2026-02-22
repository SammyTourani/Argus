'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/* ── Framer helpers ─────────────────────────────────────────────── */
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
})

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.6, delay, ease: EASE },
})

/* ── Progress bar animated mockup ──────────────────────────────── */
function HeroMockup() {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)
  const phases = ['Scraping…', 'Analyzing design…', 'Building components…', 'Done ✓']

  useEffect(() => {
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 82) { clearInterval(interval); return 82 }
          return p + 1
        })
      }, 30)
      return () => clearInterval(interval)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (progress < 20) setPhase(0)
    else if (progress < 50) setPhase(1)
    else if (progress < 82) setPhase(2)
    else setPhase(3)
  }, [progress])

  return (
    <motion.div {...inView(0.4)} style={{
      background: '#0e0e0e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      overflow: 'hidden',
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#ff5f57','#febc2e','#28c840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
          https://stripe.com
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{phases[phase]}</span>
        <span style={{ fontSize: '12px', color: '#FA4500', fontWeight: 600 }}>{progress}%</span>
      </div>
      <div style={{ margin: '6px 16px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #FA4500, #ff7a3d)', width: `${progress}%`, borderRadius: '4px', transition: 'width 0.1s linear' }} />
      </div>

      {/* Fake Stripe clone UI */}
      <div style={{ padding: '16px' }}>
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Payment Details</span>
            <span style={{ fontSize: '11px', color: '#FA4500', background: 'rgba(250,69,0,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Stripe-inspired</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Card Number</div>
            <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>
              •••• •••• •••• 4242
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[['Expiry','12/27'],['CVV','•••']].map(([l,v],i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{l}</div>
                <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#635BFF', borderRadius: '8px', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Pay $99.00
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const s = {
    section: { padding: '120px 24px' as const },
    container: { maxWidth: '1080px', margin: '0 auto' } as const,
    narrow: { maxWidth: '680px', margin: '0 auto', textAlign: 'center' as const },
  }

  const companies = ['Y Combinator','Vercel','Stripe','OpenAI','Anthropic','Google','Supabase','Linear']

  return (
    <div style={{ background: '#080808', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(16px)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#FA4500', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em' }}>Argus</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="#pricing" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Pricing</Link>
          <Link href="/sign-in" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Sign in</Link>
          <Link href="/sign-up" style={{ textDecoration: 'none', background: '#FA4500', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>Get started →</Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ ...s.section, paddingTop: '100px', paddingBottom: '80px', textAlign: 'center' }}>
        <div style={s.container}>
          <motion.div {...fadeUp(0)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(250,69,0,0.08)', border: '1px solid rgba(250,69,0,0.2)',
            borderRadius: '20px', padding: '5px 14px', marginBottom: '32px',
            fontSize: '13px', color: 'rgba(255,255,255,0.6)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FA4500', display: 'inline-block' }} />
            AI-POWERED WEBSITE CLONING · NOW WITH CLAUDE OPUS 4.6
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px', margin: '0 0 24px' }}>
            Clone any website.<br />
            <span style={{ color: '#FA4500' }}>Ship it in seconds.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Enter any URL. Argus scrapes it, extracts the design system, and rebuilds it in a sandboxed environment — powered by Claude, Gemini, and Kimi K2.
          </motion.p>

          <motion.div {...fadeUp(0.3)} style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link href="/sign-up" style={{ background: '#FA4500', color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '16px' }}>Start for free →</Link>
            <Link href="#demo" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: '10px', fontWeight: 600, fontSize: '16px' }}>▶ Watch demo</Link>
          </motion.div>

          <motion.div {...fadeUp(0.35)} style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            {['3,000+ websites cloned', 'No credit card required', 'Free tier available'].map((t,i) => (
              <span key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#4ade80' }}>✓</span> {t}
              </span>
            ))}
          </motion.div>

          {/* Hero mockup */}
          <HeroMockup />
        </div>
      </section>

      {/* ── TRUSTED BY ───────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px' }}>
        <div style={s.container}>
          <motion.div {...inView()}>
            <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '32px' }}>
              TRUSTED BY ENGINEERS AT
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '40px 48px' }}>
              {companies.map(c => (
                <span key={c} style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.02em', userSelect: 'none' }}>{c}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SINGLE TESTIMONIAL ───────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ ...s.container, ...s.narrow }}>
          <motion.div {...inView()}>
            <p style={{ fontSize: '26px', fontWeight: 500, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginBottom: '24px' }}>
              &ldquo;Cloned our competitor&rsquo;s landing page in 45 seconds. Used the output as our new design system base.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FA4500,#ff7a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>J</div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Jake R.</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Indie Hacker, 4K MRR</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ ...s.section }}>
        <div style={s.container}>
          <motion.div {...inView()} style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px' }}>From URL to clone<br />in three steps</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '17px', maxWidth: '400px', margin: '0 auto' }}>No configuration. No setup. Just paste and go.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2px' }}>
            {[
              { n:'01', title:'Enter any URL', desc:'Paste any website URL. From minimal landing pages to complex web apps — Argus handles it.' },
              { n:'02', title:'AI scrapes & rebuilds', desc:'Firecrawl extracts the design system. AI agents analyze layout and rebuild it from scratch.' },
              { n:'03', title:'Edit & deploy', desc:'Iterate with AI chat to perfect the clone. Export the code or deploy directly to production.' },
            ].map((step, i) => (
              <motion.div key={i} {...inView(i * 0.1)} style={{ padding: '40px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
                <div style={{ fontSize: '56px', fontWeight: 800, color: '#FA4500', opacity: 0.25, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '20px' }}>{step.n}</div>
                <h3 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE 1: AI-Powered Cloning ───────────────────────── */}
      <section style={{ ...s.section }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center' }}>
          <motion.div {...inView()}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FA4500', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>AI-Powered Cloning</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: 1.1 }}>Pick your model.<br />Watch it build.</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: 1.7, marginBottom: '28px' }}>
              Choose from Claude Opus 4.6, Gemini 2.5 Pro, or Kimi K2. Each brings different strengths to extracting and rebuilding your target website.
            </p>
            <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: '#4ade80' }}>clone</span>(<span style={{ color: '#fbbf24' }}>&quot;https://stripe.com&quot;</span>, {'{'}<br />
              &nbsp;&nbsp;style: <span style={{ color: '#fbbf24' }}>&quot;glassmorphism&quot;</span>,<br />
              &nbsp;&nbsp;model: <span style={{ color: '#fbbf24' }}>&quot;claude&quot;</span><br />
              {'}'})
            </div>
          </motion.div>

          <motion.div {...inView(0.15)}>
            <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#141414', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>argus.build/builder</div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
                  {['URL Input','Scraping','Building','Complete'].map((s,i) => (
                    <span key={i} style={{ fontSize: '11px', color: i < 2 ? '#FA4500' : i === 2 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>} {i < 2 ? '✓' : ''} {s}
                    </span>
                  ))}
                </div>
                {[
                  { label: 'AI-Powered Cloning', sub: 'Claude Opus 4.6 · 3 components' },
                  { label: 'Design Extraction', sub: 'Glassmorphism · 12 tokens' },
                  { label: 'Sandbox Preview', sub: 'Vite 5.0 · Hot reload ready' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{item.sub}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '3px 8px', borderRadius: '4px' }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURE 2: Live Sandbox ──────────────────────────────── */}
      <section style={{ ...s.section }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center' }}>
          <motion.div {...inView(0.15)} style={{ order: 0 }}>
            <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#141414', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {['#ff5f57','#febc2e','#28c840'].map((c,i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>localhost:5173 — Sandboxed</span>
              </div>
              <div style={{ padding: '24px' }}>
                {/* Fake payment form preview */}
                <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ height: '12px', width: '60%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '16px' }} />
                  {[['60%','40%'],['100%'],['100%']].map((ws, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      {ws.map((w,j) => <div key={j} style={{ height: '32px', width: w, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }} />)}
                    </div>
                  ))}
                  <div style={{ height: '40px', background: '#FA4500', borderRadius: '8px', opacity: 0.8 }} />
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Hot reload active</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...inView()}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FA4500', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Live Sandbox Preview</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: 1.1 }}>See it build<br />in real time.</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: 1.7 }}>
              Generated code runs in a real sandboxed Vite environment with hot-reload. Watch your clone come alive as each component renders — no setup, no waiting.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURE 3: 8 Design Styles ──────────────────────────── */}
      <section style={{ ...s.section }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center' }}>
          <motion.div {...inView()}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FA4500', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>8 Design Styles</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: 1.1 }}>Your clone.<br />Any aesthetic.</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: 1.7 }}>
              Transform any website into Glassmorphism, Neumorphism, Brutalist, Minimal, Dark Mode, Gradient Rich, 3D Depth, or Retro Wave. Same content, completely different vibe.
            </p>
          </motion.div>

          <motion.div {...inView(0.15)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { name: 'Glassmorphism', bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', blur: true },
                { name: 'Neumorphism', bg: '#1a1a1a', shadow: '4px 4px 8px #111, -4px -4px 8px #222' },
                { name: 'Brutalist', bg: '#fff', color: '#000', border: '2px solid #000' },
                { name: 'Dark Mode', bg: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' },
                { name: 'Gradient Rich', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
                { name: '3D Depth', bg: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', shadow: '0 8px 16px rgba(0,0,0,0.4)' },
                { name: 'Minimal', bg: '#fafafa', color: '#111' },
                { name: 'Retro Wave', bg: 'linear-gradient(135deg, #0d0d0d, #1a0533)', border: '1px solid rgba(220,0,255,0.3)' },
              ].map((style, i) => (
                <div key={i} style={{
                  background: style.bg || 'transparent',
                  border: style.border || 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  color: style.color || '#fff',
                  boxShadow: style.shadow,
                  backdropFilter: style.blur ? 'blur(8px)' : undefined,
                }}>
                  <div style={{ height: '20px', width: '50%', background: style.color ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', borderRadius: '3px', marginBottom: '6px' }} />
                  <div style={{ height: '8px', width: '80%', background: style.color ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '4px' }} />
                  <p style={{ fontSize: '10px', fontWeight: 600, opacity: 0.5, margin: '8px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{style.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" style={{ ...s.section }}>
        <div style={s.container}>
          <motion.div {...inView()} style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px' }}>Simple, transparent pricing</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '17px' }}>Start free. Scale when you&apos;re ready.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxWidth: '860px', margin: '0 auto' }}>
            {/* Free */}
            <motion.div {...inView(0)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px' }}>
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Free</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.04em' }}>$0</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>/month</span>
              </div>
              {['3 builds per month','All 8 design styles','All AI models','Code export'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#4ade80', fontSize: '13px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
              <Link href="/sign-up" style={{ display: 'block', marginTop: '24px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', padding: '11px', borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>Start for free</Link>
            </motion.div>

            {/* Pro */}
            <motion.div {...inView(0.1)} style={{ background: 'rgba(250,69,0,0.05)', border: '1px solid rgba(250,69,0,0.3)', borderRadius: '16px', padding: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#FA4500', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Pro</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.04em' }}>$29</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>/month</span>
              </div>
              {['Unlimited builds','Priority sandbox','All features included','Iterative AI chat','Brand style extension'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#FA4500', fontSize: '13px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
              <Link href="/api/stripe/create-checkout-session" style={{ display: 'block', marginTop: '24px', background: '#FA4500', color: '#fff', textDecoration: 'none', padding: '11px', borderRadius: '8px', textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>Start Pro trial</Link>
            </motion.div>

            {/* Team */}
            <motion.div {...inView(0.2)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', opacity: 0.75 }}>
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Team</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.5)' }}>Coming soon</span>
              </div>
              {['Custom pricing','Team collaboration','Shared projects','Admin dashboard','Priority support'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{f}</span>
                </div>
              ))}
              <button style={{ display: 'block', width: '100%', marginTop: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.5)', padding: '11px', borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Notify me</button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px' }}>
        <div style={{ ...s.container, ...s.narrow }}>
          <motion.div {...inView()}>
            <h2 style={{ fontSize: 'clamp(36px,6vw,60px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px' }}>Ready to clone<br />the web?</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '17px', marginBottom: '36px' }}>Start with 3 free builds. No credit card required.</p>
            <Link href="/sign-up" style={{ display: 'inline-block', background: '#FA4500', color: '#fff', textDecoration: 'none', padding: '16px 36px', borderRadius: '12px', fontWeight: 700, fontSize: '18px' }}>Start building for free →</Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px' }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <p style={{ color: '#FA4500', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Argus</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', lineHeight: 1.6 }}>Clone any website with AI.<br />Ship in seconds.</p>
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>Product</p>
            {['Features','Pricing','Dashboard','API docs'].map(l => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <Link href="#" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{l}</Link>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>Legal</p>
            {['Privacy','Terms'].map(l => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <Link href={`/${l.toLowerCase()}`} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{l}</Link>
              </div>
            ))}
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', marginTop: '24px' }}>© 2026 Argus</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        html { scroll-behavior: smooth }
      `}</style>
    </div>
  )
}
