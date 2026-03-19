import { badRequest, json, getIp } from './_shared/http'
import { withCache, ttlHours } from './_shared/cache'
import { rateLimitOrThrow } from './_shared/rateLimit'
import { getWikiSummary } from './_shared/wiki'
import { fetchJson } from './_shared/fetchJson'

type OverpassResponse = {
  elements: Array<{
    type: 'node' | 'way' | 'relation'
    id: number
    lat?: number
    lon?: number
    center?: { lat: number; lon: number }
    tags?: Record<string, string>
  }>
}

export default async function handler(req: any, res: any) {
  try {
    rateLimitOrThrow({ key: `placefull:${getIp(req)}`, max: 90, windowMs: 60_000 })
    const place = String(req.query?.place ?? '').trim()
    if (!place) return badRequest(res, 'place is required')

    const data = await withCache(`placeFull:${place}`, ttlHours(3), async () => {
      const wiki = await getWikiSummary(place)
      const coords = wiki.coordinates
      if (!coords) return { wiki, images: null, weather: null, nearby: null }

      const [weather, nearby] = await Promise.all([
        fetchJson(`https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
          latitude: String(coords.lat),
          longitude: String(coords.lon),
          timezone: 'auto',
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
          hourly: 'temperature_2m,precipitation_probability,weather_code',
          forecast_days: '2',
          temperature_unit: 'celsius',
          wind_speed_unit: 'ms',
        }).toString()}`).catch(() => null),
        (async () => {
          const rad = 4000
          const query = `
[out:json][timeout:18];
(
  node(around:${rad},${coords.lat},${coords.lon})["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park|aquarium|artwork)$"];
  way(around:${rad},${coords.lat},${coords.lon})["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park|aquarium|artwork)$"];
  node(around:${rad},${coords.lat},${coords.lon})["natural"~"^(peak|volcano|waterfall|beach|cave_entrance|hot_spring|spring)$"];
  way(around:${rad},${coords.lat},${coords.lon})["natural"~"^(peak|volcano|waterfall|beach|cave_entrance|hot_spring|spring)$"];
  node(around:${rad},${coords.lat},${coords.lon})["leisure"~"^(park|garden|nature_reserve)$"];
  way(around:${rad},${coords.lat},${coords.lon})["leisure"~"^(park|garden|nature_reserve)$"];
  node(around:${rad},${coords.lat},${coords.lon})["historic"~"^(monument|castle|ruins|archaeological_site|memorial|fort|yes)$"];
  way(around:${rad},${coords.lat},${coords.lon})["historic"~"^(monument|castle|ruins|archaeological_site|memorial|fort|yes)$"];
  node(around:${rad},${coords.lat},${coords.lon})["amenity"="place_of_worship"];
  way(around:${rad},${coords.lat},${coords.lon})["amenity"="place_of_worship"];
);
out center 60;
`.trim()
          const raw = await fetchJson<OverpassResponse>('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: query }).toString(),
            timeoutMs: 20_000,
          })
          const pois = raw.elements
            .map((el) => {
              const tags = el.tags ?? {}
              const name = tags.name ?? null
              const kind = tags.tourism ?? tags.natural ?? tags.historic ?? tags.leisure ?? tags.amenity ?? 'poi'
              const point = el.type === 'node' ? { lat: el.lat, lon: el.lon } : { lat: el.center?.lat, lon: el.center?.lon }
              if (point.lat == null || point.lon == null) return null
              if (!name) return null
              return { id: `${el.type}:${el.id}`, name, kind, lat: point.lat, lon: point.lon, tags }
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
            .slice(0, 60)
          return { radius: rad, pois }
        })().catch(() => null),
      ])

      return { wiki, images: null, weather, nearby }
    })

    return json(res, 200, data, { 'cache-control': 'public, max-age=600' })
  } catch (e: any) {
    if (e?.message === 'rate_limited') {
      res.setHeader('retry-after', String(e.retryAfterSec ?? 30))
      return json(res, 429, { error: 'Rate limited' })
    }
    return json(res, 500, { error: e?.message ?? 'Server error' })
  }
}

