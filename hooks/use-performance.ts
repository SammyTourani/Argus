'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight performance measurement hook that reports Core Web Vitals
 * (LCP, FCP, CLS) to Sentry as custom measurements.
 *
 * Uses the native PerformanceObserver API -- no external dependencies.
 * No-ops in development to avoid console noise.
 */
export function usePageLoadMetrics(pageName: string) {
  const reported = useRef(false);

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;
    // Only report once per page mount
    if (reported.current) return;
    reported.current = true;

    // Dynamically import Sentry so this module has zero cost if Sentry
    // is tree-shaken or not configured.
    let Sentry: typeof import('@sentry/nextjs') | null = null;

    import('@sentry/nextjs')
      .then((mod) => {
        Sentry = mod;
      })
      .catch(() => {
        // Sentry not available -- metrics will silently drop
      });

    function reportMetric(name: string, value: number, unit: string) {
      if (!Sentry) return;
      try {
        Sentry.metrics.distribution(`web_vital.${name}`, value, {
          unit,
          attributes: { page: pageName },
        });
      } catch {
        // Sentry metrics API may not be available in all versions
      }
    }

    // --- FCP (First Contentful Paint) ---
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            reportMetric('fcp', entry.startTime, 'millisecond');
            fcpObserver.disconnect();
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // PerformanceObserver not supported
    }

    // --- LCP (Largest Contentful Paint) ---
    try {
      let lcpValue = 0;
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // LCP can fire multiple times; the last entry is the final LCP
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          lcpValue = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Report LCP when the page becomes hidden (standard approach)
      const reportLcp = () => {
        if (lcpValue > 0) {
          reportMetric('lcp', lcpValue, 'millisecond');
        }
        lcpObserver.disconnect();
      };

      // Use visibilitychange to capture the final LCP value
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          reportLcp();
        }
      }, { once: true });

      // Also report after a timeout as fallback
      const lcpTimeout = setTimeout(() => {
        reportLcp();
      }, 10000);

      // Cleanup
      return () => {
        clearTimeout(lcpTimeout);
        lcpObserver.disconnect();
      };
    } catch {
      // PerformanceObserver not supported
    }

    // --- CLS (Cumulative Layout Shift) ---
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShift.hadRecentInput && layoutShift.value) {
            clsValue += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Report CLS when page is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          reportMetric('cls', clsValue, 'none');
          clsObserver.disconnect();
        }
      }, { once: true });
    } catch {
      // PerformanceObserver not supported
    }
  }, [pageName]);
}
