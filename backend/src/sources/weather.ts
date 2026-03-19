import { z } from 'zod'
import { fetchJson } from '../shared/fetchJson.js'

const OpenMeteoSchema = z.object({
  current: z
    .object({
      time: z.string(),
      temperature_2m: z.number().nullable().optional(),
      apparent_temperature: z.number().nullable().optional(),
      relative_humidity_2m: z.number().nullable().optional(),
      wind_speed_10m: z.number().nullable().optional(),
      weather_code: z.number().nullable().optional(),
    })
    .optional(),
  hourly: z
    .object({
      time: z.array(z.string()),
      temperature_2m: z.array(z.number()),
      precipitation_probability: z.array(z.number()).optional(),
      weather_code: z.array(z.number()).optional(),
    })
    .optional(),
})

export type WeatherBundle = {
  current: {
    tempC: number | null
    feelsLikeC: number | null
    humidity: number | null
    windMps: number | null
    condition: string | null
    description: string | null
  }
  forecast: Array<{
    dt: number
    tempC: number
    pop: number | null
    condition: string | null
  }>
  insights: {
    comfort: 'great' | 'ok' | 'tough'
    rainRisk: 'low' | 'medium' | 'high'
    note: string
  }
}

export async function getWeatherBundle(input: {
  lat: number
  lon: number
  units: 'metric' | 'imperial'
}): Promise<WeatherBundle> {
  const params: Record<string, string> = {
    latitude: String(input.lat),
    longitude: String(input.lon),
    timezone: 'auto',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    forecast_days: '2',
  }

  if (input.units === 'imperial') {
    params.temperature_unit = 'fahrenheit'
    params.wind_speed_unit = 'mph'
  } else {
    params.temperature_unit = 'celsius'
    params.wind_speed_unit = 'ms'
  }

  const url = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams(params).toString()}`
  const raw = await fetchJson(url, { timeoutMs: 12_000 })
  const parsed = OpenMeteoSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Invalid Open-Meteo response')

  const current = parsed.data.current
  const weatherCode = current?.weather_code ?? null
  const mapped = weatherCode != null ? mapWeatherCode(weatherCode) : null

  const temp = current?.temperature_2m ?? null
  const feels = current?.apparent_temperature ?? null
  const humidity = current?.relative_humidity_2m ?? null
  const wind = current?.wind_speed_10m ?? null

  const hourly = parsed.data.hourly
  const times = hourly?.time ?? []
  const temps = hourly?.temperature_2m ?? []
  const pops = hourly?.precipitation_probability ?? []
  const codes = hourly?.weather_code ?? []

  const forecast = times.slice(0, 16).map((t, idx) => {
    const dt = Math.floor(Date.parse(t) / 1000)
    const t2 = temps[idx] ?? null
    const popRaw = pops[idx]
    const pop = typeof popRaw === 'number' ? Math.max(0, Math.min(1, popRaw / 100)) : null
    const code = codes[idx]
    const cond = typeof code === 'number' ? mapWeatherCode(code).condition : null
    return {
      dt: Number.isFinite(dt) ? dt : 0,
      tempC: t2 ?? 0,
      pop,
      condition: cond,
    }
  })

  const popAvg =
    forecast.length > 0 ? forecast.reduce((acc, x) => acc + (x.pop ?? 0), 0) / forecast.length : 0

  const comfort = classifyComfort({ temp, humidity })
  const rainRisk = popAvg > 0.55 ? 'high' : popAvg > 0.25 ? 'medium' : 'low'
  const note =
    comfort === 'great'
      ? 'Comfortable weather for outdoor exploration.'
      : comfort === 'ok'
        ? 'Plan outdoor activities in the morning/evening.'
        : 'Keep hydration and shade breaks; consider indoor spots.'

  return {
    current: {
      tempC: temp,
      feelsLikeC: feels,
      humidity,
      windMps: wind,
      condition: mapped?.condition ?? null,
      description: mapped?.description ?? null,
    },
    forecast,
    insights: { comfort, rainRisk, note },
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

