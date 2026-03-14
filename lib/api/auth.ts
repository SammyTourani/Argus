import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Require an authenticated user from the Supabase session.
 * Throws an ApiError(401) if not authenticated.
 *
 * Usage:
 *   const supabase = await createClient();
 *   const user = await requireAuth(supabase);
 */
export async function requireAuth(supabase: SupabaseClient): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new ApiError('Unauthorized', 401);
  }
  return user;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
