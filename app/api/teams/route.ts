/**
 * GET  /api/teams — list teams the current user belongs to
 * POST /api/teams — create a new team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get team memberships
    const { data: memberships, error } = await supabase
      .from('team_members')
      .select('team_id, role, teams!inner(id, name, slug, plan)')
      .eq('user_id', user.id);

    if (error) {
      console.error('[GET /api/teams]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const teams = (memberships ?? []).map((m: any) => ({
      id: m.teams?.id,
      name: m.teams?.name,
      slug: m.teams?.slug,
      plan: m.teams?.plan || 'free',
      role: m.role,
    }));

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[GET /api/teams] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Generate slug from name, ensure min 2 chars
    let slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 44);
    if (slug.length < 2) {
      slug = slug + '-team';
    }
    // Add random suffix to prevent collisions
    slug = slug + '-' + Math.random().toString(36).substring(2, 6);

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        slug,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/teams]', error);
      const msg = error.message?.includes('duplicate') ? 'A team with that name already exists' : error.message;
      return NextResponse.json({ error: msg }, { status: error.message?.includes('duplicate') ? 409 : 500 });
    }

    // Add creator as owner member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('[POST /api/teams] member insert failed:', memberError);
      // Clean up: delete the orphaned team
      await supabase.from('teams').delete().eq('id', team.id);
      return NextResponse.json({ error: 'Failed to initialize team membership' }, { status: 500 });
    }

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/teams] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
