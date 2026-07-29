import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Dashboard } from './screens/Dashboard'
import { Placeholder } from './screens/Placeholder'

/*
 * HashRouter statt BrowserRouter: Auf GitHub Pages gibt es keinen Server, der
 * Unterseiten auf index.html umleitet — ein Neuladen unter /missionen wäre sonst ein 404.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="spiele" element={<Placeholder title="Spiele" phase="Phase 4" />} />
          <Route
            path="abenteuer"
            element={<Placeholder title="Abenteuerpfad" phase="Phase 7" />}
          />
          <Route path="missionen" element={<Placeholder title="Missionen" phase="Phase 7" />} />
          <Route path="shop" element={<Placeholder title="Shop" phase="Phase 7" />} />
          <Route path="freunde" element={<Placeholder title="Freunde" phase="Phase 8" />} />
          <Route path="rangliste" element={<Placeholder title="Rangliste" phase="Phase 8" />} />
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
