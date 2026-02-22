import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: build } = await supabase
    .from('builds')
    .select('title, input_url, input_prompt, style')
    .eq('share_token', token)
    .single()

  if (!build) return { title: 'Shared Build | Argus' }

  const source = build.input_url || build.input_prompt || 'Website'
  return {
    title: build.title || `${source} Clone | Argus`,
    description: `${build.style || 'AI'}-styled clone built with Argus — the AI website cloner`,
    openGraph: {
      title: build.title || `${source} — Argus Build`,
      description: `See this ${build.style || 'AI'} clone built with Argus`,
    },
  }
}

export default async function SharedBuildPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: build } = await supabase
    .from('builds')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!build) notFound()

  const source = build.input_url || build.input_prompt || 'Unknown source'

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#FA4500', fontWeight: 800, fontSize: '18px' }}>Argus</Link>
        <Link href="/app" style={{
          background: '#FA4500',
          color: 'white',
          textDecoration: 'none',
          padding: '7px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
        }}>Clone a site →</Link>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(250,69,0,0.1)', border: '1px solid rgba(250,69,0,0.2)', borderRadius: '20px', padding: '4px 12px', marginBottom: '16px' }}>
            <span style={{ color: '#FA4500', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shared Build</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            {build.title || 'AI Clone'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
            Cloned from <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{source}</span>
            {build.style && <> · <span style={{ color: '#FA4500' }}>{build.style}</span> style</>}
            {build.model && <> · {build.model}</>}
          </p>
        </div>

        {/* Preview */}
        {build.preview_url ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {['#ef4444', '#eab308', '#22c55e'].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
              ))}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace', marginLeft: '8px' }}>{build.preview_url}</span>
              <a href={build.preview_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: 'auto', color: '#FA4500', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>Open ↗</a>
            </div>
            <iframe
              src={build.preview_url}
              style={{ width: '100%', height: '600px', border: 'none', display: 'block' }}
              title="Build preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', padding: '48px', textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Preview not available for this build.</p>
          </div>
        )}

        {/* CTA */}
        <div style={{ background: 'rgba(250,69,0,0.08)', border: '1px solid rgba(250,69,0,0.2)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>Clone any website with AI</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>3 free builds. No credit card. Under 60 seconds.</p>
          <Link href="/app" style={{
            display: 'inline-block',
            background: '#FA4500',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 28px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 700,
          }}>Start building for free →</Link>
        </div>
      </div>
    </div>
  )
}
