/**
 * Utility to normalize image URLs across the application.
 * Ensures local dev / loopback URLs (127.0.0.1 / localhost) are safely rewritten
 * to the production API URL (or configured API_URL) so browsers on HTTPS never
 * encounter mixed-content or broken image issues.
 */

export const NOTIFICATION_ASSETS = {
  new_order: 'uploads/notifications/1b9bca5b34e443fd75a58aeef4a12041.webp',
  order_cancelled: 'uploads/notifications/64f85c2b6fe314ed6650f5d960787443.webp',
  reservation: 'uploads/notifications/52f75aef070f573a1a1927d78d4a75fb.webp',
  catering: 'uploads/notifications/2e39b7b12dc482c46f58efc6af3b34f6.webp',
};

export const getNotificationImageUrl = (type = 'new_order') => {
  const baseUrl = (process.env.API_URL || 'https://api.lassiloungeny.com').replace(/\/+$/, '');
  switch (type) {
    case 'order_cancelled':
    case 'cancel_order':
    case 'cancelled':
      return `${baseUrl}/${NOTIFICATION_ASSETS.order_cancelled}`;
    case 'reservation':
    case 'reservation_new':
      return `${baseUrl}/${NOTIFICATION_ASSETS.reservation}`;
    case 'catering':
    case 'catering_new':
      return `${baseUrl}/${NOTIFICATION_ASSETS.catering}`;
    case 'new_order':
    default:
      return `${baseUrl}/${NOTIFICATION_ASSETS.new_order}`;
  }
};

export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  const liveApi = (process.env.API_URL || 'https://api.lassiloungeny.com').replace(/\/+$/, '');
  if (url.startsWith('/uploads/')) {
    return `${liveApi}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${liveApi}/${url}`;
  }
  if (url.includes('127.0.0.1:') || url.includes('localhost:')) {
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
