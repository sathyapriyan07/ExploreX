import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import type { NearbyPoi, WeatherBundle, WikiSummary } from '../types'
import { LeafletMap } from '../components/map/LeafletMap'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ExpandableSection } from '../components/ui/expandable-section'
import { TestimonialSlider } from '../components/ui/testimonial-slider'
import MotionButton from '../components/ui/motion-button'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../services/supabase'
import { haversineKm } from '../utils/geo'
import { primePlaceImage } from '../hooks/usePlaceImage'
import type { Testimonial } from '../data/testimonials'
import { getTestimonials } from '../services/testimonials'

export function PlaceDetailPage() {
  const { place } = useParams()
  const navigate = useNavigate()
  const decoded = useMemo(() => decodeURIComponent(place ?? ''), [place])

  const [wiki, setWiki] = useState<WikiSummary | null>(null)
  const [weather, setWeather] = useState<WeatherBundle | null>(null)
  const [nearby, setNearby] = useState<NearbyPoi[] | null>(null)
  const [loadingWiki, setLoadingWiki] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedPoi, setSelectedPoi] = useState<NearbyPoi | null>(null)
  const [selectedPoiWiki, setSelectedPoiWiki] = useState<WikiSummary | null>(null)
  const [selectedPoiLoading, setSelectedPoiLoading] = useState(false)
  const [placeTestimonials, setPlaceTestimonials] = useState<Testimonial[]>([])

  const user = useAppStore((s) => s.user)

  useEffect(() => {
    if (!decoded) return
    let cancelled = false
    setLoadingWiki(true)
    setError(null)
    setWiki(null)
    setWeather(null)
    setNearby(null)
    setSelectedPoi(null)
    setSelectedPoiWiki(null)
    setSelectedPoiLoading(false)
    setPlaceTestimonials([])

    api
      .wiki(decoded)
      .then((w) => {
        if (cancelled) return
        setWiki(w)
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e?.message ?? e))
      })
      .finally(() => {
        if (cancelled) return
        setLoadingWiki(false)
      })

    return () => {
      cancelled = true
    }
  }, [decoded])

  useEffect(() => {
    if (!decoded) return
    let cancelled = false
    getTestimonials({ place: decoded, limit: 5 })
      .then((t) => {
        if (cancelled) return
        setPlaceTestimonials(t)
      })
      .catch(() => {
        if (cancelled) return
        setPlaceTestimonials([])
      })
    return () => {
      cancelled = true
    }
  }, [decoded])

  const coords = wiki?.coordinates ?? null

  useEffect(() => {
    if (!wiki?.title) return
    let cancelled = false

    // Use the place's own image (Wikipedia page summary)
    primePlaceImage(wiki.title, wiki.image ?? wiki.thumbnail ?? null)

    if (coords) {
      api
        .weather(coords.lat, coords.lon)
        .then((w) => {
          if (cancelled) return
          setWeather(w)
        })
        .catch(() => {})
      api
        .nearby(coords.lat, coords.lon, 4500)
        .then((n) => {
          if (cancelled) return
          setNearby(n.pois)
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [wiki?.title, wiki?.image, wiki?.thumbnail, coords])

  const hero = wiki?.image ?? wiki?.thumbnail ?? null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          ← Back
        </button>
        <MotionButton label="Plan Trip" to="/planner" />
      </div>

      <Hero title={decoded} hero={hero} description={wiki?.description} />

      {loadingWiki ? <LoadingSpinner label="Fetching Wikipedia summary..." /> : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {wiki ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            <Card title="Overview">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {wiki.summary ?? 'No summary found.'}
              </p>
              {wiki.url ? (
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  Read on Wikipedia →
                </a>
              ) : null}
            </Card>

            <div className="grid gap-3">
              <ExpandableSection
                title="History"
                preview={firstSentence(wiki.summary) ?? 'Quick context from Wikipedia.'}
              >
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {wiki.summary ?? 'No history section available for this place yet.'}
                </p>
              </ExpandableSection>

              <ExpandableSection
                title="Food & culture"
                preview={foodCulturePreview(wiki.title)}
              >
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>{foodCultureDetail(wiki.title)}</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                    <li>Try local breakfast + evening tea spots.</li>
                    <li>Ask locals for the best viewpoint at sunset.</li>
                    <li>Respect temple/church etiquette (dress code, photography rules).</li>
                  </ul>
                </div>
              </ExpandableSection>

              <ExpandableSection
                title="Hidden gems"
                preview={hiddenGemsPreview(nearby ?? [])}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {(nearby ?? []).slice(0, 10).map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="font-semibold">{p.name ?? 'Gem'}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">{poiTypeLabel(p)}</div>
                    </div>
                  ))}
                </div>
              </ExpandableSection>

              <ExpandableSection
                title="Travel tips"
                preview={`Best time: ${bestTimeHint(wiki.title)} · Budget: ${estimateBudget(wiki.title)}`}
              >
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p>
                    Plan outdoor activities early morning or late afternoon. Keep a light rain layer, power bank, and offline maps.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                    <li>Carry cash for smaller shops and entry tickets.</li>
                    <li>Start drives early in hill stations to avoid fog/traffic.</li>
                    <li>Save key places to your trip and build a route in the Planner.</li>
                  </ul>
                </div>
              </ExpandableSection>
            </div>

            <Card title="Interactive map">
              {coords ? (
                <LeafletMap
                  center={coords}
                  zoom={12}
                  markers={[
                    { id: 'place', lat: coords.lat, lon: coords.lon, label: wiki.title },
                    ...(nearby ?? []).slice(0, 25).map((p) => ({
                      id: p.id,
                      lat: p.lat,
                      lon: p.lon,
                      label: p.name ?? poiTypeLabel(p),
                    })),
                  ]}
                />
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-300">No coordinates available for map.</div>
              )}
            </Card>

            <Card title="Nearby attractions">
              {!nearby ? (
                <LoadingSpinner label="Loading nearby attractions..." />
              ) : nearby.length ? (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {nearby.slice(0, 3).map((p) => {
                      const distKm = coords ? haversineKm(coords, { lat: p.lat, lon: p.lon }) : null
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPoi(p)
                            setSelectedPoiWiki(null)
                            if (!p.name) return
                            setSelectedPoiLoading(true)
                            api
                              .wiki(p.name)
                              .then((w) => setSelectedPoiWiki(w))
                              .catch(() => setSelectedPoiWiki(null))
                              .finally(() => setSelectedPoiLoading(false))
                          }}
                          className="rounded-2xl border border-slate-200 bg-white/60 p-3 text-left text-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        >
                          <div className="font-semibold">{p.name ?? 'Attraction'}</div>
                          <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <span>{poiTypeLabel(p)}</span>
                            <span className="tabular-nums">{distKm != null ? `${distKm.toFixed(1)} km` : '—'}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {nearby.length > 3 ? (
                    <ExpandableSection
                      title="More attractions"
                      compact
                      preview={`Show ${Math.min(15, nearby.length - 3)} more nearby spots`}
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        {nearby.slice(3, 18).map((p) => {
                          const distKm = coords ? haversineKm(coords, { lat: p.lat, lon: p.lon }) : null
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPoi(p)
                                setSelectedPoiWiki(null)
                                if (!p.name) return
                                setSelectedPoiLoading(true)
                                api
                                  .wiki(p.name)
                                  .then((w) => setSelectedPoiWiki(w))
                                  .catch(() => setSelectedPoiWiki(null))
                                  .finally(() => setSelectedPoiLoading(false))
                              }}
                              className="rounded-2xl border border-slate-200 bg-white/60 p-3 text-left text-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                              <div className="font-semibold">{p.name ?? 'Attraction'}</div>
                              <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                                <span>{poiTypeLabel(p)}</span>
                                <span className="tabular-nums">{distKm != null ? `${distKm.toFixed(1)} km` : '—'}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </ExpandableSection>
                  ) : null}

                  {selectedPoi ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{selectedPoi.name ?? 'Selected attraction'}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">{poiTypeLabel(selectedPoi)}</div>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-100">
                          {coords ? `${haversineKm(coords, { lat: selectedPoi.lat, lon: selectedPoi.lon }).toFixed(1)} km away` : '—'}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                        {selectedPoiLoading ? (
                          <LoadingSpinner label="Loading overview..." />
                        ) : selectedPoiWiki?.summary ? (
                          <p className="leading-relaxed">{selectedPoiWiki.summary}</p>
                        ) : selectedPoi.tags?.description ? (
                          <p className="leading-relaxed">{selectedPoi.tags.description}</p>
                        ) : (
                          <p className="text-slate-600 dark:text-slate-300">
                            No overview found. Open the detail page for this attraction to explore more.
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedPoi.name ? (
                          <Link
                            to={`/place/${encodeURIComponent(selectedPoi.name)}`}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-base-950 dark:hover:bg-slate-100"
                          >
                            Open detail
                          </Link>
                        ) : null}
                        <a
                          href={osmUrl(selectedPoi.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          View on OSM
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-300">No nearby places found.</div>
              )}
            </Card>

            <Card title={`What travelers say about ${wiki.title}`}>
              <TestimonialSlider testimonials={placeTestimonials} />
            </Card>
          </section>

          <aside className="space-y-4">
            <Card title="Key info">
              <InfoRow label="Weather (now)" value={formatWeather(weather)} />
              <InfoRow
                label="Comfort"
                value={weather ? `${weather.insights.comfort} · rain ${weather.insights.rainRisk}` : '—'}
              />
              <InfoRow label="Budget" value={estimateBudget(wiki.title)} />
              <InfoRow label="Best time" value={bestTimeHint(wiki.title)} />
            </Card>

            <ExpandableSection
              title="Weather insights"
              compact
              preview={weather ? weather.insights.note : 'Forecast and travel advice.'}
            >
              {!weather ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">Weather data not available.</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Next hours (temp + rain probability):
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {weather.forecast.slice(0, 8).map((f) => (
                      <div key={f.dt} className="rounded-2xl border border-slate-200 bg-white/60 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                        <div className="font-semibold">{new Date(f.dt * 1000).toLocaleString()}</div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {Math.round(f.tempC)}° · rain {f.pop != null ? `${Math.round(f.pop * 100)}%` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ExpandableSection>

            <Card title="Suggested itineraries">
              <Itinerary title={wiki.title} nearby={nearby ?? []} />
            </Card>

            <Card title="Add to Trip">
              <MotionButton
                label="Add to Trip"
                classes="bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                onClick={async () => {
                  if (!supabase) return navigate('/auth')
                  if (!user) return navigate('/auth')
                  await supabase.from('saved_places').insert({
                    title: wiki.title,
                    wiki_url: wiki.url,
                    lat: coords?.lat ?? null,
                    lon: coords?.lon ?? null,
                    region: 'unknown',
                  })
                }}
              />
              {!supabase ? (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  Configure Supabase env vars to enable saved places and trips.
                </p>
              ) : null}
            </Card>
          </aside>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Image</h2>
        {hero ? (
          <a
            href={wiki?.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <img
              src={hero}
              alt={decoded}
              loading="lazy"
              className="h-64 w-full object-cover transition group-hover:scale-[1.01]"
            />
            <div className="p-3 text-xs text-slate-600 dark:text-slate-300">
              Source: Wikipedia
            </div>
          </a>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-300">No image found for this place.</div>
        )}
      </section>
    </div>
  )
}

function Hero({ title, hero, description }: { title: string; hero: string | null; description: string | null | undefined }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      {hero ? <img src={hero} alt={title} className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
      <div className="relative p-6 md:p-10">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Place detail · Maps · Weather · Nearby · Itineraries
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
          {description ? <p className="text-sm text-white/85">{description}</p> : null}
        </div>
      </div>
    </section>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 py-2 last:border-b-0 dark:border-white/10">
      <div className="text-xs text-slate-600 dark:text-slate-300">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

function formatWeather(weather: WeatherBundle | null) {
  if (!weather) return '—'
  const t = weather.current.tempC
  const cond = weather.current.description ?? weather.current.condition
  return `${t != null ? `${Math.round(t)}°C` : '—'}${cond ? ` · ${cond}` : ''}`
}

function estimateBudget(title: string) {
  const key = title.toLowerCase()
  if (key.includes('ooty') || key.includes('kodaikanal') || key.includes('munnar') || key.includes('wayanad')) return '₹ Low–Mid'
  if (key.includes('kochi') || key.includes('chennai')) return '₹ Mid'
  return '₹ Mid–Premium'
}

function bestTimeHint(title: string) {
  const key = title.toLowerCase()
  if (key.includes('kerala') || key.includes('alappuzha') || key.includes('kochi') || key.includes('varkala')) return 'Oct–Mar (avoid monsoon peaks)'
  if (key.includes('ooty') || key.includes('kodaikanal') || key.includes('munnar') || key.includes('coorg')) return 'Sep–May'
  return 'Check weather trends + festivals'
}

function Itinerary({ title, nearby }: { title: string; nearby: NearbyPoi[] }) {
  const picks = nearby.filter((p) => p.name).slice(0, 12)
  const one = picks.slice(0, 4)
  const two = picks.slice(0, 8)
  const three = picks.slice(0, 12)

  return (
    <div className="space-y-3 text-sm">
      <DayPlan label="1 Day" base={title} items={one} />
      <DayPlan label="2 Days" base={title} items={two} />
      <DayPlan label="3 Days" base={title} items={three} />
    </div>
  )
}

function DayPlan({ label, base, items }: { label: string; base: string; items: NearbyPoi[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{items.length} stops</div>
      </div>
      <div className="mt-2 font-semibold">{base}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700 dark:text-slate-200">
        {items.map((x) => (
          <li key={x.id}>{x.name ?? poiTypeLabel(x)}</li>
        ))}
      </ul>
    </div>
  )
}

function poiTypeLabel(p: NearbyPoi) {
  const kind = String(p.kind ?? '').toLowerCase()
  if (kind === 'place_of_worship') return 'Temple / Worship'
  if (kind === 'viewpoint') return 'Viewpoint'
  if (kind === 'park') return 'Park'
  if (kind === 'waterfall') return 'Waterfall'
  if (kind === 'peak') return 'Peak'
  if (kind === 'attraction') return 'Attraction'
  if (kind) return kind.replaceAll('_', ' ')
  return 'Attraction'
}

function osmUrl(id: string) {
  const [type, raw] = id.split(':')
  const osmType = type === 'node' || type === 'way' || type === 'relation' ? type : 'node'
  const osmId = raw ?? ''
  return `https://www.openstreetmap.org/${osmType}/${osmId}`
}

function firstSentence(text: string | null) {
  if (!text) return null
  const t = text.trim()
  if (!t) return null
  const idx = t.search(/[.!?]\s/)
  return idx > 0 ? t.slice(0, idx + 1) : t
}

function foodCulturePreview(title: string) {
  const t = title.toLowerCase()
  if (t.includes('kerala') || t.includes('kochi') || t.includes('munnar') || t.includes('wayanad')) return 'Seafood, sadya, tea, and slow evenings.'
  if (t.includes('tamil') || t.includes('ooty') || t.includes('kodaikanal') || t.includes('madurai') || t.includes('thanjavur')) return 'Temple towns, filter coffee, and street food.'
  return 'Local dishes, markets, and cultural spots.'
}

function foodCultureDetail(title: string) {
  const t = title.toLowerCase()
  if (t.includes('munnar') || t.includes('ooty') || t.includes('kodaikanal') || t.includes('wayanad') || t.includes('coorg')) {
    return 'Look for tea/coffee estate visits, small bakeries, and viewpoints paired with warm snacks. Evenings are great for café hopping and local markets.'
  }
  if (t.includes('madurai') || t.includes('thanjavur') || t.includes('mahabalipuram')) {
    return 'Plan for temple timings, heritage walks, and classic South Indian meals. Try local sweets and a filter-coffee stop between landmarks.'
  }
  return 'Mix a heritage walk, a local market, and a signature meal. Ask locals for the one dish this place is known for.'
}

function hiddenGemsPreview(nearby: NearbyPoi[]) {
  const names = nearby.filter((p) => p.name).slice(0, 3).map((p) => p.name)
  if (!names.length) return 'Curated nearby picks (expand for more).'
  return `Top picks: ${names.join(', ')}`
}
