/**
 * POST /api/marketplace/seed
 *
 * Seeds the marketplace_listings table with the 8 starter templates.
 * Admin-only: validates the requesting user's email against ADMIN_EMAIL env var.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SEED_TEMPLATES } from '@/lib/marketplace/seed-templates';

export async function POST() {
  try {
    // ── Auth check: must be signed in ────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // ── Admin check: email must match ADMIN_EMAIL env ────────────────────
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    // ── Seed the templates ───────────────────────────────────────────────
    const rows = SEED_TEMPLATES.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      tags: t.tags,
      prompt: t.prompt,
      thumbnail_url: t.previewImageUrl ?? 'https://placehold.co/400x300/1a1a2e/ffffff?text=' + encodeURIComponent(t.title),
      submitted_by: user.id,
      is_featured: false,
      use_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error: insertError } = await supabase
      .from('marketplace_listings')
      .upsert(rows, { onConflict: 'id' })
      .select('id');

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to seed templates', details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      seeded: data?.length ?? 0,
      templates: SEED_TEMPLATES.map((t) => t.title),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Seed failed', details: message },
      { status: 500 },
    );
  }
}
