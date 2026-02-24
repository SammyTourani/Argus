"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingHeroInput() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const router = useRouter();

  const handleClone = async () => {
    const target = url.trim() || "https://stripe.com";
    setIsLoading(true);
    const phases = ["Fetching page...", "Analyzing design...", "Preparing builder..."];
    for (const p of phases) {
      setPhase(p);
      await new Promise(r => setTimeout(r, 500));
    }
    router.push(`/app?url=${encodeURIComponent(target)}`);
  };

  return (
    <div className="max-w-552 mx-auto w-full z-[11] relative">
      {/* White card with subtle shadow — same as HeroInput */}
      <div
        className="bg-accent-white rounded-20 relative overflow-hidden"
        style={{
          boxShadow:
            "0px 0px 44px 0px rgba(0,0,0,0.02), 0px 88px 56px -20px rgba(0,0,0,0.03), 0px 0px 0px 1px rgba(0,0,0,0.05), 0px 0px 0px 10px #F9F9F9",
        }}
      >
        {/* URL Input row */}
        <label className="p-16 flex gap-8 items-center w-full border-b border-black-alpha-5">
          {/* Globe icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-black-alpha-24 flex-shrink-0"
          >
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
            <path
              d="M8 1.5C8 1.5 5.5 4 5.5 8C5.5 12 8 14.5 8 14.5M8 1.5C8 1.5 10.5 4 10.5 8C10.5 12 8 14.5 8 14.5M8 1.5V14.5M1.5 8H14.5"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleClone()}
            placeholder="https://example.com"
            className="w-full bg-transparent text-body-input text-accent-black placeholder:text-black-alpha-48 outline-none"
          />
        </label>

        {/* Bottom row: example URLs + button */}
        <div className="p-10 flex justify-between items-center gap-8">
          {isLoading ? (
            <div className="text-label-small text-heat-100 font-mono flex items-center gap-8">
              <span className="inline-block w-12 h-12 border-2 border-heat-20 border-t-heat-100 rounded-full animate-spin" />
              {phase}
            </div>
          ) : (
            <div className="flex gap-6 overflow-hidden">
              {["stripe.com", "linear.app", "vercel.com"].map(d => (
                <button
                  key={d}
                  onClick={() => setUrl(`https://${d}`)}
                  className="text-label-x-small text-black-alpha-48 hover:text-black-alpha-64 transition-colors font-mono border border-black-alpha-8 rounded-6 px-8 py-4 hover:bg-black-alpha-4"
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleClone}
            disabled={isLoading}
            className={`bg-heat-100 hover:bg-heat-90 text-white rounded-10 px-20 py-10 text-label-small font-semibold transition-all flex items-center gap-8 flex-shrink-0 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            Clone it &rarr;
          </button>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="flex gap-16 justify-center mt-16 text-label-x-small text-black-alpha-24">
        <span>No credit card</span>
        <span>&middot;</span>
        <span>3 free builds</span>
        <span>&middot;</span>
        <span>Free tier available</span>
      </div>
    </div>
  );
}
