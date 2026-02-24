"use client";

import { useEffect, useRef } from "react";

/**
 * Animated ASCII art divider between sections.
 * Renders a flowing line of ASCII characters that animate over time.
 */
export default function AsciiDivider({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const charsRef = useRef<string[]>([]);
  const frameRef = useRef<number>(0);

  const CHARS = "═─━┄┈╌╍░▒▓●○◆◇□■▪▫";
  const WIDTH = 60;

  useEffect(() => {
    // Initialize with random chars
    charsRef.current = Array.from({ length: WIDTH }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    );

    let animId: number;
    let lastUpdate = 0;

    const update = (time: number) => {
      animId = requestAnimationFrame(update);

      if (time - lastUpdate < 120) return;
      lastUpdate = time;

      // Shift one random position
      const pos = Math.floor(Math.random() * WIDTH);
      charsRef.current[pos] = CHARS[Math.floor(Math.random() * CHARS.length)];

      if (ref.current) {
        ref.current.textContent = `  ${charsRef.current.join("")}  `;
      }
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={`w-full py-24 lg:py-32 flex justify-center overflow-hidden ${className}`}>
      <div
        ref={ref}
        className="font-mono text-[12px] text-[var(--landing-text-faint)] tracking-[0.2em] whitespace-nowrap select-none"
      />
    </div>
  );
}
