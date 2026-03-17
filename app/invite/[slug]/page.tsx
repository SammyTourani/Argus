import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import InviteLanding from './InviteLanding';
import Link from 'next/link';

interface ReferrerInfo {
  name: string;
  initial: string;
  avatarUrl: string | null;
  referralCode: string;
}

async function getReferrer(slug: string): Promise<ReferrerInfo | null> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Dual lookup: try referral_slug first, fall back to referral_code
  let { data: profile } = await admin
    .from('profiles')
    .select('full_name, avatar_url, referral_code')
    .eq('referral_slug', slug.toLowerCase())
    .maybeSingle();

  if (!profile) {
    const result = await admin
      .from('profiles')
      .select('full_name, avatar_url, referral_code')
      .eq('referral_code', slug.toUpperCase())
      .maybeSingle();
    profile = result.data;
  }

  if (!profile || !profile.referral_code) return null;

  const name = profile.full_name || 'Someone';
  return {
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarUrl: profile.avatar_url || null,
    referralCode: profile.referral_code,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const referrer = await getReferrer(slug);

  if (!referrer) {
    return { title: 'Invite | Argus' };
  }

  const title = `${referrer.name} invited you to Argus`;
  const description = 'Clone any website with AI. Get 40 credits (10 bonus) when you sign up.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['https://buildargus.dev/argus-assets/og-image.png'],
      siteName: 'Argus',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://buildargus.dev/argus-assets/og-image.png'],
      creator: '@sammytourani',
    },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const referrer = await getReferrer(slug);

  // Invalid referral slug — show fallback
  if (!referrer) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center px-6">
        <div
          className="text-sm mb-4"
          style={{ fontFamily: '"JetBrains Mono", monospace', color: '#FA4500' }}
        >
          INVALID LINK
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          This referral link doesn&apos;t exist
        </h1>
        <p className="text-white/50 mb-8 max-w-md">
          The link may have expired or is incorrect. You can still try Argus for free.
        </p>
        <Link
          href="/sign-up"
          className="inline-block text-white font-semibold py-3 px-8 transition-all duration-150 active:scale-[0.98]"
          style={{
            borderRadius: '10px',
            background: '#FA4500',
          }}
        >
          Create free account
        </Link>
        <Link href="/" className="mt-6 text-white/40 text-sm hover:text-white/60 transition-colors">
          &larr; Back to home
        </Link>
      </div>
    );
  }

  return (
    <InviteLanding
      referrerName={referrer.name}
      referrerInitial={referrer.initial}
      referrerAvatarUrl={referrer.avatarUrl}
      referralCode={referrer.referralCode}
    />
  );
}
