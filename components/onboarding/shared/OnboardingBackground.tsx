'use client';

import { useEffect, useState } from 'react';
import MatrixAsciiPanel from '@/components/auth/MatrixAsciiPanel';
import GradientOrbs from '@/components/landing/GradientOrbs';

export default function OnboardingBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Matrix rain canvas */}
      {!reducedMotion ? (
        <div className="absolute inset-0 opacity-50">
          <MatrixAsciiPanel />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: '#060606' }} />
      )}

      {/* Gradient orbs */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <GradientOrbs />
      </div>

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 20%, rgba(6,6,6,0.8) 100%)',
        }}
      />

      {/* Top edge fade */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(8,8,8,0.9), transparent)',
        }}
      />

      {/* Bottom edge fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(8,8,8,0.9), transparent)',
        }}
      />

      {/* Subtle scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />
    </div>
  );
}
