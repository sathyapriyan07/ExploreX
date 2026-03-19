import { badRequest, json, getIp } from './_shared/http'
import { withCache, ttlHours } from './_shared/cache'
import { rateLimitOrThrow } from './_shared/rateLimit'
import { fetchJson } from './_shared/fetchJson'

type MediaWikiSearchResponse = {
  query?: {
    search?: Array<{ title: string; pageid: number; snippet?: string }>
  }
}

export default async function handler(req: any, res: any) {
  try {
    rateLimitOrThrow({ key: `search:${getIp(req)}`, max: 180, windowMs: 60_000 })
    const query = String(req.query?.query ?? '').trim()
    if (query.length < 1) return badRequest(res, 'query is required')

    const data = await withCache(`search:${query}`, ttlHours(3), async () => {
      const url =
        'https://en.wikipedia.org/w/api.php?' +
        new URLSearchParams({
          action: 'query',
          list: 'search',
          format: 'json',
          origin: '*',
          srlimit: '10',
          srsearch: query,
        }).toString()

      const raw = await fetchJson<MediaWikiSearchResponse>(url, { timeoutMs: 10_000 })
      const results =
        raw.query?.search?.map((r) => ({ title: r.title, pageId: r.pageid, snippet: r.snippet ?? null })) ?? []
      return { results }
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

