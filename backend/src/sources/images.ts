import { z } from 'zod'
import { fetchJson } from '../shared/fetchJson.js'

const UnsplashSearchSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      alt_description: z.string().nullable().optional(),
      urls: z.object({ regular: z.string(), small: z.string() }),
      user: z.object({ name: z.string().optional() }).optional(),
      links: z.object({ html: z.string().optional() }).optional(),
    }),
  ),
})

export type ImageResult = {
  id: string
  alt: string | null
  urlRegular: string
  urlSmall: string
  photographer: string | null
  sourceUrl: string | null
}

export async function searchImages(
  query: string,
): Promise<{ results: ImageResult[]; disabled?: boolean; reason?: string }> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    return { results: [], disabled: true, reason: 'UNSPLASH_ACCESS_KEY is not set' }
  }

  const url =
    'https://api.unsplash.com/search/photos?' +
    new URLSearchParams({
      query: query.trim(),
      per_page: '14',
      orientation: 'landscape',
    }).toString()

  const raw = await fetchJson(url, {
    timeoutMs: 12_000,
    headers: {
      Authorization: `Client-ID ${key}`,
    },
  })

  const parsed = UnsplashSearchSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Invalid Unsplash response')

  const results = parsed.data.results.map((r) => ({
    id: r.id,
    alt: r.alt_description ?? null,
    urlRegular: r.urls.regular,
    urlSmall: r.urls.small,
    photographer: r.user?.name ?? null,
    sourceUrl: r.links?.html ?? null,
  }))

  return { results }
}
