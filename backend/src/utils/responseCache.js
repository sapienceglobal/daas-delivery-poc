/**
 * Tiny in-process TTL cache with per-restaurant invalidation.
 *
 * Used for expensive read endpoints (analytics, CRM customer list) that many
 * devices hit at the same time. Also de-duplicates concurrent identical
 * requests ("single-flight") so 10 devices refreshing together = 1 DB query.
 *
 * Entries are tagged by restaurantId; Order writes call invalidateRestaurant()
 * (see models/Order.js hooks) so merchants never see stale numbers after a
 * new order / status change.
 *
 * NOTE: per-process. If backend is moved to PM2 cluster mode, each worker has
 * its own cache — still correct thanks to short TTL + invalidation per worker.
 */
const store = new Map();     // key -> { value, expires, tag }
const inflight = new Map();  // key -> Promise
const MAX_ENTRIES = 500;

export const getOrCompute = async (key, tag, ttlMs, compute) => {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value;

  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    try {
      const value = await compute();
      if (store.size >= MAX_ENTRIES) {
        // drop oldest entry (Map keeps insertion order)
        store.delete(store.keys().next().value);
      }
      store.set(key, { value, expires: Date.now() + ttlMs, tag: String(tag || '') });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
};

export const invalidateRestaurant = (restaurantId) => {
  if (!restaurantId) return;
  const tag = String(restaurantId);
  for (const [key, entry] of store) {
    if (entry.tag === tag) store.delete(key);
  }
};

export const clearResponseCache = () => store.clear();

export default { getOrCompute, invalidateRestaurant, clearResponseCache };
