import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../content/navigation'
import { useGameStore } from '../store/gameStore'
import { Avatar } from './Avatar'
import { NavIcon } from './NavIcon'
import { CurrencyBar } from './CurrencyBar'

/**
 * Rahmen für alle Bildschirme: Kopfzeile mit Währungen, Navigation, Inhalt.
 * Am Handy Tab-Leiste unten, ab Desktop Seitenleiste links (docs/03-art-ui-guide.md).
 */
export function AppShell() {
  const profile = useGameStore((s) => s.save?.profile)

  return (
    <div className="flex min-h-full flex-col bg-deep md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-edge bg-sidebar p-3 md:flex">
        <div className="flex items-center gap-2 px-2 pt-2 pb-4">
          <Avatar name="Fynnox" size={36} ring="var(--color-gold)" />
          <div>
            <p className="text-lg leading-none font-black tracking-wide text-gold">FYNNOX</p>
            <p className="text-[9px] font-bold tracking-[0.2em] text-ink-muted uppercase">
              Puzzle Worlds
            </p>
          </div>
        </div>
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
            <NavIcon mask={item.mask} fallback={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          Ohne den oberen Sicherheitsabstand liegt die Währungsleiste im
          Vollbild- und Startbildschirm-Modus unter Uhr und Akkuanzeige — die
          Seite reicht dort bis an die Gerätekante (`viewport-fit=cover`).
        */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-edge bg-deep/95 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur">
          <NavLink to="/profil" className="flex items-center gap-2 md:hidden">
            <Avatar name="Fynnox" size={36} ring="var(--color-gold)" />
            <span className="max-w-20 truncate text-sm font-bold">{profile?.name}</span>
          </NavLink>
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
              <NavIcon mask={item.mask} fallback={item.icon} size={22} />
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
