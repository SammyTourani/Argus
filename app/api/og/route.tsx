import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#080808',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot grid background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(250,69,0,0.2) 1.5px, transparent 1.5px)',
          backgroundSize: '40px 40px',
          opacity: 0.5,
          display: 'flex',
        }} />

        {/* Radial fade overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, #080808 80%)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          padding: '0 80px',
          textAlign: 'center',
        }}>
          {/* Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(250,69,0,0.15)',
            border: '1px solid rgba(250,69,0,0.4)',
            borderRadius: 100,
            padding: '6px 16px',
            marginBottom: 32,
            fontSize: 13,
            fontWeight: 700,
            color: '#FA4500',
            letterSpacing: 1,
          }}>
            🏆 WINNER · GOOGLE × CEREBRAL VALLEY HACKATHON
          </div>

          {/* Logo */}
          <div style={{
            fontSize: 40,
            color: '#FA4500',
            fontWeight: 800,
            letterSpacing: -2,
            marginBottom: 20,
          }}>
            Argus
          </div>

          {/* Headline */}
          <div style={{
            fontSize: 72,
            color: 'white',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -3,
            marginBottom: 20,
          }}>
            Clone any website.<br />
            <span style={{ color: '#FA4500' }}>Ship it in seconds.</span>
          </div>

          {/* Subtext */}
          <div style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 40,
          }}>
            Paste a URL. Argus clones the design in seconds.
          </div>

          {/* Domain */}
          <div style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
            letterSpacing: 1,
          }}>
            buildargus.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
