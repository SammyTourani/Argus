'use client';

import { useState } from 'react';
import { Palette, RotateCcw, Pipette, ChevronDown, ChevronRight } from 'lucide-react';
import { useDesignScheme } from '@/hooks/use-design-scheme';
import { SCHEME_PRESETS, type DesignScheme } from '@/lib/design/scheme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_KEYS: Array<{ key: keyof DesignScheme['colors']; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'muted', label: 'Muted' },
  { key: 'card', label: 'Card' },
  { key: 'border', label: 'Border' },
  { key: 'destructive', label: 'Destructive' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
];

const FONT_OPTIONS = [
  'Inter',
  'Plus Jakarta Sans',
  'Space Grotesk',
  'DM Sans',
  'Outfit',
  'Poppins',
  'Manrope',
  'Geist',
  'Sora',
  'Work Sans',
];

const MONO_FONT_OPTIONS = [
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'IBM Plex Mono',
  'Roboto Mono',
  'Cascadia Code',
  'Geist Mono',
];

const RADIUS_OPTIONS: Array<{ value: DesignScheme['borderRadius']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'full', label: 'Full' },
];

const STYLE_OPTIONS: Array<{ value: DesignScheme['style']; label: string }> = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'playful', label: 'Playful' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'brutalist', label: 'Brutalist' },
];

const PRESET_NAMES = Object.keys(SCHEME_PRESETS);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DesignSchemePanelProps {
  projectId: string;
  sourceUrl?: string;
  onExtractFromUrl?: (url: string) => void;
}

export default function DesignSchemePanel({
  projectId,
  sourceUrl,
  onExtractFromUrl,
}: DesignSchemePanelProps) {
  const {
    scheme,
    updateColor,
    updateFont,
    updateScheme,
    resetToDefault,
    applyPreset,
  } = useDesignScheme(projectId);

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[rgba(255,255,255,0.06)]">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#0E0E0E] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#FA4500]" />
          <span className="text-sm font-mono text-white">Design Scheme</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[#666]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#666]" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-5">
          {/* ---- Presets ---- */}
          <Section label="Presets">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-[#1A1A1A] text-[#888] hover:text-white transition-colors capitalize"
                >
                  {name}
                </button>
              ))}
            </div>
          </Section>

          {/* ---- Style ---- */}
          <Section label="Style">
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateScheme({ style: opt.value })}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-colors ${
                    scheme.style === opt.value
                      ? 'border-[#FA4500] bg-[rgba(250,69,0,0.08)] text-[#FA4500]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-[#1A1A1A] text-[#888] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Section>

          {/* ---- Colors ---- */}
          <Section label="Colors">
            <div className="grid grid-cols-2 gap-2">
              {COLOR_KEYS.map(({ key, label }) => (
                <ColorPicker
                  key={key}
                  label={label}
                  value={scheme.colors[key]}
                  onChange={(v) => updateColor(key, v)}
                />
              ))}
            </div>
          </Section>

          {/* ---- Fonts ---- */}
          <Section label="Fonts">
            <div className="space-y-2">
              <FontSelect
                label="Heading"
                value={scheme.fonts.heading}
                options={FONT_OPTIONS}
                onChange={(v) => updateFont('heading', v)}
              />
              <FontSelect
                label="Body"
                value={scheme.fonts.body}
                options={FONT_OPTIONS}
                onChange={(v) => updateFont('body', v)}
              />
              <FontSelect
                label="Mono"
                value={scheme.fonts.mono}
                options={MONO_FONT_OPTIONS}
                onChange={(v) => updateFont('mono', v)}
              />
            </div>
          </Section>

          {/* ---- Border Radius ---- */}
          <Section label="Border Radius">
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateScheme({ borderRadius: opt.value })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                    scheme.borderRadius === opt.value
                      ? 'border-[#FA4500] bg-[rgba(250,69,0,0.08)] text-[#FA4500]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-[#1A1A1A] text-[#888] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Section>

          {/* ---- Actions ---- */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono border border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-[#1A1A1A] text-[#888] hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>

            {sourceUrl && onExtractFromUrl && (
              <button
                onClick={() => onExtractFromUrl(sourceUrl)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono border border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-[#1A1A1A] text-[#888] hover:text-white transition-colors"
              >
                <Pipette className="w-3 h-3" />
                Extract from URL
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (internal)
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-wider text-[#666] mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 group cursor-pointer">
      <div className="relative w-6 h-6 rounded-md overflow-hidden border border-[rgba(255,255,255,0.08)] flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <div className="w-full h-full" style={{ backgroundColor: value }} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-mono text-[#888] group-hover:text-white transition-colors truncate">
          {label}
        </span>
        <span className="text-[10px] font-mono text-[#555] uppercase">
          {value}
        </span>
      </div>
    </label>
  );
}

function FontSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-mono text-[#666] w-16 flex-shrink-0">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-md px-2 py-1.5 text-[11px] font-mono text-white outline-none focus:border-[#FA4500] transition-colors appearance-none cursor-pointer"
      >
        {/* Always include the current value even if it's not in our options list */}
        {!options.includes(value) && (
          <option value={value}>{value}</option>
        )}
        {options.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
}
