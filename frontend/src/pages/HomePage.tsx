import { Link, useNavigate } from 'react-router-dom'
import { SectionRow } from '../components/SectionRow'
import { PlaceCard } from '../components/PlaceCard'
import { curated } from '../data/curated'
import { useAppStore } from '../store/useAppStore'
import { SearchBox } from '../components/SearchBox'
import { TestimonialSlider } from '../components/ui/testimonial-slider'
import { getTestimonials } from '../services/testimonials'
import { useEffect, useState } from 'react'
import type { Testimonial } from '../data/testimonials'
import MotionButton from '../components/ui/motion-button'

export function HomePage() {
  const region = useAppStore((s) => s.region)
  const navigate = useNavigate()

  const [homeTestimonials, setHomeTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    getTestimonials({ region: 'India', limit: 5 }).then(setHomeTestimonials).catch(() => setHomeTestimonials([]))
  }, [])

  return (
    <div className="space-y-10">
      <Hero region={region} onSelect={(title) => navigate(`/place/${encodeURIComponent(title)}`)} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Loved by travelers</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Trust signals from real-style trips across Kerala, Tamil Nadu, and hill stations.
        </p>
        <TestimonialSlider testimonials={homeTestimonials} />
      </section>

      {region === 'India' ? (
        <div className="space-y-10">
          <SectionRow title="Hill Stations" subtitle="Ooty, Munnar, Kodaikanal, Wayanad — instant calm.">
            {curated.hillStations.map((p) => (
              <PlaceCard key={p.title} place={p} />
            ))}
          </SectionRow>

          <SectionRow title="Kerala Escapes" subtitle="Backwaters, beaches, wildlife, and slow travel.">
            {curated.keralaEscapes.map((p) => (
              <PlaceCard key={p.title} place={p} />
            ))}
          </SectionRow>

          <SectionRow title="Tamil Nadu Culture" subtitle="Temples, heritage towns, and food trails.">
            {curated.tamilNaduCulture.map((p) => (
              <PlaceCard key={p.title} place={p} />
            ))}
          </SectionRow>

          <SectionRow
            title="Trending in India"
            subtitle="High-signal picks, good for long weekends."
            actions={
              <Link to="/explore" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                Explore all →
              </Link>
            }
          >
            {curated.trendingIndia.map((p) => (
              <PlaceCard key={p.title} place={p} compact />
            ))}
          </SectionRow>

          <SectionRow title="Quick Trip Ideas" subtitle="2–3 day getaways from major hubs.">
            {curated.quickTrips.map((p) => (
              <PlaceCard key={p.title} place={p} compact />
            ))}
          </SectionRow>

          <SectionRow title="Global Picks" subtitle="When you want to zoom out.">
            {curated.globalPicks.map((p) => (
              <PlaceCard key={p.title} place={p} />
            ))}
          </SectionRow>
        </div>
      ) : (
        <div className="space-y-10">
          <SectionRow title="Global Picks" subtitle="High-impact destinations with strong visuals.">
            {curated.globalPicks.map((p) => (
              <PlaceCard key={p.title} place={p} />
            ))}
          </SectionRow>

          <SectionRow title="South India Spotlight" subtitle="Kerala + Tamil Nadu + hill stations, always on deck.">
            {[...curated.hillStations, ...curated.keralaEscapes].slice(0, 8).map((p) => (
              <PlaceCard key={p.title} place={p} />
            ))}
          </SectionRow>
        </div>
      )}
    </div>
  )
}

function Hero({ region, onSelect }: { region: string; onSelect: (title: string) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.35),transparent_45%),radial-gradient(circle_at_70%_10%,rgba(34,211,238,0.25),transparent_50%),radial-gradient(circle_at_40%_90%,rgba(147,51,234,0.15),transparent_55%)]" />
      <div className="relative grid gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            India-first • Kerala • Tamil Nadu • Hill Stations • Global ready
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Netflix-style travel discovery, with <span className="text-emerald-700 dark:text-emerald-300">real data</span>.
          </h1>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            Wikipedia for context (summary + place images), Overpass for nearby attractions, and Open-Meteo for planning —
            all proxied and cached via the backend.
          </p>
          <div className="flex flex-wrap gap-2">
            <MotionButton label="Explore Hills" to="/explore" />
            <MotionButton
              label="Start Your Journey"
              to="/planner"
              classes="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:border-white/10"
            />
            <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
              Mode: {region}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold">Jump to a place</div>
          <SearchBox onSelect={onSelect} />
          <p className="text-xs text-slate-600 dark:text-slate-300">Try: Munnar, Ooty, Kodaikanal, Wayanad, Kochi, Madurai, Bali, Kyoto…</p>
        </div>
      </div>
    </section>
  )
}
