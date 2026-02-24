"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-screen intro loader: ASCII rain converges into "ARGUS" with progress bar.
 * Only plays once per session (sessionStorage).
 */
export default function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // Skip if already seen this session
    if (sessionStorage.getItem("argus-intro-seen")) {
      onComplete();
      setHidden(true);
      return;
    }

    const skipTimer = setTimeout(() => setShowSkip(true), 2000);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const chars = "01{}()<>/;:=[]&|!?#@$%+-*~^ARGUS";
    const fontSize = 14;
    const columns = Math.floor(W / fontSize);

    // Rain drops — multiple speed tiers for depth
    const drops: { y: number; speed: number; brightness: number }[] = [];
    for (let i = 0; i < columns; i++) {
      drops.push({
        y: Math.random() * -50,
        speed: 0.3 + Math.random() * 0.7,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }

    // Target text "ARGUS" rendered to offscreen canvas
    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d");
    const targetWord = "ARGUS";
    const targetFontSize = Math.min(W * 0.20, 180);
    textCanvas.width = W;
    textCanvas.height = H;
    if (textCtx) {
      textCtx.font = `700 ${targetFontSize}px "JetBrains Mono", "Roboto Mono", "Geist Mono", monospace`;
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "#000";
      textCtx.fillText(targetWord, W / 2, H / 2);
    }

    // Get pixel positions where text exists
    const textPixels: { x: number; y: number }[] = [];
    if (textCtx) {
      const imgData = textCtx.getImageData(0, 0, W, H);
      const step = fontSize;
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const idx = (y * W + x) * 4;
          if (imgData.data[idx + 3] > 128) {
            textPixels.push({ x, y });
          }
        }
      }
    }

    // Particles that will form the word
    interface Particle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      char: string;
      alpha: number;
      arrived: boolean;
      speed: number;
    }

    const particles: Particle[] = textPixels.map((tp) => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      targetX: tp.x,
      targetY: tp.y,
      char: chars[Math.floor(Math.random() * chars.length)],
      alpha: 0,
      arrived: false,
      speed: 0.01 + Math.random() * 0.02,
    }));

    const startTime = performance.now();
    const RAIN_DURATION = 2000;
    const CONVERGE_DURATION = 2500;
    const HOLD_DURATION = 1200;
    const TOTAL = RAIN_DURATION + CONVERGE_DURATION + HOLD_DURATION;
    let animId: number;

    const STATUS_MESSAGES = [
      { at: 0, text: "SCANNING NETWORK..." },
      { at: 0.25, text: "LOADING MATRIX..." },
      { at: 0.50, text: "CONVERGING..." },
      { at: 0.85, text: "ARGUS ONLINE" },
    ];

    const draw = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / TOTAL, 1);

      // Light background with slight trail
      ctx.fillStyle = "rgba(250, 250, 250, 0.12)";
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${fontSize}px "Roboto Mono", monospace`;

      // Phase 1: Matrix rain
      if (elapsed < RAIN_DURATION + 400) {
        for (let i = 0; i < columns; i++) {
          const drop = drops[i];
          const char = chars[Math.floor(Math.random() * chars.length)];
          const alpha = drop.brightness * (elapsed < RAIN_DURATION ? 0.7 : 0.7 * (1 - (elapsed - RAIN_DURATION) / 400));
          ctx.fillStyle = `rgba(250, 93, 25, ${alpha})`;
          ctx.fillText(char, i * fontSize, drop.y * fontSize);

          // Trail effect — draw fading chars above
          for (let t = 1; t <= 3; t++) {
            const trailAlpha = alpha * (1 - t * 0.3);
            if (trailAlpha > 0.02) {
              const trailChar = chars[Math.floor(Math.random() * chars.length)];
              ctx.fillStyle = `rgba(250, 93, 25, ${trailAlpha * 0.4})`;
              ctx.fillText(trailChar, i * fontSize, (drop.y - t * 1.5) * fontSize);
            }
          }

          if (drop.y * fontSize > H && Math.random() > 0.975) {
            drop.y = 0;
          }
          drop.y += drop.speed;
        }
      }

      // Phase 2: Converge into ARGUS
      if (elapsed > RAIN_DURATION * 0.5) {
        const convergeProgress = Math.min(
          (elapsed - RAIN_DURATION * 0.5) / CONVERGE_DURATION,
          1
        );
        const eased = 1 - Math.pow(1 - convergeProgress, 3);

        for (const p of particles) {
          p.x += (p.targetX - p.x) * eased * p.speed * 3;
          p.y += (p.targetY - p.y) * eased * p.speed * 3;
          p.alpha = Math.min(eased * 1.5, 1);

          if (Math.abs(p.x - p.targetX) < 2 && Math.abs(p.y - p.targetY) < 2) {
            p.arrived = true;
            p.x = p.targetX;
            p.y = p.targetY;
          }

          if (!p.arrived && Math.random() > 0.9) {
            p.char = chars[Math.floor(Math.random() * chars.length)];
          }

          // Glow brighter as particles arrive
          const glowBoost = p.arrived ? 1.0 : 0.8;
          ctx.fillStyle = `rgba(250, 93, 25, ${p.alpha * glowBoost})`;
          ctx.fillText(p.char, p.x, p.y);
        }
      }

      // Draw progress bar at bottom
      const barWidth = W * 0.4;
      const barX = (W - barWidth) / 2;
      const barY = H - 60;
      const fillWidth = barWidth * progress;
      const totalSegments = 30;
      const filledSegments = Math.floor(totalSegments * progress);

      // ASCII progress bar: [=====>          ]
      let barStr = "[";
      for (let i = 0; i < totalSegments; i++) {
        if (i < filledSegments) barStr += "=";
        else if (i === filledSegments) barStr += ">";
        else barStr += " ";
      }
      barStr += "]";

      const pctStr = ` ${Math.floor(progress * 100)}%`;

      // Status message
      let statusText = STATUS_MESSAGES[0].text;
      for (const msg of STATUS_MESSAGES) {
        if (progress >= msg.at) statusText = msg.text;
      }

      ctx.font = `13px "Roboto Mono", monospace`;
      ctx.fillStyle = `rgba(250, 93, 25, 0.6)`;
      ctx.textAlign = "center";
      ctx.fillText(`${barStr}${pctStr} | ${statusText}`, W / 2, barY);
      ctx.textAlign = "start";
      ctx.font = `${fontSize}px "Roboto Mono", monospace`;

      // Phase 3: Hold, then trigger fade out
      if (elapsed >= TOTAL) {
        setFadeOut(true);
        sessionStorage.setItem("argus-intro-seen", "1");
        setTimeout(() => {
          setHidden(true);
          onComplete();
        }, 600);
        return;
      }

      animId = requestAnimationFrame(draw);
    };

    // Clear canvas to light bg first
    ctx.fillStyle = "#FAFAFA";
    ctx.fillRect(0, 0, W, H);

    animId = requestAnimationFrame(draw);

    return () => {
      clearTimeout(skipTimer);
      cancelAnimationFrame(animId);
    };
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem("argus-intro-seen", "1");
    setFadeOut(true);
    setTimeout(() => {
      setHidden(true);
      onComplete();
    }, 300);
  };

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#FAFAFA] transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {showSkip && !fadeOut && (
        <button
          onClick={handleSkip}
          className="absolute bottom-24 right-24 font-mono text-[12px] tracking-[0.1em] uppercase text-[rgba(26,26,26,0.3)] hover:text-[rgba(250,93,25,0.8)] transition-colors z-10 cursor-pointer"
        >
          [ SKIP ]
        </button>
      )}
    </div>
  );
}
