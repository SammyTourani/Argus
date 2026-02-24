# Argus Landing Page — Full Claude Code Handoff

## Your Mission
Build a premium, unique landing page for **Argus** — an AI website cloning SaaS (won Google × Cerebral Valley Hackathon, 3K+ users). The current baseline (`33a1daa`) has a simple placeholder landing page. You are replacing everything below the Nav with a world-class landing page.

**DO NOT** touch the App Router pages, auth flows, API routes, or anything outside of:
- `app/page.tsx` (the landing page)
- `app/globals.css` (add keyframes/utility classes)  
- `styles/design-system/colors.css` (add dark mode variables at the bottom)
- `components/` (add new components — never remove existing ones)
- `components/shared/header/` (minor updates only: add ThemeToggle, fix branding)

---

## Repo State at Baseline (`33a1daa`)

**Branch:** `feature/saas-transformation`  
**Working directory:** `/Users/sammytourani/.openclaw/workspace/argus`  
**Build command:** `pnpm build`  
**Dev server:** `pnpm dev` at http://localhost:3000  

### Existing Components to PRESERVE (do not touch internals)
- `components/app/(home)/sections/hero/Background/Background` — `HomeHeroBackground`
- `components/app/(home)/sections/hero/Background/BackgroundOuterPiece` — `BackgroundOuterPiece`
- `components/shared/effects/flame/hero-flame` — `HeroFlame`
- `components/LandingHeroInput` — URL input box (https://example.com format)
- `components/shared/layout/curvy-rect` — `Connector`
- `components/shared/header/` — Nav (preserve all; minor text fixes below)

### Components to REMOVE from page.tsx
- `HomeHeroPixi` (import + usage) — replaced by `AsciiBackground` video

### Existing Design Tokens (use these — DO NOT rename)
```css
/* Key tokens from styles/design-system/colors.css */
--heat-100: #fa5d19           /* Orange — CTAs ONLY */
--heat-4 / --heat-8 / --heat-40  /* Orange tints */
--accent-black: #262626        /* Primary text */
--border-faint: #ededed
--border-muted: #e8e8e8
--background-base: #f9f9f9
--background-lighter: #fbfbfb
--black-alpha-24/32/48/64      /* Text opacity variants */

/* Tailwind classes from this design system */
text-accent-black, bg-background-base, bg-background-lighter
border-border-faint, border-border-muted
text-heat-100, bg-heat-100, bg-heat-4, border-heat-40
text-black-alpha-48, text-black-alpha-32, text-black-alpha-64
cmw-container    /* max-width container */
text-title-h2, text-title-h3, text-title-h4
text-body-large, text-label-small, text-label-x-small
```

---

## STEP 1: Add Dark Mode Variables to `styles/design-system/colors.css`

Append at the bottom of the file:

```css
/* ─── Argus Dark Mode ──────────────────────────────────────── */
:root {
  --color-bg-page: #f9f9f9;          /* used by LogoMarquee gradient fade */
  --color-ascii-opacity: 0.06;       /* AsciiBackground video opacity */
}

.dark {
  --color-bg-page: #0b0b0e;
  --color-ascii-opacity: 0.10;
  --background-base: #0b0b0e;
  --background-lighter: #111116;
  --accent-black: #f0f0f0;
  --border-faint: #1e1e24;
  --border-muted: #252530;
  --black-alpha-24: rgba(255,255,255,0.24);
  --black-alpha-32: rgba(255,255,255,0.32);
  --black-alpha-48: rgba(255,255,255,0.48);
  --black-alpha-64: rgba(255,255,255,0.64);
}
```

---

## STEP 2: Add CSS to `app/globals.css`

Add these keyframes and utilities:

```css
/* ─── Logo Marquee ─────────────────────────────────────────── */
@keyframes logo-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-logo-scroll {
  animation: logo-scroll 30s linear infinite;
  will-change: transform;
}

/* ─── Cursor blink ─────────────────────────────────────────── */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.animate-cursor-blink {
  animation: cursor-blink 1s step-end infinite;
}

/* ─── Scrolling feed (antimetal.com) ───────────────────────── */
@keyframes feed-scroll {
  0%  { transform: translateY(0); }
  to  { transform: translateY(-50%); }
}
.animate-feed-scroll {
  animation: feed-scroll 40s linear infinite;
}
```

---

## STEP 3: Nav Updates in `components/shared/header/`

### `components/shared/header/_svg/Logo.tsx`
Replace contents with:
```tsx
export function Logo() {
  return <span className="text-xl font-bold text-accent-black dark:text-white">Argus</span>
}
```

### `components/shared/header/Nav/Nav.tsx`
- Remove all `docs.firecrawl.dev` links
- Change GitHub link to `https://github.com/SammyTourani/Argus`
- Remove the "Docs" nav item entirely (no docs exist yet)
- Add `<ThemeToggle />` import to the nav right side

### `components/shared/header/Dropdown/Stories/Stories.tsx`
Change subtitle text to: `"Clone any website with Argus"`  
Change href to: `/blog`

### `components/shared/header/Dropdown/Github/Github.tsx`
Change description to: `"Argus — AI Website Cloner."`

### `components/shared/header/Github/GithubClient.tsx`
Change URL to: `"https://github.com/SammyTourani/Argus"`

---

## STEP 4: Create New Components

Create each file exactly as specified below.

---

### `components/ThemeProvider.tsx`
```tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('argus-theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('argus-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

---

### `components/ThemeToggle.tsx`
```tsx
'use client'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="p-8 rounded-8 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
```

---

### `components/IntroLoader.tsx`
Plays `argus_logo_matrix.mp4` once per browser session. User can click to skip.
```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeProvider'

export function IntroLoader() {
  const [show, setShow] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    if (sessionStorage.getItem('argus-intro-shown')) {
      setShow(false)
      return
    }
    sessionStorage.setItem('argus-intro-shown', '1')
  }, [])

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: theme === 'dark' ? '#0b0b0e' : '#ffffff' }}
        onClick={() => setShow(false)}
      >
        <video
          src="/argus-assets/argus_logo_matrix.mp4"
          autoPlay muted playsInline
          className={`max-w-[600px] w-full ${theme === 'dark' ? '' : 'invert'}`}
          onEnded={() => setTimeout(() => setShow(false), 300)}
        />
        <p className="absolute bottom-8 text-xs font-mono opacity-20 tracking-widest">
          CLICK TO SKIP
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
```

---

### `components/AsciiBackground.tsx`
Looping video hero background. Opacity controlled by CSS variable.
```tsx
'use client'
import { useTheme } from './ThemeProvider'

