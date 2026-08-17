# Phase 8 — Cloud und Feinschliff · Session-Prompt für Claude Code
## Prompt unten kopieren und als erste Nachricht in eine neue Claude-Code-Session einfügen
---

```
Du arbeitest am Projekt Fynnox Puzzle Worlds (c:\Users\admin\Desktop\Fynnox Strategie Spiele).
Lies ZUERST die CLAUDE.md im Projektwurzelverzeichnis — dort stehen Architektur, Regeln und Arbeitsweise.

## Aufgabe: Phase 8 — Cloud und Feinschliff

### Worum geht es?

Phase 7 ist abgeschlossen: Missionen, Tagesbelohnung, Abenteuerpfad (neun Kapitel), Shop,
Events und 24 Erfolge laufen, 399 Tests sind grün. Von acht Platzhalter-Bildschirmen sind
nur noch **zwei** übrig: Freunde und Rangliste. Was fehlt, ist alles, was einen Server
oder Ton braucht — plus der Feinschliff.

Abschlusskriterium der Roadmap: **Derselbe Spielstand erscheint auf Handy und Desktop.**

Die Einstellungen wurden am 17.08.2026 aus dieser Phase **vorgezogen** und sind fertig
(`src/screens/Settings.tsx`). Vier Schalter dort tragen die sichtbare Marke „später" —
Gap 1 macht zwei davon wahr.

### Was BEREITS EXISTIERT (nicht neu bauen!)

Diese Dateien VOR jeder Änderung vollständig lesen:

1. `src/save/adapter.ts` (88 Zeilen, VOLLSTÄNDIG für lokal)
   - `SaveAdapter` (Zeile ~11): `load` / `save` / `clear`, alle `async` — genau damit der
     Wechsel auf Supabase **keine einzige Aufrufstelle** im Projekt anfasst
   - `LocalSaveAdapter` (Zeile ~24), `migrate` (Zeile ~75), `toV2` (Zeile ~86)
   - Aktuelle `SAVE_VERSION` ist **2** (`src/save/defaults.ts` Zeile ~5)

2. `src/store/gameStore.ts` (235 Zeilen) — einziger Zugang zum Spielstand
   - `const adapter: SaveAdapter = new LocalSaveAdapter()` (Zeile ~48) — die **eine** Stelle,
     die für die Cloud getauscht werden muss
   - `persist` (Zeile ~51), `withAchievements` (Zeile ~62), `init` (Zeile ~71)
   - Aktionen: `refreshTimed`, `spendEnergy`, `finishRound`, `claimMission`,
     `claimDailyReward`, `claimChest`, `buyItem`, `renameProfile`, `updateSettings`, `resetSave`

3. `src/content/settings.ts` (69 Zeilen, VOLLSTÄNDIG) — `SettingRow.effective` (Zeile ~14)
   sagt, ob ein Schalter heute schon wirkt. `music` und `sound` stehen auf `false`.
   `vibration` steht auf `true` und wirkt bereits.

4. `src/screens/Settings.tsx` (200 Zeilen, FERTIG — nur `effective` umstellen)
   - `buzz()` (Zeile ~118): Muster, wie eine Gerätefähigkeit sauber geprüft wird

5. `src/screens/Placeholder.tsx` (19 Zeilen) und `src/App.tsx`
   - Nur noch zwei echte Platzhalter-Routen: `freunde`, `rangliste`
   - Muster für echte Routen: die Zeilen darüber (Shop, Events, Abenteuer, Erfolge)

6. `src/content/assets.ts` — `PORTRAITS` (Zeile ~19) mit zehn Begleitfiguren
   (Fynnox, Lumo, Mira, Borin, Pip, Elda, Juno, Kori, Finn, Bree). Das ist das
   Bildmaterial für Freunde und Rangliste.

7. `vite.config.ts` — PWA-Konfiguration.
   `globPatterns` enthält bereits `mp3`, `maximumFileSizeToCacheInBytes` steht auf 8 MB.
   **Achtung**: Eine Musikdatei landet damit automatisch im Vorab-Cache.

8. `src/core/time.ts`, `src/core/energy.ts` — Muster für reine Module mit Uhr von außen.

**Vorlage im Nachbarprojekt** (`../Fynnox Adventure APP/fynnox-adventure/`, gleicher Stack):
- `src/audio/sfx.ts` — Klänge **prozedural über WebAudio**, keine Dateien, keine Lizenzfrage,
  sofort offline. AudioContext entsteht erst beim ersten Klang nach einer Nutzergeste.
- `src/audio/music.ts` — geloopte `HTMLAudioElement`, Start bei der ersten Geste
- `public/audio/musik.mp3` — 4,1 MB, lizenzfrei (phatphrogstudio, royalty-free)

Ebenfalls lesen, weil dort die Regeln stehen:
`docs/01-gamedesign.md` Zeilen ~725–733 (Ranglisten und Freunde) und `docs/04-datenmodell.md`
(Abschnitte „Speicher-Schnittstelle" und „Migration").

### Was FEHLT (deine Aufgabe — 5 Lücken)

**Lücke 1: Ton und Musik**
- Einstieg: `src/content/settings.ts` Zeile ~17 (`effective: false` bei `music` und `sound`)
- Neu: `src/core/audio.ts` — Klänge prozedural über WebAudio, nach dem Muster von
  `fynnox-adventure/src/audio/sfx.ts`. Keine Audiodateien für Effekte: keine fremden
  Samples, keine Megabyte im PWA-Cache, sofort offline
- Der AudioContext darf erst **nach einer Nutzergeste** entstehen (Autoplay-Sperre).
  In `src/core/fullscreen.ts` gibt es mit `requestFullscreenOnFirstTap` bereits ein Muster
- Angeschlossen wird an der **Oberfläche**, nicht im Store: `components/RoundResult.tsx`
  (Sieg/Niederlage), `components/DailyRewardCard.tsx`, `screens/Missions.tsx`,
  `screens/Adventure.tsx` (Truhe), `screens/Shop.tsx` (Kauf)
- Der Ton muss `save.settings.sound` bzw. `.music` lesen und stumm bleiben, wenn aus
- **Zuerst zu entscheiden und in docs/01-gamedesign.md festzulegen**: ob die 4,1-MB-Musik
  überhaupt mitkommt. Sie vergrößert die Installation um rund 80 % (heute 5,0 MB), und
  `globPatterns` zieht sie automatisch in den Vorab-Cache. Optionen: weglassen, per
  `globIgnores` aus dem Cache nehmen und nachladen, oder kürzen

**Lücke 2: Freunde und Rangliste — die letzten zwei Platzhalter**
- `docs/01-gamedesign.md` Zeile ~732 markiert das noch als **OFFEN**: „Wie ohne Backend?
  Bis zur Cloud-Phase sind Freunde und Ranglisten Platzhalter mit den Spielfiguren als Gegner"
- Diese Festlegung DORT treffen, bevor Code entsteht — mit Begründung, wie bei allen
  bisherigen OFFEN-Punkten
- Freunde: Reiter Freunde · Anfragen · Bestenliste, gruppiert nach Online und Alle
- Rangliste: eigene Platzierung aus echten Werten (`stats`, `profile.level`), Gegner aus
  den zehn Begleitfiguren mit **gesäten** Werten — kein ungesäter Zufall
- Ehrlich beschriften: Diese Gegner sind Spielfiguren, keine echten Menschen

**Lücke 3: Cloud-Save über Supabase**
- Neu: `SupabaseSaveAdapter` in `src/save/` mit derselben Schnittstelle, getauscht wird
  ausschließlich `src/store/gameStore.ts` Zeile ~48
- **Riskanteste offene Frage, zuerst klären statt raten**: Woran hängt ein Spielstand?
  CLAUDE.md sagt „keine Accounts". Ohne Identität gibt es aber kein „derselbe Spielstand
  auf Handy und Desktop". Vorschlag zur Entscheidung vorlegen (anonyme Geräte-ID plus
  Kopplungscode gegenüber echtem Login) und erst danach bauen
- Zusammenführen zweier Stände braucht eine Regel (neuerer gewinnt? höheres Level?) —
  ebenfalls vorher festlegen
- Zugangsdaten gehören in `.env` und **nie** ins Repo

**Lücke 4: Offline-Verhalten prüfen**
- Bisher nie gemessen. Die App ist als PWA gebaut, aber niemand hat sie offline gestartet
- Prüfen: Startet sie ohne Netz? Fehlen Kulissen? Läuft eine Runde durch? Bleibt der
  Spielstand erhalten? Was passiert beim Wiederverbinden?
- Playwright kann das mit `context.set_offline(True)`
- Ergebnis in `docs/05-roadmap.md` festhalten, Fehler beheben

**Lücke 5: Feinschliff der Animationen**
- CLAUDE.md nennt Framer Motion im Stack, aber es ist **nicht installiert** — bewusst:
  „erst einbauen, wenn tatsächlich animiert wird"
- Erst entscheiden, was animiert werden soll (Kandidaten: Kartenzug bei Solitaire,
  Truhe im Abenteuerpfad, Zahlenanstieg im Ergebnisbildschirm), dann entscheiden, ob es
  CSS-Übergänge auch tun. Eine Abhängigkeit nur, wenn eigener Code teuer würde
- `settings.powerSaving` (heute `effective: false`) muss dann greifen

### Rahmenbedingungen

- `src/core/round.ts` bleibt **rein**: keine Uhr, kein Zufall, kein Speicherzugriff
- Jede Änderung an `src/save/types.ts` braucht `SAVE_VERSION` 2 → 3 in `src/save/defaults.ts`
  UND eine Migration in `migrate()` in `src/save/adapter.ts` Zeile ~75. `toV2` (Zeile ~86)
  ist die Vorlage. Alte Spielstände dürfen nicht kaputtgehen
- Spielcode ruft **niemals** direkt `localStorage` auf — nur `src/save/` darf das
- Kein Zufall ohne Seed
- Alles, was ein Spieler liest, ist Deutsch und liegt in `src/content/`, nicht im JSX
- Zielflächen mindestens 44 px, kein Hover als einzige Rückmeldung
- Design-Tokens, deren Namen zur Laufzeit zusammengesetzt werden, gehören NICHT in den
  `@theme`-Block in `src/index.css` — Tailwind v4 entfernt sie dort. Sie kommen in den
  normalen `:root`-Block darunter
- Grafik wird NICHT als CSS nachgebaut. Neue Ausschnitte kommen ins Skript
  `scripts/build-art.py`. Fremdes Bildmaterial wird vorher nach `docs/referenzen/`
  kopiert — ein Pfad in ein Nachbarprojekt ist nicht reproduzierbar
- Der PWA-`cacheId` muss `fynnox-puzzle-worlds` bleiben: Alle Fynnox-Apps liegen unter
  derselben Domain und würden sich sonst den Cache überschreiben
- Vor jedem Push muss `npm run build` durchlaufen (enthält `tsc -b`; `vite build` allein
  reicht NICHT und hat schon einmal den Live-Build gebrochen)

### Arbeitsweise

1. Alle oben gelisteten Dateien VOLLSTÄNDIG lesen, bevor du planst
2. Die Lücken als getrennte, unabhängige Schritte planen
3. Offene Festlegungen (Musikgröße, Freunde-ohne-Backend, Identität für die Cloud)
   ZUERST in `docs/01-gamedesign.md` bzw. `docs/04-datenmodell.md` entscheiden und
   begründen — so wie es bei Kristallmix, Sudoku, Solitaire, Minigolf und Phase 7 gemacht wurde
4. Eine Lücke nach der anderen umsetzen, jede mit Codeänderung und `npx tsc -b`
5. Nach allen Lücken: `npm test` und `npm run build` als Rückfallnetz
6. Ein Commit je Lücke mit aussagekräftiger Nachricht auf Deutsch
7. Zum Schluss `docs/05-roadmap.md` und `README.md` nachziehen

Hinweis zu Git: Im Repo ist **keine** Identität konfiguriert. Commits brauchen
`git -c user.name="Marcel-Fe" -c user.email="marcelfehse22@gmx.de" commit -F <datei>`.
Nachrichten mit Umlauten immer über `-F <datei>` — ein gepipter Here-String wird in
PowerShell 5.1 als Pathspec gelesen und schlägt fehl.

Hinweis zu Python: Skripte, die deutschen Text oder Emoji ausgeben, brauchen
`PYTHONIOENCODING=utf-8` — sonst brechen sie mit `UnicodeEncodeError` ab.

Hinweis zu PowerShell: `nativer-befehl 2>&1 | Select-Object -First N` läuft in den
Timeout. `Select-String` benutzen.

### Überprüfung

- `npx tsc -b`
- `npm test`
- `npm run build`
- `npx vite preview --port 4193 --strictPort` und mit Playwright bei 390x844 prüfen:
  Ton hörbar bzw. `AudioContext` erzeugt, Schalter „Soundeffekte" schaltet ihn stumm,
  Freunde und Rangliste zeigen Inhalte, Offline-Start funktioniert
- `grep -c "Placeholder" src/App.tsx` muss kleiner sein als vorher (heute 4 Treffer:
  ein Import, zwei Routen, ein Auffangfall). Freunde und Rangliste müssen weg
- `node -e "const s=require('fs').readFileSync('src/content/settings.ts','utf8'); console.log('effective true:', (s.match(/effective: true/g)||[]).length)"`
  — mehr als 1, sobald der Ton wirkt
- `du -sh dist` vor und nach der Musikentscheidung vergleichen (heute 5,0 MB)
- Bei Playwright-Tests den Service Worker abschalten
  (`browser.new_context(..., service_workers="block")`) — außer im Offline-Test, der ihn
  gerade braucht

### Was du NICHT tun darfst

- `src/core/round.ts` NICHT um Uhr, Zufall oder Speicherzugriff erweitern — die Reinheit
  ist der Grund, warum die Rundenauswertung ohne Browser testbar ist
- Die acht fertigen Spiele unter `src/games/` NICHT umbauen. Zuletzt geändert und
  bewusst so: Solitaire legt bei einem Tipp auf den Ablagestapel ab und kann den
  Dreierzug in jedem Level, Blockfall startet mit 1.200 ms je Reihe
- Die Phase-7-Systeme NICHT anfassen (Missionen, Tagesbelohnung, Abenteuerpfad mit neun
  Kapiteln, Shop, Events, Erfolge, Einstellungen) — sie sind fertig und im Browser belegt
- `src/save/types.ts` NICHT ohne SAVE_VERSION-Erhöhung und Migration ändern
- KEINE Zugangsdaten, Schlüssel oder Tokens ins Repo
- KEINE Bezahlung, kein Werbe-SDK — Euro-Preise im Shop bleiben Anzeige ohne Funktion
- KEINE neue Abhängigkeit ohne echten Grund. Framer Motion erst, wenn tatsächlich
  animiert wird; Klänge brauchen keine Bibliothek
- Die Identitätsfrage für die Cloud NICHT im Alleingang entscheiden — CLAUDE.md sagt
  „keine Accounts", das Abschlusskriterium verlangt geräteübergreifende Spielstände.
  Der Widerspruch wird benannt und geklärt, bevor Code entsteht
- Grafik NICHT als CSS nachbauen und NICHT von Hand zuschneiden
- Balancing-Zahlen NICHT raten: Was in docs/01-gamedesign.md als OFFEN steht, wird dort
  zuerst mit Begründung festgelegt
```
