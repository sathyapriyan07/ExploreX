import { LRUCache } from 'lru-cache'

export function createCache() {
  return new LRUCache<string, any>({
    max: Number(process.env.CACHE_MAX_ITEMS ?? 2000),
  })
}
