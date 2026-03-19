import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useExpandable } from '../hooks/use-expandable'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export function UseExpandableDemo() {
  const contentRef = useRef<HTMLDivElement>(null)
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable(contentRef, { collapsedHeight: 0 })

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Expandable demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="secondary" onClick={toggleExpand}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
        <motion.div style={{ height: animatedHeight }} className="overflow-hidden">
          <div ref={contentRef} className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <p className="font-semibold">Smooth height transition</p>
            <p className="mt-1 text-slate-700 dark:text-slate-200">
              This content expands/collapses using a spring-driven height animation. Use it across Place Detail, Planner,
              Weather insights, and Nearby sections.
            </p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

