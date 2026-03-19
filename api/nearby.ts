import { badRequest, json, getIp } from './_shared/http'
import { withCache, ttlHours } from './_shared/cache'
import { rateLimitOrThrow } from './_shared/rateLimit'
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
    rateLimitOrThrow({ key: `nearby:${getIp(req)}`, max: 120, windowMs: 60_000 })
    const lat = Number(req.query?.lat)
    const lon = Number(req.query?.lon)
    const radius = req.query?.radius != null ? Number(req.query.radius) : 4000
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return badRequest(res, 'lat/lon are required')
    const rad = Math.max(300, Math.min(10_000, Number.isFinite(radius) ? radius : 4000))

    const data = await withCache(`nearby:${lat}:${lon}:${rad}`, ttlHours(3), async () => {
      const query = `
[out:json][timeout:18];
(
  node(around:${rad},${lat},${lon})["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park|aquarium|artwork)$"];
  way(around:${rad},${lat},${lon})["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park|aquarium|artwork)$"];
  node(around:${rad},${lat},${lon})["natural"~"^(peak|volcano|waterfall|beach|cave_entrance|hot_spring|spring)$"];
  way(around:${rad},${lat},${lon})["natural"~"^(peak|volcano|waterfall|beach|cave_entrance|hot_spring|spring)$"];
  node(around:${rad},${lat},${lon})["leisure"~"^(park|garden|nature_reserve)$"];
  way(around:${rad},${lat},${lon})["leisure"~"^(park|garden|nature_reserve)$"];
  node(around:${rad},${lat},${lon})["historic"~"^(monument|castle|ruins|archaeological_site|memorial|fort|yes)$"];
  way(around:${rad},${lat},${lon})["historic"~"^(monument|castle|ruins|archaeological_site|memorial|fort|yes)$"];
  node(around:${rad},${lat},${lon})["amenity"="place_of_worship"];
  way(around:${rad},${lat},${lon})["amenity"="place_of_worship"];
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
          const kind =
            tags.tourism ??
            tags.natural ??
            tags.historic ??
            tags.leisure ??
            tags.amenity ??
            tags.shop ??
            'poi'
          const point =
            el.type === 'node'
              ? { lat: el.lat, lon: el.lon }
              : { lat: el.center?.lat, lon: el.center?.lon }
          if (point.lat == null || point.lon == null) return null
          if (!name) return null
          return { id: `${el.type}:${el.id}`, name, kind, lat: point.lat, lon: point.lon, tags }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => attractionRank(b.tags) - attractionRank(a.tags))
        .slice(0, 60)

      return { radius: rad, pois }
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

function attractionRank(tags: Record<string, string>) {
  const tourism = tags.tourism
  const natural = tags.natural
  const historic = tags.historic
  const leisure = tags.leisure
  const amenity = tags.amenity

  if (tourism === 'attraction') return 10
  if (tourism === 'viewpoint') return 9
  if (natural === 'waterfall') return 9
  if (natural === 'peak') return 8
  if (historic === 'fort' || historic === 'castle') return 8
  if (leisure === 'park' || leisure === 'garden') return 7
  if (amenity === 'place_of_worship') return 7
  if (tourism === 'museum' || tourism === 'gallery') return 7
  if (tourism) return 6
  if (natural) return 6
  if (historic) return 6
  if (leisure) return 5
  return 1
}

