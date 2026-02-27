import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const alt = 'Argus Build Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: build } = await supabase
    .from('builds')
    .select('title, input_url, input_prompt, style, model')
    .eq('share_token', token)
    .single();

  const projectName = build?.title || build?.input_url || 'AI Clone';
  const style = build?.style || 'AI';
  const model = build?.model || '';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '60px 80px',
        }}
      >
        {/* Dot grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(250,69,0,0.12) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
            opacity: 0.5,
            display: 'flex',
          }}
        />

        {/* Radial fade */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, #0A0A0A 75%)',
            display: 'flex',
          }}
        />

        {/* Top: branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FA4500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                color: 'white',
                letterSpacing: -1,
              }}
            >
              A
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#FA4500',
                letterSpacing: -1,
              }}
            >
              ARGUS
            </div>
          </div>

          {/* "Shared Build" badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(250,69,0,0.15)',
              border: '1px solid rgba(250,69,0,0.3)',
              borderRadius: 100,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: '#FA4500',
              letterSpacing: 0.5,
            }}
          >
            Shared Build
          </div>
        </div>

        {/* Middle: project name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            Built with Argus
          </div>
          <div
            style={{
              fontSize: projectName.length > 50 ? 44 : 56,
              color: 'white',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: '90%',
            }}
          >
            {projectName}
          </div>
        </div>

        {/* Bottom: badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Style badge */}
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: '#FA4500' }}>{style}</span> style
          </div>

          {/* Model badge */}
          {model && (
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
              }}
            >
              {model}
            </div>
          )}

          {/* Spacer + domain */}
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 16,
              color: 'rgba(255,255,255,0.25)',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            buildargus.dev
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
