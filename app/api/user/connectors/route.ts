/**
 * GET /api/user/connectors — get connection statuses for all connectors
 *
 * For GitHub: checks if user has a valid GitHub OAuth token
 * For others: queries user_connectors table
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectors: Array<{ provider: string; status: string; connected_at: string | null }> = [];

    // Check GitHub: see if user has GitHub identity
    const identities = user.identities || [];
    const githubIdentity = identities.find((i: any) => i.provider === 'github');
    if (githubIdentity) {
      connectors.push({
        provider: 'github',
        status: 'connected',
        connected_at: githubIdentity.created_at || null,
      });
    }

    // Check user_connectors table for any other connectors
    const { data: dbConnectors } = await supabase
      .from('user_connectors')
      .select('provider, status, connected_at')
      .eq('user_id', user.id);

    if (dbConnectors) {
      for (const c of dbConnectors) {
        // Skip GitHub if already handled via identity
        if (c.provider === 'github' && githubIdentity) continue;
        connectors.push({
          provider: c.provider,
          status: c.status,
          connected_at: c.connected_at,
        });
      }
    }

    return NextResponse.json({ connectors });
  } catch (err) {
    console.error('[GET /api/user/connectors] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
