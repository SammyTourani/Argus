'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  prompt: string;
  tags: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'saas-landing',
    name: 'SaaS Landing Page',
    description: 'Hero, features, pricing, testimonials, CTA',
    category: 'Marketing',
    gradient: 'from-orange-500 to-red-600',
    prompt: 'Build a modern SaaS landing page with a hero section featuring a headline, subheadline, and CTA button. Include a features section with 3 feature cards, a pricing section with 3 tiers (Free/Pro/Team), and a testimonials section. Use a clean white design with orange accent color.',
    tags: ['landing', 'saas', 'marketing'],
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Stats, charts, data tables, sidebar nav',
    category: 'App',
    gradient: 'from-blue-500 to-violet-600',
    prompt: 'Build a dark analytics dashboard with a sidebar navigation, a stats row showing 4 KPI cards (users, revenue, conversions, churn), a line chart for monthly revenue, a bar chart for weekly signups, and a recent activity table. Use a dark theme with blue accents.',
    tags: ['dashboard', 'analytics', 'app'],
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Product grid, cart, checkout flow',
    category: 'Commerce',
    gradient: 'from-emerald-400 to-teal-600',
    prompt: 'Build an e-commerce product page with a product image gallery, product details (name, price, description, size selector), an Add to Cart button, and a related products section. Include a cart sidebar that slides in when items are added.',
    tags: ['ecommerce', 'shop', 'commerce'],
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'About, projects, skills, contact form',
    category: 'Personal',
    gradient: 'from-violet-500 to-purple-700',
    prompt: 'Build a minimal developer portfolio with a hero section with name and title, an about section with photo placeholder, a projects grid showing 4 project cards with tech stack badges, a skills section, and a contact form. Use a dark minimal design.',
    tags: ['portfolio', 'personal', 'resume'],
  },
  {
    id: 'blog',
    name: 'Blog Platform',
    description: 'Post list, article view, categories',
    category: 'Content',
    gradient: 'from-amber-400 to-orange-500',
    prompt: 'Build a blog homepage with a featured article hero, a grid of 6 article cards with thumbnail, title, excerpt, author, and date. Include a sidebar with categories, recent posts, and newsletter signup. Use a clean editorial design.',
    tags: ['blog', 'content', 'writing'],
  },
  {
    id: 'kanban',
    name: 'Task Manager',
    description: 'Kanban board, drag-and-drop columns',
    category: 'Productivity',
    gradient: 'from-sky-400 to-blue-600',
    prompt: 'Build a Kanban task management board with three columns (Todo, In Progress, Done). Each column shows task cards with title, description, priority badge, and assignee avatar. Include a "New Task" button that opens a modal form.',
    tags: ['tasks', 'kanban', 'productivity'],
  },
  {
    id: 'chat-ui',
    name: 'AI Chat Interface',
    description: 'Chat bubbles, streaming responses, sidebar',
    category: 'AI',
    gradient: 'from-pink-500 to-rose-600',
    prompt: 'Build a ChatGPT-style AI chat interface with a sidebar showing conversation history, a main chat area with user and assistant message bubbles, a typing indicator, and a text input with send button. Use a dark theme with subtle gradients.',
    tags: ['ai', 'chat', 'messaging'],
  },
  {
    id: 'auth-screens',
    name: 'Auth Screens',
    description: 'Sign in, sign up, forgot password',
    category: 'Auth',
    gradient: 'from-zinc-700 to-zinc-900',
    prompt: 'Build a complete authentication flow with a sign-in page (email + password + remember me + forgot password link), a sign-up page (name + email + password + confirm + terms), and a forgot password page. Use a clean split-panel design with a dark left panel and white right panel.',
    tags: ['auth', 'login', 'signup'],
  },
  {
    id: 'waitlist',
    name: 'Waitlist Page',
    description: 'Email capture, social proof, countdown',
    category: 'Marketing',
    gradient: 'from-yellow-400 to-orange-500',
    prompt: 'Build a pre-launch waitlist landing page with a big headline, product tagline, email capture form with submit button, a social proof counter showing number of signups, and logos of featured-in press. Include a countdown timer. Use an exciting dark design.',
    tags: ['waitlist', 'launch', 'marketing'],
  },
  {
    id: 'pricing',
    name: 'Pricing Page',
    description: 'Comparison table, toggle monthly/yearly',
    category: 'Marketing',
    gradient: 'from-indigo-400 to-blue-600',
    prompt: 'Build a SaaS pricing page with a monthly/yearly toggle (yearly shows 20% discount), three pricing tiers (Free, Pro at $19/mo, Team at $49/mo) with feature lists and CTA buttons, and a feature comparison table below. Use a clean white design with blue accents.',
    tags: ['pricing', 'saas', 'billing'],
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
}

export default function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
      {TEMPLATES.map((template, i) => (
        <motion.button
          key={template.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onSelectTemplate(template)}
          className="group text-left rounded-xl border border-[var(--editor-border)] overflow-hidden hover:border-[var(--editor-accent-50)] transition-all duration-200 bg-[var(--editor-bg-base)]"
        >
          {/* Thumbnail gradient */}
          <div className={cn('h-16 w-full bg-gradient-to-br opacity-80', template.gradient)} />
          {/* Info */}
          <div className="p-3">
            <p className="text-[13px] font-sans font-semibold text-white group-hover:text-[var(--editor-accent)] transition-colors">{template.name}</p>
            <p className="text-[11px] font-sans text-[var(--editor-fg-tertiary)] mt-0.5 line-clamp-1">{template.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] font-mono text-[var(--editor-fg-dim)] bg-[var(--editor-bg-elevated)] border border-[var(--editor-border-faint)] px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
