'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveTeamId } from '@/lib/workspace/active-workspace';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    const teamId = getActiveTeamId();
    if (teamId) {
      router.replace('/settings/general');
    } else {
      router.replace('/settings/api-keys');
    }
  }, [router]);

  return null;
}
