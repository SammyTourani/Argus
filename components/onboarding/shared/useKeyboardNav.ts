import { useEffect, useRef, useCallback } from 'react';

interface KeyboardNavConfig {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

export function useKeyboardNav({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  enabled = true,
}: KeyboardNavConfig) {
  const lastEnterRef = useRef(0);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't intercept when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape' && onEscape) {
          onEscape();
          return;
        }
        return;
      }

      switch (e.key) {
        case 'Enter': {
          // Debounce Enter to prevent double-fires
          const now = Date.now();
          if (now - lastEnterRef.current < 200) return;
          lastEnterRef.current = now;
          onEnter?.();
          break;
        }
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onArrowRight?.();
          break;
      }
    },
    [enabled, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
