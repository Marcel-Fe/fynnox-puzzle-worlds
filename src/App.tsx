import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { applyAudioSettings, armAudioOnFirstGesture } from './core/audio'
import { requestFullscreenOnFirstTap } from './core/fullscreen'
import { BlockfallGame } from './games/blockfall/components/BlockfallGame'
import { BubbleShooterGame } from './games/bubbleshooter/components/BubbleShooterGame'
import { KristallmixGame } from './games/kristallmix/components/KristallmixGame'
import { MinigolfGame } from './games/minigolf/components/MinigolfGame'
import { SolitaireGame } from './games/solitaire/components/SolitaireGame'
import { SudokuGame } from './games/sudoku/components/SudokuGame'
import { TempelpaareGame } from './games/tempelpaare/components/TempelpaareGame'
import { WaldbloeckeGame } from './games/waldbloecke/components/WaldbloeckeGame'
import { Achievements } from './screens/Achievements'
import { Adventure } from './screens/Adventure'
import { Dashboard } from './screens/Dashboard'
import { Events } from './screens/Events'
import { Friends } from './screens/Friends'
import { Games } from './screens/Games'
import { Loading } from './screens/Loading'
import { Missions } from './screens/Missions'
import { More } from './screens/More'
import { Placeholder } from './screens/Placeholder'
import { Profile } from './screens/Profile'
import { Ranking } from './screens/Ranking'
import { Settings } from './screens/Settings'
import { Shop } from './screens/Shop'
import { CloudSaveAdapter } from './save/cloudAdapter'
import { adapter, useGameStore } from './store/gameStore'

/*
 * HashRouter statt BrowserRouter: Auf GitHub Pages gibt es keinen Server, der
 * Unterseiten auf index.html umleitet — ein Neuladen unter /missionen wäre sonst ein 404.
 */
export default function App() {
  const init = useGameStore((s) => s.init)
  const loaded = useGameStore((s) => s.loaded)
  const sound = useGameStore((s) => s.save?.settings.sound ?? false)
  const music = useGameStore((s) => s.save?.settings.music ?? false)
  const [percent, setPercent] = useState(10)

  useEffect(() => {
    // Der Balken zeigt echte Schritte: Start, Spielstand geladen, fertig.
    setPercent(35)
    void init().then(() => setPercent(100))
  }, [init])

  useEffect(() => requestFullscreenOnFirstTap(), [])
  useEffect(() => armAudioOnFirstGesture(), [])

  /*
   * Der Ton kennt den Store nicht (src/core/audio.ts bleibt frei von React).
   * Diese eine Stelle reicht ihm die Schalterstellung durch — beim Laden und
   * bei jeder Änderung in den Einstellungen.
   */
  useEffect(() => {
    applyAudioSettings({ sound, music })
  }, [sound, music])

  /*
   * Der Weg in die Cloud ist entprellt, damit nach einer Runde nicht drei
   * Aufrufe hintereinander gehen. Wer die App vorher schließt, würde den
   * letzten Stoß verlieren — `visibilitychange` schickt ihn sofort los
   * (docs/04-datenmodell.md, „Speicherzeitpunkte").
   */
  useEffect(() => {
    // Eigene Bindung: In der Rückrufschleife weiß TypeScript sonst nicht mehr,
    // dass es der Cloud-Adapter ist.
    const cloud = adapter instanceof CloudSaveAdapter ? adapter : null
    if (!cloud) return
    const flush = () => {
      if (document.visibilityState === 'hidden') void cloud.flush()
    }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [])

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
          <Route path="spiel/sudoku" element={<SudokuGame />} />
          <Route path="spiel/bubbleshooter" element={<BubbleShooterGame />} />
          <Route path="spiel/solitaire" element={<SolitaireGame />} />
          <Route path="spiel/minigolf" element={<MinigolfGame />} />
          <Route path="missionen" element={<Missions />} />
          <Route path="profil" element={<Profile />} />
          <Route path="mehr" element={<More />} />
          <Route path="abenteuer" element={<Adventure />} />
          <Route path="shop" element={<Shop />} />
          <Route path="events" element={<Events />} />
          <Route path="freunde" element={<Friends />} />
          <Route path="rangliste" element={<Ranking />} />
          <Route path="erfolge" element={<Achievements />} />
          <Route path="einstellungen" element={<Settings />} />
          <Route path="*" element={<Placeholder title="Nicht gefunden" phase="—" />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
