/**
 * SEO & URL slug utilities for menu items.
 *
 * Canonical item URL (single-restaurant site):   /item/samosa
 * Canonical item URL (multi-restaurant):          /restaurant/<restaurant>/item/samosa
 *
 * Slugs are unique per restaurant (backend appends "-2", "-3" for duplicate names),
 * so no database ID is ever shown to customers. Legacy URLs containing an ObjectId
 * are still resolved by the backend and permanently redirected to the clean URL.
 *
 * NOTE: `slugify` MUST stay identical to backend/src/utils/slugify.js
 */

export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Clean slug for an item: "samosa", "mango-lassi", "samosa-2" ... */
export function getItemSlug(item) {
  if (!item) return '';
  return item.slug || slugify(item.name) || item._id || item.id || '';
}

/** Canonical customer-facing URL for an item. */
export function getItemUrl(item, restaurantId) {
  if (!item) return '/menu';
  const slug = getItemSlug(item);
  const isSingle = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';
  if (isSingle) return `/item/${slug}`;

  const rid =
    restaurantId ||
    item.restaurantId ||
    process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID ||
    'lassi-lounge';
  return `/restaurant/${rid}/item/${slug}`;
}

/**
 * Normalizes image URLs so localhost/127.0.0.1 URLs uploaded during development
 * automatically resolve to the live production API URL on HTTPS without mixed-content errors.
 */
export function resolveImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback || '';
  
  // If the image is stored with a local loopback IP or localhost
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    if (url.includes('/uploads/')) {
      const uploadPath = url.substring(url.indexOf('/uploads/'));
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return uploadPath;
      }
      const liveApi = process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') && !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
        ? process.env.NEXT_PUBLIC_API_URL
        : '';
      return liveApi ? `${liveApi}${uploadPath}` : uploadPath;
    }

    const liveApi = process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost') && !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'https://api.lassiloungeny.com';
    return url.replace(/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, liveApi);
  }

  // Ensure any other plain http:// URL is upgraded to https:// on production
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace(/^http:\/\//, 'https://');
  }

  return url;
}

/**
 * Cleans and normalizes URLs from environment variables, removing markdown links,
 * trailing slashes, carriage returns (\r), newlines, wrapping quotes, and spaces.
 */
export function cleanUrl(url) {
  if (!url) return '';
  let str = String(url).trim().replace(/[\r\n\t]/g, '');
  const mdMatch = str.match(/\((https?:\/\/[^)]+)\)/);
  if (mdMatch) {
    str = mdMatch[1];
  } else {
    str = str.replace(/^\[+/, '').replace(/\]+$/, '');
  }
  str = str.replace(/^["']+|["']+$/g, '').trim();
  return str.replace(/\/+$/, '');
}
