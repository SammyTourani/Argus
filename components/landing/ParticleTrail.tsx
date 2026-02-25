"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight orange particle trail that follows the cursor.
 * Inspired by caj.al / xmcp.dev mouse effects.
 * Only renders on desktop (no touch).
 */
export default function ParticleTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Skip on touch devices
    if (typeof window !== "undefined" && "ontouchstart" in window) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }

    const particles: Particle[] = [];
    let mouseX = -1000;
    let mouseY = -1000;
    let animId: number;
    let lastEmit = 0;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouse);

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Emit particles at mouse position (throttled)
      if (time - lastEmit > 30 && mouseX > 0) {
        lastEmit = time;
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: mouseX + (Math.random() - 0.5) * 4,
            y: mouseY + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            life: 0,
            maxLife: 30 + Math.random() * 20,
            size: 1.5 + Math.random() * 2,
          });
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // slight gravity
        p.vx *= 0.98;
        p.vy *= 0.98;

        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;

        if (progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        const shrink = 1 - progress * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * shrink, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 93, 25, ${alpha * 0.6})`;
        ctx.fill();
      }

      // Cap particle count
      if (particles.length > 100) {
        particles.splice(0, particles.length - 100);
      }
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[90] pointer-events-none"
      aria-hidden
    />
  );
}
