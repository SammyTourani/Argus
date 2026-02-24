"use client";

import { useEffect, useRef, useState } from "react";

interface StatProps {
  end: number;
  suffix: string;
  label: string;
}

function AnimatedStat({ end, suffix, label }: StatProps) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const duration = 1500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [started, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-title-h3 sm:text-title-h2 lg:text-title-h1 text-white font-sans tabular-nums">
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="text-label-small text-white/40 mt-4">{label}</div>
    </div>
  );
}

export default function StatsBand() {
  return (
    <section className="w-full bg-[#0B0B0E] py-48 lg:py-64">
      <div className="max-w-900 mx-auto px-16 lg:px-24 grid grid-cols-3 gap-16">
        <AnimatedStat end={3000} suffix="+" label="sites cloned" />
        <AnimatedStat end={10} suffix="+" label="avg components" />
        <AnimatedStat end={30} suffix="s" label="avg build time" />
      </div>
    </section>
  );
}
