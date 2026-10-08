import { ImageResponse } from 'next/og';
import { fetchItemData } from '@/lib/menuData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dynamic Open Graph (OG) Image Endpoint for Menu Items.
 * Returns a 1200x630 social preview card for WhatsApp, Facebook, iMessage, Twitter, etc.
 * Serves exact URL at:
 * /item/[itemId]/opengraph-image
 */
export async function GET(request, { params }) {
  const { itemId } = await params;
  const item = await fetchItemData(itemId);

  const itemName = item?.name || 'Authentic Indian Dish';
  const itemPrice = item?.price !== undefined ? `$${Number(item.price).toFixed(2)}` : '$12.99';
  const itemDescription =
    item?.seoDescription ||
    item?.description ||
    'Authentic traditional Indian cuisine crafted fresh daily in New York.';
  const categoryName = item?.category?.name || item?.category || 'Chef Special';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: 'linear-gradient(135deg, #160406 0%, #2f080d 50%, #4a0d14 100%)',
          padding: '52px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '520px',
            height: '520px',
            borderRadius: '260px',
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(0, 0, 0, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* Left Column: Details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            paddingRight: '48px',
          }}
        >
          {/* Header Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#8B0000',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '17px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              LL
            </div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '2px',
                color: '#fbbf24',
                textTransform: 'uppercase',
              }}
            >
              Lassi Lounge NY · Authentic Indian
            </span>
          </div>

          {/* Dish Information */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#f87171',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  background: 'rgba(220, 38, 38, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                }}
              >
                {categoryName}
              </span>
            </div>

            <h1
              style={{
                fontSize: itemName.length > 24 ? '44px' : '52px',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                margin: 0,
              }}
            >
              {itemName}
            </h1>

            <p
              style={{
                fontSize: '20px',
                lineHeight: 1.45,
                color: '#fde68a',
                margin: 0,
                opacity: 0.95,
              }}
            >
              {itemDescription.length > 130
                ? `${itemDescription.slice(0, 127)}...`
                : itemDescription}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                  color: '#1a0507',
                  padding: '8px 24px',
                  borderRadius: '999px',
                  fontWeight: 900,
                  fontSize: '26px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                {itemPrice}
              </div>

              <span
                style={{
                  fontSize: '18px',
                  color: '#ffffff',
                  opacity: 0.85,
                }}
              >
                Prepared Fresh Daily
              </span>
            </div>
          </div>

          {/* Footer CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              paddingTop: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '18px',
              }}
            >
              •
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                Order Online at lassiloungeny.com
              </span>
              <span
                style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                }}
              >
                9408 118th St, South Richmond Hill, NY · Delivery & Pickup
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Branded Visual Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '380px',
          }}
        >
          <div
            style={{
              width: '360px',
              height: '360px',
              borderRadius: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(251, 191, 36, 0.35)',
              background: 'radial-gradient(circle, rgba(139, 0, 0, 0.6) 0%, rgba(35, 5, 9, 0.8) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
              padding: '36px',
              textAlign: 'center',
              gap: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '110px',
                height: '110px',
                borderRadius: '55px',
                background: 'linear-gradient(135deg, #8B0000 0%, #5a040b 100%)',
                color: '#ffffff',
                fontSize: '48px',
                fontWeight: 900,
                border: '3px solid rgba(251, 191, 36, 0.6)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}
            >
              LL
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '1px',
                }}
              >
                Lassi Lounge NY
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fbbf24',
                }}
              >
                Authentic Indian Recipes
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '8px 18px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: '#fde68a',
                  fontWeight: 600,
                }}
              >
                Authentic Taste Guaranteed
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
