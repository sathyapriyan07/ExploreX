import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAppStore } from '../store/useAppStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function SavedPage() {
  const user = useAppStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<any[]>([])

  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
        if (cancelled) return
        setTrips(data ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">Sign in to view saved trips</div>
        <Link
          to="/auth"
          className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-base-950"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
      {loading ? <LoadingSpinner label="Loading saved trips…" /> : null}
      {trips.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {t.destination} · {t.days} days · {t.budget}
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{new Date(t.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          No saved trips yet. Create one in the planner.
        </div>
      )}
    </div>
  )
}
