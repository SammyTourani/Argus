"use client";

import { useEffect, useRef, useCallback } from "react";

interface AsciiCanvasProps {
  className?: string;
  density?: number;
  opacity?: number;
  interactive?: boolean;
  codeChars?: boolean;
}

const PUNCT_CHARS = ".\":,-_^=+~";
const CODE_CHARS = "{}()<>/;:=01[]&|!?#@$%_+-*~^";

export default function AsciiCanvas({
  className = "",
  density = 16,
  opacity = 0.35,
  interactive = true,
  codeChars = true,
}: AsciiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);
  const gridRef = useRef<
    { x: number; y: number; char: string; changeAt: number; seed: number }[]
  >([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const chars = codeChars ? CODE_CHARS : PUNCT_CHARS;

  const initGrid = useCallback(
    (width: number, height: number) => {
      const grid: typeof gridRef.current = [];
      const now = performance.now();
      for (let x = 0; x < width; x += density) {
        for (let y = 0; y < height; y += density) {
          grid.push({
            x,
            y,
            char: chars[Math.floor(Math.random() * chars.length)],
            changeAt: now + 500 + Math.random() * 1500,
            seed: Math.random() * Math.PI * 2,
          });
        }
      }
      return grid;
    },
    [density, chars]
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
    const targetInterval = 1000 / 36;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gridRef.current = initGrid(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = parent.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    if (interactive) {
      parent.addEventListener("mousemove", handleMouse);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    const fontSize = Math.max(density - 4, 10);

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw);

      if (time - lastFrame < targetInterval) return;
      lastFrame = time;

      const rect = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.font = `${fontSize}px "Roboto Mono", "Geist Mono", monospace`;
      ctx.textBaseline = "middle";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const scroll = scrollRef.current;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      for (const cell of gridRef.current) {
        // Character cycling
        if (time > cell.changeAt) {
          cell.char = chars[Math.floor(Math.random() * chars.length)];
          cell.changeAt = time + 500 + Math.random() * 1500;
        }

        // Scroll-linked wave distortion
        const scrollWave = Math.sin(
          cell.x * 0.01 + cell.y * 0.006 + scroll * 0.004 + cell.seed
        );
        const timeWave = Math.sin(
          cell.x * 0.016 + time * 0.0012 + cell.seed
        ) * Math.cos(cell.y * 0.012 + time * 0.0008);

        let drawX = cell.x + scrollWave * 6 + timeWave * 5;
        let drawY = cell.y + timeWave * 4 + Math.sin(cell.x * 0.02 + scroll * 0.002) * 3;

        // Mouse repulsion
        let mouseProximity = 0;
        if (interactive) {
          const dx = drawX - mx;
          const dy = drawY - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250 && dist > 0) {
            const force = (250 - dist) / 250;
            const eased = force * force;
            drawX += (dx / dist) * eased * 35;
            drawY += (dy / dist) * eased * 35;
            mouseProximity = eased;
          }
        }

        // Radial opacity falloff from center
        const distFromCenter = Math.sqrt(
          Math.pow((drawX - centerX) / (centerX || 1), 2) +
            Math.pow((drawY - centerY) / (centerY || 1), 2)
        );
        const radialFade = Math.min(distFromCenter * 0.8, 1);
        const waveBrightness = 0.6 + scrollWave * 0.2 + timeWave * 0.2;
        const cellOpacity = opacity * radialFade * waveBrightness;

        if (cellOpacity < 0.01) continue;

        // Orange glow near cursor, dark gray elsewhere
        if (mouseProximity > 0.05) {
          const orangeAlpha = cellOpacity * (0.5 + mouseProximity * 0.8);
          ctx.fillStyle = `rgba(250, 93, 25, ${Math.min(orangeAlpha, 0.9)})`;
        } else {
          ctx.fillStyle = `rgba(26, 26, 26, ${cellOpacity * 0.8})`;
        }

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
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (interactive) {
        parent.removeEventListener("mousemove", handleMouse);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [density, opacity, interactive, initGrid, chars]);

  return (
    <div ref={parentRef} className={`absolute inset-0 w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
