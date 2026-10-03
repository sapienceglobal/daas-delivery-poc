/**
 * Utility to normalize image URLs across the application.
 * Ensures local dev / loopback URLs (127.0.0.1 / localhost) are safely rewritten
 * to the production API URL (or configured API_URL) so browsers on HTTPS never
 * encounter mixed-content or broken image issues.
 */

export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('127.0.0.1:') || url.includes('localhost:')) {
    const liveApi = process.env.API_URL || 'https://api.lassiloungeny.com';
    return url.replace(/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, liveApi);
  }
  return url;
};

export const sanitizeMenuItem = (item) => {
  if (!item) return item;
  if (item.image) item.image = normalizeImageUrl(item.image);
  if (Array.isArray(item.images)) {
    item.images = item.images.map(normalizeImageUrl);
  }
  return item;
};

export const sanitizeRestaurant = (rest) => {
  if (!rest) return rest;
  if (rest.logo) rest.logo = normalizeImageUrl(rest.logo);
  if (rest.banner) rest.banner = normalizeImageUrl(rest.banner);
  if (Array.isArray(rest.images)) {
    rest.images = rest.images.map(normalizeImageUrl);
  }
  if (Array.isArray(rest.menu)) {
    rest.menu = rest.menu.map((cat) => ({
      ...cat,
      image: normalizeImageUrl(cat.image),
      items: Array.isArray(cat.items) ? cat.items.map(sanitizeMenuItem) : [],
    }));
  }
  return rest;
};
