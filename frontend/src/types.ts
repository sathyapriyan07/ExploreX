export type Region = 'India' | 'Global'

export type PlaceCategory = 'Hills' | 'Beaches' | 'Temples' | 'Cities' | 'Wildlife' | 'Backwaters' | 'Heritage'

export type CuratedPlace = {
  title: string
  region: Region
  category: PlaceCategory
  state?: 'Kerala' | 'Tamil Nadu' | 'Karnataka' | 'Himachal Pradesh' | 'Uttarakhand'
  country?: string
  coords?: { lat: number; lon: number }
  tagline?: string
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

export type NearbyPoi = {
  id: string
  name: string | null
  kind: string
  lat: number
  lon: number
  tags: Record<string, string>
}

export type WeatherBundle = {
  current: {
    tempC: number | null
    feelsLikeC: number | null
    humidity: number | null
    windMps: number | null
    condition: string | null
    description: string | null
  }
  forecast: Array<{ dt: number; tempC: number; pop: number | null; condition: string | null }>
  insights: { comfort: 'great' | 'ok' | 'tough'; rainRisk: 'low' | 'medium' | 'high'; note: string }
}

export type ImageResult = {
  id: string
  alt: string | null
  urlRegular: string
  urlSmall: string
  photographer: string | null
  sourceUrl: string | null
}