export function AsciiBackground() {
  const { theme } = useTheme()
  return (
    <video
      src="/argus-assets/ascii_matrix_argus.mp4"
      autoPlay muted playsInline loop
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none ${theme === 'dark' ? 'invert' : ''}`}
      style={{ opacity: 'var(--color-ascii-opacity)' }}
    />
  )
}
```

---

### `components/LogoMarquee.tsx`
Exact browser-use.com pattern. Doubled logo array, 30s CSS keyframe, gradient fade edges.
```tsx
const LOGOS = [
  { name: 'Anthropic', file: 'anthropic' },
  { name: 'OpenAI', file: 'openai' },
  { name: 'Google', file: 'google' },
  { name: 'Stripe', file: 'stripe' },
  { name: 'Shopify', file: 'shopify' },
  { name: 'Meta', file: 'meta' },
  { name: 'Microsoft', file: 'microsoft' },
  { name: 'Apple', file: 'apple' },
  { name: 'Airbnb', file: 'airbnb' },
  { name: 'Amazon', file: 'amazon' },
  { name: 'DeepMind', file: 'deepmind' },
  { name: 'Uber', file: 'uber' },
]

const DOUBLED = [...LOGOS, ...LOGOS]

export function LogoMarquee() {
  return (
    <section className="py-48 border-t border-border-faint">
      <p className="text-center font-mono text-[10px] text-black-alpha-24 dark:text-white/25 tracking-widest uppercase mb-24">
        Loved by builders at
      </p>
      <div className="relative overflow-hidden">
        {/* Fade edges — tied to page background */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--color-bg-page)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--color-bg-page)] to-transparent z-10 pointer-events-none" />
        {/* Scrolling strip */}
        <div
          className="flex items-center animate-logo-scroll"
          style={{ width: `${DOUBLED.length * 140}px` }}
        >
          {DOUBLED.map((logo, i) => (
            <div key={i} className="flex-shrink-0 flex items-center justify-center w-[140px] h-[40px] px-5">
              <img
                src={`/argus-assets/logos/${logo.file}.svg`}
                alt={logo.name}
                className="w-full h-full object-contain opacity-25 dark:opacity-35 grayscale"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

### `components/CloneLiveDemo.tsx`
Resend.com-inspired animated terminal. Shows Argus cloning stripe.com in real-time.
```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { time: 0,     type: 'idle' },
  { time: 1000,  type: 'url',    msg: 'https://stripe.com' },
  { time: 2500,  type: 'status', msg: 'Analyzing...' },
  { time: 3500,  type: 'log',    msg: '✓ Screenshot captured' },
  { time: 4500,  type: 'log',    msg: 'Extracting design system...' },
  { time: 5500,  type: 'log',    msg: '✓ Header.jsx generated' },
  { time: 6500,  type: 'log',    msg: '✓ Hero.jsx generated' },
  { time: 7500,  type: 'log',    msg: '⟳ Generating Showcase.jsx...' },
  { time: 8500,  type: 'log',    msg: '✓ Showcase.jsx generated' },
  { time: 9500,  type: 'log',    msg: '✓ 10 files generated' },
  { time: 10500, type: 'done',   msg: 'Build ready in 28.4s ✓' },
]

export function CloneLiveDemo() {
  const [stepIdx, setStepIdx] = useState(0)
  const [url, setUrl] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let idx = 0
    const run = () => {
      if (idx >= STEPS.length) {
        // Reset after pause
        setTimeout(() => {
          setUrl(''); setLogs([]); setDone(false); idx = 0; run()
        }, 3000)
        return
      }
      const s = STEPS[idx]
      setStepIdx(idx)
      if (s.type === 'url')    setUrl(s.msg!)
      if (s.type === 'log')    setLogs(p => [...p, s.msg!])
      if (s.type === 'done')  { setLogs(p => [...p, s.msg!]); setDone(true) }
      idx++
      setTimeout(run, 1000)
    }
    run()
  }, [])

  return (
    <section className="py-96 border-t border-border-faint">
      <div className="cmw-container">
        <div className="text-center mb-64">
          <h2 className="font-mono font-bold text-[48px] lg:text-[56px] text-accent-black dark:text-white mb-16">
            Watch Argus work
          </h2>
          <p className="text-body-large text-black-alpha-48 max-w-500 mx-auto">
            From URL to production-ready React in under 30 seconds
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-32 max-w-1000 mx-auto">
          {/* Browser mockup */}
          <div className="bg-accent-black rounded-12 overflow-hidden border border-border-faint">
            <div className="h-36 bg-black/20 border-b border-white/8 flex items-center px-12 gap-6">
              <div className="size-10 rounded-full bg-red-500/40" />
              <div className="size-10 rounded-full bg-yellow-500/40" />
              <div className="size-10 rounded-full bg-green-500/40" />
            </div>
            <div className="p-16 border-b border-white/8">
              <div className="bg-white/8 rounded-8 px-12 py-8 font-mono text-[13px] text-white/70 flex items-center gap-8">
                <span className="text-white/30">▸</span>
                <span>{url}</span>
                {stepIdx === 0 && <span className="animate-cursor-blink">|</span>}
              </div>
            </div>
            <div className="h-[280px] flex items-center justify-center relative overflow-hidden">
              <AnimatePresence>
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="font-mono text-sm text-white/60 mb-8">Preview Ready</div>
                    <div className="text-xs text-white/30 font-mono">10 React components generated</div>
                  </motion.div>
                ) : (
                  <motion.p key="waiting" className="font-mono text-xs text-white/20 tracking-widest">
                    {stepIdx > 0 ? 'ANALYZING...' : 'WAITING FOR URL'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Terminal logs */}
          <div className="bg-accent-black rounded-12 border border-border-faint p-16 font-mono text-[13px] min-h-[400px] flex flex-col">
            <div className="mb-12 flex items-center gap-8">
              <div className="size-8 rounded-full bg-heat-100" />
              <span className="text-white/40 text-xs tracking-wider">ARGUS TERMINAL</span>
            </div>
            <div className="space-y-6 flex-1">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${log.startsWith('✓') ? 'text-green-400' : log.startsWith('⟳') ? 'text-yellow-400' : 'text-white/60'}`}
                  >
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

---

### `components/AsciiEyeSection.tsx`
Dark full-width section. "Code that sees." headline. Animated eye video. Cascading "argus" text background (sandbox.cloudflare.com style).
```tsx
export function AsciiEyeSection() {
  return (
    <section className="py-80 bg-accent-black relative overflow-hidden">
      {/* Cascading "argus" background — cloudflare sandbox style */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none overflow-hidden">
        <div className="flex flex-col leading-none" style={{ gap: '-0.7em' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="font-mono font-bold text-[18vw] text-white whitespace-nowrap"
              style={i < 5 ? {
                WebkitTextStroke: '1px white',
                color: 'transparent',
                lineHeight: 0.85,
              } : { lineHeight: 0.85 }}
            >
              argusargusargus
            </span>
          ))}
        </div>
      </div>

      <div className="cmw-container text-center relative z-10">
        <p className="font-mono text-[10px] tracking-widest text-white/30 uppercase mb-16">
          The power of
        </p>
        <h2 className="font-mono font-bold text-[48px] lg:text-[64px] text-white mb-24 leading-none">
          Code that sees.
        </h2>
        <p className="text-body-large text-white/50 max-w-400 mx-auto mb-48">
          Argus doesn't just visit websites — it reads them. Every pixel, every font,
          every design decision extracted and rebuilt.
        </p>
        <div className="max-w-[480px] mx-auto">
          <video
            src="/argus-assets/animated_eye.mp4"
            autoPlay muted playsInline loop
            className="w-full invert"
          />
        </div>
      </div>
    </section>
  )
}
```

---

### `components/ParticleLogo.tsx`
Canvas-based particle effect. 384 particles sampled from logo image. Mouse repulsion + spring physics. No new dependencies.
```tsx
'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  originX: number; originY: number
  vx: number; vy: number
  size: number; opacity: number; phase: number
  nx: number; ny: number  // normalized coords for resize
}

