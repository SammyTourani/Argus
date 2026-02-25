'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'login_required'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    const handle = async () => {
      if (!token) { setStatus('error'); setErrorMsg('Invalid invite link.'); return; }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('login_required');
        return;
      }

      setStatus('accepting');

      // Look up the invite
      const { data: invite, error } = await supabase
        .from('project_collaborators')
        .select('id, project_id, status, invite_expires_at, projects(name)')
        .eq('invite_token', token)
        .single();

      if (error || !invite) {
        setStatus('error');
        setErrorMsg('Invite not found or already used.');
        return;
      }

      if (invite.status === 'accepted') {
        // Already accepted — just redirect to project
        router.push(`/workspace/${invite.project_id}`);
        return;
      }

      if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
        setStatus('error');
        setErrorMsg('This invite has expired. Ask the project owner to send a new one.');
        return;
      }

      // Accept the invite
      const { error: updateError } = await supabase
        .from('project_collaborators')
        .update({
          status: 'accepted',
          user_id: user.id,
          joined_at: new Date().toISOString(),
          invite_token: null, // invalidate token
        })
        .eq('id', invite.id);

      if (updateError) {
        setStatus('error');
        setErrorMsg('Failed to accept invite. Please try again.');
        return;
      }

      const proj = invite.projects as unknown as { name: string } | null;
      setProjectName(proj?.name ?? 'the project');
      setStatus('success');

      setTimeout(() => router.push(`/workspace/${invite.project_id}`), 2000);
    };

    handle();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md px-6"
      >
        <div className="text-[#FA4500] font-bold text-xl tracking-widest mb-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          ARGUS
        </div>

        {status === 'loading' && (
          <div className="text-zinc-400 text-sm">Checking invite...</div>
        )}

        {status === 'accepting' && (
          <div className="text-zinc-400 text-sm">
            <span className="inline-block animate-pulse">Accepting invitation...</span>
          </div>
        )}

        {status === 'success' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-white text-xl font-bold mb-2">You're in!</h2>
            <p className="text-zinc-400 text-sm">You now have access to <span className="text-white">{projectName}</span>. Redirecting...</p>
          </motion.div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-red-400 text-xl mb-4">✕</div>
            <h2 className="text-white text-lg font-bold mb-2">Invite error</h2>
            <p className="text-zinc-400 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push('/workspace')}
              className="text-[#FA4500] text-sm hover:underline"
            >
              Go to workspace →
            </button>
          </div>
        )}

        {status === 'login_required' && (
          <div>
            <h2 className="text-white text-lg font-bold mb-2">Sign in to accept</h2>
            <p className="text-zinc-400 text-sm mb-6">You need an Argus account to accept this invite.</p>
            <a
              href={`/sign-in?redirect=/workspace/invite/${token}`}
              className="inline-block bg-[#FA4500] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#e03e00] transition-colors"
            >
              Sign in →
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
