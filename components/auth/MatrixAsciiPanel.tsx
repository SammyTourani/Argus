'use client';

import { useEffect, useRef, useCallback } from 'react';

// Clean monospace characters only — no emojis, no weird symbols
const CHARS = '0123456789{}()<>/;:=[]&|!?#@$%+-*~^';

export default function MatrixAsciiPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<number[]>([]);
  const speedsRef = useRef<number[]>([]);
  const animIdRef = useRef<number>(0);

  const initColumns = useCallback((w: number, fontSize: number) => {
    const cols = Math.floor(w / fontSize);
    dropsRef.current = Array.from({ length: cols }, () => Math.random() * -60);
    speedsRef.current = Array.from({ length: cols }, () => 0.15 + Math.random() * 0.45);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 14;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, w, h);
      initColumns(w, fontSize);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // Gentle fade for longer, smoother trails
      ctx.fillStyle = 'rgba(6, 6, 6, 0.04)';
      ctx.fillRect(0, 0, w, h);

      const drops = dropsRef.current;
      const speeds = speedsRef.current;

      ctx.font = `${fontSize}px "JetBrains Mono", "Roboto Mono", monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > -fontSize * 2 && y < h + fontSize) {
          const char = CHARS[Math.floor(Math.random() * CHARS.length)];

          // Leading character — bright orange
          ctx.fillStyle = 'rgba(250, 93, 25, 0.9)';
          ctx.fillText(char, x, y);

          // Second character — slightly dimmer
          if (drops[i] - 1 > 0) {
            ctx.fillStyle = 'rgba(250, 93, 25, 0.4)';
            ctx.fillText(
              CHARS[Math.floor(Math.random() * CHARS.length)],
              x,
              (drops[i] - 1) * fontSize
            );
          }

          // Trail with exponential decay
          for (let t = 2; t <= 6; t++) {
            const trailY = (drops[i] - t) * fontSize;
            if (trailY > 0 && trailY < h) {
              const alpha = 0.18 * Math.pow(0.5, t - 1);
              ctx.fillStyle = `rgba(250, 93, 25, ${Math.max(alpha, 0.012)})`;
              ctx.fillText(
                CHARS[Math.floor(Math.random() * CHARS.length)],
                x,
                trailY
              );
            }
          }
        }

        // Reset when past bottom
        if (y > h && Math.random() > 0.98) {
          drops[i] = Math.random() * -30;
          speeds[i] = 0.15 + Math.random() * 0.45;
        }
        drops[i] += speeds[i];
      }

      animIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initColumns]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#060606' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Vignette — darkens edges for cinematic depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(6,6,6,0.6) 100%)',
        }}
      />

      {/* Top edge fade */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(6,6,6,0.7), transparent)',
        }}
      />

      {/* Bottom edge fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(6,6,6,0.5), transparent)',
        }}
      />
    </div>
  );
}
