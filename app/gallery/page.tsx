import { createClient } from '@/lib/supabase/server';
import GalleryClient from './gallery-client';

const FALLBACK_GALLERY = [
  { id: '1', name: 'SaaS Landing Page', category: 'Landing Pages', creator: 'Sammy T.', model: 'Claude Sonnet', gradient: 'from-orange-400 to-red-600', desc: 'Clean SaaS landing with pricing and testimonials' },
  { id: '2', name: 'Analytics Dashboard', category: 'Dashboard', creator: 'Alex K.', model: 'GPT-4o', gradient: 'from-blue-500 to-purple-600', desc: 'Real-time analytics dashboard with charts' },
  { id: '3', name: 'E-commerce Store', category: 'E-commerce', creator: 'Maria S.', model: 'Claude Sonnet', gradient: 'from-pink-400 to-rose-600', desc: 'Full product catalog with cart and checkout' },
  { id: '4', name: 'Portfolio Site', category: 'Portfolio', creator: 'James L.', model: 'Gemini Flash', gradient: 'from-green-400 to-teal-600', desc: 'Minimal portfolio with project showcases' },
  { id: '5', name: 'Social Network', category: 'SaaS', creator: 'Priya M.', model: 'DeepSeek R1', gradient: 'from-violet-500 to-purple-700', desc: 'Twitter-like social platform with feeds' },
  { id: '6', name: 'Task Manager', category: 'SaaS', creator: 'Tom B.', model: 'Llama 3.3', gradient: 'from-yellow-400 to-orange-500', desc: 'Kanban-style project management tool' },
  { id: '7', name: 'Food Delivery App', category: 'Mobile', creator: 'Lisa C.', model: 'GPT-4o', gradient: 'from-red-400 to-orange-600', desc: 'Restaurant ordering with live tracking' },
  { id: '8', name: 'Crypto Tracker', category: 'Dashboard', creator: 'Raj P.', model: 'Claude Sonnet', gradient: 'from-yellow-500 to-amber-600', desc: 'Portfolio tracker with price alerts' },
  { id: '9', name: 'Blog Platform', category: 'SaaS', creator: 'Sara N.', model: 'Gemini Flash', gradient: 'from-sky-400 to-blue-600', desc: 'CMS with markdown editor and comments' },
  { id: '10', name: 'Booking System', category: 'SaaS', creator: 'Mike R.', model: 'Mistral', gradient: 'from-emerald-400 to-green-600', desc: 'Appointment scheduler with calendar sync' },
  { id: '11', name: 'AI Chat Interface', category: 'SaaS', creator: 'Yuki T.', model: 'Claude Opus', gradient: 'from-indigo-400 to-violet-600', desc: 'Custom ChatGPT interface with personas' },
  { id: '12', name: 'Learning Platform', category: 'SaaS', creator: 'Omar H.', model: 'DeepSeek R1', gradient: 'from-cyan-400 to-blue-500', desc: 'Course platform with video + quizzes' },
];

const GRADIENT_POOL = [
  'from-orange-400 to-red-600',
  'from-blue-500 to-purple-600',
  'from-pink-400 to-rose-600',
  'from-green-400 to-teal-600',
  'from-violet-500 to-purple-700',
  'from-yellow-400 to-orange-500',
  'from-red-400 to-orange-600',
  'from-yellow-500 to-amber-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-green-600',
  'from-indigo-400 to-violet-600',
  'from-cyan-400 to-blue-500',
];

export default async function GalleryPage() {
  let gallery = FALLBACK_GALLERY;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('id, title, description, category, tags, preview_image_url, use_count, created_at')
      .order('use_count', { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      gallery = data.map((row, i) => ({
        id: row.id,
        name: row.title ?? 'Untitled',
        category: row.category ?? 'SaaS',
        creator: 'Community',
        model: (row.tags as string[] | null)?.[0] ?? 'Claude Sonnet',
        gradient: GRADIENT_POOL[i % GRADIENT_POOL.length],
        desc: row.description ?? '',
      }));
    }
  } catch {
    // Supabase unavailable — use fallback
  }

  return <GalleryClient items={gallery} />;
}
