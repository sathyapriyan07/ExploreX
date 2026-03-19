import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from './ui/cn'

export function SearchBox({
  placeholder,
  initialValue,
  onSelect,
  className,
}: {
  placeholder?: string
  initialValue?: string
  onSelect: (title: string) => void
  className?: string
}) {
  const [q, setQ] = useState(initialValue ?? '')
  const debounced = useDebounce(q, 250)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<{ title: string; snippet: string | null }>>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const term = debounced.trim()
    if (term.length < 2) {
      setItems([])
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .search(term)
      .then((res) => {
        if (cancelled) return
        setItems(res.results.map((r) => ({ title: r.title, snippet: r.snippet })))
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debounced])

  const hint = useMemo(() => (loading ? 'Searching…' : items.length ? `${items.length} results` : ''), [loading, items.length])

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
        <span className="text-slate-400">⌕</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Search places (Kerala, Tamil Nadu, hill stations, global)…'}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <span className="text-xs text-slate-400">{hint}</span>
      </div>

      {open && items.length ? (
        <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-base-900">
          <ul className="max-h-72 overflow-auto p-1">
            {items.map((it) => (
              <li key={it.title}>
                <button
                  onClick={() => {
                    onSelect(it.title)
                    setQ(it.title)
                    setOpen(false)
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <div className="text-sm font-semibold">{it.title}</div>
                  {it.snippet ? (
                    <div
                      className="mt-0.5 text-xs text-slate-600 line-clamp-2 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: it.snippet }}
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
