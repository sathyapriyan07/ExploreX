import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBox } from '../components/SearchBox'
import { curated } from '../data/curated'
import { useAppStore } from '../store/useAppStore'
import type { CuratedPlace, PlaceCategory } from '../types'
import { PlaceCard } from '../components/PlaceCard'
import { LeafletMap } from '../components/map/LeafletMap'
import { api } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import MotionButton from '../components/ui/motion-button'

export function ExplorePage() {
  const region = useAppStore((s) => s.region)
  const navigate = useNavigate()
  const [category, setCategory] = useState<PlaceCategory | 'All'>('All')
  const [mapPoisLoading, setMapPoisLoading] = useState(false)
  const [mapPois, setMapPois] = useState<Array<{ id: string; lat: number; lon: number; label: string }>>([])

  const all = useMemo(() => flattenCurated(), [])
  const places = useMemo(() => {
    return all.filter((p) => {
      if (region !== p.region) return false
      if (category !== 'All' && p.category !== category) return false
      return true
    })
  }, [all, region, category])

  const defaultCenter = region === 'India' ? { lat: 10.3, lon: 76.6 } : { lat: 20, lon: 0 }
  const defaultZoom = region === 'India' ? 6 : 2

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <SearchBox
            onSelect={(title) => navigate(`/place/${encodeURIComponent(title)}`)}
            placeholder="Search with autocomplete (via MediaWiki proxy)…"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none dark:border-white/10 dark:bg-white/5"
          >
            <option value="All">All categories</option>
            <option value="Hills">Hills</option>
            <option value="Beaches">Beaches</option>
            <option value="Temples">Temples</option>
            <option value="Cities">Cities</option>
            <option value="Wildlife">Wildlife</option>
            <option value="Backwaters">Backwaters</option>
            <option value="Heritage">Heritage</option>
          </select>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Map is OpenStreetMap (Leaflet). Click anywhere on the map to fetch nearby POIs via Overpass proxy.
        </p>
        <div className="flex flex-wrap gap-2">
          <MotionButton label="Explore More" to="/explore" />
        </div>
      </header>

      <LeafletMap
        center={defaultCenter}
        zoom={defaultZoom}
        markers={[
          ...places
            .filter((p) => p.coords)
            .slice(0, 50)
            .map((p) => ({
              id: p.title,
              lat: p.coords!.lat,
              lon: p.coords!.lon,
              label: p.title,
            })),
          ...mapPois.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, label: p.label })),
        ]}
        heightClassName="h-[460px]"
        onClick={async ({ lat, lon }) => {
          setMapPoisLoading(true)
          try {
            const res = await api.nearby(lat, lon, 2500)
            setMapPois(
              res.pois
                .filter((x) => x.name)
                .slice(0, 20)
                .map((x) => ({ id: x.id, lat: x.lat, lon: x.lon, label: x.name! })),
            )
          } finally {
            setMapPoisLoading(false)
          }
        }}
      />
      {mapPoisLoading ? <LoadingSpinner label="Fetching nearby places…" /> : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Curated picks</h2>
          <div className="text-sm text-slate-600 dark:text-slate-300">{places.length} places</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p) => (
            <PlaceCard key={p.title} place={p} />
          ))}
        </div>
      </section>
    </div>
  )
}

function flattenCurated(): CuratedPlace[] {
  return [
    ...curated.hillStations,
    ...curated.keralaEscapes,
    ...curated.tamilNaduCulture,
    ...curated.trendingIndia,
    ...curated.quickTrips,
    ...curated.globalPicks,
  ]
}
