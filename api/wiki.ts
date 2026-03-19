import { badRequest, json, getIp } from './_shared/http'
import { withCache, ttlHours } from './_shared/cache'
import { rateLimitOrThrow } from './_shared/rateLimit'
import { getWikiSummary } from './_shared/wiki'

export default async function handler(req: any, res: any) {
  try {
    rateLimitOrThrow({ key: `wiki:${getIp(req)}`, max: 120, windowMs: 60_000 })
    const place = String(req.query?.place ?? '').trim()
    if (!place) return badRequest(res, 'place is required')

    const data = await withCache(`wiki:${place}`, ttlHours(3), () => getWikiSummary(place))
    return json(res, 200, data, { 'cache-control': 'public, max-age=600' })
  } catch (e: any) {
    if (e?.message === 'rate_limited') {
      res.setHeader('retry-after', String(e.retryAfterSec ?? 30))
      return json(res, 429, { error: 'Rate limited' })
    }
    return json(res, 500, { error: e?.message ?? 'Server error' })
  }
}
