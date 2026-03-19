import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { useThemeSync } from '../../hooks/useThemeSync'
import { useAppStore } from '../../store/useAppStore'
import { supabase } from '../../services/supabase'

export function AppShell({ children }: PropsWithChildren) {
  useThemeSync()

  const setSession = useAppStore((s) => s.setSession)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => data.subscription.unsubscribe()
  }, [setSession])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white dark:from-base-950 dark:to-base-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</main>
    </div>
  )
}

