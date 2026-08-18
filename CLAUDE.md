# Fynnox Puzzle Worlds

Ein Casual-Game-Universum mit sieben Puzzle-Spielen, die sich ein gemeinsames Profil teilen
(XP, Münzen, Kristalle, Missionen, Abenteuerpfad). Hauptfigur ist der Fuchs **Fynnox**, der auf
jedem Bildschirm auftaucht. Auslieferung als **installierbare PWA** — primär fürs Smartphone
im Hochformat, funktioniert aber auch am Desktop.

Repo: `Marcel-Fe/fynnox-puzzle-worlds` · Live: `https://marcel-fe.github.io/fynnox-puzzle-worlds/`

## Verbindliche Dokumente

Diese Dateien sind die Wahrheit. Details zu Charakteren, Farben, Regeln oder Datenstrukturen
werden **nie aus dem Gedächtnis erfunden**, sondern hier nachgelesen:

| Datei | Inhalt |
|---|---|
| [docs/00-masterprompt.md](docs/00-masterprompt.md) | Ursprüngliche Vision des Auftraggebers, unverändert |
| [docs/01-gamedesign.md](docs/01-gamedesign.md) | Regeln der sieben Spiele + geteilte Systeme (XP, Währungen, Missionen, Events) |
| [docs/02-charakterbibel.md](docs/02-charakterbibel.md) | Fynnox und alle Nebenfiguren: Aussehen, Rolle, Sprechstil |
| [docs/03-art-ui-guide.md](docs/03-art-ui-guide.md) | Farben (aus den Mockups gemessen), Typografie, Layout, Navigation |
| [docs/04-datenmodell.md](docs/04-datenmodell.md) | Typen für Profil/Fortschritt + Speicher-Schnittstelle |
| [docs/05-roadmap.md](docs/05-roadmap.md) | Phasenplan mit Abschlusskriterien |
| [docs/referenzen/](docs/referenzen/) | Elf Konzeptbilder plus zwei Kulissen aus den Nachbarprojekten — visuelle Referenz für alles UI-nahe |

Widerspricht eine Anforderung diesen Dokumenten, wird der Widerspruch benannt und geklärt,
bevor Code entsteht. Wird eine Festlegung geändert, wird das Dokument mitgeändert — nie nur der Code.

## Tech-Stack

Bewusst identisch zu **`fynnox-adventure`**, damit alle Fynnox-Projekte gleich funktionieren:

- **Vite** + **React 19** + **TypeScript** (`strict`)
- **zustand** für den geteilten Zustand (Profil, Währungen, Missionen)
- **vite-plugin-pwa** — macht die App auf dem Smartphone installierbar und offline-fähig
- **TailwindCSS v4** — einzige bewusste Abweichung von `fynnox-adventure`.
  Grund: Dieses Projekt ist UI-lastig (Dashboard, Shop, Missionen, sieben HUDs);
  `fynnox-adventure` ist ein 3D-Spiel mit wenig UI und kommt darum mit reinem CSS aus.
- **three.js / @react-three/fiber / drei** — **ausschließlich** für die 3D-Ansicht von Fynnox
  auf dem Profilbildschirm, und nur über `lazy()` nachgeladen. Gebaut wiegt der 3D-Teil
  rund 1 MB, das Hauptbündel dagegen 274 KB. Nie im Hauptbündel landen lassen.
- **Framer Motion** für UI-Animationen (erst einbauen, wenn tatsächlich animiert wird)
- **Spiellogik** als reines TypeScript + React/DOM bzw. Canvas.
  Eine Engine (PixiJS/Phaser) erst dann, wenn ein konkretes Spiel sie nachweislich braucht.
  Keine Engine „auf Vorrat" — seit Minigolf raus ist, gibt es dafür auch keinen Kandidaten
  mehr, weil kein verbliebenes Spiel eine laufende Simulation hat.
- **Speicher**: startet lokal (localStorage) hinter der Schnittstelle aus dem Datenmodell.
  Supabase kommt später dahinter. Spielcode ruft niemals direkt `localStorage` auf.

**Bewusste Abweichung vom Masterprompt**: Dort steht *Next.js*. Verwendet wird *Vite*,
weil `fynnox-adventure` bereits so gebaut ist und beide Projekte gleich funktionieren sollen.
Für ein Spiel ohne Server bringt Next.js keinen Vorteil — serverseitiges Rendern und
API-Routen werden hier nicht gebraucht, dafür wäre das Deployment auf GitHub Pages umständlicher.
Alles andere aus dem Masterprompt (TypeScript, TailwindCSS, Framer Motion, PWA, Cloud-Save,
Offline-Modus) bleibt unverändert.

## Deployment

Push auf `main` → GitHub Action baut → GitHub Pages. Nichts manuell hochladen.

- `vite.config.ts` setzt `base: '/fynnox-puzzle-worlds/'` — ohne das laden auf Pages keine Assets.
- Der PWA-`cacheId` ist ebenfalls `fynnox-puzzle-worlds`. Er **muss** eindeutig sein,
  weil alle Projekte unter derselben Domain `marcel-fe.github.io` liegen und sich sonst
  gegenseitig den Cache überschreiben.
- Manifest: `display: 'fullscreen'`, `orientation: 'portrait'` (Puzzle-Spiele werden hochkant
  gespielt — anders als `fynnox-adventure`, das `landscape` nutzt).
  `display_override` fällt der Reihe nach auf `standalone` und `minimal-ui` zurück,
  falls ein Gerät kein Vollbild kann. **iOS wertet beides nicht aus** — dort entscheidet
  `apple-mobile-web-app-capable` in `index.html`, und Vollbild gibt es nur über
  „Zum Home-Bildschirm", nicht im Safari-Tab.
