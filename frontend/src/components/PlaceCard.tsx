import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { CuratedPlace } from '../types'
import { cn } from './ui/cn'
import { usePlaceImage } from '../hooks/usePlaceImage'

export function PlaceCard({
  place,
  imageUrl,
  compact,
}: {
  place: CuratedPlace
  imageUrl?: string | null
  compact?: boolean
}) {
  const fetched = usePlaceImage(place.title)
  const hero = imageUrl ?? fetched

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
      <Link
        to={`/place/${encodeURIComponent(place.title)}`}
        className={cn(
          'group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-glow dark:border-white/10 dark:bg-white/5',
          compact ? 'w-[220px]' : 'w-[260px]',
        )}
      >
        <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-white/10">
          {hero ? (
            <img
              src={hero}
              alt={place.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-300/60 to-cyan-300/40 dark:from-emerald-500/25 dark:to-cyan-500/15" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-900">
                {place.category}
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
                {place.region === 'India' ? place.state ?? 'India' : place.country ?? 'Global'}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1 p-3">
          <div className="text-sm font-semibold">{place.title}</div>
          <div className="text-xs text-slate-600 line-clamp-2 dark:text-slate-300">
            {place.tagline ?? 'Tap to explore highlights, map, weather, and nearby spots.'}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
