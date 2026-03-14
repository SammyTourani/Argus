// ===== SHARED WORKSPACE CONFIG & STATE =====
// Extracted from index.html <script> block — shared across all workspace components.

import { MODELS as REAL_MODELS, DEFAULT_MODEL_ID } from '@/lib/models';

export interface StyleOption {
  id: string;
  name: string;
}

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  screenshot: string | null;
  markdown: string;
  gradient: string;
}

export const CONFIG = {
  styles: [
    { id: '1', name: 'Glassmorphism' },
    { id: '2', name: 'Neumorphism' },
    { id: '3', name: 'Brutalism' },
    { id: '4', name: 'Minimalist' },
    { id: '5', name: 'Dark Mode' },
    { id: '6', name: 'Gradient Rich' },
    { id: '7', name: '3D Depth' },
    { id: '8', name: 'Retro Wave' },
  ] as StyleOption[],
  models: REAL_MODELS.map((m) => ({ id: m.id, name: m.name })),
  mockResults: [] as SearchResult[],
};

export const state = {
  url: '',
  selectedStyle: '1',
  selectedModel: DEFAULT_MODEL_ID,
  isValidUrl: false,
  showSearchTiles: false,
  searchResults: [] as SearchResult[],
  isSearching: false,
  hasSearched: false,
  isFadingOut: false,
  showInstructionsForIndex: null as number | null,
  additionalInstructions: '',
  extendBrandStyles: false,
};

// ===== UTILITIES =====
export function validateUrl(str: string): boolean {
  if (!str) return false;
  return /^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w \.\-]*)*\/?$/.test(str.toLowerCase());
}

export function isURL(str: string): boolean {
  return /^(https?:\/\/)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(str.trim());
}

export function showToast(message: string, type?: string): void {
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.classList.add('visible'); });
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => { t.remove(); }, 300);
  }, 3000);
}
