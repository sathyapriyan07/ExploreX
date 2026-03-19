import type { LRUCache } from 'lru-cache'

type CacheEntry<T> =
  | { kind: 'value'; value: T; expiresAt: number }
  | { kind: 'inflight'; promise: Promise<T>; expiresAt: number }

export async function withCache<T>(
  cache: LRUCache<string, any>,
  key: string,
  opts: { ttlMs: number },
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const existing = cache.get(key) as CacheEntry<T> | undefined
  if (existing && existing.expiresAt > now) {
    if (existing.kind === 'value') return existing.value
    return existing.promise
  }

  const promise = loader()
  cache.set(key, { kind: 'inflight', promise, expiresAt: now + opts.ttlMs } satisfies CacheEntry<T>)

  try {
    const value = await promise
    cache.set(key, { kind: 'value', value, expiresAt: now + opts.ttlMs } satisfies CacheEntry<T>)
    return value
  } catch (err) {
    cache.delete(key)
    throw err
  }
}
