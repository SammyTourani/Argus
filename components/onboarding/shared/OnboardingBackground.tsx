'use client';

import DotRainCanvas from './DotRainCanvas';

export default function OnboardingBackground() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Orange radial gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, #F97316 0%, #EA580C 30%, #9A3412 60%, #431407 100%)',
        }}
      />

      {/* Animated white dot rain */}
      <DotRainCanvas />

      {/* Bottom darkening for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  );
}
