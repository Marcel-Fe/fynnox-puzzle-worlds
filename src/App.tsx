import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { WaldbloeckeGame } from './games/waldbloecke/components/WaldbloeckeGame'
import { Dashboard } from './screens/Dashboard'
import { Missions } from './screens/Missions'
import { More } from './screens/More'
import { Placeholder } from './screens/Placeholder'
import { useGameStore } from './store/gameStore'

/*
 * HashRouter statt BrowserRouter: Auf GitHub Pages gibt es keinen Server, der
 * Unterseiten auf index.html umleitet — ein Neuladen unter /missionen wäre sonst ein 404.
 */
export default function App() {
  const init = useGameStore((s) => s.init)
  const loaded = useGameStore((s) => s.loaded)

  useEffect(() => {
    void init()
  }, [init])

  if (!loaded) {
    return (
      <div className="grid min-h-full place-items-center bg-deep">
        <div className="text-center">
          <p className="text-5xl" aria-hidden>
            🦊
          </p>
          <p className="mt-3 text-2xl font-black tracking-wide text-gold">FYNNOX</p>
          <p className="mt-1 text-sm text-ink-muted">Wird geladen …</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="spiel/waldbloecke" element={<WaldbloeckeGame />} />
          <Route path="mehr" element={<More />} />
          <Route path="spiele" element={<Placeholder title="Spiele" phase="Phase 5" />} />
          <Route path="missionen" element={<Missions />} />
          <Route path="shop" element={<Placeholder title="Shop" phase="Phase 7" />} />
          <Route
            path="abenteuer"
            element={<Placeholder title="Abenteuerpfad" phase="Phase 7" />}
          />
          <Route path="events" element={<Placeholder title="Events" phase="Phase 7" />} />
          <Route path="freunde" element={<Placeholder title="Freunde" phase="Phase 8" />} />
          <Route path="rangliste" element={<Placeholder title="Rangliste" phase="Phase 8" />} />
          <Route path="profil" element={<Placeholder title="Profil" phase="Phase 5" />} />
          <Route path="erfolge" element={<Placeholder title="Erfolge" phase="Phase 7" />} />
          <Route
            path="einstellungen"
            element={<Placeholder title="Einstellungen" phase="Phase 8" />}
          />
          <Route path="*" element={<Placeholder title="Nicht gefunden" phase="—" />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
