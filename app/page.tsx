import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background-base">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background-base/80 backdrop-blur-md border-b border-border-faint">
        <div className="max-w-[1200px] mx-auto px-24 h-56 flex items-center justify-between">
          <div className="flex items-center gap-32">
            <Link href="/" className="text-[20px] font-bold tracking-tight text-accent-black">
              Argus
            </Link>
            <div className="hidden md:flex items-center gap-24">
              <a href="#pricing" className="text-label-medium text-black-alpha-48 hover:text-accent-black transition-colors">
                Pricing
              </a>
              <a
                href="https://github.com/SammyTourani/Argus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-label-medium text-black-alpha-48 hover:text-accent-black transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="flex items-center gap-12">
            <Link
              href="/sign-in"
              className="text-label-medium text-black-alpha-48 hover:text-accent-black transition-colors px-12 py-8"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-label-medium font-medium text-white px-16 py-8 rounded-10 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#FA4500' }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-80 pb-64 px-24">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="inline-flex items-center gap-6 px-12 py-4 rounded-full text-label-small font-medium mb-24" style={{ background: 'rgba(250, 69, 0, 0.08)', color: '#FA4500' }}>
            <span className="w-6 h-6 rounded-full" style={{ background: '#FA4500' }} />
            AI-Powered Website Cloning
          </div>
          <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-accent-black leading-[1.05] mb-20">
            Clone any website
            <br />
            <span style={{ color: '#FA4500' }}>in seconds</span> with AI
          </h1>
          <p className="text-[18px] text-black-alpha-48 leading-relaxed max-w-[560px] mx-auto mb-40">
            Enter a URL, pick a style, and Argus rebuilds it in a sandboxed environment. Powered by multi-model AI and real-time preview.
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-8 text-label-medium font-medium text-white px-24 py-14 rounded-12 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#FA4500' }}
            >
              Start for free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a
              href="https://github.com/SammyTourani/Argus"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-8 text-label-medium font-medium text-accent-black px-24 py-14 rounded-12 border border-border-muted hover:bg-gray-50 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="pb-80 px-24">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-20 overflow-hidden border border-border-faint bg-white" style={{
            boxShadow: '0px 0px 0px 1px rgba(0,0,0,0.03), 0px 24px 64px -16px rgba(0,0,0,0.08)'
          }}>
            <div className="h-40 bg-gray-50 border-b border-border-faint flex items-center px-16 gap-8">
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="w-10 h-10 rounded-full bg-gray-200" />
              </div>
              <div className="flex-1 mx-16 h-24 bg-gray-100 rounded-6 flex items-center px-10">
                <span className="text-[11px] text-black-alpha-32 font-mono">argus.vercel.app/app</span>
              </div>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden">
              <div className="text-center relative z-10">
                <div className="w-64 h-64 rounded-full mx-auto mb-16 flex items-center justify-center" style={{ background: 'rgba(250, 69, 0, 0.08)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FA4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <p className="text-body-large text-black-alpha-48">Enter a URL, select a style, generate</p>
                <p className="text-label-small text-black-alpha-24 mt-4">Live sandbox preview with AI-generated code</p>
              </div>
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-80 px-24 bg-white border-y border-border-faint">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-56">
            <h2 className="text-[32px] font-bold tracking-tight text-accent-black mb-12">
              Everything you need to rebuild the web
            </h2>
            <p className="text-body-large text-black-alpha-48 max-w-[480px] mx-auto">
              Argus combines web scraping, AI generation, and sandboxed execution into one seamless workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FA4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                ),
                title: "AI-Powered Cloning",
                description: "Scrape any website and rebuild it with AI. Choose from GPT-5, Claude, Gemini, and Kimi K2 for generation."
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FA4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                  </svg>
                ),
                title: "Live Sandbox Preview",
                description: "Generated code runs in a real sandboxed Vite environment. See your clone come alive with hot-reload."
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FA4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                ),
                title: "8 Design Styles",
                description: "Glassmorphism, Neumorphism, Brutalism, Minimalist, Dark Mode, Gradient Rich, 3D Depth, and Retro Wave."
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FA4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                ),
                title: "Iterative Chat Editing",
                description: "After generation, chat with AI to refine your clone. Edit specific elements, add features, change styles."
              }
            ].map((feature, i) => (
              <div key={i} className="p-24 rounded-16 border border-border-faint hover:border-border-muted transition-colors bg-background-base">
                <div className="w-40 h-40 rounded-10 flex items-center justify-center mb-16" style={{ background: 'rgba(250, 69, 0, 0.08)' }}>
                  {feature.icon}
                </div>
                <h3 className="text-[16px] font-semibold text-accent-black mb-6">{feature.title}</h3>
                <p className="text-body-medium text-black-alpha-48 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-80 px-24">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-56">
            <h2 className="text-[32px] font-bold tracking-tight text-accent-black mb-12">
              Simple, transparent pricing
            </h2>
            <p className="text-body-large text-black-alpha-48">
              Start free, upgrade when you need more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Free Tier */}
            <div className="p-24 rounded-16 border border-border-faint bg-white">
              <div className="mb-20">
                <h3 className="text-label-medium font-medium text-black-alpha-48 mb-4">Free</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[36px] font-bold text-accent-black">$0</span>
                  <span className="text-body-medium text-black-alpha-32">/month</span>
                </div>
              </div>
              <ul className="space-y-10 mb-24">
                {['3 builds per month', 'All 8 design styles', 'All AI models', 'Sandbox preview', 'Code download'].map((f, i) => (
                  <li key={i} className="flex items-center gap-8 text-body-medium text-black-alpha-72">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 5" stroke="#42C366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center py-12 rounded-10 text-label-medium font-medium border border-border-muted text-accent-black hover:bg-gray-50 transition-all"
              >
                Get started
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="p-24 rounded-16 border-2 bg-white relative" style={{ borderColor: '#FA4500' }}>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-12 py-2 rounded-full text-[11px] font-semibold text-white" style={{ background: '#FA4500' }}>
                Most Popular
              </div>
              <div className="mb-20">
                <h3 className="text-label-medium font-medium text-black-alpha-48 mb-4">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[36px] font-bold text-accent-black">$29</span>
                  <span className="text-body-medium text-black-alpha-32">/month</span>
                </div>
              </div>
              <ul className="space-y-10 mb-24">
                {['Unlimited builds', 'Priority sandbox', 'All features included', 'Iterative chat editing', 'Brand style extension'].map((f, i) => (
                  <li key={i} className="flex items-center gap-8 text-body-medium text-black-alpha-72">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 5" stroke="#42C366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center py-12 rounded-10 text-label-medium font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: '#FA4500' }}
              >
                Start Pro trial
              </Link>
            </div>

            {/* Team Tier */}
            <div className="p-24 rounded-16 border border-border-faint bg-white">
              <div className="mb-20">
                <h3 className="text-label-medium font-medium text-black-alpha-48 mb-4">Team</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-black-alpha-32">Coming soon</span>
                </div>
              </div>
              <ul className="space-y-10 mb-24">
                {['Everything in Pro', 'Team collaboration', 'Shared projects', 'Admin dashboard', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-8 text-body-medium text-black-alpha-32">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 5" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="block w-full text-center py-12 rounded-10 text-label-medium font-medium border border-border-faint text-black-alpha-32 cursor-not-allowed"
              >
                Notify me
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-64 px-24 border-t border-border-faint">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-accent-black mb-12">
            Ready to clone?
          </h2>
          <p className="text-body-large text-black-alpha-48 mb-24">
            Start with 3 free builds. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-8 text-label-medium font-medium text-white px-24 py-14 rounded-12 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#FA4500' }}
          >
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-faint py-24 px-24">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="text-label-small text-black-alpha-32">
            Argus &copy; {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-16">
            <a href="https://github.com/SammyTourani/Argus" target="_blank" rel="noopener noreferrer" className="text-label-small text-black-alpha-32 hover:text-accent-black transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
