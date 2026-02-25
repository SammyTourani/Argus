"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TextScrambleProps {
  phrases: string[];
  className?: string;
  charSet?: string;
  speed?: number;
  revealDelay?: number;
}

const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function TextScramble({
  phrases,
  className = "",
  charSet = DEFAULT_CHARS,
  speed = 30,
  revealDelay = 5000,
}: TextScrambleProps) {
  const [display, setDisplay] = useState(phrases[0] || "");
  const phraseIdx = useRef(0);
  const animRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrambleTo = useCallback(
    (target: string) => {
      const length = target.length;
      const revealFrames = Array.from({ length }, (_, i) => {
        return Math.floor(i * 2.5 + Math.random() * 8);
      });
      const totalFrames = Math.max(...revealFrames) + 1;
      let frame = 0;

      const tick = () => {
        let result = "";
        for (let i = 0; i < length; i++) {
          if (frame >= revealFrames[i]) {
            // Character is revealed — show the real character
            result += target[i];
          } else if (target[i] === " " || target[i] === "." || target[i] === "," || target[i] === "—") {
            // Preserve whitespace and punctuation so word-wrap works
            result += target[i];
          } else {
            result += charSet[Math.floor(Math.random() * charSet.length)];
          }
        }
        setDisplay(result);
        frame++;

        if (frame <= totalFrames) {
          animRef.current = requestAnimationFrame(() => {
            setTimeout(tick, speed);
          });
        } else {
          timeoutRef.current = setTimeout(() => {
            phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
            scrambleTo(phrases[phraseIdx.current]);
          }, revealDelay);
        }
      };

      tick();
    },
    [charSet, speed, revealDelay, phrases]
  );

  useEffect(() => {
    scrambleTo(phrases[0]);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scrambleTo, phrases]);

  return <span className={className}>{display}</span>;
}
