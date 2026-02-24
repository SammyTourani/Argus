import { HeaderProvider } from "@/components/shared/header/HeaderContext";
import HeaderWrapper from "@/components/shared/header/Wrapper/Wrapper";
import HeaderDropdownWrapper from "@/components/shared/header/Dropdown/Wrapper/Wrapper";
import HomeHeroBackground from "@/components/app/(home)/sections/hero/Background/Background";
import { BackgroundOuterPiece } from "@/components/app/(home)/sections/hero/Background/BackgroundOuterPiece";
import HomeHeroPixi from "@/components/app/(home)/sections/hero/Pixi/Pixi";
import HomeHeroTitle from "@/components/app/(home)/sections/hero/Title/Title";
import HeroFlame from "@/components/shared/effects/flame/hero-flame";
import { Connector } from "@/components/shared/layout/curvy-rect";
import LandingHeroInput from "@/components/LandingHeroInput";
import Link from "next/link";

export default function HomePage() {
  return (
    <HeaderProvider>
      <div className="min-h-screen bg-background-base">
        <HeaderDropdownWrapper />

        {/* Sticky Nav */}
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
                <Link href="/" className="text-xl font-bold text-accent-black">
                  Argus
                </Link>
                <span className="text-label-x-small text-black-alpha-24">
                  buildargus.com
                </span>
              </div>
              <div className="flex gap-8 items-center">
                <Link
                  href="#pricing"
                  className="text-label-small text-black-alpha-48 hover:text-black-alpha-64 px-12 py-8"
                >
                  Pricing
                </Link>
                <Link
                  href="/sign-in"
                  className="text-label-small text-black-alpha-48 hover:text-black-alpha-64 px-12 py-8"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-heat-100 hover:bg-heat-90 text-white text-label-small font-semibold px-16 py-8 rounded-10 transition-all"
                >
                  Get started &rarr;
                </Link>
              </div>
            </div>
          </HeaderWrapper>
        </div>

        {/* Hero */}
        <section className="overflow-x-clip" id="home-hero">
          <div
            className="pt-28 lg:pt-254 lg:-mt-100 pb-115 relative"
            id="hero-content"
          >
            <HomeHeroPixi />
            <HeroFlame />
            <BackgroundOuterPiece />
            <HomeHeroBackground />
            <div className="relative container px-16">
              {/* Winner badge */}
              <div className="flex justify-center mb-12 lg:mb-16">
                <div className="p-4 rounded-full flex w-max mx-auto items-center inside-border before:border-border-faint">
                  <div className="px-8 text-label-x-small text-black-alpha-48">
                    &thinsp;WINNER &middot; GOOGLE &times; CEREBRAL VALLEY
                    HACKATHON
                  </div>
                  <div className="p-1">
                    <div className="size-18 bg-accent-black flex-center rounded-full">
                      <svg fill="none" height="8" viewBox="0 0 10 8" width="10">
                        <path
                          d="M6 1L9 4L6 7"
                          stroke="white"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.25"
                        />
                        <path
                          d="M1 4L9 4"
                          stroke="white"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.25"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <HomeHeroTitle />

              {/* Subtitle below "Argus" */}
              <p className="text-body-large text-black-alpha-48 text-center mb-24 max-w-400 mx-auto">
                Clone any website. Ship it in seconds.
              </p>

              <LandingHeroInput />
            </div>
          </div>
        </section>

        {/* TRUSTED BY section */}
        <section className="py-64 border-t border-border-faint">
          <div className="cmw-container">
            <p className="text-center text-label-x-small text-black-alpha-24 uppercase tracking-widest mb-32">
              Trusted by engineers at
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                "Y Combinator",
                "Vercel",
                "Stripe",
                "OpenAI",
                "Anthropic",
                "Google",
                "Supabase",
                "Linear",
              ].map(c => (
                <div
                  key={c}
                  className="px-14 py-6 border border-border-faint rounded-6 text-label-small text-black-alpha-32 font-semibold"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-96 border-t border-border-faint">
          <div className="cmw-container">
            <div className="text-center mb-64">
              <h2 className="text-title-h2 text-accent-black mb-16">
                From URL to clone
                <br />
                in three steps
              </h2>
              <p className="text-body-large text-black-alpha-48">
                No configuration. No setup. Just paste and go.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
              {[
                {
                  n: "01",
                  title: "Enter any URL",
                  desc: "Paste a URL. Argus fetches the page, extracts the design system, and analyzes the visual structure.",
                },
                {
                  n: "02",
                  title: "AI scrapes & rebuilds",
                  desc: "Powered by Claude and Gemini. Argus generates production-quality React components matching the source design.",
                },
                {
                  n: "03",
                  title: "Edit & deploy",
                  desc: "Chat with AI to refine the clone. Export the code or deploy directly to Vercel in one click.",
                },
              ].map(step => (
                <div
                  key={step.n}
                  className="p-32 border border-border-faint rounded-16 bg-background-base hover:border-border-muted transition-colors"
                >
                  <div className="w-40 h-40 rounded-full border border-heat-40 bg-heat-4 flex items-center justify-center mb-20 text-label-small font-bold text-heat-100">
                    {step.n}
                  </div>
                  <h3 className="text-title-h4 text-accent-black mb-12">
                    {step.title}
                  </h3>
                  <p className="text-body-large text-black-alpha-48">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="py-64 border-t border-border-faint bg-background-lighter">
          <div className="cmw-container max-w-640 mx-auto text-center">
            <blockquote className="text-title-h3 text-accent-black mb-24">
              &ldquo;Cloned our competitor&rsquo;s landing page in 45 seconds.
              Used the output as our new design system base.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-12">
              <div className="w-32 h-32 rounded-full bg-heat-100 flex items-center justify-center text-white text-label-small font-bold">
                JR
              </div>
              <span className="text-body-large text-black-alpha-48">
                Jake R. &middot; Senior Engineer at Fintech Startup
              </span>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-96 border-t border-border-faint" id="pricing">
          <div className="cmw-container">
            <div className="text-center mb-64">
              <h2 className="text-title-h2 text-accent-black mb-16">
                Simple, transparent pricing
              </h2>
              <p className="text-body-large text-black-alpha-48">
                Start for free. No credit card required.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 max-w-900 mx-auto">
              {/* Free */}
              <div className="p-32 border border-border-faint rounded-16">
                <div className="text-label-small text-black-alpha-48 mb-8">
                  Free
                </div>
                <div className="text-title-h2 text-accent-black mb-4">$0</div>
                <div className="text-body-large text-black-alpha-32 mb-32">
                  Forever free
                </div>
                <ul className="space-y-12 mb-32 text-body-large text-black-alpha-64">
                  <li>&check; 3 builds/month</li>
                  <li>&check; Public builds</li>
                  <li>&check; All AI models</li>
                  <li>&check; ZIP export</li>
                </ul>
                <Link
                  href="/sign-up"
                  className="block w-full text-center border border-border-muted text-accent-black py-12 rounded-10 text-label-small font-semibold hover:bg-background-lighter transition-all"
                >
                  Start for free
                </Link>
              </div>
              {/* Pro - featured */}
              <div className="p-32 border border-heat-40 rounded-16 relative bg-heat-4">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-heat-100 text-white text-label-x-small font-bold px-12 py-4 rounded-full">
                  MOST POPULAR
                </div>
                <div className="text-label-small text-heat-100 mb-8">Pro</div>
                <div className="text-title-h2 text-accent-black mb-4">
                  $29
                  <span className="text-title-h4">/mo</span>
                </div>
                <div className="text-body-large text-black-alpha-32 mb-32">
                  Billed monthly
                </div>
                <ul className="space-y-12 mb-32 text-body-large text-black-alpha-64">
                  <li>&check; Unlimited builds</li>
                  <li>&check; Private builds</li>
                  <li>&check; Priority models</li>
                  <li>&check; Vercel deploy</li>
                  <li>&check; Custom instructions</li>
                </ul>
                <Link
                  href="/sign-up?plan=pro"
                  className="block w-full text-center bg-heat-100 hover:bg-heat-90 text-white py-12 rounded-10 text-label-small font-semibold transition-all"
                >
                  Start Pro trial
                </Link>
              </div>
              {/* Team */}
              <div className="p-32 border border-border-faint rounded-16">
                <div className="text-label-small text-black-alpha-48 mb-8">
                  Team
                </div>
                <div className="text-title-h2 text-accent-black mb-4">Soon</div>
                <div className="text-body-large text-black-alpha-32 mb-32">
                  Coming in Q2 2026
                </div>
                <ul className="space-y-12 mb-32 text-body-large text-black-alpha-64">
                  <li>&check; Everything in Pro</li>
                  <li>&check; Team workspaces</li>
                  <li>&check; SSO</li>
                  <li>&check; Priority support</li>
                </ul>
                <div className="block w-full text-center border border-border-faint text-black-alpha-32 py-12 rounded-10 text-label-small font-semibold">
                  Notify me
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-96 border-t border-border-faint">
          <div className="cmw-container text-center">
            <h2 className="text-title-h2 text-accent-black mb-16">
              Ready to clone
              <br />
              the web?
            </h2>
            <p className="text-body-large text-black-alpha-48 mb-40">
              Start with 3 free builds. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-8 bg-heat-100 hover:bg-heat-90 text-white px-40 py-16 rounded-12 text-body-large font-bold transition-all"
            >
              Start building for free &rarr;
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-48 border-t border-border-faint">
          <div className="cmw-container flex flex-col lg:flex-row justify-between items-center gap-24">
            <div>
              <div className="text-xl font-bold text-accent-black mb-4">
                Argus
              </div>
              <div className="text-label-small text-black-alpha-32">
                Clone any website with AI
              </div>
            </div>
            <div className="flex gap-32">
              {(
                [
                  ["Pricing", "#pricing"],
                  ["Sign in", "/sign-in"],
                  ["Sign up", "/sign-up"],
                  ["Privacy", "/privacy"],
                  ["Terms", "/terms"],
                ] as const
              ).map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-label-small text-black-alpha-48 hover:text-black-alpha-64"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </HeaderProvider>
  );
}
