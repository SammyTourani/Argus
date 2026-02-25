'use client';

import { useEffect, useRef, useCallback } from 'react';

const CHARS = '01◆▸≡∞⚡▒░|/\\-+*#@';

export default function MatrixAsciiPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<number[]>([]);
  const speedsRef = useRef<number[]>([]);
  const animIdRef = useRef<number>(0);

  const initColumns = useCallback((canvas: HTMLCanvasElement, fontSize: number) => {
    const cols = Math.floor(canvas.width / fontSize);
    dropsRef.current = Array.from({ length: cols }, () => Math.random() * -50);
    speedsRef.current = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7);
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
      // Re-fill the background so we don't get a white flash
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, w, h);
      initColumns(canvas, fontSize);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // Fade the canvas slightly for trail effect
      ctx.fillStyle = 'rgba(8, 8, 8, 0.05)';
      ctx.fillRect(0, 0, w, h);

      const drops = dropsRef.current;
      const speeds = speedsRef.current;

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading character — bright orange
        ctx.fillStyle = 'rgba(250, 69, 0, 0.9)';
        ctx.fillText(char, x, y);

        // Draw a few trail characters behind the leading one
        for (let t = 1; t <= 3; t++) {
          if (drops[i] - t > 0) {
            const trailAlpha = 0.15 - t * 0.03;
            ctx.fillStyle = `rgba(250, 69, 0, ${Math.max(trailAlpha, 0.04)})`;
            const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
            ctx.fillText(trailChar, x, (drops[i] - t) * fontSize);
          }
        }

        // Reset column when it falls past the bottom
        if (y > h && Math.random() > 0.975) {
          drops[i] = 0;
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
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#080808' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Ghost ARGUS watermark */}
      <div className="absolute bottom-8 left-0 right-0 flex items-end justify-center pointer-events-none select-none overflow-hidden">
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 'clamp(60px, 12vw, 120px)',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.04)',
            letterSpacing: '0.15em',
            lineHeight: 1,
          }}
        >
          ARGUS
        </span>
      </div>

      {/* Top-left wordmark */}
      <div className="absolute top-6 left-6 z-10">
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '0.1em',
          }}
        >
          ARGUS
        </span>
      </div>

      {/* Orange glow top-right corner */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(250,69,0,0.15) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
