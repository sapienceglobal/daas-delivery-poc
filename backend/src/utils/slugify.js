/**
 * Shared slug generator — MUST stay identical to frontend/src/lib/slugUtils.js `slugify`
 * so that slugs generated on the server and client always match.
 *
 *   "Mango Lassi (16 oz)!"  ->  "mango-lassi-16-oz"
 *   "Crème Brûlée"          ->  "creme-brulee"
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

export default slugify;
