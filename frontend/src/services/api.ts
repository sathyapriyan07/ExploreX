import type { ImageResult, NearbyPoi, WeatherBundle, WikiSummary } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8787'

async function getJson<T>(path: string, params?: Record<string, string | number | undefined | null>): Promise<T> {
  const url = new URL(path, API_BASE)
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === '') continue
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export const api = {
  wiki(place: string) {
    return getJson<WikiSummary>('/api/wiki', { place })
  },
  search(query: string) {
    return getJson<{ results: Array<{ title: string; pageId: number; snippet: string | null }> }>('/api/search', {
      query,
    })
  },
  nearby(lat: number, lon: number, radius?: number) {
    return getJson<{ radius: number; pois: NearbyPoi[] }>('/api/nearby', { lat, lon, radius })
  },
  weather(lat: number, lon: number) {
    return getJson<WeatherBundle>('/api/weather', { lat, lon })
  },
  images(query: string) {
    return getJson<{ results: ImageResult[] }>('/api/images', { query })
  },
  placeFull(place: string) {
    return getJson<{
      wiki: WikiSummary
      images: { results: ImageResult[] } | null
      weather: WeatherBundle | null
      nearby: { radius: number; pois: NearbyPoi[] } | null
    }>('/api/place-full', { place })
  },
}

