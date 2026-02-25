'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, ExternalLink, X, Check } from 'lucide-react';

interface DeploySuccessBannerProps {
  url: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function DeploySuccessBanner({
  url,
  onDismiss,
  autoDismissMs = 10000,
}: DeploySuccessBannerProps) {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);

  /* ─── Auto-dismiss with countdown bar ─── */
  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(pct);
      if (elapsed >= autoDismissMs) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, autoDismissMs]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 400); // wait for exit animation
  }, [onDismiss]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <div className="relative bg-[#0D0D0D] border border-green-900/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Auto-dismiss progress bar */}
            <div className="absolute top-0 left-0 h-[2px] bg-green-500/40 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />

            <div className="flex items-center gap-3 px-4 py-3">
              {/* Rocket emoji + message */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0" role="img" aria-label="rocket">🚀</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-mono text-green-400 font-semibold">Your app is live!</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-[#888] hover:text-white truncate transition-colors"
                    title={url}
                  >
                    {url}
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-[#888] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-green-400 hover:text-green-300 border border-green-900/40 hover:border-green-700/60 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Open</span>
                </a>

                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg text-[#555] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.08)] transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
