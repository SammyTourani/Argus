'use client';

/**
 * VisualEditor — Click-to-edit mode for the builder preview panel.
 *
 * How it works:
 * 1. Inject a small JS script into the preview iframe via postMessage
 * 2. Script adds hover/click listeners to every element
 * 3. When clicked, it sends back element info (tag, text, styles, xpath)
 * 4. We show an inspector panel with editable fields
 * 5. User changes text/color/etc → generates a targeted AI prompt automatically
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, X, Type, Palette, Layout, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectedElement {
  xpath: string;
  tagName: string;
  textContent: string;
  innerText: string;
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
  };
  rect: { x: number; y: number; width: number; height: number };
}

interface VisualEditorProps {
  isActive: boolean;
  onToggle: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onGeneratePrompt: (prompt: string) => void;
}

// The script injected into the iframe to enable element selection
const INSPECTOR_SCRIPT = `
(function() {
  if (window.__argusInspectorActive) return;
  window.__argusInspectorActive = true;

  let overlay = null;
  let selectedEl = null;

  function getXPath(el) {
    if (!el || el === document.body) return '/html/body';
    const idx = Array.from(el.parentNode?.children || [])
      .filter(c => c.tagName === el.tagName).indexOf(el) + 1;
    return getXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + idx + ']';
  }

  function getComputedStylesFlat(el) {
    const cs = window.getComputedStyle(el);
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      padding: cs.padding,
      margin: cs.margin,
      borderRadius: cs.borderRadius,
    };
  }

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = '__argus_overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
    document.body.appendChild(overlay);
  }

  function highlightEl(el) {
    if (!overlay) createOverlay();
    const rect = el.getBoundingClientRect();
    overlay.innerHTML = '';
    const highlight = document.createElement('div');
    highlight.style.cssText = \`
      position:fixed;
      left:\${rect.left}px;top:\${rect.top}px;
      width:\${rect.width}px;height:\${rect.height}px;
      border:2px solid #FA4500;
      background:rgba(250,69,0,0.08);
      pointer-events:none;
      border-radius:3px;
      box-shadow:0 0 0 4000px rgba(0,0,0,0.15);
    \`;
    overlay.appendChild(highlight);

    const label = document.createElement('div');
    label.textContent = el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : '');
    label.style.cssText = \`
      position:fixed;left:\${rect.left}px;top:\${Math.max(0,rect.top-22)}px;
      background:#FA4500;color:white;font-size:11px;font-family:monospace;
      padding:2px 6px;border-radius:3px;pointer-events:none;white-space:nowrap;
    \`;
    overlay.appendChild(label);
  }

  document.addEventListener('mousemove', function(e) {
    if (!window.__argusInspectorActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== document.body && el !== document.documentElement && el !== overlay) {
      highlightEl(el);
    }
  }, true);

  document.addEventListener('click', function(e) {
    if (!window.__argusInspectorActive) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    if (!el || el === overlay) return;
    selectedEl = el;
    const rect = el.getBoundingClientRect();
    window.parent.postMessage({
      type: 'argus_element_selected',
      data: {
        xpath: getXPath(el),
        tagName: el.tagName,
        textContent: el.textContent?.slice(0, 200) || '',
        innerText: el.innerText?.slice(0, 200) || '',
        computedStyles: getComputedStylesFlat(el),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      }
    }, '*');
  }, true);

  // Cursor style
  document.body.style.cursor = 'crosshair';
  
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'argus_inspector_off') {
      window.__argusInspectorActive = false;
      if (overlay) { overlay.remove(); overlay = null; }
      document.body.style.cursor = '';
    }
  });
})();
`;

type EditTab = 'text' | 'style' | 'layout';

export default function VisualEditor({ isActive, onToggle, iframeRef, onGeneratePrompt }: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [activeTab, setActiveTab] = useState<EditTab>('text');

  // Editable fields
  const [editText, setEditText] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBgColor, setEditBgColor] = useState('');
  const [editFontSize, setEditFontSize] = useState('');
  const [editBorderRadius, setEditBorderRadius] = useState('');

  // Inject/remove inspector script into iframe
  const injectInspector = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      (iframe.contentWindow as any).eval(INSPECTOR_SCRIPT);
    } catch {
      // Cross-origin — postMessage fallback
    }
  }, [iframeRef]);

  const removeInspector = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage({ type: 'argus_inspector_off' }, '*');
    } catch {}
    setSelectedElement(null);
  }, [iframeRef]);

  useEffect(() => {
    if (isActive) {
      injectInspector();
    } else {
      removeInspector();
    }
  }, [isActive, injectInspector, removeInspector]);

  // Listen for element selection from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'argus_element_selected') {
        const el = e.data.data as SelectedElement;
        setSelectedElement(el);
        setEditText(el.innerText || el.textContent || '');
        setEditColor(rgbToHex(el.computedStyles.color));
        setEditBgColor(rgbToHex(el.computedStyles.backgroundColor));
        setEditFontSize(el.computedStyles.fontSize.replace('px', ''));
        setEditBorderRadius(el.computedStyles.borderRadius.replace('px', ''));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleApplyTextChange = () => {
    if (!selectedElement) return;
    const prompt = `Change the text of the ${selectedElement.tagName.toLowerCase()} element "${selectedElement.innerText.slice(0, 40)}" to: "${editText}"`;
    onGeneratePrompt(prompt);
    setSelectedElement(null);
  };

  const handleApplyStyleChange = () => {
    if (!selectedElement) return;
    const changes: string[] = [];
    if (editColor !== rgbToHex(selectedElement.computedStyles.color)) {
      changes.push(`text color to ${editColor}`);
    }
    if (editBgColor !== rgbToHex(selectedElement.computedStyles.backgroundColor)) {
      changes.push(`background color to ${editBgColor}`);
    }
    if (editFontSize !== selectedElement.computedStyles.fontSize.replace('px', '')) {
      changes.push(`font size to ${editFontSize}px`);
    }
    if (editBorderRadius !== selectedElement.computedStyles.borderRadius.replace('px', '')) {
      changes.push(`border radius to ${editBorderRadius}px`);
    }
    if (changes.length === 0) return;
    const prompt = `Update the ${selectedElement.tagName.toLowerCase()} element "${selectedElement.innerText.slice(0, 40)}": change ${changes.join(', ')}`;
    onGeneratePrompt(prompt);
    setSelectedElement(null);
  };

  return (
    <>
      {/* Visual edit toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors',
          isActive
            ? 'bg-[#FA4500] text-white border-[#FA4500]'
            : 'text-[#888] hover:text-white border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
        )}
        title="Visual editor — click any element to edit it"
      >
        <MousePointer2 className="w-3.5 h-3.5" />
        {isActive ? 'Editing' : 'Edit'}
      </button>

      {/* Element inspector panel */}
      <AnimatePresence>
        {selectedElement && isActive && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 bottom-0 w-72 bg-[#0D0D0D] border-l border-[rgba(255,255,255,0.08)] z-20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#FA4500] uppercase tracking-wider">
                  {selectedElement.tagName.toLowerCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-[#666] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[rgba(255,255,255,0.06)]">
              {([
                { id: 'text' as EditTab, icon: Type, label: 'Text' },
                { id: 'style' as EditTab, icon: Palette, label: 'Style' },
                { id: 'layout' as EditTab, icon: Layout, label: 'Layout' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-colors',
                    activeTab === tab.id ? 'text-[#FA4500] border-b-2 border-[#FA4500]' : 'text-[#666] hover:text-white'
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'text' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5">Content</label>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={4}
                      className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#FA4500] outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={handleApplyTextChange}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FA4500] hover:bg-[#E63F00] text-white text-xs font-mono rounded-lg transition-colors"
                  >
                    Apply with AI <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {activeTab === 'style' && (
                <>
                  <ColorField label="Text color" value={editColor} onChange={setEditColor} />
                  <ColorField label="Background" value={editBgColor} onChange={setEditBgColor} />
                  <NumberField label="Font size (px)" value={editFontSize} onChange={setEditFontSize} />
                  <NumberField label="Border radius (px)" value={editBorderRadius} onChange={setEditBorderRadius} />
                  <button
                    onClick={handleApplyStyleChange}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FA4500] hover:bg-[#E63F00] text-white text-xs font-mono rounded-lg transition-colors"
                  >
                    Apply with AI <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider">Computed</div>
                  {Object.entries({
                    Padding: selectedElement.computedStyles.padding,
                    Margin: selectedElement.computedStyles.margin,
                    'Font weight': selectedElement.computedStyles.fontWeight,
                    Size: `${Math.round(selectedElement.rect.width)}×${Math.round(selectedElement.rect.height)}px`,
                  }).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#666]">{k}</span>
                      <span className="text-[11px] font-mono text-[#aaa]">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-[rgba(255,255,255,0.08)] bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1.5 text-xs text-white font-mono focus:border-[#FA4500] outline-none"
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-[#666] uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded px-2 py-1.5 text-xs text-white font-mono focus:border-[#FA4500] outline-none"
      />
    </div>
  );
}

function rgbToHex(rgb: string): string {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return '#000000';
  return '#' + [m[0], m[1], m[2]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}
