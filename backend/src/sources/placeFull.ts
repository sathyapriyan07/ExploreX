import { fetchJson } from '../shared/fetchJson.js'
import { getNearbyPois } from './nearby.js'
import { getWeatherBundle } from './weather.js'
import { searchImages } from './images.js'
import { getWikiSummary, type WikiSummary } from './wiki.js'

type Coords = { lat: number; lon: number }

export async function getPlaceFull(place: string): Promise<{
  wiki: WikiSummary
  images: Awaited<ReturnType<typeof searchImages>> | null
  weather: Awaited<ReturnType<typeof getWeatherBundle>> | null
  nearby: Awaited<ReturnType<typeof getNearbyPois>> | null
}> {
  const wiki = await getWikiSummary(place)
  const coords = wiki.coordinates ?? (await getCoordsFallback(wiki.title))

  if (!coords) {
    return { wiki, images: null, weather: null, nearby: null }
  }

  const [images, weather, nearby] = await Promise.all([
    safe(() => searchImages(`${wiki.title} travel`)),
    safe(() => getWeatherBundle({ lat: coords.lat, lon: coords.lon, units: 'metric' })),
    safe(() => getNearbyPois({ lat: coords.lat, lon: coords.lon, radius: 4000 })),
  ])

  return { wiki: { ...wiki, coordinates: coords }, images, weather, nearby }
}

async function getCoordsFallback(title: string): Promise<Coords | null> {
  const url =
    'https://en.wikipedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      prop: 'coordinates',
      format: 'json',
      origin: '*',
      titles: title,
      colimit: '1',
    }).toString()

  const raw = await fetchJson<any>(url, { timeoutMs: 10_000 })
  const pages = raw?.query?.pages
  if (!pages) return null
  const first = Object.values(pages)[0] as any
  const coord = first?.coordinates?.[0]
  if (!coord) return null
  const lat = Number(coord.lat)
  const lon = Number(coord.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

