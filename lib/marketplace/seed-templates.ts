/**
 * Marketplace Seed Templates
 *
 * 8 starter templates that populate the marketplace on first launch.
 * Each template includes a realistic AI prompt that Argus's generation
 * engine would use to build the site from scratch.
 */

export interface MarketplaceTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  prompt: string;
  previewImageUrl?: string;
}

export const SEED_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: '00000000-0001-4000-a000-000000000001',
    title: 'SaaS Landing Page',
    description:
      'Modern landing page with hero section, feature grid, pricing table with 3 tiers, testimonials carousel, and email capture footer. Includes smooth scroll animations and responsive design.',
    category: 'Marketing',
    tags: ['SaaS', 'Landing Page', 'Pricing', 'Responsive'],
    prompt:
      'Build a modern SaaS landing page with the following sections: (1) A hero section with a bold headline, subheadline, CTA button, and a product screenshot mockup. (2) A logo cloud of partner companies. (3) A features grid with 6 feature cards, each with an icon, title, and description. (4) A pricing section with 3 tiers (Free, Pro, Enterprise) showing features and pricing. (5) A testimonials section with 3 customer quotes. (6) A CTA section with email capture form. Use a clean, modern design with Inter font, dark navy primary color, and electric blue accents. Make it fully responsive. Add subtle scroll-triggered fade-in animations.',
  },
  {
    id: '00000000-0001-4000-a000-000000000002',
    title: 'Portfolio Site',
    description:
      'Minimal developer portfolio featuring a brief introduction, project grid with hover effects, skills list, experience timeline, and contact form. Dark theme with accent color.',
    category: 'Personal',
    tags: ['Portfolio', 'Developer', 'Minimal', 'Dark Theme'],
    prompt:
      'Build a minimal developer portfolio website with: (1) A hero section with name, title (Full-Stack Developer), short bio, and social links (GitHub, LinkedIn, Twitter). (2) A project grid showing 6 projects as cards with thumbnail, title, tech stack badges, and links to live demo and source code. Cards should have a subtle hover effect. (3) A skills section organized by category (Frontend, Backend, DevOps) with skill bars or tags. (4) An experience timeline showing work history. (5) A contact form with name, email, and message fields. Use a dark theme (#0a0a0a background, #fafafa text) with a single accent color (#6366f1). Use JetBrains Mono for code elements.',
  },
  {
    id: '00000000-0001-4000-a000-000000000003',
    title: 'E-commerce Storefront',
    description:
      'Product catalog with category sidebar, product cards with quick-add, shopping cart drawer, and checkout flow. Includes search and filter functionality.',
    category: 'E-commerce',
    tags: ['Store', 'Products', 'Cart', 'Checkout'],
    prompt:
      'Build an e-commerce storefront with: (1) A header with logo, search bar, category navigation, and cart icon with item count badge. (2) A hero banner with a featured product or sale. (3) A product catalog page with a category sidebar filter, sort dropdown (price, rating, newest), and a grid of product cards. Each card shows product image, name, price, rating stars, and an "Add to Cart" button. (4) A slide-out cart drawer showing cart items with quantity controls, subtotal, and checkout button. (5) A product detail page with image gallery, description, size/color selectors, and related products. Use a clean white theme with warm accent colors. Make it fully responsive.',
  },
  {
    id: '00000000-0001-4000-a000-000000000004',
    title: 'Blog Platform',
    description:
      'Blog with markdown post rendering, sidebar with categories and recent posts, tag filtering, search, and responsive reading experience with dark mode toggle.',
    category: 'Content',
    tags: ['Blog', 'Markdown', 'Tags', 'Dark Mode'],
    prompt:
      'Build a blog platform with: (1) A homepage showing blog posts as cards in a grid — each card has a cover image, title, excerpt, author avatar, date, and reading time. (2) A single post page with rendered markdown content, table of contents sidebar, author bio, and related posts. (3) A sidebar with categories list, tag cloud, recent posts, and newsletter signup. (4) A category/tag archive page that filters posts. (5) A search page with full-text search. (6) A dark mode toggle in the header. Use a serif font (Merriweather) for body text and sans-serif (Inter) for UI. Clean, medium-width reading layout. Support code blocks with syntax highlighting.',
  },
  {
    id: '00000000-0001-4000-a000-000000000005',
    title: 'Dashboard Template',
    description:
      'Admin dashboard with sidebar navigation, KPI metric cards, line/bar/pie charts, data table with sorting and pagination, and user management section.',
    category: 'Application',
    tags: ['Dashboard', 'Admin', 'Charts', 'Data Table'],
    prompt:
      'Build an admin dashboard with: (1) A collapsible sidebar with navigation items: Overview, Analytics, Users, Products, Orders, Settings — each with an icon. (2) A top bar with search, notifications bell with badge, and user avatar dropdown. (3) An overview page with 4 KPI cards (Total Revenue, Active Users, Orders, Conversion Rate) showing value, trend arrow, and percentage change. (4) A line chart showing revenue over the last 12 months and a bar chart showing orders by category. (5) A data table with columns for Name, Email, Role, Status, Last Active — with sorting, search filter, and pagination. (6) A settings page with form fields. Use a dark sidebar (#1e1e2e) with white content area. Use Recharts or similar for charts.',
  },
  {
    id: '00000000-0001-4000-a000-000000000006',
    title: 'Documentation Site',
    description:
      'Developer documentation with hierarchical sidebar navigation, search, code block syntax highlighting, copy buttons, breadcrumbs, and prev/next navigation.',
    category: 'Developer',
    tags: ['Docs', 'Documentation', 'API Reference', 'Search'],
    prompt:
      'Build a developer documentation site with: (1) A left sidebar with collapsible, hierarchical navigation (Getting Started > Installation, Quick Start, Configuration; API Reference > Authentication, Endpoints, Webhooks; Guides > Deployment, Testing). (2) A top bar with search (opens a command palette overlay), dark mode toggle, and GitHub link. (3) Content area with rendered markdown including headings with anchor links, code blocks with syntax highlighting and copy button, callout boxes (info, warning, tip), and tables. (4) A right sidebar table of contents for the current page. (5) Breadcrumb navigation at the top of content. (6) Previous/Next page navigation at the bottom. Use a clean layout similar to Stripe or Vercel docs. Monospace font for code (Fira Code).',
  },
  {
    id: '00000000-0001-4000-a000-000000000007',
    title: 'Restaurant Menu',
    description:
      'Food ordering page with categorized menu (Appetizers, Mains, Desserts, Drinks), item cards with images, descriptions, prices, dietary badges, and a cart with order summary.',
    category: 'Food & Drink',
    tags: ['Restaurant', 'Menu', 'Food', 'Ordering'],
    prompt:
      'Build a restaurant menu and ordering page with: (1) A header with restaurant name, logo, and "View Cart" button. (2) A hero section with restaurant interior photo and tagline. (3) A sticky category nav bar (Appetizers, Mains, Pasta, Desserts, Drinks) that scrolls to sections. (4) Menu sections — each item is a card with food photo, name, description, price, dietary badges (V for vegetarian, GF for gluten-free, spicy indicator), and an "Add to Order" button with quantity selector. (5) A cart sidebar/drawer showing ordered items, quantities, item totals, subtotal, tax, and order total with a "Place Order" button. Use warm colors (deep red #8B0000, cream #FFFDD0) and a serif font for the restaurant name with sans-serif for body text.',
  },
  {
    id: '00000000-0001-4000-a000-000000000008',
    title: 'Fitness Tracker',
    description:
      'Workout logging app with exercise form, workout history calendar, progress charts (weight, reps over time), personal records display, and weekly summary dashboard.',
    category: 'Health',
    tags: ['Fitness', 'Workout', 'Progress', 'Charts'],
    prompt:
      'Build a fitness tracker application with: (1) A dashboard showing weekly summary: total workouts, total volume (sets x reps x weight), calories burned, and a streak counter. (2) A "Log Workout" form with exercise name autocomplete, sets/reps/weight inputs, rest timer, and notes field. Allow adding multiple exercises to one session. (3) A workout history page with a calendar view highlighting workout days, and a list view of past workouts that can be expanded to see details. (4) A progress page with line charts showing strength progress over time for selected exercises (bench press, squat, deadlift). Show personal records (PRs) prominently. (5) An exercise library page with exercise cards showing name, muscle group tags, and instructions. Use a sporty dark theme (#111827 background) with energetic accent color (#22c55e green). Include motivational empty states.',
  },
];
