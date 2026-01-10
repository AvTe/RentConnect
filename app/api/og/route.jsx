import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get dynamic parameters
    const title = searchParams.get('title') || 'Find Your Perfect Rental Home in Kenya';
    const subtitle = searchParams.get('subtitle') || 'Connect with verified agents and tenants';
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e2530',
            backgroundImage: 'linear-gradient(135deg, #1e2530 0%, #2d3748 50%, #1e2530 100%)',
          }}
        >
          {/* Logo Area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '-2px',
              }}
            >
              Yoombaa
            </div>
          </div>
          
          {/* Main Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 60px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '20px',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '28px',
                color: '#FE9200',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              {subtitle}
            </div>
          </div>
          
          {/* Bottom tagline */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: '#9CA3AF',
              }}
            >
              🇰🇪 Kenya&apos;s Leading Rental Marketplace
            </div>
          </div>
          
          {/* Decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(254,146,0,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(254,146,0,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('OG Image generation error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}

