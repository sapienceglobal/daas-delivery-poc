import { cache } from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Hardcoded fallback metadata for static pages when database has no entry.
 */
const DEFAULT_PAGE_META = {
  '/': {
    title: 'Lassi Lounge NY | Indian Restaurant & Delivery',
    description:
      'Experience authentic Indian cuisine at Lassi Lounge in New York. Order fresh biryani, savory curries, and mango lassi online.',
    ogImage: `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`,
  },
  '/menu': {
    title: 'Our Menu | Authentic Indian Cuisine | Lassi Lounge NY',
    description:
      'Explore our authentic Indian menu — signature biryanis, rich curries, tandoori specialties, and refreshing lassis in NY.',
    ogImage: `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`,
  },
  '/about-us': {
    title: 'About Us | Heritage & Story | Lassi Lounge NY',
    description:
      'Discover our heritage, chefs, and culinary passion bringing traditional authentic Indian recipes to New York.',
    ogImage: `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`,
  },
  '/contact-us': {
    title: 'Contact Us & Reservations | Lassi Lounge NY',
    description:
      'Get in touch with Lassi Lounge NY for dine-in reservations, catering orders, and general inquiries.',
    ogImage: `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`,
  },
  '/catering': {
    title: 'Catering Services & Events | Lassi Lounge NY',
    description:
      'Host unforgettable events with authentic Indian catering by Lassi Lounge NY. Custom menus for parties and weddings.',
    ogImage: `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`,
  },
};

/**
 * Fetch editable SEO metadata for a static page from backend with React cache().
 * If backend is unavailable or no custom SEO is set, gracefully falls back to default.
 */
export const fetchPageSeo = cache(async (path) => {
  const cleanPath = String(path || '/').trim().toLowerCase();
  try {
    const res = await fetch(
      `${apiUrl}/api/seo/page?path=${encodeURIComponent(cleanPath)}`,
      {
        cache: 'no-store',
      }
    );

    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    // Non-blocking fallback
  }

  return DEFAULT_PAGE_META[cleanPath] || null;
});

/**
 * Helper to build Next.js Metadata object for static pages.
 */
export async function getPageMetadata(path) {
  const cleanPath = String(path || '/').trim().toLowerCase();
  const dbData = await fetchPageSeo(cleanPath);
  const fallback = DEFAULT_PAGE_META[cleanPath] || DEFAULT_PAGE_META['/'];

  const rawTitle = dbData?.title?.trim() || fallback.title;
  const description = dbData?.description?.trim() || fallback.description;
  const rawOgImage = dbData?.ogImage?.trim() || fallback.ogImage;
  const ogImageUrl = rawOgImage.startsWith('http')
    ? rawOgImage
    : `${siteUrl}${rawOgImage.startsWith('/') ? '' : '/'}${rawOgImage}`;

  const canonicalUrl = `${siteUrl}${cleanPath === '/' ? '' : cleanPath}`;

  return {
    title: { absolute: rawTitle },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: rawTitle,
      description,
      url: canonicalUrl,
      siteName: 'Lassi Lounge NY',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${rawTitle} | Lassi Lounge NY`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: rawTitle,
      description,
      images: [ogImageUrl],
    },
  };
}
