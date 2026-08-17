# Phase 7 — Meta-Systeme — Session Prompt für Claude Code
## Kopiere den Prompt unten und füge ihn als erste Nachricht in eine neue Claude-Code-Session ein
---

```
Du arbeitest am Projekt Fynnox Puzzle Worlds (c:\Users\admin\Desktop\Fynnox Strategie Spiele).
Lies ZUERST die CLAUDE.md im Projektwurzelverzeichnis — dort stehen Architektur, Regeln und Arbeitsweise.

## Aufgabe: Phase 7 — Meta-Systeme

### Worum geht es?

Alle acht Spiele sind fertig und spielbar (Phase 6 abgeschlossen, 314 Tests grün). Was fehlt,
ist alles, was die Spiele zusammenhält: Abenteuerpfad, Missionsbildschirm mit drei Reitern,
Erfolge, tägliche Belohnung, Shop und Events. Vier davon sind heute Platzhalter-Bildschirme.

Abschlusskriterium der Roadmap: **Der Abenteuerpfad zeigt echten Fortschritt und Belohnungen
sind abholbar.**

WICHTIG — veralteter Hinweis in der Roadmap: docs/05-roadmap.md schreibt bei Phase 7
„Vorher zu klären: der Widerspruch zwischen elf Welten und einem Pfad bis Level 100".
Dieser Widerspruch ist **längst geklärt** — docs/01-gamedesign.md, Abschnitt „Abenteuerpfad"
(Zeilen ~493–508), hat am 29.07.2026 Entwurf B verbindlich festgelegt: Kapitel zu 15 Leveln,
ein Kapitel je Welt. Korrigiere den Roadmap-Satz, statt die Frage neu aufzumachen.

### Was BEREITS EXISTIERT (rund 55 % — nicht neu bauen!)

Diese Dateien VOR jeder Änderung vollständig lesen:

1. `src/save/types.ts` (117 Zeilen, VOLLSTÄNDIG) — das Datenmodell für Phase 7 steht komplett
   - `Mission` (Zeile ~41) mit `kind: 'daily' | 'weekly' | 'event'` und `expiresAt`
   - `MissionTrack` (Zeile ~32): playRounds, winRounds, collectCoins, collectCrystals,
     reachScore, custom — deckt alle Missionsarten ab
   - `Achievement` (Zeile ~54), `AdventurePath` (Zeile ~63) mit chapter, nodeInChapter,
     stars, claimedChests
   - `SaveData` (Zeile ~89) enthält `lastDailyRewardAt` und `dailyRewardStreak`
   - **Es fehlt kein einziges Feld.** Änderungen hier brauchen SAVE_VERSION + Migration.

2. `src/core/round.ts` (155 Zeilen, VOLLSTÄNDIG, NICHT ÄNDERN) — Rundenauswertung
   - `applyRoundResult` (Zeile ~32): rein, ohne Uhr, ohne Zufall, ohne Speicherzugriff
   - `missionDelta` (Zeile ~126): zählt **alle** Missionsarten bereits hoch, auch
     wöchentliche und Event-Missionen. Sie brauchen nur Inhalte und eine Oberfläche.
   - Erfolge (Zeile ~100): nur drei fest verdrahtete IDs — adventurer, collector, master
   - Von 314 Tests abgesichert, davon `src/core/round.test.ts`

3. `src/store/gameStore.ts` (152 Zeilen) — einziger Zugang zum Spielstand
   - `claimMission` (Zeile ~90): VOLLSTÄNDIG, zahlt Münzen und Kristalle aus
   - `finishRound` (Zeile ~70) setzt Erfolgs-Zeitstempel, weil `applyRoundResult` keine Uhr hat
   - FEHLT: Abholen der Tagesbelohnung, Abenteuerpfad-Aktionen, Kauf im Shop

4. `src/save/defaults.ts` (135 Zeilen, TEILWEISE)
   - `createDailyMissions` (Zeile ~27): nur **drei** Tagesmissionen, keine wöchentlichen,
     keine Event-Missionen
   - Erfolge (Zeile ~88): nur **drei** — das Mockup zeigt 25 / 60
   - `adventure` (Zeile ~114): wird angelegt, aber nirgends gelesen

5. `src/screens/Missions.tsx` (48 Zeilen, TEILWEISE) — zeigt nur „Tägliche Missionen",
   keine Reiter. Der Kommentar oben nennt das selbst als Phase-7-Aufgabe.

6. `src/screens/Profile.tsx` (174 Zeilen) — Erfolge stehen als Karte ab Zeile ~107 drin,
   inklusive Fortschrittsbalken. Die Route `/erfolge` zeigt heute denselben Bildschirm.

7. `src/content/navigation.ts` (31 Zeilen, VOLLSTÄNDIG) — Shop, Abenteuer und Events sind
   in der Navigation bereits verlinkt; nur die Ziele sind Platzhalter.

8. `src/App.tsx` — Platzhalter-Routen für shop, abenteuer, events (Zeilen ~51–57).
   Muster für echte Routen: die acht Spielrouten darüber.

Ebenfalls lesen, weil dort die Regeln stehen:
`docs/01-gamedesign.md` Zeilen ~460–572 (Missionen, Tägliche Belohnung, Abenteuerpfad,
Events, Erfolge, Shop) und `docs/04-datenmodell.md`.

### Was FEHLT (deine Aufgabe — 5 Lücken schließen)

**Lücke 1: Offene Werte festlegen und dokumentieren**
- docs/01-gamedesign.md trägt für Phase 7 fünf OFFEN-Markierungen:
  Missionspool und Reset-Zeitpunkt (~472), Belohnungsleiter der Tagesbelohnung (~477),
  was auf einem Abenteuer-Knoten passiert (~514), Eventkatalog (~529), Erfolgsliste (~546)
- Lege alles DORT fest, bevor Code entsteht — mit Begründung je Entscheidung, so wie es
  bei Kristallmix, Sudoku, Bubble Shooter, Solitaire und Minigolf gemacht wurde
- Die wichtigste Entscheidung ist der Knoten: eine Runde in einem vorgegebenen Spiel mit
  Ziel, oder freie Wahl? Das Gamedesign schiebt sie ausdrücklich auf Phase 7.
- Korrigiere dabei den veralteten Satz in docs/05-roadmap.md (siehe oben)

**Lücke 2: Missionen — drei Reiter, wöchentlich, Event, täglicher Reset**
- Einstieg: `src/screens/Missions.tsx` (ganze Datei) und `createDailyMissions`
  in `src/save/defaults.ts` Zeile ~27
- `missionDelta` zählt bereits alles hoch — es fehlen Inhalte, der Ablauf und die Reiter
- Ablaufende Missionen brauchen eine Uhr. `core/round.ts` ist bewusst uhrenfrei; der
  Reset gehört darum in den Store oder in ein eigenes reines Modul, dem die Zeit
  hereingegeben wird (Muster: `src/core/energy.ts`, `refillEnergy(profile, now)`)

**Lücke 3: Tägliche Belohnung**
- `lastDailyRewardAt` und `dailyRewardStreak` stehen im Spielstand, werden aber nirgends
  gelesen oder geschrieben — kein Code greift darauf zu
- Neu: reines Modul `src/core/dailyReward.ts` (Uhr von außen), Store-Aktion, Anzeige
- Das Dashboard-Mockup zeigt die Truhe mit Countdown und Knopf „Abholen"
- Offen und in Lücke 1 zu klären: Verhalten bei Aussetzern — Serie zurücksetzen oder halten

**Lücke 4: Abenteuerpfad**
- `AdventurePath` in `src/save/types.ts` Zeile ~63 existiert und wird nie benutzt
- Neu: reine Logik `src/core/adventure.ts` (Kapitel, Knoten, Sterne, Truhen) und ein
  Bildschirm unter `src/screens/`, Route statt Platzhalter in `src/App.tsx`
- Entwurf B ist verbindlich: Kapitel mit eigenem Fortschrittsbalken (Mockup: 8/15),
  nummerierte Knoten auf einem senkrechten Pfad, je Knoten 1 bis 3 Sterne, der nächste
  hervorgehoben, spätere gesperrt, am Kapitelende eine Truhe
- Kulissen liegen bereits unter `public/art/bg/` — je Kapitel eine Welt

**Lücke 5: Shop und Events**
- Beides heute `<Placeholder>` in `src/App.tsx`
- Shop: Reiter Empfohlen · Outfits · Helfer · Booster, Waren und Preise stehen im
  Gamedesign ~553–572. **Nur Kristallpreise umsetzen** — Euro-Preise sind Platzhalter,
  es gibt keine Bezahlung. Gekauftes muss im Spielstand landen, sonst ist der Kauf wirkungslos.
- Events: drei Gruppen (laufendes Hauptevent, aktive Events, kommende Events),
  Gamedesign ~518–529

### Rahmenbedingungen

- `src/core/round.ts` bleibt **rein**: keine Uhr, kein Zufall, kein Speicherzugriff.
  Alles Zeitabhängige bekommt die Zeit von außen hereingereicht (Muster: `src/core/energy.ts`)
- Änderungen an `src/save/types.ts` brauchen `SAVE_VERSION` +1 in `src/save/defaults.ts`
  UND eine Migration in `migrate()` in `src/save/adapter.ts` Zeile ~71.
  Alte Spielstände dürfen nicht kaputtgehen. Das Datenmodell reicht aber bereits —
  prüfe zweimal, ob eine Änderung wirklich nötig ist.
- Spielcode ruft **niemals** direkt `localStorage` auf, immer über den Store
- Kein Zufall ohne Seed
- Alles, was ein Spieler liest, ist Deutsch und liegt in `src/content/`, nicht im JSX
- Zielflächen mindestens 44 px, kein Hover als einzige Rückmeldung
- Grafik wird NICHT als CSS nachgebaut. Neue Ausschnitte kommen ins Skript
  `scripts/build-art.py` und werden von dort erzeugt — nie von Hand geschnitten
- Design-Tokens, deren Namen zur Laufzeit zusammengesetzt werden, gehören NICHT in den
  `@theme`-Block in `src/index.css`: Tailwind v4 entfernt sie dort. Sie kommen in den
  normalen `:root`-Block darunter
- Vor jedem Push muss `npm run build` durchlaufen (enthält die Typprüfung;
  `vite build` allein reicht NICHT und hat schon einmal den Live-Build gebrochen)

### Arbeitsweise

1. Alle oben gelisteten Dateien VOLLSTÄNDIG lesen, bevor du planst
2. Die fünf Lücken als getrennte, unabhängige Schritte planen
3. Eine Lücke nach der anderen umsetzen, jede mit:
   - Codeänderung
   - `npx tsc -b` als Typprüfung
4. Nach allen Lücken: `npm test` und `npm run build` als Rückfallnetz
5. Ein Commit je Lücke mit aussagekräftiger Nachricht auf Deutsch
6. Zum Schluss docs/05-roadmap.md und README.md nachziehen

Hinweis zu Git: Im Repo ist **keine** Identität konfiguriert. Commits brauchen
`git -c user.name="Marcel-Fe" -c user.email="marcelfehse22@gmx.de" commit -F <datei>`.
Nachrichten mit Umlauten immer über `-F <datei>` — ein gepipter Here-String wird in
PowerShell 5.1 als Pathspec gelesen und schlägt fehl.

### Überprüfung

- `npx tsc -b`
- `npm test`
- `npm run build`
- `npx vite preview --port 4193 --strictPort` und mit Playwright bei 390x844 prüfen:
  Missionsreiter wechseln, Belohnung abholen, Tagesbelohnung abholen, Abenteuerpfad
  öffnen und einen Knoten starten, im Shop mit Kristallen kaufen
- `grep -c "Placeholder" src/App.tsx` muss kleiner sein als vorher (heute 8 Treffer:
  ein Import, sechs Routen, ein Auffangfall). Shop, Abenteuer und Events müssen weg sein;
  Freunde, Rangliste und Einstellungen bleiben Platzhalter bis Phase 8.
- `node -e "const s=require('fs').readFileSync('src/save/defaults.ts','utf8'); console.log('Missionen:', (s.match(/kind: '/g)||[]).length)"`
  — mehr als 3, und darunter mindestens eine wöchentliche

### Was du NICHT tun darfst

- `src/core/round.ts` NICHT um Uhr, Zufall oder Speicherzugriff erweitern — die Reinheit
  ist der Grund, warum die Rundenauswertung ohne Browser testbar ist
- Die acht fertigen Spiele unter `src/games/` NICHT anfassen
- `src/save/types.ts` NICHT ohne SAVE_VERSION-Erhöhung und Migration ändern
- KEINE Bezahlung, kein Werbe-SDK, keine Accounts, kein Multiplayer — Euro-Preise im
  Shop bleiben Anzeige ohne Funktion
- KEINE neuen Abhängigkeiten ohne echten Grund. Framer Motion liegt bereit, falls
  tatsächlich animiert wird — sonst nicht einbauen
- Grafik NICHT als CSS nachbauen und NICHT von Hand zuschneiden
- Balancing-Zahlen NICHT raten: Was in docs/01-gamedesign.md als OFFEN steht, wird dort
  zuerst mit Begründung festgelegt (Lücke 1)
- Den veralteten Roadmap-Satz zum „Widerspruch elf Welten / Level 100" NICHT als offene
  Frage behandeln — er ist im Gamedesign bereits entschieden und nur nachzuziehen
- Bei Playwright-Tests den Service Worker abschalten
  (`browser.new_context(..., service_workers="block")`) — sonst läuft der Test gegen
  den alten Stand
```
