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
    // Create project + build via API then redirect to editor with auto-start
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: new URL(target).hostname.replace('www.', ''),
          source_url: target,
        }),
      });
      const data = await res.json();
      if (res.ok && data.project?.id) {
        // Create a build for this project
        const buildRes = await fetch(`/api/projects/${data.project.id}/builds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_url: target, prompt: 'Clone ' + target }),
        });
        const buildData = await buildRes.json();
        if (buildRes.ok && buildData.build?.id) {
          // Set auto-start so editor begins generation immediately
          sessionStorage.setItem('autoStart', 'true');
          sessionStorage.setItem('targetUrl', target);
          router.push(`/workspace/${data.project.id}/build/${buildData.build.id}`);
        } else {
          // Fallback: navigate to project with latest build
          sessionStorage.setItem('autoStart', 'true');
          sessionStorage.setItem('targetUrl', target);
          router.push(`/workspace/${data.project.id}/build/latest`);
        }
      } else {
        // Not logged in — redirect to sign-up with return URL
        router.push(`/sign-up?redirect=/workspace`);
      }
    } catch {
      router.push(`/sign-up?redirect=/workspace`);
    }
  };

  return (
    <div className="max-w-552 mx-auto w-full z-[11] relative">
      {/* Dark card with subtle border glow */}
      <div
        className="bg-[var(--landing-surface)] rounded-16 relative overflow-hidden border border-[var(--landing-border)]"
        style={{
          boxShadow:
            "0 0 60px -12px rgba(250, 93, 25, 0.06), 0 25px 50px -12px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* URL Input row */}
        <label className="p-16 flex gap-8 items-center w-full border-b border-[var(--landing-border)]">
          {/* Globe icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-[var(--landing-text-tertiary)] flex-shrink-0"
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
            className="w-full bg-transparent text-body-input text-[var(--landing-text)] placeholder:text-[var(--landing-text-tertiary)] outline-none"
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
            <div className="flex gap-6 overflow-hidden flex-nowrap">
              {["stripe.com", "linear.app", "vercel.com"].map((d, i) => (
                <button
                  key={d}
                  onClick={() => setUrl(`https://${d}`)}
                  className={`text-[11px] text-[var(--landing-text-tertiary)] hover:text-[var(--landing-text-secondary)] transition-colors font-mono border border-[var(--landing-border)] rounded-6 px-8 py-4 hover:bg-black/5 flex-shrink-0 ${i === 2 ? "hidden xs:block" : ""}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleClone}
            disabled={isLoading}
            className={`bg-heat-100 hover:bg-heat-90 text-white rounded-8 px-20 py-10 text-label-small font-mono font-semibold transition-all flex items-center gap-8 flex-shrink-0 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            Clone it &rarr;
          </button>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="flex gap-16 justify-center mt-16 font-mono text-[11px] text-[var(--landing-text-faint)]">
        <span>No credit card</span>
        <span>&middot;</span>
        <span>30 free credits</span>
        <span>&middot;</span>
        <span>Free tier available</span>
      </div>
    </div>
  );
}
