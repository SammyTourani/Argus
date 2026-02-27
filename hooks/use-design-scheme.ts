'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  type DesignScheme,
  DEFAULT_SCHEME,
  SCHEME_PRESETS,
  schemeToPromptInjection,
  saveScheme,
  loadScheme,
} from '@/lib/design/scheme';

/**
 * React hook for reading, editing, and persisting a project's design scheme.
 * All mutations auto-persist to localStorage keyed by projectId.
 */
export function useDesignScheme(projectId: string) {
  const [scheme, setScheme] = useState<DesignScheme>(() => loadScheme(projectId));

  // Persist helper — keeps localStorage in sync after every state update
  const persist = useCallback(
    (next: DesignScheme) => {
      setScheme(next);
      saveScheme(projectId, next);
    },
    [projectId],
  );

  // -- Mutations --

  const updateScheme = useCallback(
    (partial: Partial<DesignScheme>) => {
      setScheme((prev) => {
        const next: DesignScheme = {
          colors: { ...prev.colors, ...(partial.colors || {}) },
          fonts: { ...prev.fonts, ...(partial.fonts || {}) },
          borderRadius: partial.borderRadius ?? prev.borderRadius,
          style: partial.style ?? prev.style,
        };
        saveScheme(projectId, next);
        return next;
      });
    },
    [projectId],
  );

  const updateColor = useCallback(
    (key: keyof DesignScheme['colors'], value: string) => {
      setScheme((prev) => {
        const next: DesignScheme = {
          ...prev,
          colors: { ...prev.colors, [key]: value },
        };
        saveScheme(projectId, next);
        return next;
      });
    },
    [projectId],
  );

  const updateFont = useCallback(
    (key: keyof DesignScheme['fonts'], value: string) => {
      setScheme((prev) => {
        const next: DesignScheme = {
          ...prev,
          fonts: { ...prev.fonts, [key]: value },
        };
        saveScheme(projectId, next);
        return next;
      });
    },
    [projectId],
  );

  const resetToDefault = useCallback(() => {
    persist({ ...DEFAULT_SCHEME });
  }, [persist]);

  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = SCHEME_PRESETS[presetName];
      if (preset) {
        persist({ ...preset });
      }
    },
    [persist],
  );

  const getPromptInjection = useCallback(() => {
    return schemeToPromptInjection(scheme);
  }, [scheme]);

  return {
    scheme,
    updateScheme,
    updateColor,
    updateFont,
    resetToDefault,
    applyPreset,
    getPromptInjection,
  };
}
