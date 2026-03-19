import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { usePlaceImage } from '../../hooks/usePlaceImage'

export type AnimatedCardData = {
  id: string
  title: string
  description?: string
  href: string
}

export function AnimatedCardStack({
  cards,
  className,
  autoPlay = true,
  intervalMs = 3500,
  visibleCount = 3,
}: {
  cards: AnimatedCardData[]
  className?: string
  autoPlay?: boolean
  intervalMs?: number
  visibleCount?: number
}) {
  const safeVisible = Math.max(1, Math.min(5, visibleCount))
  const normalized = useMemo(() => cards.filter((c) => c.title && c.href), [cards])

  const [stack, setStack] = useState(() => normalized.slice(0, safeVisible))
  const [nextIndex, setNextIndex] = useState(safeVisible)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    setStack(normalized.slice(0, safeVisible))
    setNextIndex(safeVisible)
  }, [normalized, safeVisible])

  useEffect(() => {
    if (!autoPlay) return
    if (hovered) return
    if (normalized.length <= safeVisible) return
    const handle = setInterval(() => rotate(), intervalMs)
    return () => clearInterval(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, hovered, intervalMs, normalized.length, safeVisible, nextIndex])

  function rotate() {
    if (normalized.length <= safeVisible) return
    setStack((prev) => {
      const out = prev[0]
      const rest = prev.slice(1)
      const next = normalized[nextIndex % normalized.length]
      setNextIndex((i) => i + 1)
      return out && next ? [...rest, next] : prev
    })
  }

  return (
    <div
      className={cn('relative w-full', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-[320px] w-full sm:h-[360px]">
        <AnimatePresence initial={false}>
          {stack.map((card, idx) => (
            <StackCard
              key={card.id}
              card={card}
              index={idx}
              count={stack.length}
              onNext={rotate}
              isTop={idx === 0}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StackCard({
  card,
  index,
  count,
  isTop,
  onNext,
}: {
  card: AnimatedCardData
  index: number
  count: number
  isTop: boolean
  onNext: () => void
}) {
  const image = usePlaceImage(card.title)
  const depth = count - 1 - index
  const y = depth * 14
  const scale = 1 - depth * 0.04
  const zIndex = 10 + (count - index)

  return (
    <motion.div
      layout
      className="absolute inset-0"
      style={{ zIndex }}
      initial={{ opacity: 0, y: -32, scale: 0.96 }}
      animate={{ opacity: 1, y, scale }}
      exit={{ opacity: 0, y: 80, scale: 0.98, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
    >
      <div className="h-full w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-glow dark:border-white/10 dark:bg-white/5">
        <div className="relative h-full w-full">
          {image ? (
            <img src={image} alt={card.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.35),transparent_45%),radial-gradient(circle_at_70%_10%,rgba(34,211,238,0.25),transparent_50%),radial-gradient(circle_at_40%_90%,rgba(147,51,234,0.15),transparent_55%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />

          <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
            <div className="max-w-lg space-y-2">
              <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Featured · India-first
              </div>
              <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{card.title}</div>
              {card.description ? <div className="text-sm text-white/85">{card.description}</div> : null}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button asChild>
                  <Link to={card.href}>Explore</Link>
                </Button>
                <Button variant="secondary" onClick={onNext} disabled={!isTop}>
                  Next
                </Button>
              </div>
              {!isTop ? <div className="pt-1 text-xs text-white/60">Tip: hover to pause</div> : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

