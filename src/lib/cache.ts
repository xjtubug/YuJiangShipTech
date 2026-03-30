/**
 * Simple in-memory cache with TTL support.
 * Suitable for caching frequently accessed data in serverless/edge environments.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL = 60; // seconds

const store = new Map<string, CacheEntry<unknown>>();

export function get<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function del(key: string): void {
  store.delete(key);
}

export function clear(): void {
  store.clear();
}

/**
 * Get-or-set helper: returns cached value if available, otherwise calls
 * the factory function, caches the result, and returns it.
 */
export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<T> {
  const cached = get<T>(key);
  if (cached !== undefined) return cached;
  const value = await factory();
  set(key, value, ttlSeconds);
  return value;
}
