# Fynnox Puzzle Worlds

Ein Casual-Game-Universum mit sechs Puzzle-Spielen, die sich ein gemeinsames Profil teilen
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
| [docs/01-gamedesign.md](docs/01-gamedesign.md) | Regeln der 6 Spiele + geteilte Systeme (XP, Währungen, Missionen, Events) |
| [docs/02-charakterbibel.md](docs/02-charakterbibel.md) | Fynnox und alle Nebenfiguren: Aussehen, Rolle, Sprechstil |
| [docs/03-art-ui-guide.md](docs/03-art-ui-guide.md) | Farben (aus den Mockups gemessen), Typografie, Layout, Navigation |
| [docs/04-datenmodell.md](docs/04-datenmodell.md) | Typen für Profil/Fortschritt + Speicher-Schnittstelle |
| [docs/05-roadmap.md](docs/05-roadmap.md) | Phasenplan mit Abschlusskriterien |
| [docs/referenzen/](docs/referenzen/) | Sechs Konzeptbilder — visuelle Referenz für alles UI-nahe |

Widerspricht eine Anforderung diesen Dokumenten, wird der Widerspruch benannt und geklärt,
bevor Code entsteht. Wird eine Festlegung geändert, wird das Dokument mitgeändert — nie nur der Code.

## Tech-Stack

Bewusst identisch zu **`fynnox-adventure`**, damit alle Fynnox-Projekte gleich funktionieren:

- **Vite** + **React 19** + **TypeScript** (`strict`)
- **zustand** für den geteilten Zustand (Profil, Währungen, Missionen)
- **vite-plugin-pwa** — macht die App auf dem Smartphone installierbar und offline-fähig
- **TailwindCSS v4** — einzige bewusste Abweichung von `fynnox-adventure`.
  Grund: Dieses Projekt ist UI-lastig (Dashboard, Shop, Missionen, sechs HUDs);
  `fynnox-adventure` ist ein 3D-Spiel mit wenig UI und kommt darum mit reinem CSS aus.
- **Framer Motion** für UI-Animationen (erst einbauen, wenn tatsächlich animiert wird)
- **Spiellogik** als reines TypeScript + React/DOM bzw. Canvas.
  Eine Engine (PixiJS/Phaser) erst dann, wenn ein konkretes Spiel sie nachweislich braucht
  — Kandidat ist ausschließlich Minigolf wegen der Ballphysik. Keine Engine „auf Vorrat".
- **Speicher**: startet lokal (localStorage) hinter der Schnittstelle aus dem Datenmodell.
  Supabase kommt später dahinter. Spielcode ruft niemals direkt `localStorage` auf.

## Deployment

Push auf `main` → GitHub Action baut → GitHub Pages. Nichts manuell hochladen.

- `vite.config.ts` setzt `base: '/fynnox-puzzle-worlds/'` — ohne das laden auf Pages keine Assets.
- Der PWA-`cacheId` ist ebenfalls `fynnox-puzzle-worlds`. Er **muss** eindeutig sein,
  weil alle Projekte unter derselben Domain `marcel-fe.github.io` liegen und sich sonst
  gegenseitig den Cache überschreiben.
- Manifest: `display: 'standalone'`, `orientation: 'portrait'` (Puzzle-Spiele werden hochkant
  gespielt — anders als `fynnox-adventure`, das `landscape` nutzt).

**Auf dem Handy installieren**: Seite in Safari (iOS) bzw. Chrome (Android) öffnen →
Teilen/Menü → „Zum Home-Bildschirm". Danach startet sie wie eine echte App, ohne Browserleiste.

## Konventionen

- **Sprache**: Code, Dateinamen, Variablen, Funktionen, Kommentare → **Englisch**.
  Alles, was ein Spieler liest → **Deutsch**. Spielertexte liegen in `src/content/`,
  nicht im JSX verstreut.
- **Spiel-IDs** (technisch, unveränderlich): `blockfall`, `waldbloecke`, `tempelpaare`,
  `kristallmix`, `solitaire`, `minigolf`.
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

- **Ein Spiel nach dem anderen** vollständig fertigstellen, statt sechs halbe Spiele zu haben.
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
