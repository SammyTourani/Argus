// Design Scheme — brand colors, fonts, and style tokens
// Injected into every AI generation prompt for consistent design output

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignScheme {
  colors: {
    primary: string;      // Main brand color (e.g. #FA4500)
    secondary: string;    // Secondary brand color
    accent: string;       // Accent / highlight color
    background: string;   // Page background
    foreground: string;   // Main text color
    muted: string;        // Muted / secondary text
    card: string;         // Card / surface background
    border: string;       // Border color
    destructive: string;  // Error / danger color
    success: string;      // Success color
    warning: string;      // Warning color
  };
  fonts: {
    heading: string;      // Heading font family
    body: string;         // Body text font family
    mono: string;         // Code / mono font family
  };
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  style: 'minimal' | 'playful' | 'corporate' | 'brutalist';
}

// ---------------------------------------------------------------------------
// Defaults & Presets
// ---------------------------------------------------------------------------

export const DEFAULT_SCHEME: DesignScheme = {
  colors: {
    primary: '#FA4500',
    secondary: '#1A1A1A',
    accent: '#FF6B35',
    background: '#0A0A0A',
    foreground: '#FFFFFF',
    muted: '#888888',
    card: '#0E0E0E',
    border: '#1A1A1A',
    destructive: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    mono: 'JetBrains Mono',
  },
  borderRadius: 'md',
  style: 'minimal',
};

export const SCHEME_PRESETS: Record<string, DesignScheme> = {
  argus: { ...DEFAULT_SCHEME },

  minimal: {
    colors: {
      primary: '#18181B',
      secondary: '#71717A',
      accent: '#3B82F6',
      background: '#FFFFFF',
      foreground: '#18181B',
      muted: '#A1A1AA',
      card: '#FAFAFA',
      border: '#E4E4E7',
      destructive: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'JetBrains Mono',
    },
    borderRadius: 'sm',
    style: 'minimal',
  },

  corporate: {
    colors: {
      primary: '#1E40AF',
      secondary: '#1E3A5F',
      accent: '#3B82F6',
      background: '#F8FAFC',
      foreground: '#0F172A',
      muted: '#64748B',
      card: '#FFFFFF',
      border: '#CBD5E1',
      destructive: '#DC2626',
      success: '#16A34A',
      warning: '#D97706',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Inter',
      mono: 'Fira Code',
    },
    borderRadius: 'md',
    style: 'corporate',
  },

  playful: {
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F472B6',
      background: '#0F0720',
      foreground: '#F5F3FF',
      muted: '#A78BFA',
      card: '#1A0B3E',
      border: '#2E1065',
      destructive: '#F43F5E',
      success: '#34D399',
      warning: '#FBBF24',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'DM Sans',
      mono: 'JetBrains Mono',
    },
    borderRadius: 'full',
    style: 'playful',
  },
};

// ---------------------------------------------------------------------------
// Color label helpers (used for prompt injection & UI)
// ---------------------------------------------------------------------------

const COLOR_LABELS: Record<keyof DesignScheme['colors'], string> = {
  primary: 'main brand color - use for CTAs, links, accents',
  secondary: 'secondary elements',
  accent: 'accent / highlight',
  background: 'page background',
  foreground: 'main text color',
  muted: 'muted / secondary text',
  card: 'card / surface background',
  border: 'border color',
  destructive: 'error / danger actions',
  success: 'success indicators',
  warning: 'warning indicators',
};

const RADIUS_DESCRIPTIONS: Record<DesignScheme['borderRadius'], string> = {
  none: 'sharp corners (rounded-none)',
  sm: 'subtle rounding (rounded-sm for cards, rounded for buttons)',
  md: 'moderate rounding (rounded-md for cards, rounded-lg for buttons)',
  lg: 'generous rounding (rounded-lg for cards, rounded-xl for buttons)',
  full: 'pill-shaped (rounded-2xl for cards, rounded-full for buttons)',
};

const STYLE_DESCRIPTIONS: Record<DesignScheme['style'], string> = {
  minimal: 'clean lines, generous whitespace, subtle animations',
  playful: 'vibrant gradients, rounded shapes, bouncy animations, fun personality',
  corporate: 'professional, structured grids, restrained palette, trustworthy feel',
  brutalist: 'bold typography, stark contrasts, raw edges, no rounded corners',
};

// ---------------------------------------------------------------------------
// Prompt injection
// ---------------------------------------------------------------------------

export function schemeToPromptInjection(scheme: DesignScheme): string {
  const colorLines = (Object.keys(scheme.colors) as Array<keyof DesignScheme['colors']>)
    .map((key) => {
      const label = COLOR_LABELS[key];
      const value = scheme.colors[key];
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      return `- ${name}: ${value} (${label})`;
    })
    .join('\n');

  return `DESIGN SCHEME - FOLLOW THESE DESIGN GUIDELINES:
The user has configured a brand design scheme. Use these values in all generated code.

Colors (use these exact hex values in Tailwind arbitrary values or inline styles):
${colorLines}

Fonts:
- Headings: ${scheme.fonts.heading} (use font-['${scheme.fonts.heading.replace(/ /g, '_')}'] or import from Google Fonts)
- Body: ${scheme.fonts.body}
- Code: ${scheme.fonts.mono}

Style: ${scheme.style} (${STYLE_DESCRIPTIONS[scheme.style]})
Border radius: ${scheme.borderRadius} (${RADIUS_DESCRIPTIONS[scheme.borderRadius]})

IMPORTANT:
- Always use the exact hex values above for consistency.
- Import Google Fonts if the specified fonts are not system fonts.
- Apply the style guidelines (${scheme.style}) to spacing, animation, and layout decisions.
- Use the border radius guideline for all interactive elements and cards.`;
}

