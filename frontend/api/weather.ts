import { badRequest, json, getIp } from './_shared/http'
import { withCache, ttlHours } from './_shared/cache'
import { rateLimitOrThrow } from './_shared/rateLimit'
import { fetchJson } from './_shared/fetchJson'

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number | null
    apparent_temperature?: number | null
    relative_humidity_2m?: number | null
    wind_speed_10m?: number | null
    weather_code?: number | null
  }
  hourly?: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability?: number[]
    weather_code?: number[]
  }
}

export default async function handler(req: any, res: any) {
  try {
    rateLimitOrThrow({ key: `weather:${getIp(req)}`, max: 120, windowMs: 60_000 })
    const lat = Number(req.query?.lat)
    const lon = Number(req.query?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return badRequest(res, 'lat/lon are required')

    const data = await withCache(`weather:${lat}:${lon}`, ttlHours(1), async () => {
      const url =
        'https://api.open-meteo.com/v1/forecast?' +
        new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          timezone: 'auto',
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
          hourly: 'temperature_2m,precipitation_probability,weather_code',
          forecast_days: '2',
          temperature_unit: 'celsius',
          wind_speed_unit: 'ms',
        }).toString()

      const raw = await fetchJson<OpenMeteoResponse>(url, { timeoutMs: 12_000 })

      const code = raw.current?.weather_code ?? null
      const mapped = code != null ? mapWeatherCode(code) : null

      const forecast = (raw.hourly?.time ?? []).slice(0, 16).map((t, idx) => {
        const dt = Math.floor(Date.parse(t) / 1000)
        const tempC = raw.hourly?.temperature_2m?.[idx] ?? 0
        const popRaw = raw.hourly?.precipitation_probability?.[idx]
        const pop = typeof popRaw === 'number' ? Math.max(0, Math.min(1, popRaw / 100)) : null
        const c = raw.hourly?.weather_code?.[idx]
        const cond = typeof c === 'number' ? mapWeatherCode(c).condition : null
        return { dt: Number.isFinite(dt) ? dt : 0, tempC, pop, condition: cond }
      })

      const popAvg = forecast.length ? forecast.reduce((a, x) => a + (x.pop ?? 0), 0) / forecast.length : 0
      const comfort = classifyComfort({ temp: raw.current?.temperature_2m ?? null, humidity: raw.current?.relative_humidity_2m ?? null })
      const rainRisk = popAvg > 0.55 ? 'high' : popAvg > 0.25 ? 'medium' : 'low'
      const note =
        comfort === 'great'
          ? 'Comfortable weather for outdoor exploration.'
          : comfort === 'ok'
            ? 'Plan outdoor activities in the morning/evening.'
            : 'Keep hydration and shade breaks; consider indoor spots.'

      return {
        current: {
          tempC: raw.current?.temperature_2m ?? null,
          feelsLikeC: raw.current?.apparent_temperature ?? null,
          humidity: raw.current?.relative_humidity_2m ?? null,
          windMps: raw.current?.wind_speed_10m ?? null,
          condition: mapped?.condition ?? null,
          description: mapped?.description ?? null,
        },
        forecast,
        insights: { comfort, rainRisk, note },
      }
    })

    return json(res, 200, data, { 'cache-control': 'public, max-age=300' })
  } catch (e: any) {
    if (e?.message === 'rate_limited') {
      res.setHeader('retry-after', String(e.retryAfterSec ?? 30))
      return json(res, 429, { error: 'Rate limited' })
    }
    return json(res, 500, { error: e?.message ?? 'Server error' })
  }
}

function classifyComfort(input: { temp: number | null; humidity: number | null }) {
  const t = input.temp
  const h = input.humidity
  if (t == null) return 'ok' as const
  if (t >= 34) return 'tough' as const
  if (t <= 10) return 'ok' as const
  if (h != null && h >= 80 && t >= 28) return 'tough' as const
  if (t >= 18 && t <= 30) return 'great' as const
  return 'ok' as const
}

function mapWeatherCode(code: number): { condition: string; description: string } {
  if (code === 0) return { condition: 'Clear', description: 'Clear sky' }
  if (code >= 1 && code <= 3) return { condition: 'Clouds', description: 'Partly cloudy' }
  if (code === 45 || code === 48) return { condition: 'Fog', description: 'Foggy' }
  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67)) return { condition: 'Rain', description: 'Rain / drizzle' }
  if (code >= 71 && code <= 77) return { condition: 'Snow', description: 'Snow' }
  if (code >= 80 && code <= 82) return { condition: 'Rain', description: 'Showers' }
  if (code === 85 || code === 86) return { condition: 'Snow', description: 'Snow showers' }
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', description: 'Thunderstorm' }
  return { condition: 'Weather', description: 'Mixed conditions' }
}

