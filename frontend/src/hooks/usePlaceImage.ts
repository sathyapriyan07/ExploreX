import { useEffect, useState } from 'react'
import { api } from '../services/api'

const SUCCESS_TTL_MS = 12 * 60 * 60 * 1000
const FAILURE_TTL_MS = 5 * 60 * 1000
const MAX_CONCURRENCY = 4

type CacheEntry = { url: string | null; ts: number; ttlMs: number }

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<string | null>>()

let active = 0
const queue: Array<() => void> = []

function runLimited<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active++
      fn()
        .then(resolve, reject)
        .finally(() => {
          active--
          const next = queue.shift()
          next?.()
        })
    }
    if (active < MAX_CONCURRENCY) run()
    else queue.push(run)
  })
}

async function fetchPlaceImage(title: string): Promise<string | null> {
  const key = title.trim()
  const now = Date.now()

  const existing = cache.get(key)
  if (existing && now - existing.ts < existing.ttlMs) return existing.url

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = runLimited(async () => {
    try {
      const res = await api.wiki(key)
      const url = res.image ?? res.thumbnail ?? null
      cache.set(key, { url, ts: Date.now(), ttlMs: SUCCESS_TTL_MS })
      return url
    } catch {
      cache.set(key, { url: null, ts: Date.now(), ttlMs: FAILURE_TTL_MS })
      return null
    } finally {
      inflight.delete(key)
    }
  })

  inflight.set(key, promise)
  return promise
}

export function usePlaceImage(title: string) {
  const [url, setUrl] = useState<string | null>(() => cache.get(title.trim())?.url ?? null)

  useEffect(() => {
    const t = title.trim()
    if (!t) return
    let cancelled = false
    fetchPlaceImage(t).then((u) => {
      if (cancelled) return
      setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [title])

  return url
}

export function primePlaceImage(title: string, url: string | null) {
  const key = title.trim()
  if (!key) return
  cache.set(key, { url, ts: Date.now(), ttlMs: SUCCESS_TTL_MS })
}
