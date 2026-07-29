import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { BlockfallGame } from './games/blockfall/components/BlockfallGame'
import { KristallmixGame } from './games/kristallmix/components/KristallmixGame'
import { TempelpaareGame } from './games/tempelpaare/components/TempelpaareGame'
import { WaldbloeckeGame } from './games/waldbloecke/components/WaldbloeckeGame'
import { Dashboard } from './screens/Dashboard'
import { Games } from './screens/Games'
import { Loading } from './screens/Loading'
import { Missions } from './screens/Missions'
import { More } from './screens/More'
import { Placeholder } from './screens/Placeholder'
import { Profile } from './screens/Profile'
import { useGameStore } from './store/gameStore'

/*
 * HashRouter statt BrowserRouter: Auf GitHub Pages gibt es keinen Server, der
 * Unterseiten auf index.html umleitet — ein Neuladen unter /missionen wäre sonst ein 404.
 */
export default function App() {
  const init = useGameStore((s) => s.init)
  const loaded = useGameStore((s) => s.loaded)
  const [percent, setPercent] = useState(10)

  useEffect(() => {
    // Der Balken zeigt echte Schritte: Start, Spielstand geladen, fertig.
    setPercent(35)
    void init().then(() => setPercent(100))
  }, [init])

  if (!loaded) return <Loading percent={percent} />

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="spiele" element={<Games />} />
          <Route path="spiel/waldbloecke" element={<WaldbloeckeGame />} />
          <Route path="spiel/blockfall" element={<BlockfallGame />} />
          <Route path="spiel/tempelpaare" element={<TempelpaareGame />} />
          <Route path="spiel/kristallmix" element={<KristallmixGame />} />
          <Route path="missionen" element={<Missions />} />
          <Route path="profil" element={<Profile />} />
          <Route path="mehr" element={<More />} />
          <Route path="shop" element={<Placeholder title="Shop" phase="Phase 7" />} />
          <Route
            path="abenteuer"
            element={<Placeholder title="Abenteuerpfad" phase="Phase 7" />}
          />
          <Route path="events" element={<Placeholder title="Events" phase="Phase 7" />} />
          <Route path="freunde" element={<Placeholder title="Freunde" phase="Phase 8" />} />
          <Route path="rangliste" element={<Placeholder title="Rangliste" phase="Phase 8" />} />
          <Route path="erfolge" element={<Profile />} />
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
