import { fetchJson } from '../shared/fetchJson.js'

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

export type NearbyPoi = {
  id: string
  name: string | null
  kind: string
  lat: number
  lon: number
  tags: Record<string, string>
}

export async function getNearbyPois(input: {
  lat: number
  lon: number
  radius: number
}): Promise<{ radius: number; pois: NearbyPoi[] }> {
  const { lat, lon, radius } = input

  const query = `
[out:json][timeout:18];
(
  /* tourism attractions only (avoid hotels/shops/transport/etc) */
  node(around:${radius},${lat},${lon})["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park|aquarium|artwork)$"];
  way(around:${radius},${lat},${lon})["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park|aquarium|artwork)$"];

  /* nature / viewpoints */
  node(around:${radius},${lat},${lon})["natural"~"^(peak|volcano|waterfall|beach|cave_entrance|hot_spring|spring)$"];
  way(around:${radius},${lat},${lon})["natural"~"^(peak|volcano|waterfall|beach|cave_entrance|hot_spring|spring)$"];

  /* parks and reserves */
  node(around:${radius},${lat},${lon})["leisure"~"^(park|garden|nature_reserve)$"];
  way(around:${radius},${lat},${lon})["leisure"~"^(park|garden|nature_reserve)$"];

  /* heritage / monuments */
  node(around:${radius},${lat},${lon})["historic"~"^(monument|castle|ruins|archaeological_site|memorial|fort|yes)$"];
  way(around:${radius},${lat},${lon})["historic"~"^(monument|castle|ruins|archaeological_site|memorial|fort|yes)$"];

  /* temples and worship places (common attractions in India) */
  node(around:${radius},${lat},${lon})["amenity"="place_of_worship"];
  way(around:${radius},${lat},${lon})["amenity"="place_of_worship"];
);
out center 60;
`.trim()

  const data = await fetchJson<OverpassResponse>('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query }).toString(),
    timeoutMs: 20_000,
  })

  const pois: NearbyPoi[] = data.elements
    .map((el): NearbyPoi | null => {
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
      return {
        id: `${el.type}:${el.id}`,
        name,
        kind,
        lat: point.lat,
        lon: point.lon,
        tags,
      } satisfies NearbyPoi
    })
    .filter((x): x is NearbyPoi => x !== null)
    .filter((p) => Boolean(p.name))
    .filter((p) => isAttraction(p.tags))
    .sort((a, b) => attractionRank(b.tags) - attractionRank(a.tags))
    .slice(0, 60)

  return { radius, pois }
}

function isAttraction(tags: Record<string, string>) {
  const tourism = tags.tourism
  const natural = tags.natural
  const historic = tags.historic
  const leisure = tags.leisure
  const amenity = tags.amenity

  const denyAmenity = new Set([
    'taxi',
    'fuel',
    'bus_station',
    'parking',
    'restaurant',
    'cafe',
    'fast_food',
    'bar',
    'pub',
    'bank',
    'atm',
    'hospital',
    'clinic',
    'pharmacy',
    'police',
    'fire_station',
    'school',
    'college',
    'university',
    'marketplace',
    'toilets',
  ])
  const denyTourism = new Set([
    'hotel',
    'guest_house',
    'hostel',
    'motel',
    'apartment',
    'resort',
    'camp_site',
    'caravan_site',
    'chalet',
  ])

  if (amenity && denyAmenity.has(amenity)) return false
  if (tourism && denyTourism.has(tourism)) return false

  if (tourism) return true
  if (natural) return true
  if (historic) return true
  if (leisure) return true
  if (amenity === 'place_of_worship') return true
  return false
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
