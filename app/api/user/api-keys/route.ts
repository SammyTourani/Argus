/**
 * GET  /api/user/api-keys — list masked keys for current user
 * POST /api/user/api-keys — add a new API key (encrypted)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, deriveKeyMask } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/ratelimit';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: keys, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, label, key_mask, status, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/user/api-keys]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: keys ?? [] });
  } catch (err) {
    console.error('[GET /api/user/api-keys] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const PROVIDER_PREFIXES: Record<string, string[]> = {
  openai: ['sk-'],
  anthropic: ['sk-ant-'],
  google: ['AIza'],
  xai: ['xai-'],
  groq: ['gsk_'],
  deepseek: ['sk-'],
  mistral: [''],
  alibaba: [''],
  custom: [''],
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 60 key additions per minute per user
    const rateLimit = await checkRateLimit(`user:${user.id}`, 'generic');
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            'Retry-After': String(resetIn),
          },
        }
      );
    }

    const body = await request.json();
    const { provider, key, label } = body;

    if (!provider || !key) {
      return NextResponse.json({ error: 'provider and key are required' }, { status: 400 });
    }

    const validProviders = Object.keys(PROVIDER_PREFIXES);
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider: ' + provider }, { status: 400 });
    }

    if (typeof key !== 'string' || key.length < 8 || key.length > 256) {
      return NextResponse.json({ error: 'Key must be between 8 and 256 characters' }, { status: 400 });
    }

    // Validate provider-specific prefix (skip for providers with empty prefix)
    const expectedPrefixes = PROVIDER_PREFIXES[provider] || [];
    const hasValidPrefix = expectedPrefixes.length === 0 ||
      expectedPrefixes.some(p => p === '' || key.startsWith(p));
    if (!hasValidPrefix) {
      return NextResponse.json({
        error: 'Invalid key format for ' + provider + '. Expected prefix: ' + expectedPrefixes.filter(Boolean).join(' or '),
      }, { status: 400 });
    }

    // Encrypt the key
    const encryptedKey = encrypt(key);
    const keyMask = deriveKeyMask(key);

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        label: label || null,
        encrypted_key: encryptedKey,
        key_mask: keyMask,
        status: 'active',
      })
      .select('id, provider, label, key_mask, status, created_at')
      .single();

    if (error) {
      console.error('[POST /api/user/api-keys]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/user/api-keys] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
