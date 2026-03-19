import { fetchJson } from './fetchJson'

type WikiSummaryResponse = {
  title: string
  extract?: string
  description?: string
  content_urls?: { desktop?: { page?: string } }
  thumbnail?: { source: string }
  originalimage?: { source: string }
  coordinates?: { lat: number; lon: number }
}

export type WikiSummary = {
  title: string
  summary: string | null
  description: string | null
  url: string | null
  thumbnail: string | null
  image: string | null
  coordinates: { lat: number; lon: number } | null
}

export async function getWikiSummary(place: string): Promise<WikiSummary> {
  const title = place.trim()
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const data = await fetchJson<WikiSummaryResponse>(url, { timeoutMs: 10_000 })

  let image = data.originalimage?.source ?? data.thumbnail?.source ?? null
  let thumbnail = data.thumbnail?.source ?? null

  if (!image) {
    const fallback = await getPageImageFallback(data.title ?? title)
    image = fallback.image
    thumbnail = fallback.thumbnail
  }

  return {
    title: data.title ?? title,
    summary: data.extract ?? null,
    description: data.description ?? null,
    url: data.content_urls?.desktop?.page ?? null,
    thumbnail,
    image,
    coordinates: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : null,
  }
}

async function getPageImageFallback(title: string): Promise<{ image: string | null; thumbnail: string | null }> {
  const url =
    'https://en.wikipedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      prop: 'pageimages',
      piprop: 'original|thumbnail',
      pithumbsize: '800',
      titles: title,
    }).toString()

  const raw = await fetchJson<any>(url, { timeoutMs: 10_000 })
  const pages = raw?.query?.pages
  if (!pages) return { image: null, thumbnail: null }
  const first = Object.values(pages)[0] as any
  const image = first?.original?.source ?? first?.thumbnail?.source ?? null
  const thumbnail = first?.thumbnail?.source ?? null
  return { image, thumbnail }
}

