"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border-faint py-32 lg:py-48 bg-background-base">
      <div className="max-w-900 mx-auto px-16 lg:px-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-8">
              <span className="text-title-h5 text-accent-black font-sans">Argus</span>
              <span className="text-mono-x-small text-black-alpha-32 border border-border-faint rounded-full px-8 py-2">
                v1.0
              </span>
            </div>
            <p className="text-body-small text-black-alpha-40 mt-4">
              Clone any website with AI.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-24 gap-y-8">
            {[
              { label: "Pricing", href: "#pricing" },
              { label: "Sign in", href: "/sign-in" },
              { label: "Sign up", href: "/sign-up" },
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "GitHub", href: "https://github.com/SammyTourani/Argus" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-body-small text-black-alpha-48 hover:text-accent-black transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-24 pt-16 border-t border-border-faint">
          <p className="text-mono-x-small text-black-alpha-24">
            &copy; {new Date().getFullYear()} Argus. Built by{" "}
            <a
              href="https://twitter.com/sammytourani"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-black transition-colors"
            >
              @sammytourani
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
