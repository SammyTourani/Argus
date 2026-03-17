/**
 * Clone Templates
 *
 * Curated list of real, publicly accessible websites organized by category.
 * Users pick one and Argus clones it as a starting point for their project.
 *
 * Every URL here is a well-known, publicly accessible website with excellent
 * modern design that works well as a cloning target (clear landing page,
 * not an overly complex SPA behind auth walls).
 */

export interface CloneTemplate {
  /** URL-safe slug, unique across all templates */
  id: string;
  /** Full URL of the page to clone */
  url: string;
  /** Company or site name (matches TemplatesTab fallback shape) */
  name: string;
  /** 1-2 sentences on what makes the design special (matches TemplatesTab fallback shape) */
  desc: string;
  /** Which category group this belongs to */
  category: CloneCategory;
  /** 3-5 descriptive tags */
  tags: string[];
  /** Visual style classification for browse filtering (NOT generation style) */
  browseStyle: "minimal" | "bold" | "dark" | "colorful" | "animated";
  /** How hard it is to clone faithfully */
  diff: "beginner" | "intermediate" | "advanced";
  /** Tech tags for display (matches TemplatesTab fallback shape) */
  tech: string[];
  /** Whether this should appear in the "featured" row on the home page (top 8) */
  featured: boolean;
  /** CSS gradient fallback when screenshot isn't available */
  gradient: string;
  /** Path to screenshot image (populated by capture script) */
  thumbnail: string;
  /** Display use count */
  uses: number;
  /** Whether to show NEW badge */
  isNew: boolean;
}

export type CloneCategory =
  | "landing-pages"
  | "portfolios"
  | "e-commerce"
  | "dashboards"
  | "blogs-content"
  | "saas-apps"
  | "animations-effects";

export const CLONE_CATEGORY_LABELS: Record<CloneCategory, string> = {
  "landing-pages": "Landing Pages",
  portfolios: "Portfolios",
  "e-commerce": "E-commerce",
  dashboards: "Dashboards",
  "blogs-content": "Blogs & Content",
  "saas-apps": "SaaS Apps",
  "animations-effects": "Animations & Effects",
};

// ---------------------------------------------------------------------------
// 1. Landing Pages (12)
// ---------------------------------------------------------------------------