export function ParticleLogo({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    let isDark = false
    const mouse = { x: 9999, y: 9999, smoothX: 9999, smoothY: 9999 }

    const checkDark = () => { isDark = document.documentElement.classList.contains('dark') }
    checkDark()
    const obs = new MutationObserver(checkDark)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
      if (particles.length > 0) {
        const cx = canvas.offsetWidth * 0.5
        const cy = canvas.offsetHeight * 0.5
        const scale = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.45
        particles.forEach(p => {
          p.originX = cx + (p.nx - 0.5) * scale
          p.originY = cy + (p.ny - 0.5) * scale
        })
      }
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/argus-assets/Gemini_Generated_Image_gua6pngua6pngua6.png'

    img.onload = () => {
      const SZ = 200, TARGET = 384
      const off = document.createElement('canvas')
      off.width = SZ; off.height = SZ
      const octx = off.getContext('2d')!
      octx.drawImage(img, 0, 0, SZ, SZ)
      const { data } = octx.getImageData(0, 0, SZ, SZ)

      let candidates: [number, number][] = []
      for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
        const i = (y * SZ + x) * 4
        if (data[i+3] < 32) continue
        if ((data[i]+data[i+1]+data[i+2])/3 < 128) candidates.push([x/SZ, y/SZ])
      }
      if (candidates.length < 20) {
        candidates = []
        for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
          const i = (y * SZ + x) * 4
          if (data[i+3] > 128) candidates.push([x/SZ, y/SZ])
        }
      }
      if (!candidates.length) return

      const step = Math.max(1, Math.floor(candidates.length / TARGET))
      const cx = canvas.offsetWidth * 0.5
      const cy = canvas.offsetHeight * 0.5
      const sc = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.45

      particles = candidates.filter((_, i) => i % step === 0).slice(0, TARGET).map(([nx, ny]) => ({
        x: cx+(nx-0.5)*sc, y: cy+(ny-0.5)*sc,
        originX: cx+(nx-0.5)*sc, originY: cy+(ny-0.5)*sc,
        vx: 0, vy: 0,
        size: 1.5+Math.random(), opacity: 0.6+Math.random()*0.4,
        phase: Math.random()*Math.PI*2,
        nx, ny,
      }))

      let t = 0
      const frame = () => {
        t++
        checkDark()
        mouse.smoothX += (mouse.x - mouse.smoothX) * 0.2
        mouse.smoothY += (mouse.y - mouse.smoothY) * 0.2
        const w = canvas.offsetWidth, h = canvas.offsetHeight
        ctx.fillStyle = isDark ? 'rgba(10,10,10,0.3)' : 'rgba(255,255,255,0.3)'
        ctx.fillRect(0, 0, w, h)
        const repelR = w * 0.13
        particles.forEach(p => {
          const dx = p.x - mouse.smoothX, dy = p.y - mouse.smoothY
          const dist = Math.sqrt(dx*dx+dy*dy)
          if (dist < repelR && dist > 0.1) {
            const force = (1 - dist/repelR) * 2.0
            p.vx += (dx/dist)*force; p.vy += (dy/dist)*force
          }
          const idleX = Math.sin(t*0.02+p.phase)*3, idleY = Math.cos(t*0.015+p.phase)*3
          p.vx += (p.originX+idleX-p.x)*0.08; p.vy += (p.originY+idleY-p.y)*0.08
          p.vx *= 0.85; p.vy *= 0.85
          p.x += p.vx; p.y += p.vy
          const disp = Math.hypot(p.x-p.originX, p.y-p.originY)
          ctx.globalAlpha = Math.min(1, p.opacity + disp*0.004)
          ctx.fillStyle = isDark ? '#ffffff' : '#0d0d0d'
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill()
        })
        ctx.globalAlpha = 1
        animId = requestAnimationFrame(frame)
      }
      animId = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top
    }
    const onLeave = () => { mouse.x = 9999; mouse.y = 9999 }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    resize()
    return () => {
      cancelAnimationFrame(animId); ro.disconnect(); obs.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className={`w-full h-full ${className??''}`} style={{ touchAction: 'none', display: 'block' }} />
  )
}
```

---

### `components/ScrollingFeed.tsx`
Antimetal.com-style vertically scrolling commit/file feed. Mask gradient fade at top and bottom.
```tsx
'use client'

