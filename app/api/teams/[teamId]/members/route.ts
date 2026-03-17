/**
 * GET  /api/teams/:teamId/members — list team members with profile info
 * POST /api/teams/:teamId/members — add a member by email (must already have Argus account)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!callerMembership) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const admin = getSupabaseAdmin();
    const { data: rawMembers, error } = await admin
      .from('team_members')
      .select('id, user_id, role, joined_at')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('[GET /api/teams/:teamId/members]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = (rawMembers || []).map(m => m.user_id);
    const { data: profiles } = userIds.length > 0
      ? await admin.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const members = (rawMembers || []).map(m => ({
      ...m,
      profiles: profileMap.get(m.user_id) || { full_name: null, email: null, avatar_url: null },
    }));

    return NextResponse.json({ members, callerRole: callerMembership.role });
  } catch (err) {
    console.error('[GET /api/teams/:teamId/members] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
    }

    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const role = body.role === 'admin' ? 'admin' : 'member';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: targetProfile } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'No Argus account found for this email. The user must sign up first.' },
        { status: 404 }
      );
    }

    const { data: existing } = await admin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', targetProfile.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'This user is already a member of this workspace.' }, { status: 409 });
    }

    const { data: member, error: insertError } = await admin
      .from('team_members')
      .insert({ team_id: teamId, user_id: targetProfile.id, role, invited_by: user.id })
      .select('id, user_id, role, joined_at')
      .single();

    if (insertError) {
      console.error('[POST /api/teams/:teamId/members]', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      member: { ...member, profiles: { full_name: targetProfile.full_name, email: targetProfile.email, avatar_url: null } },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/teams/:teamId/members] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
