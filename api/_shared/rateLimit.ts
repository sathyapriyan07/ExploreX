type Bucket = { resetAt: number; count: number }

const buckets = new Map<string, Bucket>()

export function rateLimitOrThrow(input: { key: string; max: number; windowMs: number }) {
  const now = Date.now()
  const existing = buckets.get(input.key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { resetAt: now + input.windowMs, count: 1 })
    return
  }
  if (existing.count >= input.max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    const err = new Error('rate_limited') as Error & { retryAfterSec?: number }
    err.retryAfterSec = retryAfterSec
    throw err
  }
  existing.count++
  buckets.set(input.key, existing)
}