const FEED_ITEMS = [
  { icon: '✓', text: 'Header.jsx generated',          color: 'text-green-400' },
  { icon: '✓', text: 'Hero.jsx generated',             color: 'text-green-400' },
  { icon: '✓', text: 'Design tokens extracted',        color: 'text-green-400' },
  { icon: '✓', text: 'Navigation.jsx ready',           color: 'text-green-400' },
  { icon: '⟳', text: 'Generating Pricing.jsx...',      color: 'text-yellow-400' },
  { icon: '✓', text: 'Footer.jsx generated',           color: 'text-green-400' },
  { icon: '✓', text: 'Colors.css extracted',           color: 'text-green-400' },
  { icon: '✓', text: 'Typography system rebuilt',      color: 'text-green-400' },
  { icon: '✓', text: 'Modal.jsx generated',            color: 'text-green-400' },
  { icon: '⟳', text: 'Applying brand styles...',       color: 'text-yellow-400' },
  { icon: '✓', text: 'Animations replicated',          color: 'text-green-400' },
  { icon: '✓', text: 'Build complete — 10 files',      color: 'text-heat-100' },
]

const DOUBLED = [...FEED_ITEMS, ...FEED_ITEMS]

export function ScrollingFeed() {
  return (
    <div
      className="relative overflow-hidden h-[320px]"
      style={{
        maskImage: 'linear-gradient(transparent 0%, black 20%, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
    >
      <div className="animate-feed-scroll">
        {DOUBLED.map((item, i) => (
          <div key={i} className="flex items-center gap-12 py-10 px-16 border-b border-border-faint font-mono text-[13px]">
            <span className={item.color}>{item.icon}</span>
            <span className="text-black-alpha-64">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/StatBar.tsx`
Daytona.io-style stat callouts. Clean number badges with context labels.
```tsx
const STATS = [
  { value: '3K+',   label: 'active users' },
  { value: '10s',   label: 'avg clone time' },
  { value: '4',     label: 'AI models' },
  { value: '#1',    label: 'Google Hackathon' },
]

export function StatBar() {
  return (
    <section className="py-64 border-t border-border-faint bg-background-lighter">
      <div className="cmw-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-32 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-8">
              <span className="font-mono font-bold text-[48px] lg:text-[56px] text-accent-black leading-none">
                {value}
              </span>
              <span className="text-label-small text-black-alpha-48 uppercase tracking-wider font-mono">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## STEP 5: Wire Everything into `app/page.tsx`

Replace `app/page.tsx` with this:

```tsx
import { HeaderProvider } from "@/components/shared/header/HeaderContext"
import HeaderWrapper from "@/components/shared/header/Wrapper/Wrapper"
import HeaderDropdownWrapper from "@/components/shared/header/Dropdown/Wrapper/Wrapper"
import HomeHeroBackground from "@/components/app/(home)/sections/hero/Background/Background"
import { BackgroundOuterPiece } from "@/components/app/(home)/sections/hero/Background/BackgroundOuterPiece"
import HomeHeroTitle from "@/components/app/(home)/sections/hero/Title/Title"
import HeroFlame from "@/components/shared/effects/flame/hero-flame"
import { Connector } from "@/components/shared/layout/curvy-rect"
import LandingHeroInput from "@/components/LandingHeroInput"
import Link from "next/link"
import { IntroLoader } from "@/components/IntroLoader"
import { AsciiBackground } from "@/components/AsciiBackground"
import { LogoMarquee } from "@/components/LogoMarquee"
import { CloneLiveDemo } from "@/components/CloneLiveDemo"
import { AsciiEyeSection } from "@/components/AsciiEyeSection"
import { ParticleLogo } from "@/components/ParticleLogo"
import { ScrollingFeed } from "@/components/ScrollingFeed"
import { StatBar } from "@/components/StatBar"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function HomePage() {
  return (
    <HeaderProvider>
      <IntroLoader />

      <div className="min-h-screen bg-background-base transition-colors duration-200">
        <HeaderDropdownWrapper />

        {/* ── Sticky Nav ── */}
        <div className="sticky top-0 left-0 w-full z-[101] bg-background-base header">
          <div className="absolute top-0 cmw-container border-x border-border-faint h-full pointer-events-none" />
          <div className="h-1 bg-border-faint w-full left-0 -bottom-1 absolute" />
          <div className="cmw-container absolute h-full pointer-events-none top-0">
            <Connector className="absolute -left-[10.5px] -bottom-11" />
            <Connector className="absolute -right-[10.5px] -bottom-11" />
          </div>
          <HeaderWrapper>
            <div className="max-w-900 mx-auto w-full flex justify-between items-center">
              <div className="flex gap-24 items-center">
                <Link href="/" className="text-xl font-bold text-accent-black">Argus</Link>
                <span className="text-label-x-small text-black-alpha-24">buildargus.com</span>
              </div>
              <div className="flex gap-8 items-center">
                <Link href="#pricing" className="text-label-small text-black-alpha-48 hover:text-black-alpha-64 px-12 py-8">
                  Pricing
                </Link>
                <Link href="/sign-in" className="text-label-small text-black-alpha-48 hover:text-black-alpha-64 px-12 py-8">
                  Sign in
                </Link>
                <ThemeToggle />
                <Link href="/sign-up" className="bg-heat-100 hover:bg-heat-90 text-white text-label-small font-semibold px-16 py-8 rounded-10 transition-all">
                  Get started →
                </Link>
              </div>
            </div>
          </HeaderWrapper>
        </div>

        {/* ── Hero ── */}
        <section className="overflow-x-clip" id="home-hero">
          <div className="pt-28 lg:pt-254 lg:-mt-100 pb-115 relative" id="hero-content">
            <AsciiBackground />
            <HeroFlame />
            <BackgroundOuterPiece />
            <HomeHeroBackground />
            <div className="relative container px-16">
              {/* Winner badge */}
              <div className="flex justify-center mb-12 lg:mb-16">
                <div className="p-4 rounded-full flex w-max mx-auto items-center inside-border before:border-border-faint">
                  <div className="px-8 text-label-x-small text-black-alpha-48">
                    &thinsp;WINNER · GOOGLE × CEREBRAL VALLEY HACKATHON
                  </div>
                  <div className="p-1">
                    <div className="size-18 bg-accent-black flex-center rounded-full">
                      <svg fill="none" height="8" viewBox="0 0 10 8" width="10">
                        <path d="M6 1L9 4L6 7" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25"/>
                        <path d="M1 4L9 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <HomeHeroTitle />
              <p className="text-body-large text-black-alpha-48 text-center mb-24 max-w-400 mx-auto">
                Clone any website. Ship it in seconds.
              </p>
              <LandingHeroInput />
            </div>
          </div>
        </section>

        {/* ── Logo Marquee ── */}
        <LogoMarquee />

        {/* ── Stats ── */}
        <StatBar />

        {/* ── How It Works ── */}
        <section className="py-96 border-t border-border-faint">
          <div className="cmw-container">
            <div className="text-center mb-64">
              <h2 className="text-title-h2 text-accent-black mb-16">From URL to clone<br/>in three steps</h2>
              <p className="text-body-large text-black-alpha-48">No configuration. No setup. Just paste and go.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
              {[
                { n: '01', title: 'Enter any URL', desc: 'Paste a URL. Argus fetches the page, extracts the design system, and analyzes the visual structure.' },
                { n: '02', title: 'AI scrapes & rebuilds', desc: 'Powered by Gemini 2.5 Pro, Claude Opus 4, and GPT-4o. Argus generates production-quality React components.' },
                { n: '03', title: 'Edit & deploy', desc: 'Chat with AI to refine the clone. Export the code or deploy directly to Vercel in one click.' },
              ].map(step => (
                <div key={step.n} className="p-32 border border-border-faint rounded-16 bg-background-base hover:border-border-muted transition-colors">
                  <div className="w-40 h-40 rounded-full border border-heat-40 bg-heat-4 flex items-center justify-center mb-20 text-label-small font-bold text-heat-100">{step.n}</div>
                  <h3 className="text-title-h4 text-accent-black mb-12">{step.title}</h3>
                  <p className="text-body-large text-black-alpha-48">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Demo Terminal ── */}
        <CloneLiveDemo />

        {/* ── Scrolling file feed ── */}
        <section className="py-64 border-t border-border-faint">
          <div className="cmw-container">
            <div className="grid lg:grid-cols-2 gap-48 items-center">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-black-alpha-24 uppercase mb-12">Real-time generation</p>
                <h2 className="text-title-h2 text-accent-black mb-16">Ship more,<br/>build faster</h2>
                <p className="text-body-large text-black-alpha-48 mb-32">
                  Watch Argus generate component after component. Every file, every style, every interaction rebuilt in real time.
                </p>
                <Link href="/sign-up" className="inline-flex items-center gap-8 bg-heat-100 hover:bg-heat-90 text-white px-24 py-12 rounded-10 text-label-small font-semibold transition-all">
                  Try it free →
                </Link>
              </div>
              <ScrollingFeed />
            </div>
          </div>
        </section>

        {/* ── ASCII Eye ── */}
        <AsciiEyeSection />

        {/* ── Particle Logo / Features ── */}
        <section className="py-96 border-t border-border-faint">
          <div className="cmw-container">
            <div className="grid lg:grid-cols-2 gap-48 items-start">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-black-alpha-24 uppercase mb-12">Argus</p>
                <h2 className="text-title-h2 text-accent-black mb-24">Built to see everything</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                  {[
                    { title: 'Design extraction', desc: 'Colors, fonts, spacing — all pulled automatically' },
                    { title: 'Multi-model AI', desc: 'Gemini 2.5 Pro, Claude Opus 4, GPT-4o, Kimi K2' },
                    { title: 'Live sandbox', desc: 'Preview and iterate with AI chat in real time' },
                    { title: 'One-click deploy', desc: 'Ship to Vercel directly from the Argus editor' },
                    { title: 'Brand inheritance', desc: 'Your clone keeps the exact visual identity of the source' },
                    { title: 'Export anywhere', desc: 'Download clean React/JSX — no vendor lock-in' },
                  ].map(f => (
                    <div key={f.title} className="p-20 border border-border-faint rounded-12 hover:border-border-muted transition-colors">
                      <h3 className="text-label-small font-semibold text-accent-black mb-6">{f.title}</h3>
                      <p className="text-body-large text-black-alpha-48">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Particle canvas */}
              <div className="relative h-[400px] hidden lg:block">
                <ParticleLogo className="absolute inset-0" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonial ── */}
        <section className="py-64 border-t border-border-faint bg-background-lighter">
          <div className="cmw-container max-w-640 mx-auto text-center">
            <blockquote className="text-title-h3 text-accent-black mb-24">
              "Cloned our competitor's landing page in 45 seconds. Used the output as our new design system base."
            </blockquote>
            <div className="flex items-center justify-center gap-12">
              <div className="w-32 h-32 rounded-full bg-heat-100 flex items-center justify-center text-white text-label-small font-bold">JR</div>
              <span className="text-body-large text-black-alpha-48">Jake R. · Senior Engineer at Fintech Startup</span>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="py-96 border-t border-border-faint" id="pricing">
          <div className="cmw-container">
            <div className="text-center mb-64">
              <h2 className="text-title-h2 text-accent-black mb-16">Simple, transparent pricing</h2>
              <p className="text-body-large text-black-alpha-48">Start for free. No credit card required.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 max-w-900 mx-auto">
              <div className="p-32 border border-border-faint rounded-16">
                <div className="text-label-small text-black-alpha-48 mb-8">Free</div>
                <div className="text-title-h2 text-accent-black mb-4">$0</div>
                <div className="text-body-large text-black-alpha-32 mb-32">Forever free</div>
                <ul className="space-y-12 mb-32 text-body-large text-black-alpha-64">
                  <li>✓ 3 builds/month</li>
                  <li>✓ Public builds</li>
                  <li>✓ All AI models</li>
                  <li>✓ ZIP export</li>
                </ul>
                <Link href="/sign-up" className="block w-full text-center border border-border-muted text-accent-black py-12 rounded-10 text-label-small font-semibold hover:bg-background-lighter transition-all">
                  Start for free
                </Link>
              </div>
              <div className="p-32 border border-heat-40 rounded-16 relative bg-heat-4">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-heat-100 text-white text-label-x-small font-bold px-12 py-4 rounded-full">
                  MOST POPULAR
                </div>
                <div className="text-label-small text-heat-100 mb-8">Pro</div>
                <div className="text-title-h2 text-accent-black mb-4">$29<span className="text-title-h4">/mo</span></div>
                <div className="text-body-large text-black-alpha-32 mb-32">Billed monthly</div>
                <ul className="space-y-12 mb-32 text-body-large text-black-alpha-64">
                  <li>✓ Unlimited builds</li>
                  <li>✓ Private builds</li>
                  <li>✓ Priority models</li>
                  <li>✓ Vercel deploy</li>
                  <li>✓ Custom instructions</li>
                </ul>
                <Link href="/sign-up?plan=pro" className="block w-full text-center bg-heat-100 hover:bg-heat-90 text-white py-12 rounded-10 text-label-small font-semibold transition-all">
                  Start Pro trial
                </Link>
              </div>
              <div className="p-32 border border-border-faint rounded-16">
                <div className="text-label-small text-black-alpha-48 mb-8">Team</div>
                <div className="text-title-h2 text-accent-black mb-4">Soon</div>
                <div className="text-body-large text-black-alpha-32 mb-32">Coming Q2 2026</div>
                <ul className="space-y-12 mb-32 text-body-large text-black-alpha-64">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Team workspaces</li>
                  <li>✓ SSO</li>
                  <li>✓ Priority support</li>
                </ul>
                <div className="block w-full text-center border border-border-faint text-black-alpha-32 py-12 rounded-10 text-label-small font-semibold">
                  Notify me
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-96 border-t border-border-faint">
          <div className="cmw-container text-center">
            <h2 className="text-title-h2 text-accent-black mb-16">Ready to clone<br/>the web?</h2>
            <p className="text-body-large text-black-alpha-48 mb-40">Start with 3 free builds. No credit card required.</p>
            <Link href="/sign-up" className="inline-flex items-center gap-8 bg-heat-100 hover:bg-heat-90 text-white px-40 py-16 rounded-12 text-body-large font-bold transition-all">
              Start building for free →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-48 border-t border-border-faint">
          <div className="cmw-container flex flex-col lg:flex-row justify-between items-center gap-24">
            <div>
              <div className="text-xl font-bold text-accent-black mb-4">Argus</div>
              <div className="text-label-small text-black-alpha-32">Code that clones. AI that sees.</div>
            </div>
            <div className="flex gap-32">
              {[['Pricing','#pricing'],['Sign in','/sign-in'],['Sign up','/sign-up'],['Privacy','/privacy'],['Terms','/terms']].map(([l,h]) => (
                <Link key={h} href={h} className="text-label-small text-black-alpha-48 hover:text-black-alpha-64">{l}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </HeaderProvider>
  )
}
```

---

## STEP 6: Wrap layout with ThemeProvider

In `app/layout.tsx`, import and wrap with `ThemeProvider`:

```tsx
import { ThemeProvider } from "@/components/ThemeProvider"

// In the <body> or root div, wrap children:
<ThemeProvider>
  {children}
</ThemeProvider>
```

Also add `suppressHydrationWarning` to the `<html>` tag.

---

## STEP 7: Remove `HomeHeroPixi` import

In `app/page.tsx` (already done in the replacement above — do NOT import `HomeHeroPixi`).

Also remove from `app/page.tsx` in `components/app/(home)/sections/hero/Pixi/Pixi.tsx` — just don't import it. Don't delete the file.

---

## Assets Available (in `public/argus-assets/`)

```
argus_logo_matrix.mp4     → IntroLoader video
ascii_matrix_argus.mp4    → AsciiBackground hero video
animated_eye.mp4          → AsciiEyeSection eye video
argus.mp4                 → Product demo (not used yet)

Gemini_Generated_Image_gua6pngua6pngua6.png  → ParticleLogo source image (brain/eye logo)
Gemini_Generated_Image_460y8y460y8y460y.png  → ASCII "ARGUS" dripping wordmark
Gemini_Generated_Image_77omr977omr977om.png  → ASCII "ARGUS" clean wordmark
Gemini_Generated_Image_o5wpfzo5wpfzo5wp.png  → Logo with green matrix fragments

logos/
  airbnb.svg, amazon.svg, anthropic.svg, apple.svg,
  deepmind.svg, google.svg, meta.svg, microsoft.svg,
  openai.svg, palantir.svg, sentry.svg, shopify.svg,
  snowflake.svg, stripe.svg, uber.svg, zapier.svg
```

---

## Hard Rules

1. **`pnpm build` must exit 0** after every change. Fix TypeScript errors; don't suppress them with `@ts-ignore`.
2. **No new npm packages.** Existing: Next.js 15, Tailwind CSS, Framer Motion, PixiJS. Use only these.
3. **Orange (`#fa5d19` / `bg-heat-100`) for CTAs ONLY** — not decorative elements.
4. **Never rename `--heat-*` CSS variables** — they're used across hundreds of components.
5. **Never push to `main`** — all work stays on `feature/saas-transformation`.
6. **`suppressHydrationWarning` on `<html>` tag** in `app/layout.tsx`.
7. **Dark mode**: `class="dark"` on `<html>` via ThemeProvider. Light mode is default.
8. **Keep**: HeroFlame, HomeHeroBackground, BackgroundOuterPiece, LandingHeroInput, winner badge.
9. **Remove**: HomeHeroPixi (from imports and usage — don't delete the file itself).
10. **Logo SVGs**: display with `opacity-25 dark:opacity-35 grayscale` — never full color.
11. **Firecrawl API routes**: Never touch `app/api/*` — Firecrawl is the scraping engine, keep it.

---

## What Was Wrong With Previous Attempt

The previous attempt had context/token issues and produced a broken page. Specific problems:
- Dark mode backgrounds weren't applying (missing CSS variable overrides)  
- IntroLoader exit animation didn't clean up properly  
- CloneLiveDemo used `setTimeout` inside `setInterval` causing timer drift  
- Stats section had visual issues  
- Some components weren't properly exported as named exports

The components above are the corrected versions — use them exactly.

---

## Verification Steps

After implementing all steps:
1. `pnpm build` — must exit 0
2. `pnpm dev` — open localhost:3000
3. Verify: intro loader plays on first visit, not on refresh
4. Verify: dark mode toggle switches entire page cleanly
5. Verify: logo marquee scrolls smoothly
6. Verify: terminal demo animates in a loop
7. Verify: particle logo reacts to mouse hover (desktop only)
8. Verify: eye section background text is barely visible (3.5% opacity)
9. Git commit all changes on `feature/saas-transformation`
