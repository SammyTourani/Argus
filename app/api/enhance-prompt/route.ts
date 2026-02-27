import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ratelimit';
import { sanitizeString, sanitizeOptionalString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Check if we're using Vercel AI Gateway
const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

const google = createGoogleGenerativeAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.GEMINI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
});

export async function POST(request: NextRequest) {
  try {
    // ── Auth Check ────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    const rateLimitKey = `user:${user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 'generic');
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${resetIn}s.` },
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

    // ── Parse & Validate Body ─────────────────────────────────────────────────
    const body = await request.json();
    const prompt = sanitizeString(body.prompt, 10_000);
    if (!prompt || prompt.length < 1) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    const projectContext = sanitizeOptionalString(body.projectContext, 5_000);

    // ── Build Enhancement Prompt ──────────────────────────────────────────────
    const contextSection = projectContext
      ? `\n\nProject context:\n${projectContext}`
      : '';

    const enhancementPrompt = `You are a prompt engineer improving a user's request for an AI code generation tool.

Original prompt: "${prompt}"${contextSection}

Improve this prompt to be more specific and actionable for code generation. Your enhancements should:
1. Add specific technical details (framework, styling approach, responsive requirements)
2. Clarify layout structure if vague
3. Specify interaction states (hover, click, loading)
4. Add accessibility requirements if missing
5. Keep the user's original intent intact

Return a JSON object with:
- "enhanced": the improved prompt (string)
- "changes": array of strings describing what you changed

Only improve what's missing. Don't over-engineer simple requests.
If the prompt is already specific enough, return it unchanged with an empty changes array.

IMPORTANT: Return ONLY valid JSON, no markdown code fences or extra text.`;

    // ── Call Gemini Flash ──────────────────────────────────────────────────────
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: enhancementPrompt,
      maxOutputTokens: 2048,
      temperature: 0.3,
    });

    // ── Parse Response ────────────────────────────────────────────────────────
    let parsed: { enhanced: string; changes: string[] };
    try {
      // Strip markdown code fences if present
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If parsing fails, return the raw text as the enhanced prompt
      parsed = {
        enhanced: text.trim(),
        changes: ['Could not parse structured response — returning raw enhancement'],
      };
    }

    // Ensure the response has the expected shape
    if (typeof parsed.enhanced !== 'string' || !Array.isArray(parsed.changes)) {
      parsed = {
        enhanced: typeof parsed.enhanced === 'string' ? parsed.enhanced : prompt,
        changes: Array.isArray(parsed.changes) ? parsed.changes : [],
      };
    }

    return NextResponse.json({
      enhanced: parsed.enhanced,
      changes: parsed.changes,
    });
  } catch (error: any) {
    console.error('[enhance-prompt] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
