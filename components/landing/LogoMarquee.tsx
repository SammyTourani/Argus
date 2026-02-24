"use client";

import Image from "next/image";

const LOGOS = [
  "anthropic",
  "openai",
  "google",
  "meta",
  "apple",
  "microsoft",
  "stripe",
  "shopify",
  "amazon",
  "uber",
  "airbnb",
  "deepmind",
  "palantir",
  "sentry",
  "snowflake",
  "zapier",
];

export default function LogoMarquee() {
  return (
    <section className="w-full border-t border-b border-border-faint py-24 overflow-hidden bg-background-base">
      <div className="max-w-900 mx-auto px-16 mb-12">
        <p className="text-label-x-small text-black-alpha-32 uppercase tracking-widest text-center">
          Trusted by builders at
        </p>
      </div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-40 sm:w-80 bg-gradient-to-r from-background-base to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 sm:w-80 bg-gradient-to-l from-background-base to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex animate-argus-marquee" style={{ width: "fit-content" }}>
          {/* Duplicate for seamless loop */}
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <div
              key={`${logo}-${i}`}
              className="flex-shrink-0 mx-24 lg:mx-32 flex items-center"
            >
              <Image
                src={`/argus-assets/logos/${logo}.svg`}
                alt={logo}
                width={100}
                height={28}
                className="opacity-40 hover:opacity-60 transition-opacity h-20 lg:h-24 w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
