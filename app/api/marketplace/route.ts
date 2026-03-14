/**
 * GET /api/marketplace
 *
 * Public endpoint: lists marketplace_listings with filtering, sorting, pagination.
 * Query params: category, featured, search, sort (popular|newest|uses), limit, offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('marketplace_listings')
      .select('id, title, description, category, tags, thumbnail_url, like_count, use_count, is_featured, prompt, gradient, created_at')
      .eq('is_public', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (search) {
      // Sanitize: escape PostgREST special chars and LIKE wildcards
      const sanitized = search.replace(/[%_\\]/g, '\\$&').replace(/[.,()]/g, '');
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }

    // Sort
    if (sort === 'popular') {
      query = query.order('like_count', { ascending: false });
    } else if (sort === 'uses') {
      query = query.order('use_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/marketplace]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listings: data ?? [] });
  } catch (err) {
    console.error('[GET /api/marketplace] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
