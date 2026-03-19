import { create } from 'zustand'
import type { Region } from '../types'
import type { Session, User } from '@supabase/supabase-js'

type Theme = 'dark' | 'light'
type MapStyle = 'standard' | 'satellite'

type AppState = {
  region: Region
  theme: Theme
  mapStyle: MapStyle
  session: Session | null
  user: User | null
  setRegion: (region: Region) => void
  toggleRegion: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setMapStyle: (style: MapStyle) => void
  toggleMapStyle: () => void
  setSession: (session: Session | null) => void
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('explorex_theme')
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialRegion(): Region {
  const saved = localStorage.getItem('explorex_region')
  if (saved === 'India' || saved === 'Global') return saved
  return 'India'
}

function getInitialMapStyle(): MapStyle {
  const saved = localStorage.getItem('explorex_map_style')
  if (saved === 'standard' || saved === 'satellite') return saved
  return 'standard'
}

export const useAppStore = create<AppState>((set, get) => ({
  region: getInitialRegion(),
  theme: getInitialTheme(),
  mapStyle: getInitialMapStyle(),
  session: null,
  user: null,
  setRegion: (region) => {
    localStorage.setItem('explorex_region', region)
    set({ region })
  },
  toggleRegion: () => {
    const next: Region = get().region === 'India' ? 'Global' : 'India'
    localStorage.setItem('explorex_region', next)
    set({ region: next })
  },
  setTheme: (theme) => {
    localStorage.setItem('explorex_theme', theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('explorex_theme', next)
    set({ theme: next })
  },
  setMapStyle: (style) => {
    localStorage.setItem('explorex_map_style', style)
    set({ mapStyle: style })
  },
  toggleMapStyle: () => {
    const next: MapStyle = get().mapStyle === 'standard' ? 'satellite' : 'standard'
    localStorage.setItem('explorex_map_style', next)
    set({ mapStyle: next })
  },
  setSession: (session) => set({ session, user: session?.user ?? null }),
}))
