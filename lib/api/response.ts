import { NextResponse } from 'next/server';
import { ApiError } from './auth';

/**
 * Standard success response.
 * Returns: { data: T } with the given status (default 200).
 */
export function success<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Standard error response.
 * Returns: { error: { message, code? } } with the given status.
 */
export function error(message: string, status = 500, code?: string): NextResponse {
  return NextResponse.json(
    { error: { message, ...(code && { code }) } },
    { status }
  );
}

/**
 * Catch handler for API routes. Converts ApiError to proper response,
 * logs unexpected errors.
 *
 * Usage:
 *   try { ... } catch (err) { return handleError(err, 'POST /api/projects'); }
 */
export function handleError(err: unknown, context?: string): NextResponse {
  if (err instanceof ApiError) {
    return error(err.message, err.status, err.code);
  }
  if (context) console.error(`[${context}]`, err);
  return error('Internal server error', 500);
}
