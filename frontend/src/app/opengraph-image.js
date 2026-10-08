import { ImageResponse } from 'next/og';
import { cleanUrl } from '@/lib/slugUtils';

export const runtime = 'nodejs';
export const alt = 'Lassi Lounge NY - Authentic Indian Restaurant & Delivery';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const siteUrl = cleanUrl(process.env.NEXT_PUBLIC_SITE_URL) || 'https://www.lassiloungeny.com';
const brandedLogoUrl = `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`;

/**
 * Root Default Open Graph (OG) Image for Lassi Lounge NY (Next.js App Router convention).
 * Automatically applies to all pages across the website that do not define their own OG image.
 *
 * Satori / next/og requirement: Pure Flexbox layout (no CSS Grid).
 */
export default function RootOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #160406 0%, #2f080d 50%, #4a0d14 100%)',
          padding: '56px 64px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Decorative ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '600px',
            height: '600px',
            borderRadius: '300px',
            background: 'radial-gradient(circle, rgba(185, 28, 28, 0.4) 0%, rgba(0, 0, 0, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* Top Bar: Brand Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#8B0000',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              LL
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              Lassi Lounge NY
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              color: '#fbbf24',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            New York, USA
          </div>
        </div>

        {/* Center Content: Headline & Subheading */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxWidth: '920px',
          }}
        >
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              padding: 0,
              color: '#ffffff',
              letterSpacing: '-1px',
            }}
          >
            Authentic Indian Cuisine & Refreshing Drinks
          </h1>
          <p
            style={{
              fontSize: '24px',
              lineHeight: 1.4,
              margin: 0,
              padding: 0,
              color: '#cbd5e1',
            }}
          >
            Experience authentic flavors — hand-crafted Biryanis, rich Curries, savory Tandoori, and thick creamy traditional Lassis.
          </p>
        </div>

        {/* Bottom Bar: Value Props & Domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#f87171',
              }}
            >
              • Online Ordering
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#f87171',
              }}
            >
              • Fast Delivery
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#f87171',
              }}
            >
              • Table Reservations
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#f87171',
              }}
            >
              • Catering
            </span>
          </div>

          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#fbbf24',
            }}
          >
            lassiloungeny.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
