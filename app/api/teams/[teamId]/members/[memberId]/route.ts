/**
 * PATCH  /api/teams/:teamId/members/:memberId — change member role
 * DELETE /api/teams/:teamId/members/:memberId — remove member
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const { teamId, memberId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is owner or admin
    const { data: callerMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const newRole = body.role;
    if (!['owner', 'admin', 'member'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Only owners can promote to owner or demote from owner
    const admin = getSupabaseAdmin();
    const { data: targetMember } = await admin
      .from('team_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if ((targetMember.role === 'owner' || newRole === 'owner') && callerMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can change owner roles' }, { status: 403 });
    }

    // Prevent sole owner from demoting themselves
    if (targetMember.user_id === user.id && targetMember.role === 'owner' && newRole !== 'owner') {
      const { count } = await admin
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('role', 'owner');
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot demote the only owner. Promote another member first.' }, { status: 400 });
      }
    }

    const { error: updateError } = await admin
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (updateError) {
      console.error('[PATCH /api/teams/:teamId/members/:memberId]', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, role: newRole });
  } catch (err) {
    console.error('[PATCH /api/teams/:teamId/members/:memberId] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const { teamId, memberId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Fetch target member
    const { data: targetMember } = await admin
      .from('team_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Self-removal: any member can leave (unless sole owner)
    const isSelf = targetMember.user_id === user.id;

    if (!isSelf) {
      // Verify caller is owner or admin to remove others
      const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Admins can't remove owners
      if (targetMember.role === 'owner' && callerMembership.role !== 'owner') {
        return NextResponse.json({ error: 'Only owners can remove other owners' }, { status: 403 });
      }
    }

    // Prevent sole owner from leaving
    if (targetMember.role === 'owner') {
      const { count } = await admin
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('role', 'owner');
      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the only owner. Transfer ownership or delete the workspace instead.' },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await admin
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('[DELETE /api/teams/:teamId/members/:memberId]', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/teams/:teamId/members/:memberId] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
