/**
 * Ultra-fast in-memory cache utility with TTL and prefix invalidation.
 * Drastically eliminates repeat database round-trips for read-heavy routes
 * (platform stats, project feeds, suggested devs) across both local dev and production.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = 60) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key) {
    this.store.delete(key);
  }

  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async wrap(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  clear() {
    this.store.clear();
  }
}

const cache = new MemoryCache();

module.exports = cache;
