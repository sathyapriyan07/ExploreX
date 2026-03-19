type Entry = { expiresAt: number; value: unknown } | { expiresAt: number; promise: Promise<unknown> }

const store = new Map<string, Entry>()

export async function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const existing = store.get(key)
  if (existing && existing.expiresAt > now) {
    if ('value' in existing) return existing.value as T
    return (await existing.promise) as T
  }

  const promise = loader()
  store.set(key, { expiresAt: now + ttlMs, promise })
  try {
    const value = await promise
    store.set(key, { expiresAt: now + ttlMs, value })
    return value
  } catch (e) {
    store.delete(key)
    throw e
  }
}

export function ttlHours(hours: number) {
  const clamped = Math.max(1, Math.min(6, hours))
  return clamped * 60 * 60 * 1000
}

