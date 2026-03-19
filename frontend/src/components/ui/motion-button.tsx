import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export default function MotionButton({
  label,
  classes,
  to,
  onClick,
  disabled,
  type,
}: {
  label: string
  classes?: string
  to?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}) {
  const base =
    'group relative inline-flex w-full items-center justify-between gap-3 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-60 sm:w-auto'

  const surface =
    'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-base-950 dark:hover:bg-slate-100'

  const Comp = to ? Link : 'button'
  const props = to
    ? { to }
    : {
        type: type ?? 'button',
        onClick,
        disabled,
      }

  return (
    <Comp className={cn(base, surface, classes)} {...(props as any)}>
      <span className="relative z-10">{label}</span>

      {/* expanding circle */}
      <span
        aria-hidden
        className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/15 transition-transform duration-300 ease-out group-hover:scale-[8] dark:bg-black/10"
      />

      <span className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:translate-x-0.5 dark:bg-black/10">
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Comp>
  )
}

