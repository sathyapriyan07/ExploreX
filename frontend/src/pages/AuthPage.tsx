import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAppStore } from '../store/useAppStore'

export function AuthPage() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const sb = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!sb) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
      </div>
    )
  }

  if (user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-semibold">Signed in</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{user.email}</div>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-base-950"
        >
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <label className="block text-xs text-slate-600 dark:text-slate-300">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <label className="mt-3 block text-xs text-slate-600 dark:text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <button
          onClick={async () => {
            setLoading(true)
            setError(null)
            try {
              const { error } = await sb.auth.signInWithPassword({ email, password })
              if (error) throw error
              navigate('/')
            } catch (e: any) {
              setError(e?.message ?? String(e))
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70 dark:bg-white dark:text-base-950 dark:hover:bg-slate-100"
        >
          Sign in
        </button>

        <button
          onClick={async () => {
            setLoading(true)
            setError(null)
            try {
              const { error } = await sb.auth.signUp({ email, password })
              if (error) throw error
              setError('Check your email for confirmation (if enabled).')
            } catch (e: any) {
              setError(e?.message ?? String(e))
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          Create account
        </button>

        <div className="my-4 h-px bg-slate-200 dark:bg-white/10" />

        <button
          onClick={async () => {
            setLoading(true)
            setError(null)
            try {
              const { error } = await sb.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
              })
              if (error) throw error
            } catch (e: any) {
              setError(e?.message ?? String(e))
              setLoading(false)
            }
          }}
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
        >
          Continue with Google
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300">
        Supabase Auth must have Google provider enabled and redirect URLs configured for your domain.
      </p>
    </div>
  )
}
