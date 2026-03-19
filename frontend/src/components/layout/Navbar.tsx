import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { supabase } from '../../services/supabase'
import { cn } from '../ui/cn'

export function Navbar() {
  const region = useAppStore((s) => s.region)
  const toggleRegion = useAppStore((s) => s.toggleRegion)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const user = useAppStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur dark:border-white/10 dark:bg-base-950/55">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-glow" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">ExploreX</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Travel Intelligence</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavItem to="/" label="Home" />
          <NavItem to="/explore" label="Explore" />
          <NavItem to="/planner" label="Planner" />
          <NavItem to="/saved" label="Saved" />
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleRegion}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label="Toggle India/Global"
          >
            {region === 'India' ? 'India First' : 'Global'} · Switch
          </button>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>

          {user ? (
            <button
              onClick={async () => {
                await supabase?.auth.signOut()
                navigate('/')
              }}
              className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 md:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 md:inline-flex dark:bg-white dark:text-base-950 dark:hover:bg-slate-100"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
          isActive && 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white',
        )
      }
      end={to === '/'}
    >
      {label}
    </NavLink>
  )
}

