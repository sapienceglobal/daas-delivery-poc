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
