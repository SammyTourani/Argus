import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}
  
  // Check Supabase
  try {
    const supabase = await createClient()
    await supabase.from('profiles').select('count').limit(1)
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  // Check env vars
  checks.stripe = process.env.STRIPE_SECRET_KEY ? 'ok' : 'error'
  checks.resend = process.env.RESEND_API_KEY ? 'ok' : 'error'
  checks.upstash = process.env.UPSTASH_REDIS_REST_URL ? 'ok' : 'error'

  const allOk = Object.values(checks).every(v => v === 'ok')

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks,
  }, { status: allOk ? 200 : 503 })
}
