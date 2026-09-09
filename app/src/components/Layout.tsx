import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CreditCard, ScanLine, Users, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/cards', label: 'Carte', icon: CreditCard },
  { to: '/scan', label: 'Scansiona', icon: ScanLine },
  { to: '/groups', label: 'Gruppi', icon: Users },
]

export function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <span className="font-semibold text-slate-900">Carte Fedeltà</span>
        <div className="flex items-center gap-3">
          {profile && <span className="text-sm text-slate-500">@{profile.username}</span>}
          <button
            onClick={() => navigate('/account')}
            aria-label="Account"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => signOut()}
            aria-label="Esci"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-medium',
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600',
                )
              }
            >
              <Icon size={22} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
