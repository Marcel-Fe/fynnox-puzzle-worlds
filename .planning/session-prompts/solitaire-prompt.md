# Fynnox Solitaire — Session-Prompt für Claude Code
## Prompt unten kopieren und als erste Nachricht in einer neuen Claude-Code-Sitzung einfügen
---

```
Du arbeitest am Projekt Fynnox Puzzle Worlds (c:\Users\admin\Desktop\Fynnox Strategie Spiele).
Lies ZUERST die CLAUDE.md im Projektwurzelverzeichnis — dort stehen Architektur, Regeln und Arbeitsweise.

## Aufgabe: Fynnox Solitaire bauen (Spiel 7 von 8)

### Worum geht es?

Klondike-Solitaire ist das siebte von acht Spielen. Sechs sind fertig (Waldblöcke,
Blockfall, Tempelpaare, Kristallmix, Sudoku, Bubble Shooter), danach fehlt nur noch
Minigolf. Ziel: 52 Karten auf vier Ablagestapel sortieren, aufsteigend nach Farbe von
Ass bis König. Die Regeln stehen in docs/01-gamedesign.md, Abschnitt „5. Fynnox Solitaire".

Solitaire hat die umfangreichsten Regeln aller acht Spiele, aber weder Physik noch
Zeittakt — der Aufwand steckt in der Zuglogik, nicht in der Darstellung.

### Was BEREITS EXISTIERT (rund 70 % — nicht neu bauen!)

Diese Dateien VOR jeder Änderung vollständig lesen:

1. `src/games/tempelpaare/logic/game.ts` (331 Zeilen, VOLLSTÄNDIG) — bestes Vorbild,
   weil es ebenfalls Zeit, Hilfen und garantierte Lösbarkeit hat
   - `createGame` (Zeile ~178): Aufbau aus Seed, gibt GameState zurück
   - `tapTile` (Zeile ~213): ein Zug, gibt `{state, outcome}` zurück
   - `useHint` (Zeile ~266), `shuffle` (Zeile ~287): Hilfen
   - `starsFor` (Zeile ~319), `finalScore` (Zeile ~327): Wertung
2. `src/games/tempelpaare/logic/game.test.ts` (318 Zeilen) — Testmuster, deutsche
   Testnamen, Hilfsfunktionen zum Bauen gezielter Zustände
3. `src/games/tempelpaare/components/TempelpaareGame.tsx` (293 Zeilen) — UI-Muster:
   Startbildschirm mit Kulisse und Sprechblase, HUD-Karte, Spielfeld, Hilfen-Knöpfe
4. `src/core/round.ts` (155 Zeilen, VOLLSTÄNDIG) — Rundenauswertung, NICHT ändern
   - `applyRoundResult` (Zeile ~32): verrechnet das Ergebnis mit dem Spielstand
   - Bestzeit wird bei Sieg gesetzt (Zeile ~48) — Solitaire nutzt `bestLabel: 'Bestzeit'`
   - `counters` (Zeile ~141): eigene Zähler für Missionen, z. B. `{ moves, undos }`
5. `src/store/gameStore.ts` (150 Zeilen, VOLLSTÄNDIG) — NICHT ändern
   - `spendEnergy()` (Zeile ~51): eine Runde kostet 1 Energie, false = keine übrig
   - `finishRound(result)` (Zeile ~70): Rundenergebnis melden
   - `clearRewards()` (Zeile ~115): vor jedem Neustart aufrufen
6. `src/components/RoundResult.tsx` (102 Zeilen, VOLLSTÄNDIG) — Ergebnisbildschirm
   für alle Spiele; Signatur ab Zeile ~10:
   `{won, title, stars, facts, rewards, accent, onAgain, onLeave, againDisabled}`
7. `src/components/Avatar.tsx` (55 Zeilen) — `SpeechBubble` für die Begleitfigur
   (bei Solitaire: Fynnox selbst)
8. `src/content/games.ts` (164 Zeilen) — Solitaire-Eintrag steht ab Zeile ~104 bereit:
   Titel, Farbe, Kachelbild, Kulisse. Nur `available` steht noch auf `false` (Zeile ~115)

### Was FEHLT (deine Aufgabe — 4 Lücken schließen)

**Lücke 1: Offene Regeln festlegen und dokumentieren**
- In docs/01-gamedesign.md steht bei Solitaire noch „OFFEN: Punktesystem, ob eine oder
  drei Karten gezogen werden, Anzahl der Hilfen"
- Einstieg: docs/01-gamedesign.md, Abschnitt „### 5. Fynnox Solitaire"
- Lege fest und trage es DORT ein, bevor Code entsteht — mit Begründung je Entscheidung,
  so wie es bei Kristallmix, Sudoku und Bubble Shooter gemacht wurde. Empfehlung:
  eine Karte ziehen (auf dem Handy freundlicher), unbegrenztes Nachziehen,
  3 Hinweise, unbegrenztes Rückgängig, Punkte nach Ablagestapel-Fortschritt und Tempo.

**Lücke 2: Spiellogik ohne React**
- Es gibt noch keinen Ordner `src/games/solitaire/`
- Neu: `src/games/solitaire/logic/cards.ts` (Blatt, Farben, Mischen mit Seed) und
  `logic/game.ts` (Zustand, Züge, Regelprüfung, Hilfen, Sieg)
- Zu beachten: sieben Spalten mit 1 bis 7 Karten, davon je die oberste offen;
  Ablegen absteigend mit wechselnder Kartenfarbe; Ablagestapel aufsteigend je Farbe;
  ein König darf auf eine leere Spalte; ganze Kartenfolgen dürfen zusammen bewegt werden.
  Mulberry32-Seed wie in den anderen Spielen, damit Partien reproduzierbar sind.

**Lücke 3: Tests**
- Neu: `src/games/solitaire/logic/game.test.ts`
- Mindestens: Blatt hat 52 verschiedene Karten; gleicher Seed ergibt gleiche Partie;
  erlaubte und verbotene Züge (Farbe, Reihenfolge, König auf leere Spalte);
  Folgen bewegen; Ablagestapel nur aufsteigend; Sieg bei 52 abgelegten Karten;
  Rückgängig stellt den vorigen Zustand her; Hinweis nennt einen gültigen Zug.

**Lücke 4: Oberfläche und Verdrahtung**
- Neu: `src/games/solitaire/components/SolitaireGame.tsx`
- Route in `src/App.tsx` ergänzen (Muster: Zeilen ~42–47), Import oben dazu
- In `src/content/games.ts` Zeile ~115 `available: false` auf `true` setzen
- Bedienung: Karte antippen, dann Ziel antippen — kein Ziehen. Alle Zielflächen
  mindestens 44 px. Auf einem 390 px breiten Bildschirm müssen sieben Spalten
  nebeneinander passen; überlappende Karten mit kleinem Versatz stapeln.

### Rahmenbedingungen

- Reine Spiellogik ist FREI von React und kennt KEINE Uhr — verstrichene Zeit wird
  von außen hereingegeben (siehe Tempelpaare)
- Kein Zufall ohne Seed in der Spiellogik
- Spiel-IDs sind unveränderlich: die ID lautet `solitaire`
- Alles, was ein Spieler liest, ist Deutsch; Code, Dateinamen und Funktionen Englisch
- Grafik wird NICHT als CSS nachgebaut. Kulisse und Kachelbild liegen bereits unter
  `public/art/` und stehen im games.ts-Eintrag
- Kommentare nur, wo das WARUM nicht offensichtlich ist — dann aber mit Begründung
- Vor jedem Push muss `npm run build` durchlaufen (enthält die Typprüfung;
  `vite build` allein reicht NICHT und hat schon einmal den Live-Build gebrochen)

### Arbeitsweise

1. Alle oben gelisteten Dateien VOLLSTÄNDIG lesen, bevor du planst
2. Die vier Lücken als getrennte, unabhängige Schritte planen
3. Eine Lücke nach der anderen umsetzen, jede mit:
   - Codeänderung
   - `npx tsc -b` als Typprüfung
4. Nach allen Lücken: `npm test` und `npm run build` als Rückfallnetz
5. Ein Commit je Lücke mit aussagekräftiger Nachricht auf Deutsch;
   Commit-Nachrichten mit Sonderzeichen über `git commit -F datei` schreiben,
   nicht über die Befehlszeile
6. Zum Schluss docs/05-roadmap.md und README.md nachziehen (Muster: die sechs
   fertigen Spiele in Phase 6)

### Überprüfung

- `npx tsc -b`
- `npm test`
- `npm run build`
- `npx vite preview --port 4193 --strictPort` und mit Playwright bei 390x844 prüfen:
  Runde starten, mehrere Karten bewegen, Rückgängig, Hinweis
- `grep -c "available: true" src/content/games.ts` muss 7 ergeben

### Was du NICHT tun darfst

- `src/core/round.ts`, `src/store/gameStore.ts`, `src/save/` NICHT ändern — die
  Rundenauswertung ist fertig und von sechs Spielen erprobt
- Die sechs fertigen Spiele unter `src/games/` NICHT anfassen
- KEINE neuen Abhängigkeiten hinzufügen — Solitaire braucht weder Engine noch
  Animationsbibliothek
- Design-Tokens, deren Namen zur Laufzeit zusammengesetzt werden, NICHT in den
  `@theme`-Block in `src/index.css` schreiben: Tailwind v4 entfernt sie dort.
  Solche Tokens gehören in den normalen `:root`-Block darunter
- Bei Playwright-Tests den Service Worker abschalten
  (`browser.new_context(..., service_workers="block")`) — sonst läuft der Test
  gegen den alten Stand
- Bei Zieh-Gesten auf Flächen, die sich neu zeichnen: siehe lessons.md, Eintrag
  „Ziehen auf Flächen, die sich neu zeichnen". Bei Solitaire lässt sich das
  vermeiden, indem antippen statt ziehen bedient wird
- Balancing-Zahlen NICHT raten: Was in docs/01-gamedesign.md als OFFEN steht, wird
  dort zuerst mit Begründung festgelegt (Lücke 1)
```

**Gespeichert unter**: `.planning/session-prompts/solitaire-prompt.md`
