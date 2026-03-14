import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { nanoid } from 'nanoid';

const resend = new Resend(process.env.RESEND_API_KEY!);

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

type RouteParams = { params: Promise<{ projectId: string }> };

// GET /api/projects/[projectId]/collaborators
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: collaborators, error } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ collaborators: collaborators ?? [] });
  } catch (err) {
    console.error('[GET /api/projects/[id]/collaborators]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/collaborators — invite by email
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { email, role = 'editor' } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role must be editor or viewer' }, { status: 400 });
    }

    // Verify requester is project owner
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, created_by')
      .eq('id', projectId)
      .eq('created_by', user.id)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found or forbidden' }, { status: 403 });

    // Check if already invited
    const { data: existing } = await supabase
      .from('project_collaborators')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('email', email)
      .single();

    if (existing && existing.status === 'accepted') {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 });
    }

    // Create invite token
    const inviteToken = nanoid(32);

    const { data: invite, error: inviteError } = await supabase
      .from('project_collaborators')
      .upsert(
        {
          project_id: projectId,
          invited_by: user.id,
          email,
          role,
          status: 'pending',
          invite_token: inviteToken,
        },
        { onConflict: 'project_id,email' }
      )
      .select()
      .single();

    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });

    // Send invite email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://buildargus.dev';
    const inviteUrl = `${appUrl}/workspace/invite/${inviteToken}`;
    const inviterName = user.user_metadata?.full_name ?? user.email ?? 'Someone';
    const projectName = (project as { name: string }).name;

    try {
      await resend.emails.send({
        from: 'Argus <noreply@argus.build>',
        to: [email],
        subject: `${inviterName} invited you to collaborate on "${projectName}"`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#080808;margin:0;padding:40px 20px;font-family:'JetBrains Mono',monospace;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="color:#FA4500;font-size:22px;font-weight:700;letter-spacing:0.1em;margin-bottom:32px;">ARGUS</div>
    <div style="color:#ffffff;font-size:16px;margin-bottom:16px;">
      <strong>${inviterName}</strong> invited you to collaborate on
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin-bottom:24px;">
      <div style="color:#FA4500;font-size:18px;font-weight:600;">${projectName}</div>
      <div style="color:#666;font-size:13px;margin-top:4px;">Role: ${role}</div>
    </div>
    <a href="${inviteUrl}"
       style="display:inline-block;background:#FA4500;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">
      Accept Invitation →
    </a>
    <div style="color:#333;font-size:11px;margin-top:24px;border-top:1px solid #1a1a1a;padding-top:16px;">
      This invite expires in 7 days. If you weren't expecting this, you can ignore it.
    </div>
    <div style="color:#1a1a1a;font-size:11px;letter-spacing:0.2em;margin-top:16px;">
      · · · ARGUS · · ·
    </div>
  </div>
</body>
</html>
        `,
      });
    } catch (emailErr) {
      console.error('[collaborators invite email failed]', emailErr);
      // Don't fail the whole invite if email fails — return the invite anyway
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects/[id]/collaborators]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/collaborators/[collaboratorId]
// Note: handled in a separate route file
