import { notFound } from 'next/navigation';
import ItemDetailContent from '@/components/menu-detail/ItemDetailContent';
import { resolveImageUrl, getItemSlug, cleanUrl } from '@/lib/slugUtils';
import { fetchItemData } from '@/lib/menuData';

const siteUrl = cleanUrl(process.env.NEXT_PUBLIC_SITE_URL) || 'https://www.lassiloungeny.com';
const restaurantId = (process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge').trim().replace(/[\r\n]/g, '');

/**
 * Generates dynamic SEO metadata for Google, WhatsApp, Facebook, Twitter, etc.
 * Uses shared React cache() in fetchItemData so both generateMetadata and
 * the Page component share a single request per render.
 */
export async function generateMetadata({ params }) {
  const { itemId } = await params;
  const item = await fetchItemData(itemId);

  if (!item) {
    return {
      title: 'Dish Not Found',
      description: 'The requested food item is no longer available on our menu.',
      robots: { index: false, follow: false },
    };
  }

  const primarySlug = getItemSlug(item) || itemId;
  const canonicalUrl = `${siteUrl}/item/${primarySlug}`;

  // Custom SEO Title: show exactly as written without layout template if set,
  // otherwise fallback to "<Item Name> - Order Online | Lassi Lounge NY"
  const hasCustomTitle =
    item.seoTitle &&
    typeof item.seoTitle === 'string' &&
    item.seoTitle.trim().length > 0;

  const rawTitleString = hasCustomTitle
    ? item.seoTitle.trim()
    : `${item.name} - Order Online | Lassi Lounge NY`;

  const pageTitle = { absolute: rawTitleString };

  // Custom SEO Description set by Marketing/SEO Team, or fallback to item description
  const description =
    item.seoDescription?.trim() ||
    (item.description && item.description.length > 0
      ? item.description.slice(0, 155)
      : `Order fresh, delicious ${item.name} online from Lassi Lounge NY. Authentic Indian recipes prepared fresh.`);

  // OpenGraph Image Priority:
  // 1. seoImage (agar explicitly set ho)
  // 2. generated dynamic opengraph-image (/item/<slug>/opengraph-image)
  // 3. item photo (item.image or item.images[0])
  // 4. default root branded image
  let ogImageUrl;
  if (item.seoImage && typeof item.seoImage === 'string' && item.seoImage.trim().length > 0) {
    const resolved = resolveImageUrl(item.seoImage.trim());
    ogImageUrl = resolved.startsWith('http') ? resolved : `${siteUrl}${resolved}`;
  } else {
    // Priority 2: generated dynamic opengraph-image
    ogImageUrl = `${siteUrl}/item/${primarySlug}/opengraph-image`;
  }

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: rawTitleString,
      description,
      url: canonicalUrl,
      siteName: 'Lassi Lounge NY',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: item.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: rawTitleString,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Server Component for Menu Item Detail Page.
 * Injects Google JSON-LD structured data (@type: 'Product') for rich search results.
 */
export default async function BrandedItemDetailPage({ params }) {
  const { itemId } = await params;
  const item = await fetchItemData(itemId);

  if (!item) {
    notFound();
  }

  const primarySlug = getItemSlug(item) || itemId;
  const canonicalFullUrl = `${siteUrl}/item/${primarySlug}`;

  const rawImage =
    item.image ||
    (Array.isArray(item.images) && item.images[0]) ||
    '/assets/images/branded/lassi-lounge/og-image.png';
  const resolvedImage = resolveImageUrl(
    rawImage,
    `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`
  );
  const fullImageUrl = resolvedImage.startsWith('http')
    ? resolvedImage
    : `${siteUrl}${resolvedImage}`;

  // Build JSON-LD structured data with @type: Product for Google Rich Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description:
      item.seoDescription?.trim() ||
      item.description ||
      `Fresh and authentic ${item.name} from Lassi Lounge NY.`,
    image: [fullImageUrl],
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: 'USD',
      availability: item.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalFullUrl,
    },
  };

  // Only include aggregateRating if real rating data exists with reviewCount >= 3
  if (
    item.reviewCount &&
    Number(item.reviewCount) >= 3 &&
    item.averageRating &&
    Number(item.averageRating) > 0
  ) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(item.averageRating).toFixed(1),
      reviewCount: Number(item.reviewCount),
    };
  }

  return (
    <>
      {/* Google Rich Snippet Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Interactive client component */}
      <ItemDetailContent
        restaurantId={restaurantId}
        itemId={itemId}
        initialItem={item}
      />
    </>
  );
}