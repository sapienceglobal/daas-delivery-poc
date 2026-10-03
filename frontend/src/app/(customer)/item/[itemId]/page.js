import { permanentRedirect, notFound } from 'next/navigation';
import ItemDetailContent from '@/components/menu-detail/ItemDetailContent';
import { getItemSlug } from '@/lib/slugUtils';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const restaurantId = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

/**
 * Canonical URL:  /item/samosa
 * Legacy URLs (/item/6a7c..., /item/samosa-6a7c..., /item/<old-name>) are
 * permanently redirected (308) here so Google consolidates ranking on one URL.
 *
 * Returns: { item } | { notFound: true } | { error: true }  (backend unreachable)
 */
async function fetchItem(key) {
  try {
    const res = await fetch(
      `${apiUrl}/api/menu/items/${encodeURIComponent(key)}?restaurant=${encodeURIComponent(restaurantId)}`,
      { next: { revalidate: 60 } }
    );
    if (res.status === 404) return { notFound: true };
    if (!res.ok) return { error: true };
    const json = await res.json();
    return json.data ? { item: json.data } : { notFound: true };
  } catch {
    return { error: true };
  }
}

export async function generateMetadata({ params }) {
  const { itemId } = await params;
  const { item } = await fetchItem(itemId);

  if (!item) {
    return {
      title: 'Menu Item',
      description: 'Explore authentic Indian cuisine and specialty lassis at Lassi Lounge NY.',
    };
  }

  const slug = getItemSlug(item);
  const canonicalUrl = `${siteUrl}/item/${slug}`;
  const price = Number(item.price || 0).toFixed(2);
  const imageUrl = item.image || `${siteUrl}/images/brand/logo.png`;
  const description = item.description
    ? `${item.description.slice(0, 140)} — $${price}. Order online for delivery or pickup at Lassi Lounge NY.`
    : `Order ${item.name} ($${price}), freshly prepared at Lassi Lounge NY. Fast delivery & easy pickup.`;

  return {
    title: `${item.name} – Order Online`,
    description,
    keywords: [
      item.name,
      `${item.name} near me`,
      'Lassi Lounge NY',
      'Indian food NY',
      item.isVeg ? 'vegetarian Indian food' : '',
      item.isGlutenFree ? 'gluten free Indian food' : '',
      ...(item.tags || []),
    ].filter(Boolean),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${item.name} | Lassi Lounge NY`,
      description,
      url: canonicalUrl,
      siteName: 'Lassi Lounge NY',
      images: [{ url: imageUrl, width: 800, height: 600, alt: item.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.name} | Lassi Lounge NY`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BrandedItemDetailPage({ params }) {
  const { itemId } = await params;
  const result = await fetchItem(itemId);

  if (result.notFound) notFound();

  const item = result.item;
  if (item) {
    const slug = getItemSlug(item);
    // 308 permanent redirect: legacy ID / old-name URLs -> clean canonical URL
    if (slug && decodeURIComponent(itemId).toLowerCase() !== slug) {
      permanentRedirect(`/item/${slug}`);
    }
  }

  const slug = item ? getItemSlug(item) : itemId;

  // Schema.org structured data (rich results: price, availability, diet)
  const jsonLd = item
    ? {
        '@context': 'https://schema.org',
        '@type': 'MenuItem',
        name: item.name,
        description: item.description || `Fresh ${item.name} from Lassi Lounge NY`,
        image: item.image || `${siteUrl}/images/brand/logo.png`,
        url: `${siteUrl}/item/${slug}`,
        offers: {
          '@type': 'Offer',
          price: Number(item.price || 0).toFixed(2),
          priceCurrency: 'USD',
          availability:
            item.isAvailable !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${siteUrl}/item/${slug}`,
        },
        suitableForDiet: [
          item.isVeg ? 'https://schema.org/VegetarianDiet' : null,
          item.isVegan ? 'https://schema.org/VeganDiet' : null,
          item.isGlutenFree ? 'https://schema.org/GlutenFreeDiet' : null,
        ].filter(Boolean),
      }
    : null;

  const breadcrumbLd = item
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Menu', item: `${siteUrl}/menu` },
          { '@type': 'ListItem', position: 3, name: item.name, item: `${siteUrl}/item/${slug}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {breadcrumbLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      )}
      <ItemDetailContent restaurantId={restaurantId} itemId={slug} />
    </>
  );
}