const landingPages: RawTemplate[] = [
  {
    id: "stripe",
    url: "https://stripe.com",
    name: "Stripe",
    desc:
      "The gold standard of developer-focused landing pages. Gradient mesh backgrounds, clean typography, and polished interactive code snippets.",
    category: "landing-pages",
    tags: ["fintech", "developer tools", "gradients", "enterprise"],
    browseStyle: "dark",
    diff: "advanced",
    tech: ["React", "CSS Animations", "SVG"],
    featured: true,
  },
  {
    id: "linear",
    url: "https://linear.app",
    name: "Linear",
    desc:
      "Exemplary dark-mode SaaS landing page with buttery-smooth scroll animations, a cinematic hero section, and razor-sharp UI screenshots.",
    category: "landing-pages",
    tags: ["project management", "dark mode", "scroll animations", "SaaS"],
    browseStyle: "dark",
    diff: "advanced",
    tech: ["React", "Framer Motion", "Tailwind"],
    featured: true,
  },
  {
    id: "vercel",
    url: "https://vercel.com",
    name: "Vercel",
    desc:
      "Minimalist, high-contrast dark landing page with a bold hero, sleek feature sections, and a developer-centric aesthetic.",
    category: "landing-pages",
    tags: ["developer tools", "hosting", "dark mode", "minimal"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: true,
  },
  {
    id: "notion",
    url: "https://www.notion.com",
    name: "Notion",
    desc:
      "Clean, approachable landing page with playful illustrations, clear value props, and excellent use of whitespace.",
    category: "landing-pages",
    tags: ["productivity", "collaboration", "illustrations", "clean"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["React", "CSS", "SVG"],
    featured: false,
  },
  {
    id: "raycast",
    url: "https://www.raycast.com",
    name: "Raycast",
    desc:
      "Gorgeous dark-mode landing page with fluid animations, keyboard shortcut showcases, and a polished developer aesthetic.",
    category: "landing-pages",
    tags: ["developer tools", "productivity", "dark mode", "macOS"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["React", "Framer Motion", "Tailwind"],
    featured: false,
  },
  {
    id: "arc-browser",
    url: "https://arc.net",
    name: "Arc Browser",
    desc:
      "Bold, colorful landing page with playful scroll interactions, vibrant gradients, and a distinctive brand voice.",
    category: "landing-pages",
    tags: ["browser", "colorful", "playful", "modern"],
    browseStyle: "colorful",
    diff: "intermediate",
    tech: ["React", "GSAP", "CSS"],
    featured: false,
  },
  {
    id: "resend",
    url: "https://resend.com",
    name: "Resend",
    desc:
      "Developer-focused email API landing page with a clean dark theme, code-centric hero, and excellent typography.",
    category: "landing-pages",
    tags: ["developer tools", "email", "dark mode", "API"],
    browseStyle: "dark",
    diff: "beginner",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
  {
    id: "supabase",
    url: "https://supabase.com",
    name: "Supabase",
    desc:
      "Feature-rich dark landing page with neon green accents, animated code blocks, and a developer-first layout.",
    category: "landing-pages",
    tags: ["developer tools", "database", "dark mode", "open source"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
  {
    id: "lemon-squeezy",
    url: "https://www.lemonsqueezy.com",
    name: "Lemon Squeezy",
    desc:
      "Bright, cheerful payments landing page with playful illustrations, warm yellow branding, and approachable copywriting.",
    category: "landing-pages",
    tags: ["payments", "colorful", "playful", "SaaS"],
    browseStyle: "colorful",
    diff: "beginner",
    tech: ["Next.js", "Tailwind", "SVG"],
    featured: false,
  },
  {
    id: "tailwind-css",
    url: "https://tailwindcss.com",
    name: "Tailwind CSS",
    desc:
      "Beautiful utility-first CSS framework landing page with interactive demos, gradient accents, and a dark polished aesthetic.",
    category: "landing-pages",
    tags: ["developer tools", "CSS", "framework", "dark mode"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "Tailwind", "React"],
    featured: false,
  },
  {
    id: "cal-com",
    url: "https://cal.com",
    name: "Cal.com",
    desc:
      "Open-source scheduling app with a clean, minimal landing page, clear CTAs, and a professional SaaS layout.",
    category: "landing-pages",
    tags: ["scheduling", "open source", "SaaS", "clean"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
  {
    id: "clerk",
    url: "https://clerk.com",
    name: "Clerk",
    desc:
      "Auth-focused landing page with interactive component demos, dark/light sections, and a developer-centric design.",
    category: "landing-pages",
    tags: ["auth", "developer tools", "components", "SaaS"],
    browseStyle: "minimal",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// 2. Portfolios (6)
// ---------------------------------------------------------------------------

const portfolios: RawTemplate[] = [
  {
    id: "brittany-chiang",
    url: "https://brittanychiang.com",
    name: "Brittany Chiang",
    desc:
      "The most-referenced developer portfolio on the internet. Clean dark layout, smooth scroll sections, and a perfect balance of personality and professionalism.",
    category: "portfolios",
    tags: ["developer", "dark mode", "minimal", "single page"],
    browseStyle: "dark",
    diff: "beginner",
    tech: ["React", "Styled Components", "Gatsby"],
    featured: true,
  },
  {
    id: "leerob",
    url: "https://leerob.io",
    name: "Lee Robinson",
    desc:
      "VP of Product at Vercel's personal site. Ultra-minimal design with excellent typography and a clean blog layout.",
    category: "portfolios",
    tags: ["developer", "minimal", "blog", "clean"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["Next.js", "Tailwind", "MDX"],
    featured: false,
  },
  {
    id: "paco-coursey",
    url: "https://paco.me",
    name: "Paco Coursey",
    desc:
      "Minimalist portfolio with subtle micro-interactions, monochrome palette, and beautifully crafted typography.",
    category: "portfolios",
    tags: ["developer", "minimal", "monochrome", "micro-interactions"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["Next.js", "React", "CSS"],
    featured: false,
  },
  {
    id: "sj-zhang",
    url: "https://www.sj.land",
    name: "SJ Zhang",
    desc:
      "Creative, experimental portfolio with unique layouts, artistic presentation, and interactive elements that break conventional grid structures.",
    category: "portfolios",
    tags: ["designer", "creative", "experimental", "interactive"],
    browseStyle: "colorful",
    diff: "advanced",
    tech: ["React", "CSS", "Canvas"],
    featured: false,
  },
  {
    id: "rauno-freiberg",
    url: "https://rauno.me",
    name: "Rauno Freiberg",
    desc:
      "Design engineer at Vercel with a beautifully minimal portfolio showcasing craft details, smooth animations, and refined taste.",
    category: "portfolios",
    tags: ["design engineer", "minimal", "animations", "craft"],
    browseStyle: "minimal",
    diff: "intermediate",
    tech: ["Next.js", "React", "Framer Motion"],
    featured: false,
  },
  {
    id: "dennnnis",
    url: "https://dennissnellenberg.com",
    name: "Dennis Snellenberg",
    desc:
      "Award-winning freelance developer portfolio with custom cursor, smooth page transitions, and cinematic scroll-driven animations.",
    category: "portfolios",
    tags: ["freelancer", "animations", "custom cursor", "cinematic"],
    browseStyle: "animated",
    diff: "advanced",
    tech: ["GSAP", "Barba.js", "CSS"],
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// 3. E-commerce (6)
// ---------------------------------------------------------------------------

const ecommerce: RawTemplate[] = [
  {
    id: "apple-macbook",
    url: "https://www.apple.com/macbook-air",
    name: "Apple MacBook Air",
    desc:
      "Premium product page with hero imagery, spec comparisons, scroll-triggered animations, and Apple's signature minimalist design.",
    category: "e-commerce",
    tags: ["tech", "premium", "product page", "minimal"],
    browseStyle: "minimal",
    diff: "intermediate",
    tech: ["CSS", "JavaScript", "Responsive"],
    featured: false,
  },
  {
    id: "apple-store",
    url: "https://www.apple.com/store",
    name: "Apple Store",
    desc:
      "The benchmark for premium product presentation. Massive hero images, scroll-triggered reveals, and a refined minimalist layout.",
    category: "e-commerce",
    tags: ["tech", "premium", "minimal", "product showcase"],
    browseStyle: "minimal",
    diff: "intermediate",
    tech: ["CSS", "JavaScript", "Responsive"],
    featured: true,
  },
  {
    id: "linear-pricing",
    url: "https://linear.app/pricing",
    name: "Linear Pricing",
    desc:
      "Best-in-class SaaS pricing page with clean comparison tables, feature lists, and a polished dark design. Great for cloning pricing UIs.",
    category: "e-commerce",
    tags: ["pricing", "SaaS", "dark mode", "comparison"],
    browseStyle: "dark",
    diff: "beginner",
    tech: ["React", "Tailwind", "CSS"],
    featured: false,
  },
  {
    id: "figma-store",
    url: "https://store.figma.com",
    name: "Figma Store",
    desc:
      "Playful merch store with colorful design, bold typography, and a fun brand personality that extends from the product itself.",
    category: "e-commerce",
    tags: ["merch", "playful", "colorful", "design"],
    browseStyle: "colorful",
    diff: "beginner",
    tech: ["React", "Shopify", "CSS"],
    featured: false,
  },
  {
    id: "teenage-engineering",
    url: "https://teenage.engineering",
    name: "Teenage Engineering",
    desc:
      "Iconic minimalist product pages with industrial design sensibility, unique grid layouts, and a distinctive monospace aesthetic.",
    category: "e-commerce",
    tags: ["electronics", "minimal", "industrial", "unique"],
    browseStyle: "minimal",
    diff: "intermediate",
    tech: ["JavaScript", "CSS Grid", "Custom"],
    featured: false,
  },
  {
    id: "gumroad",
    url: "https://gumroad.com",
    name: "Gumroad",
    desc:
      "Creator-focused e-commerce platform with a clean, colorful landing page, bold typography, and a friendly approachable design.",
    category: "e-commerce",
    tags: ["creator economy", "colorful", "clean", "marketplace"],
    browseStyle: "colorful",
    diff: "beginner",
    tech: ["React", "CSS", "Responsive"],
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// 4. Dashboards (5)
// ---------------------------------------------------------------------------

const dashboards: RawTemplate[] = [
  {
    id: "vercel-dashboard",
    url: "https://vercel.com/templates",
    name: "Vercel Templates",
    desc:
      "Vercel's template gallery with clean card layouts, category filtering, and a polished dark developer-focused aesthetic.",
    category: "dashboards",
    tags: ["deployments", "developer tools", "dark mode", "status"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
  {
    id: "shadcn-dashboard",
    url: "https://ui.shadcn.com/examples/dashboard",
    name: "shadcn/ui Dashboard",
    desc:
      "The go-to open-source dashboard example. Charts, data tables, sidebar nav, and metric cards built with Radix + Tailwind.",
    category: "dashboards",
    tags: ["open source", "components", "charts", "data table"],
    browseStyle: "minimal",
    diff: "intermediate",
    tech: ["Next.js", "Tailwind", "Radix UI"],
    featured: false,
  },
  {
    id: "linear-inbox",
    url: "https://linear.app/features",
    name: "Linear Features",
    desc:
      "Showcases Linear's dashboard UI through feature previews, with polished screenshots of their issue tracker, roadmap, and workflow views.",
    category: "dashboards",
    tags: ["project management", "UI showcase", "dark mode", "productivity"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["React", "Framer Motion", "CSS"],
    featured: false,
  },
  {
    id: "planetscale",
    url: "https://planetscale.com",
    name: "PlanetScale",
    desc:
      "Database platform landing page that showcases its dashboard UI with schema browser, query insights, and deployment branching visuals.",
    category: "dashboards",
    tags: ["database", "developer tools", "dark mode", "enterprise"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
  {
    id: "posthog",
    url: "https://posthog.com",
    name: "PostHog",
    desc:
      "Analytics platform with a quirky, illustrated landing page that showcases dashboards, funnels, and session replays with a playful brand.",
    category: "dashboards",
    tags: ["analytics", "open source", "playful", "illustrations"],
    browseStyle: "colorful",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// 5. Blogs & Content (5)
// ---------------------------------------------------------------------------

const blogsContent: RawTemplate[] = [
  {
    id: "hackernews",
    url: "https://news.ycombinator.com",
    name: "Hacker News",
    desc:
      "The iconic minimalist tech news aggregator. Ultra-simple layout that proves sometimes less is more. Great beginner clone target.",
    category: "blogs-content",
    tags: ["tech news", "minimal", "classic", "simple"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["HTML", "CSS", "Responsive"],
    featured: false,
  },
  {
    id: "stripe-blog",
    url: "https://stripe.com/blog",
    name: "Stripe Blog",
    desc:
      "Exemplary corporate blog with clean card layouts, category filtering, and a professional reading experience.",
    category: "blogs-content",
    tags: ["corporate blog", "clean", "cards", "tech"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["React", "CSS", "Responsive"],
    featured: false,
  },
  {
    id: "tailwind-blog",
    url: "https://tailwindcss.com/blog",
    name: "Tailwind Blog",
    desc:
      "Developer-focused blog with excellent code examples, clean reading layout, and a polished dark aesthetic.",
    category: "blogs-content",
    tags: ["developer blog", "dark mode", "code examples", "clean"],
    browseStyle: "dark",
    diff: "beginner",
    tech: ["Next.js", "Tailwind", "MDX"],
    featured: false,
  },
  {
    id: "brain-pickings",
    url: "https://www.themarginalian.org",
    name: "The Marginalian",
    desc:
      "Beautiful long-form reading experience with elegant serif typography, generous whitespace, and a timeless literary aesthetic.",
    category: "blogs-content",
    tags: ["long-form", "literary", "serif", "reading"],
    browseStyle: "minimal",
    diff: "beginner",
    tech: ["WordPress", "CSS", "Responsive"],
    featured: false,
  },
  {
    id: "smashing-magazine",
    url: "https://www.smashingmagazine.com",
    name: "Smashing Magazine",
    desc:
      "Iconic web design publication with a distinctive red brand, category-rich layout, and a content-dense but organized grid.",
    category: "blogs-content",
    tags: ["web design", "publication", "categories", "tutorials"],
    browseStyle: "bold",
    diff: "intermediate",
    tech: ["React", "CSS", "Responsive"],
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// 6. SaaS Apps (5)
// ---------------------------------------------------------------------------

const saasApps: RawTemplate[] = [
  {
    id: "slack",
    url: "https://slack.com",
    name: "Slack",
    desc:
      "Iconic messaging app landing page with product screenshots, animated feature demos, and a friendly enterprise marketing layout.",
    category: "saas-apps",
    tags: ["messaging", "collaboration", "enterprise", "product demos"],
    browseStyle: "colorful",
    diff: "intermediate",
    tech: ["React", "CSS", "Responsive"],
    featured: false,
  },
  {
    id: "figma",
    url: "https://www.figma.com",
    name: "Figma",
    desc:
      "Design tool landing page with bold typography, interactive product showcases, and a clean section-based layout.",
    category: "saas-apps",
    tags: ["design tool", "collaboration", "bold", "interactive"],
    browseStyle: "bold",
    diff: "intermediate",
    tech: ["React", "WebGL", "CSS"],
    featured: true,
  },
  {
    id: "framer",
    url: "https://www.framer.com",
    name: "Framer",
    desc:
      "Web builder landing page with stunning animations, interactive demos, and a dark, polished design that showcases its own capabilities.",
    category: "saas-apps",
    tags: ["web builder", "animations", "dark mode", "interactive"],
    browseStyle: "dark",
    diff: "advanced",
    tech: ["React", "Framer Motion", "CSS"],
    featured: true,
  },
  {
    id: "pitch",
    url: "https://pitch.com",
    name: "Pitch",
    desc:
      "Presentation tool with a colorful, modern landing page featuring animated slides, team collaboration visuals, and bold gradients.",
    category: "saas-apps",
    tags: ["presentations", "collaboration", "colorful", "gradients"],
    browseStyle: "colorful",
    diff: "intermediate",
    tech: ["React", "CSS", "SVG"],
    featured: false,
  },
  {
    id: "liveblocks",
    url: "https://liveblocks.io",
    name: "Liveblocks",
    desc:
      "Real-time collaboration API landing page with interactive cursor demos, clean dark design, and developer-focused code examples.",
    category: "saas-apps",
    tags: ["collaboration", "real-time", "developer tools", "API"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "React", "Tailwind"],
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// 7. Animations & Effects (7)
// ---------------------------------------------------------------------------

const animationsEffects: RawTemplate[] = [
  {
    id: "apple-airpods-pro",
    url: "https://www.apple.com/airpods-pro",
    name: "Apple AirPods Pro",
    desc:
      "Scroll-driven product storytelling at its finest. Pinned product shots, text reveals, and cinematic transitions tied to scroll position.",
    category: "animations-effects",
    tags: ["scroll animations", "product", "cinematic", "Apple"],
    browseStyle: "animated",
    diff: "advanced",
    tech: ["JavaScript", "CSS", "Canvas", "ScrollTrigger"],
    featured: false,
  },
  {
    id: "linear-releases",
    url: "https://linear.app/changelog",
    name: "Linear Changelog",
    desc:
      "Beautifully animated changelog with smooth entry transitions, glassmorphism cards, and a polished dark aesthetic.",
    category: "animations-effects",
    tags: ["changelog", "dark mode", "transitions", "glassmorphism"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["React", "Framer Motion", "CSS"],
    featured: false,
  },
  {
    id: "railway",
    url: "https://railway.com",
    name: "Railway",
    desc:
      "Deployment platform with a stunning animated hero featuring a 3D train/track visualization, particle effects, and smooth scroll sections.",
    category: "animations-effects",
    tags: ["3D", "particles", "dark mode", "deployment"],
    browseStyle: "animated",
    diff: "advanced",
    tech: ["Three.js", "React", "WebGL"],
    featured: false,
  },
  {
    id: "cosmos",
    url: "https://www.cosmos.so",
    name: "Cosmos",
    desc:
      "Visual bookmarking tool with a mesmerizing animated grid hero, smooth hover effects, and a creative dark interface.",
    category: "animations-effects",
    tags: ["creative", "grid", "dark mode", "hover effects"],
    browseStyle: "animated",
    diff: "advanced",
    tech: ["React", "GSAP", "WebGL"],
    featured: false,
  },
  {
    id: "linear-method",
    url: "https://linear.app/method",
    name: "Linear Method",
    desc:
      "Beautifully designed content page with smooth scroll animations, dark aesthetic, and thoughtful typography transitions.",
    category: "animations-effects",
    tags: ["methodology", "dark mode", "scroll animations", "typography"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["React", "Framer Motion", "CSS"],
    featured: false,
  },
  {
    id: "rive-app",
    url: "https://rive.app",
    name: "Rive",
    desc:
      "Animation tool landing page that eats its own dogfood -- interactive Rive animations throughout, smooth transitions, and playful interactive elements.",
    category: "animations-effects",
    tags: ["animation tool", "interactive", "playful", "Rive"],
    browseStyle: "animated",
    diff: "advanced",
    tech: ["React", "Rive", "WASM", "CSS"],
    featured: false,
  },
  {
    id: "midday",
    url: "https://midday.ai",
    name: "Midday",
    desc:
      "Financial tool with a beautifully animated dark landing page, smooth number counters, glassmorphism cards, and polished micro-interactions.",
    category: "animations-effects",
    tags: ["fintech", "dark mode", "micro-interactions", "glassmorphism"],
    browseStyle: "dark",
    diff: "intermediate",
    tech: ["Next.js", "Framer Motion", "Tailwind"],
    featured: true,
  },
];

// ---------------------------------------------------------------------------
// Gradient generator (deterministic from template id)
// ---------------------------------------------------------------------------

function generateGradientFromId(id: string): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    "linear-gradient(135deg, #f5576c 0%, #ff6a00 100%)",
    "linear-gradient(135deg, #13547a 0%, #80d0c7 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
    "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// Type for the raw data entries (without auto-filled fields)
type RawTemplate = Omit<CloneTemplate, "gradient" | "thumbnail" | "uses" | "isNew">;

function fillDefaults(templates: RawTemplate[]): CloneTemplate[] {
  return templates.map((t) => ({
    ...t,
    gradient: generateGradientFromId(t.id),
    thumbnail: `/templates/screenshots/${t.id}.webp`,
    uses: 0,
    isNew: true,
  }));
}

// ---------------------------------------------------------------------------
// Combined export
// ---------------------------------------------------------------------------

export const CLONE_TEMPLATES: CloneTemplate[] = [
  ...fillDefaults(landingPages),
  ...fillDefaults(portfolios),
  ...fillDefaults(ecommerce),
  ...fillDefaults(dashboards),
  ...fillDefaults(blogsContent),
  ...fillDefaults(saasApps),
  ...fillDefaults(animationsEffects),
];

/** Get templates by category */
export function getTemplatesByCategory(
  category: CloneCategory
): CloneTemplate[] {
  return CLONE_TEMPLATES.filter((t) => t.category === category);
}

/** Get the top 8 featured templates */
export function getFeaturedTemplates(): CloneTemplate[] {
  return CLONE_TEMPLATES.filter((t) => t.featured);
}

/** Get a single template by its slug id */
export function getTemplateById(id: string): CloneTemplate | undefined {
  return CLONE_TEMPLATES.find((t) => t.id === id);
}
