import { getItemSlug } from '@/lib/slugUtils';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const restaurantId = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/menu`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/order-online`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/catering`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/book-a-table`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/offers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/loyalty`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms-conditions`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/merchant-privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/merchant-terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/delete-account`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/merchant-account-deletion`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/merchant-portal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamically include all menu items with their SEO slugs
  let itemRoutes = [];
  try {
    const res = await fetch(`${apiUrl}/api/menu/restaurant/${restaurantId}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const categories = json.data || [];
      const allItems = categories.flatMap((cat) => cat.items || []);

      itemRoutes = allItems.map((item) => {
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
    // Graceful fallback to static routes if backend unavailable during build
  }

  return [...staticRoutes, ...itemRoutes];
}
