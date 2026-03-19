import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import { z } from 'zod'
import { createCache } from './shared/cache.js'
import { withCache } from './shared/withCache.js'
import { getWikiSummary } from './sources/wiki.js'
import { getNearbyPois } from './sources/nearby.js'
import { getWeatherBundle } from './sources/weather.js'
import { searchPlaces } from './sources/search.js'
import { searchImages } from './sources/images.js'
import { getPlaceFull } from './sources/placeFull.js'

export async function buildServer() {
  const server = Fastify({ logger: true })

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  await server.register(cors, {
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      return cb(new Error('Origin not allowed'), false)
    },
  })

  await server.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 120),
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
    hook: 'onRequest',
  })
  await server.register(sensible)

  const cache = createCache()

  server.get('/health', async () => ({ ok: true }))

  server.get(
    '/api/wiki',
    async (req) => {
      const parsed = z.object({ place: z.string().min(1).max(120) }).safeParse(req.query)
      if (!parsed.success) return server.httpErrors.badRequest('Invalid query')
      const { place } = parsed.data
      return withCache(cache, `wiki:${place}`, { ttlMs: ttlMs() }, () => getWikiSummary(place))
    },
  )

  server.get(
    '/api/search',
    async (req) => {
      const parsed = z.object({ query: z.string().min(1).max(120) }).safeParse(req.query)
      if (!parsed.success) return server.httpErrors.badRequest('Invalid query')
      const { query } = parsed.data
      return withCache(cache, `search:${query}`, { ttlMs: ttlMs() }, () => searchPlaces(query))
    },
  )

  server.get(
    '/api/nearby',
    async (req) => {
      const parsed = z
        .object({
          lat: z.coerce.number().min(-90).max(90),
          lon: z.coerce.number().min(-180).max(180),
          radius: z.coerce.number().min(300).max(10000).optional(),
        })
        .safeParse(req.query)
      if (!parsed.success) return server.httpErrors.badRequest('Invalid query')
      const { lat, lon, radius } = parsed.data
      const rad = radius ?? 4000
      return withCache(cache, `nearby:${lat}:${lon}:${rad}`, { ttlMs: ttlMs() }, () =>
        getNearbyPois({ lat, lon, radius: rad }),
      )
    },
  )

  server.get(
    '/api/weather',
    async (req) => {
      const parsed = z
        .object({
          lat: z.coerce.number().min(-90).max(90),
          lon: z.coerce.number().min(-180).max(180),
          units: z.enum(['metric', 'imperial']).optional(),
        })
        .safeParse(req.query)
      if (!parsed.success) return server.httpErrors.badRequest('Invalid query')
      const { lat, lon, units } = parsed.data
      const u = units ?? 'metric'
      return withCache(cache, `weather:${lat}:${lon}:${u}`, { ttlMs: ttlMs() }, () =>
        getWeatherBundle({ lat, lon, units: u }),
      )
    },
  )

  server.get(
    '/api/images',
    async (req) => {
      const parsed = z.object({ query: z.string().min(1).max(120) }).safeParse(req.query)
      if (!parsed.success) return server.httpErrors.badRequest('Invalid query')
      const { query } = parsed.data
      return withCache(cache, `images:${query}`, { ttlMs: ttlMs(6) }, () => searchImages(query))
    },
  )

  server.get(
    '/api/place-full',
    async (req) => {
      const parsed = z.object({ place: z.string().min(1).max(120) }).safeParse(req.query)
      if (!parsed.success) return server.httpErrors.badRequest('Invalid query')
      const { place } = parsed.data
      return withCache(cache, `placeFull:${place}`, { ttlMs: ttlMs() }, () => getPlaceFull(place))
    },
  )

  return server
}

function ttlMs(hours = 3) {
  const clamped = Math.max(1, Math.min(6, hours))
  return clamped * 60 * 60 * 1000
}
