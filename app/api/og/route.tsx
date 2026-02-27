import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'Clone any website. Ship it in seconds.';
  const description = searchParams.get('description') || '';

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
              'radial-gradient(circle, rgba(250,69,0,0.15) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
            opacity: 0.6,
            display: 'flex',
          }}
        />

        {/* Radial fade overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, #0A0A0A 75%)',
            display: 'flex',
          }}
        />

        {/* Bottom-right accent glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(250,69,0,0.12) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top section: branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Argus logo mark */}
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

        {/* Middle section: title + description */}
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
              fontSize: title.length > 60 ? 48 : 64,
              color: 'white',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -3,
              maxWidth: '90%',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.45)',
                marginTop: 20,
                lineHeight: 1.4,
                maxWidth: '80%',
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Bottom section: domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            buildargus.dev
          </div>
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
            AI Website Cloner
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
