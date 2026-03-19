import type { RefObject } from 'react'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useSpring } from 'framer-motion'

export function useExpandable(
  contentRef: RefObject<HTMLElement | null>,
  opts?: { collapsedHeight?: number; defaultExpanded?: boolean },
) {
  const collapsedHeight = opts?.collapsedHeight ?? 0
  const [isExpanded, setIsExpanded] = useState(Boolean(opts?.defaultExpanded))
  const [measuredHeight, setMeasuredHeight] = useState(collapsedHeight)

  const animatedHeight = useSpring(collapsedHeight, {
    stiffness: 260,
    damping: 32,
    mass: 0.7,
  })

  const ro = useMemo(() => {
    if (typeof ResizeObserver === 'undefined') return null
    return new ResizeObserver(() => {
      const el = contentRef.current
      if (!el) return
      const next = el.scrollHeight
      setMeasuredHeight(next)
      if (isExpanded) animatedHeight.set(next)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const next = el.scrollHeight
    setMeasuredHeight(next)
    animatedHeight.set(isExpanded ? next : collapsedHeight)
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [contentRef, ro, animatedHeight, isExpanded, collapsedHeight])

  useLayoutEffect(() => {
    animatedHeight.set(isExpanded ? measuredHeight : collapsedHeight)
  }, [isExpanded, measuredHeight, collapsedHeight, animatedHeight])

  function toggleExpand() {
    const el = contentRef.current
    if (el) setMeasuredHeight(el.scrollHeight)
    setIsExpanded((v) => !v)
  }

  return { isExpanded, toggleExpand, animatedHeight } as const
}
