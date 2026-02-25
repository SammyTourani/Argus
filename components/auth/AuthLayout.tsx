'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import MatrixAsciiPanel from './MatrixAsciiPanel';

interface AuthLayoutProps {
  mode: 'signin' | 'signup';
  children: ReactNode;
}

export default function AuthLayout({ mode, children }: AuthLayoutProps) {
  const isSignIn = mode === 'signin';

  // Both ARGUS texts are identically positioned (centered in viewport).
  // clip-path splits them at 50% so each half shows a different color.
  const formClip = isSignIn ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)';
  const matrixClip = isSignIn ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)';

  // Shared ARGUS text styles. paddingLeft compensates for letter-spacing's
  // trailing space on the last character, ensuring the visual center of "G"
  // aligns exactly with the 50% viewport split.
  const argusText = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 'clamp(120px, 20vw, 360px)',
    fontWeight: 900 as const,
    letterSpacing: '0.18em',
    paddingLeft: '0.18em',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1,
  };

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden"
      style={{ background: '#FAFAFA' }}
    >
      {/* ─── Giant ARGUS — form side (deep orange on light bg) ─── */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-center pointer-events-none select-none"
        style={{ zIndex: 2, clipPath: formClip }}
      >
        <span style={{ ...argusText, color: 'rgba(220, 60, 0, 0.22)' }}>
          ARGUS
        </span>
      </div>

      {/* ─── Giant ARGUS — matrix side (bright white on dark bg) ─── */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-center pointer-events-none select-none"
        style={{ zIndex: 2, clipPath: matrixClip }}
      >
        <span style={{ ...argusText, color: 'rgba(255, 255, 255, 0.28)' }}>
          ARGUS
        </span>
      </div>

      {/* ─── Mobile ARGUS watermark ─── */}
      <div className="absolute inset-0 flex md:hidden items-center justify-center pointer-events-none select-none">
        <span
          style={{
            ...argusText,
            fontSize: 'clamp(80px, 28vw, 200px)',
            color: 'rgba(250, 93, 25, 0.05)',
          }}
        >
          ARGUS
        </span>
      </div>

      {/* ─── Matrix panel (dark half) ─── */}
      <div
        className={`hidden md:block w-1/2 h-full relative ${isSignIn ? 'order-1' : 'order-2'}`}
        style={{ zIndex: 1 }}
      >
        <MatrixAsciiPanel />

        {/* Scanline overlay — subtle CRT feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
            zIndex: 3,
          }}
        />
      </div>

      {/* ─── Divider — subtle orange glow line ─── */}
      <div
        className="hidden md:block absolute top-0 h-full"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          background:
            'linear-gradient(to bottom, transparent 5%, rgba(250,93,25,0.1) 20%, rgba(250,93,25,0.2) 50%, rgba(250,93,25,0.1) 80%, transparent 95%)',
          zIndex: 10,
        }}
      />

      {/* ─── Form panel (light half) ─── */}
      <div
        className={`w-full md:w-1/2 h-full overflow-y-auto relative ${isSignIn ? 'order-2' : 'order-1'}`}
        style={{ zIndex: 5 }}
      >
        <div className="flex items-center justify-center min-h-full px-6 sm:px-8 py-12">
          <motion.div
            className="w-full max-w-[400px] relative"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0, ease: 'easeOut' }}
          >
            {/* Soft radial backdrop — fades ARGUS watermark behind form for readability */}
            <div
              className="absolute -inset-12 pointer-events-none hidden md:block"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(250,250,250,0.88) 0%, rgba(250,250,250,0.5) 55%, transparent 100%)',
                borderRadius: '40px',
              }}
            />
            <div className="relative">{children}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
