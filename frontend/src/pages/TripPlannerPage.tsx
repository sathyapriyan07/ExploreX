import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from '../planner/SortableItem'
import { SearchBox } from '../components/SearchBox'
import { api } from '../services/api'
import { LeafletMap } from '../components/map/LeafletMap'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ExpandableSection } from '../components/ui/expandable-section'
import MotionButton from '../components/ui/motion-button'
import { supabase } from '../services/supabase'
import { useDebounce } from '../hooks/useDebounce'
import { useAppStore } from '../store/useAppStore'
import { rupee } from '../utils/format'

type Budget = 'low' | 'mid' | 'lux'
type Interest = 'nature' | 'food' | 'culture' | 'adventure' | 'relax'
type PlanItem = { id: string; label: string; lat?: number; lon?: number }
type TravelMode = 'auto' | 'road' | 'train' | 'flight'
type CostTier = 'low' | 'mid' | 'high'

export function TripPlannerPage() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const [from, setFrom] = useState('Chennai')
  const [destination, setDestination] = useState('Munnar')
  const [days, setDays] = useState(3)
  const [travelers, setTravelers] = useState(2)
  const [budget, setBudget] = useState<Budget>('mid')
  const [interests, setInterests] = useState<Interest[]>(['nature', 'food'])
  const [travelMode, setTravelMode] = useState<TravelMode>('auto')
  const [costTier, setCostTier] = useState<CostTier>('mid')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PlanItem[]>([])
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null)

  const debFrom = useDebounce(from, 250)
  const debDest = useDebounce(destination, 250)

  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [modeLabel, setModeLabel] = useState<string>('—')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const f = debFrom.trim()
      const d = debDest.trim()
      if (f.length < 2 || d.length < 2) return

      try {
        const [fw, dw] = await Promise.all([api.wiki(f), api.wiki(d)])
        if (cancelled) return

        const fc = fw.coordinates ?? null
        const dc = dw.coordinates ?? null
        setDestCoords(dc)

        if (fc && dc) {
          const km = haversineKm(fc, dc)
          setDistanceKm(km)
          setModeLabel(pickTravelMode(travelMode, km).label)
        } else {
          setDistanceKm(null)
          setModeLabel('—')
        }
      } catch {
        if (cancelled) return
        setDestCoords(null)
        setDistanceKm(null)
        setModeLabel('—')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debFrom, debDest, travelMode])

  const cost = useMemo(() => {
    const base = estimateLocalCost(days, budget)
    const tierMult = costTier === 'low' ? 0.85 : costTier === 'high' ? 1.25 : 1.0
    const destMult = destCoords ? destinationMultiplier(destCoords) : 1.0
    const mult = tierMult * destMult

    const stay = Math.round(base.stay * mult)
    const food = Math.round(base.food * mult)
    const local = Math.round(base.local * mult)
    const activities = Math.round(base.activities * mult)

    const travel =
      distanceKm != null
        ? estimateTravelCost({
            distanceKm,
            travelers,
            mode: pickTravelMode(travelMode, distanceKm).mode,
            regionHint: destCoords ? (isInIndia(destCoords) ? 'India' : 'Global') : 'India',
          })
        : 0

    const total = stay + food + local + activities + travel
    return { stay, food, local, activities, travel, total }
  }, [days, budget, costTier, destCoords, distanceKm, travelers, travelMode])

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trip Planner</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Distance-aware cost estimate + day-wise itinerary from nearby attractions. Drag to reorder.
        </p>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-sm font-semibold">Route</div>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">From</div>
              <SearchBox
                initialValue={from}
                placeholder="Search origin..."
                onSelect={(t) => {
                  setFrom(t)
                }}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">Destination</div>
              <SearchBox
                initialValue={destination}
                placeholder="Search destination..."
                onSelect={(t) => {
                  setDestination(t)
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-white/10 dark:bg-white/5">
              Distance: {distanceKm != null ? `${Math.round(distanceKm)} km` : '—'}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-white/10 dark:bg-white/5">
              Travel: {modeLabel}
            </span>
          </div>

          <div className="flex gap-3">
            <label className="w-full text-xs text-slate-600 dark:text-slate-300">
              Days
              <input
                type="number"
                min={1}
                max={10}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              />
            </label>

            <label className="w-full text-xs text-slate-600 dark:text-slate-300">
              Travelers
              <input
                type="number"
                min={1}
                max={8}
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              />
            </label>

            <label className="w-full text-xs text-slate-600 dark:text-slate-300">
              Budget
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value as Budget)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="low">Low</option>
                <option value="mid">Mid</option>
                <option value="lux">Luxury</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="w-full text-xs text-slate-600 dark:text-slate-300">
              Travel mode
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="auto">Auto (by distance)</option>
                <option value="road">Road (bus/car)</option>
                <option value="train">Train</option>
                <option value="flight">Flight</option>
              </select>
            </label>

            <label className="w-full text-xs text-slate-600 dark:text-slate-300">
              Local prices
              <select
                value={costTier}
                onChange={(e) => setCostTier(e.target.value as CostTier)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              >
                <option value="low">Low</option>
                <option value="mid">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300">Interests</div>
          <div className="flex flex-wrap gap-2">
            {(['nature', 'food', 'culture', 'adventure', 'relax'] as Interest[]).map((i) => {
              const active = interests.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => setInterests((prev) => (active ? prev.filter((x) => x !== i) : [...prev, i]))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100'
                  }`}
                >
                  {i}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <ExpandableSection
            title="Cost breakdown"
            preview={
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Estimated total</div>
                <div className="mt-1 text-2xl font-semibold">{rupee(cost.total)}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Travel {rupee(cost.travel)} · Stay {rupee(cost.stay)}
                </div>
              </div>
            }
          >
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Travel (round trip)</span>
                  <span className="font-semibold">{rupee(cost.travel)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {distanceKm != null ? `${Math.round(distanceKm)} km` : 'Distance unknown'} · {modeLabel} · {travelers} travelers
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Stay</div>
                  <div className="mt-1 font-semibold">{rupee(cost.stay)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Food</div>
                  <div className="mt-1 font-semibold">{rupee(cost.food)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Local</div>
                  <div className="mt-1 font-semibold">{rupee(cost.local)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Activities</div>
                  <div className="mt-1 font-semibold">{rupee(cost.activities)}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Local prices use your selected tier ({costTier}) and a destination multiplier (India vs Global + metro/hill heuristics).
              </div>
            </div>
          </ExpandableSection>

          <MotionButton
            label={loading ? 'Planning…' : 'Generate Itinerary'}
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              try {
                const w = await api.wiki(destination)
                setCenter(w.coordinates ?? null)
                const coords = w.coordinates
                const near = coords ? await api.nearby(coords.lat, coords.lon, 5000) : null
                const generated = generatePlan(destination, days, interests, near?.pois ?? [])
                setItems(generated)
              } finally {
                setLoading(false)
              }
            }}
          />

          <MotionButton
            label="Save Trip"
            classes="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:border-white/10"
            onClick={async () => {
              if (!supabase) return navigate('/auth')
              if (!user) return navigate('/auth')
              await supabase.from('trips').insert({
                title: `${destination} - ${days} days`,
                destination,
                days,
                budget,
                interests,
                itinerary: {
                  items,
                  meta: { from, travelers, travelMode, costTier, distanceKm, estimatedCost: cost },
                },
              })
            }}
          />
        </div>
      </section>

      {loading ? <LoadingSpinner label="Building itinerary..." /> : null}

      {items.length ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Editable plan</h2>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event
                if (!over || active.id === over.id) return
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)
                setItems((prev) => arrayMove(prev, oldIndex, newIndex))
              }}
            >
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <SortableItem key={it.id} id={it.id} index={idx + 1} label={it.label} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Map route</h2>
            {center ? (
              <LeafletMap
                center={center}
                zoom={12}
                markers={items
                  .filter((x) => x.lat != null && x.lon != null)
                  .slice(0, 40)
                  .map((x) => ({ id: x.id, lat: x.lat!, lon: x.lon!, label: x.label }))}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Map needs coordinates from Wikipedia.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function generatePlan(destination: string, days: number, interests: Interest[], pois: any[]): PlanItem[] {
  const scored = pois
    .filter((p: any) => p.name)
    .map((p: any) => {
      const kind = String(p.kind ?? '')
      const name = String(p.name ?? '')
      const score = scorePoi({ interests, kind, name })
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(8, days * 6))

  const items: PlanItem[] = []
  items.push({ id: `base:${destination}`, label: `Arrive - ${destination}` })

  let idx = 0
  for (let d = 1; d <= days; d++) {
    items.push({ id: `day:${d}`, label: `Day ${d} - Highlights` })
    for (let s = 0; s < 4 && idx < scored.length; s++, idx++) {
      const poi = scored[idx]!.p
      items.push({ id: poi.id, label: poi.name, lat: poi.lat, lon: poi.lon })
    }
    items.push({ id: `food:${d}`, label: 'Local food + sunset spot' })
  }
  items.push({ id: 'wrap', label: 'Wrap up - Souvenirs - Return' })
  return items
}

function scorePoi(input: { interests: Interest[]; kind: string; name: string }) {
  const k = (input.kind + ' ' + input.name).toLowerCase()
  let score = 0
  if (input.interests.includes('nature') && (k.includes('waterfall') || k.includes('viewpoint') || k.includes('park') || k.includes('lake'))) score += 3
  if (input.interests.includes('culture') && (k.includes('temple') || k.includes('museum') || k.includes('fort') || k.includes('heritage'))) score += 3
  if (input.interests.includes('food') && (k.includes('restaurant') || k.includes('cafe') || k.includes('market'))) score += 2
  if (input.interests.includes('adventure') && (k.includes('trek') || k.includes('trail') || k.includes('camp'))) score += 2
  if (input.interests.includes('relax') && (k.includes('beach') || k.includes('spa') || k.includes('garden'))) score += 2
  if (k.includes('tourism')) score += 1
  return score
}

function estimateLocalCost(days: number, budget: Budget) {
  const baseStay = budget === 'low' ? 1800 : budget === 'mid' ? 4200 : 9000
  const baseFood = budget === 'low' ? 700 : budget === 'mid' ? 1200 : 2200
  const baseLocal = budget === 'low' ? 500 : budget === 'mid' ? 900 : 1800
  const baseActivities = budget === 'low' ? 400 : budget === 'mid' ? 900 : 1600

  const stay = baseStay * days
  const food = baseFood * days
  const local = baseLocal * days
  const activities = baseActivities * days
  return { stay, food, local, activities }
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLon / 2)
  const aa = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
  return R * c
}

function toRad(d: number) {
  return (d * Math.PI) / 180
}

function pickTravelMode(mode: TravelMode, distanceKm: number) {
  if (mode !== 'auto') {
    return { mode, label: mode === 'road' ? 'Road' : mode === 'train' ? 'Train' : 'Flight' }
  }
  if (distanceKm < 250) return { mode: 'road' as const, label: 'Road (short)' }
  if (distanceKm < 900) return { mode: 'train' as const, label: 'Train (mid)' }
  return { mode: 'flight' as const, label: 'Flight (long)' }
}

function isInIndia(coords: { lat: number; lon: number }) {
  return coords.lat >= 6 && coords.lat <= 37.5 && coords.lon >= 68 && coords.lon <= 97.5
}

function destinationMultiplier(coords: { lat: number; lon: number }) {
  if (!isInIndia(coords)) return 3.0

  const near = (lat: number, lon: number, rKm: number) => haversineKm(coords, { lat, lon }) < rKm
  const isMetro =
    near(13.0827, 80.2707, 45) || // Chennai
    near(12.9716, 77.5946, 45) || // Bengaluru
    near(19.076, 72.8777, 55) || // Mumbai
    near(28.6139, 77.209, 55) || // Delhi
    near(9.9312, 76.2673, 35) // Kochi

  const hillBand = coords.lat > 8 && coords.lat < 13 && coords.lon > 75 && coords.lon < 78.5

  if (isMetro) return 1.15
  if (hillBand) return 1.1
  return 1.0
}

function estimateTravelCost(input: {
  distanceKm: number
  travelers: number
  mode: Exclude<TravelMode, 'auto'>
  regionHint: 'India' | 'Global'
}) {
  const km = Math.max(1, input.distanceKm)
  const pax = Math.max(1, input.travelers)

  if (input.mode === 'road') {
    const perKm = input.regionHint === 'India' ? 9 : 18
    const base = 250
    return Math.round((base + perKm * km) * 2 * pax)
  }
  if (input.mode === 'train') {
    const perKm = input.regionHint === 'India' ? 3.5 : 8
    const base = 500
    return Math.round((base + perKm * km) * 2 * pax)
  }

  const base = input.regionHint === 'India' ? 2400 : 9000
  const perKm = input.regionHint === 'India' ? 4.5 : 10
  return Math.round((base + perKm * km) * 2 * pax)
}
