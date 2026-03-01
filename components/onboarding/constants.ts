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
    ascii: '{ } => {\n  code()\n}',
    description: 'I write code and ship products',
  },
  {
    id: 'designer',
    label: 'Designer',
    ascii: '+--+--+\n|  #  |\n+--+--+',
    description: 'I craft interfaces and experiences',
  },
  {
    id: 'founder',
    label: 'Founder',
    ascii: '$ npm init\n> name: _\n> v: 0.1',
    description: 'I build companies and MVPs',
  },
  {
    id: 'student',
    label: 'Student',
    ascii: '> help()\n  [...]\n> _',
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
  'Other',
] as const;

export const MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10A37F',
    description: 'Fast and versatile, great for rapid iteration',
    speed: 90,
    quality: 75,
    capability: 80,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    color: '#D97757',
    description: 'Best code quality with deep React understanding',
    speed: 75,
    quality: 95,
    capability: 90,
    recommended: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    color: '#5BA8F5',
    initial: 'F',
    description: 'Lightning fast with free tier available',
    speed: 95,
    quality: 70,
    capability: 72,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    color: '#3367D6',
    initial: 'P',
    description: 'Most capable with massive context window',
    speed: 65,
    quality: 88,
    capability: 95,
  },
] as const;

export const EYE_FRAMES = [
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |   (◉)     | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |    (◉)    | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |     (◉)   | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |      (◉)  | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |     (◉)   | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |    (◉)    | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |   (◉)     | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
  `
  ╔══════════════════════╗
  ║    .-"""""""""""-.   ║
  ║   /               \\  ║
  ║  |   .---------.  |  ║
  ║  |  |  (◉)      | |  ║
  ║  |   '---------'  |  ║
  ║   \\               /  ║
  ║    '-...........-'   ║
  ╚══════════════════════╝`,
] as const;

export const SPINNER = [
  '\u280B', '\u2819', '\u2839', '\u2838',
  '\u283C', '\u2834', '\u2826', '\u2827',
  '\u2807', '\u280F',
] as const;

export const STATUS_MESSAGES = [
  'Scanning capabilities...',
  'Loading AI models...',
  'Preparing workspace...',
] as const;
