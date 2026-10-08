import { cache } from 'react';
import { cleanUrl } from '@/lib/slugUtils';

const apiUrl = cleanUrl(process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5001';
const restaurantId = (process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge').trim().replace(/[\r\n]/g, '');
const appSecret = (process.env.APP_SECRET || process.env.NEXT_PUBLIC_APP_SECRET || 'mobile_app_secure_key_2026').trim().replace(/[\r\n]/g, '');

/**
 * Shared menu item fetcher wrapped in React's cache().
 *
 * Official Next.js Best Practice:
 * Wrapping data fetching with React `cache()` deduplicates requests across
 * `generateMetadata()`, `opengraph-image.js`, and the Server Component Page
 * during a single render pass, ensuring only ONE network request is made to the backend.
 *
 * Revalidates every 60 seconds (ISR) or on-demand via the /api/revalidate route.
 */
export const fetchItemData = cache(async (itemId) => {
  if (!itemId) return null;

  try {
    const res = await fetch(
      `${apiUrl}/api/menu/items/${encodeURIComponent(itemId)}?restaurant=${encodeURIComponent(restaurantId)}`,
      {
        cache: 'no-store',
        headers: {
          'x-app-secret': appSecret,
          'x-tenant-id': 'lassi-lounge',
          'x-platform': 'web',
        },
      }
    );

    if (!res.ok) {
      console.warn(`[menuData fetchItemData] Backend returned status ${res.status} for item "${itemId}"`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error(`[menuData fetchItemData] Failed to fetch item "${itemId}":`, err.message);
    return null;
  }
});
