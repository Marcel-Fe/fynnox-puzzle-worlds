import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../content/navigation'
import { CurrencyBar } from './CurrencyBar'

/**
 * Rahmen für alle Bildschirme: Kopfzeile mit Währungen, Navigation, Inhalt.
 * Am Handy Tab-Leiste unten, ab Desktop Seitenleiste links (docs/03-art-ui-guide.md).
 */
export function AppShell() {
  return (
    <div className="flex min-h-full flex-col bg-deep md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-edge bg-sidebar p-3 md:flex">
        <div className="px-2 pt-2 pb-4 text-xl font-black tracking-wide text-gold">FYNNOX</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                isActive
                  ? 'bg-gradient-to-r from-gold to-gold-deep text-deep'
                  : 'text-ink-muted hover:bg-card hover:text-ink',
              ].join(' ')
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-edge bg-deep/95 px-4 py-3 backdrop-blur">
          <span className="text-lg font-black tracking-wide text-gold md:hidden">FYNNOX</span>
          <div className="ml-auto">
            <CurrencyBar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:pb-8">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-edge bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {NAV_ITEMS.filter((item) => item.inBottomBar).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition',
                  isActive ? 'text-gold' : 'text-ink-muted',
                ].join(' ')
              }
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/mehr"
            className={({ isActive }) =>
              [
                'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition',
                isActive ? 'text-gold' : 'text-ink-muted',
              ].join(' ')
            }
          >
            <span className="text-lg" aria-hidden>
              ☰
            </span>
            Mehr
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
