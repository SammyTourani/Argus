/**
 * BYOK (Bring Your Own Key) resolver.
 *
 * Queries the user's stored API keys, decrypts the matching one for the
 * requested model's provider, and returns it. Returns null on any error
 * so callers can safely fall back to server-side env keys.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/crypto';

type ProviderName = 'openai' | 'anthropic' | 'groq' | 'google';

/** Map model ID prefixes to the provider name stored in user_api_keys */
function resolveProvider(modelId: string): ProviderName {
  if (modelId.startsWith('anthropic/')) return 'anthropic';
  if (modelId.startsWith('openai/')) return 'openai';
  if (modelId.startsWith('google/')) return 'google';
  return 'groq';
}

function getSupabaseAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Look up the user's active BYOK key for the given model.
 * Returns the decrypted API key string, or null if none found / on error.
 */
export async function getUserApiKey(
  userId: string,
  modelId: string,
): Promise<string | null> {
  try {
    const provider = resolveProvider(modelId);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, encrypted_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.encrypted_key) return null;

    const decryptedKey = decrypt(data.encrypted_key);

    // Update last_used_at (fire-and-forget)
    supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
      .then(() => { /* best effort */ });

    return decryptedKey;
  } catch {
    return null;
  }
}