// ---------------------------------------------------------------------------
// Extract scheme from scraped HTML/CSS (basic heuristics)
// ---------------------------------------------------------------------------

export function extractSchemeFromHTML(html: string, css?: string): Partial<DesignScheme> {
  const combined = (html || '') + '\n' + (css || '');
  const partial: Partial<DesignScheme> = {};
  const colors: Partial<DesignScheme['colors']> = {};
  const fonts: Partial<DesignScheme['fonts']> = {};

  // ----- colours -----

  // CSS custom properties first (highest signal)
  const varPatterns: Array<{ regex: RegExp; target: keyof DesignScheme['colors'] }> = [
    { regex: /--(?:color-)?primary\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'primary' },
    { regex: /--(?:color-)?secondary\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'secondary' },
    { regex: /--(?:color-)?accent\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'accent' },
    { regex: /--(?:color-)?background\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'background' },
    { regex: /--(?:color-)?foreground\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'foreground' },
    { regex: /--(?:color-)?muted\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'muted' },
    { regex: /--(?:color-)?card\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'card' },
    { regex: /--(?:color-)?border\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'border' },
    { regex: /--(?:color-)?destructive\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'destructive' },
    { regex: /--(?:color-)?success\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'success' },
    { regex: /--(?:color-)?warning\s*:\s*(#[0-9a-fA-F]{3,8})/i, target: 'warning' },
  ];

  for (const { regex, target } of varPatterns) {
    const match = combined.match(regex);
    if (match) {
      colors[target] = match[1];
    }
  }

  // Fallback: grab the first few unique hex colours from background/background-color rules
  if (!colors.primary) {
    const bgHexMatches = combined.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/gi) || [];
    const uniqueHexes = [...new Set(bgHexMatches.map((m) => {
      const hexMatch = m.match(/#[0-9a-fA-F]{3,8}/);
      return hexMatch ? hexMatch[0] : null;
    }).filter(Boolean))] as string[];

    // Heuristic: skip very common white/black values
    const nonTrivial = uniqueHexes.filter(
      (h) => !['#fff', '#ffffff', '#000', '#000000', '#FFF', '#FFFFFF'].includes(h),
    );

    if (nonTrivial.length > 0) colors.primary = nonTrivial[0];
    if (nonTrivial.length > 1) colors.secondary = nonTrivial[1];
    if (nonTrivial.length > 2) colors.accent = nonTrivial[2];
  }

  // Body background
  if (!colors.background) {
    const bodyBg = combined.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i);
    if (bodyBg) colors.background = bodyBg[1];
  }

  // Body text colour
  if (!colors.foreground) {
    const bodyColor = combined.match(/body\s*\{[^}]*(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,8})/i);
    if (bodyColor) colors.foreground = bodyColor[1];
  }

  // ----- fonts -----

  const fontFamilyMatches = combined.match(/font-family\s*:\s*['"]?([^;'"}\n]+)/gi) || [];
  const fontFamilies = fontFamilyMatches.map((m) => {
    const val = m.replace(/font-family\s*:\s*/i, '').trim();
    // Take the first family in the stack
    return val.split(',')[0].replace(/['"]/g, '').trim();
  });

  const uniqueFonts = [...new Set(fontFamilies)].filter(
    (f) => !['inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace', 'system-ui'].includes(f.toLowerCase()),
  );

  if (uniqueFonts.length > 0) fonts.heading = uniqueFonts[0];
  if (uniqueFonts.length > 1) fonts.body = uniqueFonts[1];
  else if (uniqueFonts.length === 1) fonts.body = uniqueFonts[0];

  // Monospace font
  const monoMatch = combined.match(/font-family\s*:[^;]*\b((?:JetBrains Mono|Fira Code|Source Code Pro|IBM Plex Mono|Roboto Mono|Cascadia Code|SF Mono|Menlo|Consolas|Monaco))/i);
  if (monoMatch) fonts.mono = monoMatch[1];

  // ----- assemble -----

  if (Object.keys(colors).length > 0) partial.colors = colors as DesignScheme['colors'];
  if (Object.keys(fonts).length > 0) partial.fonts = fonts as DesignScheme['fonts'];

  return partial;
}

// ---------------------------------------------------------------------------
// Persistence (localStorage)
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'argus_design_scheme_';

export function saveScheme(projectId: string, scheme: DesignScheme): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(scheme));
  } catch {
    // localStorage may be unavailable (SSR, quota exceeded)
  }
}

export function loadScheme(projectId: string): DesignScheme {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all keys exist even after schema evolution
      return mergeWithDefaults(parsed);
    }
  } catch {
    // corrupt or unavailable — fall through
  }
  return { ...DEFAULT_SCHEME };
}

// ---------------------------------------------------------------------------
// Merge helper
// ---------------------------------------------------------------------------

function mergeWithDefaults(partial: Partial<DesignScheme>): DesignScheme {
  return {
    colors: { ...DEFAULT_SCHEME.colors, ...(partial.colors || {}) },
    fonts: { ...DEFAULT_SCHEME.fonts, ...(partial.fonts || {}) },
    borderRadius: partial.borderRadius ?? DEFAULT_SCHEME.borderRadius,
    style: partial.style ?? DEFAULT_SCHEME.style,
  };
}