- Wegen `viewport-fit=cover` reicht die Seite bis an die Gerätekante. Alles, was oben
  oder unten klebt, braucht `env(safe-area-inset-*)` — sonst liegt es unter Uhr,
  Akkuanzeige oder Gestenbalken.

**Auf dem Handy installieren**: Seite in Safari (iOS) bzw. Chrome (Android) öffnen →
Teilen/Menü → „Zum Home-Bildschirm". Danach startet sie wie eine echte App, ohne Browserleiste.

## Grafik

Die Spielgrafik ist **nicht** nachgebaut, sondern aus den Konzeptbildern geschnitten.
`python scripts/build-art.py` erzeugt alles unter `public/art/` neu.

- Soll ein Ausschnitt anders sitzen: Koordinate **im Skript** ändern, Skript laufen lassen.
  Nie von Hand nachschneiden — sonst ist der Stand nicht reproduzierbar.
- Beim Zuschneiden auf **fremde Beschriftungen** achten: In den Mockups steht überall UI
  mit auf den Bildern (Level-Anzeigen, „NEU"-Fähnchen, Schriftzüge). Landet so etwas in
  einem Ausschnitt, widerspricht es später den echten Werten im Spiel.
- Details und Quellenzuordnung: [docs/03-art-ui-guide.md](docs/03-art-ui-guide.md).

## Konventionen

- **Sprache**: Code, Dateinamen, Variablen, Funktionen, Kommentare → **Englisch**.
  Alles, was ein Spieler liest → **Deutsch**. Spielertexte liegen in `src/content/`,
  nicht im JSX verstreut.
- **Spiel-IDs** (technisch): `blockfall`, `waldbloecke`, `tempelpaare`, `kristallmix`,
  `solitaire`, `sudoku`, `bubbleshooter`. Sie werden nicht umbenannt — ein Spielstand hängt
  daran. Fällt ein Spiel ganz weg, braucht das eine Migration, die seine Spuren aus
  `progress`, `recentGames`, `favoriteGame` und laufenden Missionen entfernt
  (Vorlage: `toV4` in `src/save/adapter.ts`).
- Reine Spiellogik ist **frei von React** — testbar ohne Rendering.
  Ein Spiel besteht aus `logic/` (Regeln, Zustand, Züge) und `components/` (Darstellung).
- Keine Zufallszahlen ohne Seed in der Spiellogik — sonst sind Bugs nicht reproduzierbar.
- **Touch zuerst**: Zielflächen mindestens 44 px, kein Hover als einzige Rückmeldung,
  nichts, was zwingend eine Maus braucht.
- Neue Abhängigkeiten nur, wenn sie ein echtes Problem lösen, das eigener Code teuer machen würde.

## Ordnerstruktur

```
src/
├─ main.tsx, App.tsx     Einstieg + Routing
├─ screens/              Dashboard, Spieleliste, Missionen, Shop, Abenteuerpfad, Profil …
├─ components/           geteilte UI-Bausteine (Karten, Währungsleiste, Navigation)
├─ games/<gameId>/       pro Spiel: logic/ (rein) + components/ (Darstellung)
├─ core/                 Profil, XP-/Währungs-Logik, Missionen, Rundenauswertung
├─ store/                zustand-Stores
├─ save/                 Speicher-Schnittstelle + localStorage-Umsetzung
├─ content/              deutsche Spielertexte, Charakterdialoge, Weltendaten
└─ styles/               Design-Tokens
public/                  PWA-Icons (pwa-192, pwa-512, maskable-512, apple-touch-icon), Grafiken
```

## Arbeitsweise in diesem Projekt

- **Ein Spiel nach dem anderen** vollständig fertigstellen, statt sieben halbe Spiele zu haben.
  Reihenfolge und Abschlusskriterien stehen in der [Roadmap](docs/05-roadmap.md).
- Jedes neue Spiel folgt dem Muster des ersten (Waldblöcke) — kein zweiter Architekturstil.
- Balancing-Zahlen (XP pro Runde, Münzen, Energiekosten) stehen im Gamedesign-Dokument.
  Sind sie dort als *OFFEN* markiert, wird nachgefragt statt geraten.
- Änderungen an Profil-/Speicherstrukturen brauchen eine Migration — alte Spielstände
  dürfen nicht kaputtgehen.
- Vor jedem Push: `npm run build` muss durchlaufen. Ein roter Build auf `main` heißt,
  die Live-Seite bleibt auf dem alten Stand.

## Was das Projekt bewusst (noch) nicht ist

Kein Multiplayer, kein Echtgeld-Kauf, kein Werbe-SDK, keine Accounts.
Shop-Preise auf den Mockups sind Platzhalter, keine implementierte Bezahlung.

**Sieben Spiele, und die Liste ist geschlossen** (bei acht geschlossen am 17.08.2026,
Minigolf am selben Tag wieder entfernt: Seine Bahnen überzeugten in der Darstellung
nicht, und als einziges Spiel mit laufender Physik trug es die Architektur nicht mit —
siehe `lessons.md`). Bewegungs- und
Reaktionsspiele wie Snowboarden oder Skateboarden gehören **nicht** hierher, sondern nach
**Fynnox City** — dem 3D-Projekt der Familie (`../Fynnox City/fynnox-city`, Three.js,
1 Einheit = 1 m). Dort gibt es bereits die passende Geometrie: Bordsteine, Geländer,
Kletterkanten, Parkour-Lücken. Hier wären sie das erste reine Reaktionsspiel und hätten
zudem kein Bildmaterial in den Konzeptbildern.

Wird trotzdem ein neuntes Spiel gewünscht, braucht es **zuerst ein Konzeptbild** —
sonst wäre es das erste Spiel, dessen Grafik erfunden statt geschnitten ist.
