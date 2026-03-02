// @ts-nocheck
// ===== SHARED WORKSPACE CONFIG & STATE =====
// Extracted from index.html <script> block — shared across all workspace components.

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
  ],
  models: [
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro' },
    { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'openai/gpt-5', name: 'GPT-5' },
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2' },
  ],
  mockResults: [
    { url: 'https://stripe.com', title: 'Stripe', description: 'Financial infrastructure for the internet', screenshot: null as string | null, markdown: '', gradient: 'linear-gradient(135deg, #635bff 0%, #a259ff 100%)' },
    { url: 'https://linear.app', title: 'Linear', description: 'Streamline issues, projects, and product roadmaps', screenshot: null as string | null, markdown: '', gradient: 'linear-gradient(135deg, #5e6ad2 0%, #8b5cf6 100%)' },
    { url: 'https://vercel.com', title: 'Vercel', description: 'Develop. Preview. Ship. For the best frontend teams.', screenshot: null as string | null, markdown: '', gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)' },
    { url: 'https://notion.so', title: 'Notion', description: 'Your connected workspace for wiki, docs & projects', screenshot: null as string | null, markdown: '', gradient: 'linear-gradient(135deg, #f7f6f3 0%, #e3d5c5 100%)' },
    { url: 'https://figma.com', title: 'Figma', description: 'The collaborative interface design tool', screenshot: null as string | null, markdown: '', gradient: 'linear-gradient(135deg, #f24e1e 0%, #a259ff 50%, #0acf83 100%)' },
    { url: 'https://supabase.com', title: 'Supabase', description: 'Open source Firebase alternative', screenshot: null as string | null, markdown: '', gradient: 'linear-gradient(135deg, #3ecf8e 0%, #1a9f68 100%)' },
  ],
};

export const state = {
  url: '',
  selectedStyle: '1',
  selectedModel: CONFIG.models[0].id,
  isValidUrl: false,
  showSearchTiles: false,
  searchResults: [] as Array<{ url: string; title: string; description: string; screenshot: string | null; markdown: string; gradient: string }>,
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

export function showToast(message: string, type?: string) {
  var t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add('visible'); });
  setTimeout(function() {
    t.classList.remove('visible');
    setTimeout(function() { t.remove(); }, 300);
  }, 3000);
}
