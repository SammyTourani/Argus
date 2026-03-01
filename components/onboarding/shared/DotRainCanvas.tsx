'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  phaseOffset: number;
  speedMultiplier: number;
}

export default function DotRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Check reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const mqHandler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', mqHandler);

    const buildGrid = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      const dots: Dot[] = [];
      const isMobile = w < 640;
      const baseSpacing = isMobile ? 28 : 22;

      // Top 2/3 — normal spacing
      const normalRows = Math.floor((h * 0.65) / baseSpacing);
      const cols = Math.floor(w / baseSpacing);

      for (let row = 0; row < normalRows; row++) {
        for (let col = 0; col < cols; col++) {
          dots.push({
            x: col * baseSpacing + baseSpacing / 2,
            y: row * baseSpacing + baseSpacing / 2,
            phaseOffset: col * 0.15 + row * 0.25 + Math.random() * 0.5,
            speedMultiplier: 0.8 + Math.random() * 0.4,
          });
        }
      }

      // Bottom 1/3 — denser spacing
      const denseSpacing = baseSpacing * 0.6;
      const startY = h * 0.65;
      const denseRows = Math.floor((h * 0.35) / denseSpacing);
      const denseCols = Math.floor(w / denseSpacing);

      for (let row = 0; row < denseRows; row++) {
        for (let col = 0; col < denseCols; col++) {
          dots.push({
            x: col * denseSpacing + denseSpacing / 2,
            y: startY + row * denseSpacing + denseSpacing / 2,
            phaseOffset: col * 0.12 + row * 0.2 + Math.random() * 0.6,
            speedMultiplier: 0.8 + Math.random() * 0.4,
          });
        }
      }

      dotsRef.current = dots;
    };

    buildGrid();

    const draw = (time: number) => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const dots = dotsRef.current;
      const isReduced = reducedMotionRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const opacity = isReduced
          ? 0.2
          : 0.05 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.002 * dot.speedMultiplier + dot.phaseOffset));

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      if (!isReduced) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      buildGrid();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      mq.removeEventListener('change', mqHandler);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
