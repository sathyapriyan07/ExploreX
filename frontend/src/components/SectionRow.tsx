import type { ReactNode } from 'react'

export function SectionRow({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-3 pb-2">{children}</div>
      </div>
    </section>
  )
}

