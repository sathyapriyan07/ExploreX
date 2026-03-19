import { useRef } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useExpandable } from '../hooks/use-expandable'
import { Button } from './button'
import { cn } from '../../lib/utils'

export function ExpandableSection({
  title,
  preview,
  children,
  defaultExpanded,
  compact,
}: {
  title: string
  preview: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  compact?: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable(contentRef, { collapsedHeight: 0, defaultExpanded })

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5', compact && 'p-3')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cn('text-sm font-semibold', compact && 'text-xs')}>{title}</div>
          <div className={cn('mt-1 text-sm text-slate-700 dark:text-slate-200', compact && 'text-xs')}>{preview}</div>
        </div>
        <Button variant="secondary" size="sm" onClick={toggleExpand}>
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      </div>

      <motion.div style={{ height: animatedHeight }} className="overflow-hidden">
        <div ref={contentRef} className="pt-3">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
