import { getItemSlug } from '@/lib/slugUtils';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const restaurantId = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

/**
 * Next.js Dynamic Sitemap Generator (App Router)
 * Generates /sitemap.xml for Google Search Console and other crawlers.
 */
export default async function sitemap() {
  const now = new Date();

  // Validated public customer-facing static routes that return 200 OK
  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/menu`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/catering`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic menu item routes (All active & available food items)
  let itemRoutes = [];
  try {
    const res = await fetch(`${apiUrl}/api/menu/restaurant/${restaurantId}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const categories = json.data || [];
      const allItems = categories.flatMap((cat) => cat.items || []);

      // Only include items that are active & available for ordering
      const availableItems = allItems.filter((item) => item.isAvailable !== false);

      itemRoutes = availableItems.map((item) => {
        const slug = getItemSlug(item);
        return {
          url: `${siteUrl}/item/${slug}`,
          lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        };
      });
    }
  } catch (err) {
    console.warn('[Sitemap] Could not fetch dynamic menu items from API:', err.message);
  }

  return [...staticRoutes, ...itemRoutes];
}
