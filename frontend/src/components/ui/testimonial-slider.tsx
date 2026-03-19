import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import type { Testimonial } from '../../data/testimonials'
import { Button } from './button'
import { usePlaceImage } from '../../hooks/usePlaceImage'

export function TestimonialSlider({
  testimonials,
  className,
  autoPlay = true,
  intervalMs = 5000,
}: {
  testimonials: Testimonial[]
  className?: string
  autoPlay?: boolean
  intervalMs?: number
}) {
  const items = useMemo(() => testimonials.filter((t) => t.quote && t.name), [testimonials])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
  }, [items.length])

  useEffect(() => {
    if (!autoPlay) return
    if (hovered) return
    if (items.length <= 1) return
    const handle = setInterval(() => go(1), intervalMs)
    return () => clearInterval(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, hovered, intervalMs, items.length, currentIndex])

  function go(delta: number) {
    if (items.length === 0) return
    setDirection(delta)
    setCurrentIndex((i) => (i + delta + items.length) % items.length)
  }

  const current = items[currentIndex]
  const placeImage = usePlaceImage(current?.place ?? '')

  return (
    <div
      className={cn('relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {placeImage ? (
        <img
          src={placeImage}
          alt={current?.place ?? 'Destination'}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.15),transparent_55%),radial-gradient(circle_at_40%_90%,rgba(147,51,234,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15 dark:from-black/75 dark:via-black/45 dark:to-black/25" />

      <div className="relative grid gap-4 p-5 sm:grid-cols-[140px_1fr] sm:gap-6 sm:p-6">
        <div className="flex items-start gap-4 sm:flex-col sm:gap-3">
          <Avatar name={current?.name ?? 'Traveler'} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{current?.name ?? 'Traveler'}</div>
            <div className="text-xs text-white/80">{current?.role ?? 'Traveler'}</div>
            <div className="mt-2 flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('h-4 w-4', i < (current?.rating ?? 0) ? 'fill-amber-400' : 'fill-transparent')} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {current?.place ? `Review · ${current.place}` : 'Traveler review'}
          </div>

          <div className="relative min-h-[110px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.blockquote
                key={current?.id ?? 'empty'}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                className="text-sm leading-relaxed text-white"
              >
                “{current?.quote ?? 'No testimonials yet.'}”
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {items.slice(0, 6).map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1)
                    setCurrentIndex(idx)
                  }}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full transition',
                    idx === currentIndex ? 'bg-emerald-500' : 'bg-slate-300/70 dark:bg-white/15',
                  )}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => go(-1)} disabled={items.length <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => go(1)} disabled={items.length <= 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-white/70">
            Tip: hover to pause · {currentIndex + 1}/{Math.max(1, items.length)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name)
  const bg = avatarBg(name)
  return (
    <div
      className={cn(
        'flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-white/20 sm:h-28 sm:w-28',
        bg,
      )}
      aria-label={name}
      title={name}
    >
      <div className="text-base font-semibold text-white sm:text-2xl">{initials}</div>
    </div>
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0]?.toUpperCase() ?? 'T'
  const b = parts.length > 1 ? parts[parts.length - 1]![0]!.toUpperCase() : ''
  return (a + b).slice(0, 2)
}

function avatarBg(seed: string) {
  const palettes = [
    'bg-gradient-to-br from-emerald-500 to-cyan-500',
    'bg-gradient-to-br from-indigo-500 to-fuchsia-500',
    'bg-gradient-to-br from-amber-500 to-rose-500',
    'bg-gradient-to-br from-sky-500 to-emerald-500',
    'bg-gradient-to-br from-violet-500 to-blue-500',
  ]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return palettes[h % palettes.length]!
}
