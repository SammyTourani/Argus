export const STEP_NAMES = [
  'welcome',
  'what_to_build',
  'choose_model',
  'first_build',
] as const;

export const STEP_LABELS = [
  { num: '01', label: 'WELCOME' },
  { num: '02', label: 'BUILD' },
  { num: '03', label: 'MODEL' },
  { num: '04', label: 'LAUNCH' },
] as const;

export const ROLES = [
  {
    id: 'developer',
    label: 'Developer',
    ascii: '┌─────────┐\n│ { } =>  │\n│  fn()   │\n│ </>     │\n└─────────┘',
    description: 'I write code and ship products',
  },
  {
    id: 'designer',
    label: 'Designer',
    ascii: '╭─────────╮\n│ ◇  ◈  ◇│\n│─────────│\n│ ▣  ◈  ▣│\n╰─────────╯',
    description: 'I craft interfaces and experiences',
  },
  {
    id: 'founder',
    label: 'Founder',
    ascii: '    ▲    \n   ╱ ╲   \n  ╱ $ ╲  \n ╱─────╲ \n ▔▔▔▔▔▔▔ ',
    description: 'I build companies and MVPs',
  },
  {
    id: 'student',
    label: 'Student',
    ascii: '┌─────────┐\n│  ?   ?  │\n│ ─ ─ ─ ─│\n│ > _ <   │\n└─────────┘',
    description: 'I explore and experiment',
  },
] as const;

export const USE_CASES = [
  {
    id: 'clone',
    label: 'Clone a website',
    icon: '>_',
    description: 'Paste a URL and get a pixel-perfect React rebuild',
    showsUrl: true,
  },
  {
    id: 'redesign',
    label: 'Redesign a site',
    icon: '~>',
    description: 'Take an existing site and reimagine it with a new style',
    showsUrl: true,
  },
  {
    id: 'scratch',
    label: 'Build from scratch',
    icon: '+>',
    description: 'Describe what you want and let AI generate it',
    showsUrl: false,
  },
] as const;

export const CATEGORIES = [
  'SaaS',
  'E-commerce',
  'Portfolio',
  'Dashboard',
  'Blog',
  'Social',
  'Mobile App',
  'Landing Page',
  'Marketplace',
  'AI / ML',
  'Developer Tool',
  'Education',
  'Healthcare',
  'Finance',
  'Other',
] as const;

export const MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Google',
    logo: '/argus-assets/logos/google.svg',
    description: 'Gemini Flash — ultra-fast iteration (2 credits)',
    recommended: true,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Anthropic',
    logo: '/argus-assets/logos/anthropic.svg',
    description: 'Claude Sonnet — best code quality (10 credits)',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI',
    logo: '/argus-assets/logos/openai.svg',
    description: 'GPT-4o — fast and versatile (7 credits)',
  },
  {
    id: 'llama-3.3-70b',
    name: 'Meta',
    logo: '/argus-assets/logos/meta.svg',
    description: 'Llama 3.3 — free after credits run out (1 credit)',
  },
] as const;

// Braille spinner for terminal animation in StepLaunch
export const SPINNER = [
  '\u280B', '\u2819', '\u2839', '\u2838',
  '\u283C', '\u2834', '\u2826', '\u2827',
  '\u2807', '\u280F',
] as const;
