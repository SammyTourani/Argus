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
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 48, color: '#FA4500', fontWeight: 700, marginBottom: 24 }}>
          Argus
        </div>
        <div
          style={{
            fontSize: 64,
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Clone any website with AI
        </div>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)', marginTop: 24 }}>
          Powered by Claude Opus 4.6 · Gemini 2.5 Pro · Kimi K2
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
