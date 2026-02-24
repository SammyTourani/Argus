"use client";

import { useEffect, useRef, useCallback } from "react";

interface AsciiCanvasProps {
  className?: string;
  density?: number;
  opacity?: number;
  interactive?: boolean;
}

const CHARS = ".\":,-_^=+~";

export default function AsciiCanvas({
  className = "",
  density = 10,
  opacity = 0.06,
  interactive = true,
}: AsciiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const gridRef = useRef<
    { x: number; y: number; char: string; changeAt: number }[]
  >([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const initGrid = useCallback(
    (width: number, height: number) => {
      const grid: typeof gridRef.current = [];
      const now = performance.now();
      for (let x = 0; x < width; x += density) {
        for (let y = 0; y < height; y += density) {
          grid.push({
            x,
            y,
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            changeAt: now + 2000 + Math.random() * 3000,
          });
        }
      }
      return grid;
    },
    [density]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let animId: number;
    let lastFrame = 0;
    const targetInterval = 1000 / 24;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gridRef.current = initGrid(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Listen on parent for mouse events (canvas is pointer-events-none)
    const handleMouse = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = parent.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    if (interactive) {
      parent.addEventListener("mousemove", handleMouse);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw);

      if (time - lastFrame < targetInterval) return;
      lastFrame = time;

      const rect = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const isDark = document.documentElement.classList.contains("dark");
      const charColor = isDark ? "255,255,255" : "38,38,38";

      // Use actual font name, not CSS variable (canvas doesn't resolve CSS vars)
      const fontSize = density - 2;
      ctx.font = `${fontSize}px "Roboto Mono", "Geist Mono", monospace`;
      ctx.textBaseline = "middle";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      for (const cell of gridRef.current) {
        if (time > cell.changeAt) {
          cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          cell.changeAt = time + 2000 + Math.random() * 3000;
        }

        const drift =
          Math.sin(cell.x * 0.01 + time * 0.001) *
          Math.sin(cell.y * 0.013 + time * 0.0007) *
          3;

        let drawX = cell.x + drift;
        let drawY = cell.y + drift * 0.5;

        if (interactive) {
          const dx = drawX - mx;
          const dy = drawY - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            drawX += (dx / dist) * force * 8;
            drawY += (dy / dist) * force * 8;
          }
        }

        // Lower opacity near center so content remains readable
        const distFromCenter = Math.sqrt(
          Math.pow((drawX - centerX) / centerX, 2) +
            Math.pow((drawY - centerY) / centerY, 2)
        );
        const cellOpacity = opacity * (0.3 + distFromCenter * 0.7);

        ctx.fillStyle = `rgba(${charColor}, ${cellOpacity})`;
        ctx.fillText(cell.char, drawX, drawY);
      }
    };

    animId = requestAnimationFrame(draw);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (interactive) {
        parent.removeEventListener("mousemove", handleMouse);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [density, opacity, interactive, initGrid]);

  return (
    <div ref={parentRef} className={`absolute inset-0 w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
