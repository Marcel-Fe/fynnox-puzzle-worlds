# Phase 9 — Wirkung und Vollständigkeit — Session-Prompt für Claude Code
## Kopiere den Prompt unten und füge ihn als erste Nachricht in eine neue Claude-Code-Sitzung ein
---

```
Du arbeitest am Projekt Fynnox Puzzle Worlds (c:\Users\admin\Desktop\Fynnox Strategie Spiele).
Lies ZUERST die CLAUDE.md im Projektwurzelverzeichnis — dort stehen Architektur, Regeln und Arbeitsweise.

## Aufgabe: Phase 9 — was gebaut ist, soll auch wirken

### Worum geht es?

Die Oberfläche ist seit dem 18.08.2026 fertig: Jeder Bildschirm trägt Bildmaterial aus den
Konzeptbildern, alle sechs Einblendungen des Gamedesigns sind gebaut, jede Ware im Shop hat
ein Bild. Was fehlt, ist **Wirkung**: Gekauftes liegt in der Sammlung und tut nichts, zwei
frische Bausteine hängen an je einem einzigen Spiel, und der Cloud-Speicher ist nie gegen
ein echtes Supabase-Projekt gelaufen.

Vier Lücken, absichtlich in dieser Reihenfolge — Lücke 4 setzt Lücke 1 voraus.

### Was BEREITS EXISTIERT (nicht neu bauen!)

Diese Dateien VOR jeder Änderung vollständig lesen:

1. `src/core/shop.ts` (44 Zeilen, VOLLSTÄNDIG für den Kauf, KEINE Wirkung)
   - `owns(save, id)` (Zeile ~13): liest `save.ownedItems`
   - `refusalFor` (~18), `canBuy` (~27), `buyItem` (~35): Kristalle abziehen, ID anhängen
   - Rein: keine Uhr, kein Zufall, kein Speicherzugriff. Das bleibt so.

2. `src/content/shop.ts` (210 Zeilen, VOLLSTÄNDIG) — `ShopItem` (~13) mit `category`,
   `crystals`, `euro`, `icon`, `image`. `SHOP_ITEMS` (~44) listet 4 Outfits, 4 Helfer,
   4 Booster, 3 Euro-Waren. `SHOP_NOTE` (~197) sagt dem Spieler bis heute:
   „Wie es im Spiel wirkt, kommt später dazu." Genau das ist Lücke 1.

3. `src/core/round.ts` (155 Zeilen, VOLLSTÄNDIG) — `applyRoundResult(save, result)` (~32)
   ist die EINE Stelle, an der eine Runde verrechnet wird: Fortschritt, Statistik, XP,
   Münzen, Kristalle, Missionen. `RoundRewards` (~11) ist ihr Rückgabewert.
   Rein und ohne Browser testbar — diese Eigenschaft ist die Grundlage von 392 Tests.

4. `src/components/PauseOverlay.tsx` (36 Zeilen, VOLLSTÄNDIG, nur 1 von 7 Spielen)
   - `PauseOverlay({ onResume })`: Schicht mit dem Bild `moments/pause.jpg`
   - Eingebunden NUR in `src/games/blockfall/components/BlockfallGame.tsx` (~290)

5. `src/components/RoundResult.tsx` (209 Zeilen, VOLLSTÄNDIG, `unlockedLevel` nur 1 Spiel)
   - `RoundResultOverlay` (~14): Ergebnisbildschirm aller sieben Spiele
   - `unlockedLevel?: number` (~40): zeigt die Einblendung `NEUES LEVEL!`
   - Gesetzt NUR in `src/games/solitaire/components/SolitaireGame.tsx` (~634)

6. `supabase/schema.sql` (124 Zeilen, NIE AUSGEFÜHRT) — Tabellen `public.saves` (~14)
   und `public.pairings` (~20) samt Policies. Laut `docs/05-roadmap.md` (~451) nie gegen
   ein echtes Supabase-Projekt gelaufen.

7. `src/save/cloudAdapter.ts` (140 Zeilen, VOLLSTÄNDIG, ungetestet gegen echten Server)
   - Setzt auf `src/save/supabase.ts` und `src/save/merge.ts` auf
   - `src/save/merge.test.ts` prüft das Zusammenführen ohne Server

8. `src/screens/Events.tsx` (184 Zeilen, VOLLSTÄNDIG bis auf den Event-Shop)
   - Hauptevent, aktive und kommende Events, Event-Mission — alles da
   - `src/core/events.ts` rechnet den Plan aus der Wochennummer, ohne Zufall

Ebenfalls lesen:
- `docs/01-gamedesign.md`, Abschnitt „Shop" (~968) — Warenkatalog und Preislagen
- `docs/01-gamedesign.md`, Zeile ~852 — der Event-Shop ist dort BEWUSST zurückgestellt,
  Begründung: „ein zweiter Shop mit zweiter Währung verdoppelt das Kaufsystem, bevor das
  erste benutzt wurde". Genau deshalb kommt Lücke 4 nach Lücke 1.
- `docs/04-datenmodell.md` — Speicherstruktur und Migrationspflicht

### Was FEHLT (deine Aufgabe — 4 Lücken)

**Lücke 1: Gekauftes wirkt nicht (die größte)**
- `buyItem` (`src/core/shop.ts` ~35) hängt die ID an `save.ownedItems` — danach passiert nichts
- Die drei Kategorien brauchen drei verschiedene Wirkungen:
  - **Outfits** verändern, wie Fynnox aussieht. Nächster Ort: `src/components/Avatar.tsx`
    und `src/screens/Profile.tsx`. ACHTUNG: Es gibt KEIN Bildmaterial für einen Fynnox
    in Winterfell oder Forscherweste — nur das Piratenoutfit (`art/shop/pirat.jpg`).
    Erfinde keins. Entweder nur das Piratenoutfit wirkt sichtbar, oder du fragst den
    Auftraggeber nach einem Blatt mit vier Fynnox-Varianten.
  - **Helfer** sind Begleiter. Der billigste ehrliche Weg: ein kleines Bild neben Fynnox
    auf dem Startbildschirm oder im Ergebnisbildschirm — Bilder liegen in `art/shop/`.
  - **Booster** verändern eine Runde. Das ist der einzige Punkt, der `applyRoundResult`
    berührt. Halte die Funktion rein: Der Besitz steht bereits im übergebenen `save`.
- Ansatz: Erst eine Funktion `effectsFor(save)` in `src/core/shop.ts`, die aus
  `ownedItems` ein Objekt mit den aktiven Wirkungen macht. Dann diese Wirkungen an genau
  den Stellen lesen, an denen sie greifen. Nicht umgekehrt.
- Zum Schluss `SHOP_NOTE` in `src/content/shop.ts` (~197) an die Wahrheit anpassen.

**Lücke 2: Pause gibt es nur in Blockfall**
- `PauseOverlay` liegt seit dem 18.08.2026 in `src/components/`, eingebunden ist es einmal
- Sechs Spiele haben gar keine Pause: waldbloecke, tempelpaare, kristallmix, solitaire,
  sudoku, bubbleshooter (je `src/games/<id>/components/*Game.tsx`)
- Tempelpaare ist der wichtigste Fall — dort läuft eine Uhr, und ohne Pause verliert man
  die Runde, wenn das Telefon klingelt. Prüfe, ob der Timer beim Pausieren wirklich anhält
- Das Gamedesign sagt: „Pause ist in jedem Spiel oben rechts erreichbar"

**Lücke 3: Der Cloud-Speicher ist nie gegen einen echten Server gelaufen**
- `supabase/schema.sql` ist geschrieben, aber nie ausgeführt (`docs/05-roadmap.md` ~451)
- `src/save/cloudAdapter.ts` und `src/save/supabase.ts` sind dadurch ungetestet
- Das braucht Zugangsdaten (Projekt-URL und anon key) vom Auftraggeber. Frag danach,
  BEVOR du anfängst — ohne sie ist diese Lücke nicht abschließbar
- Prüfe mindestens: Schema läuft durch, ein Spielstand wird hochgeladen, ein zweites
  Gerät holt ihn, und `merge.ts` entscheidet bei Konflikt wie in `merge.test.ts` erwartet

**Lücke 4: Der Event-Shop fehlt (erst NACH Lücke 1)**
- `src/screens/Events.tsx` zeigt Events, aber keinen eigenen Shop
- Das Gamedesign hat ihn bewusst zurückgestellt (~852) — die Begründung war, dass das
  erste Kaufsystem noch nicht wirkt. Sobald Lücke 1 steht, fällt diese Begründung weg
- Bevor du baust: Kläre mit dem Auftraggeber, ob der Event-Shop eine ZWEITE Währung
  bekommt (Mockup zeigt eine) oder ebenfalls Kristalle nimmt. Eine zweite Währung heißt
  Änderung an `src/save/types.ts` und damit SAVE_VERSION plus Migration

### Rahmenbedingungen

- **`src/core/round.ts` bleibt rein**: keine Uhr, kein Zufall, kein Speicherzugriff.
  Gleicher Spielstand + gleiches Ergebnis muss immer dasselbe liefern — daran hängen
  die Tests
- **Änderungen an `src/save/types.ts` brauchen SAVE_VERSION-Erhöhung und Migration.**
  Vorlage: `toV4` in `src/save/adapter.ts` (~136). Alte Spielstände dürfen nicht kaputtgehen
- **Grafik entsteht ausschließlich in `scripts/build-art.py`.** Neue Koordinate ins Skript,
  Skript laufen lassen. Ein von Hand erzeugtes Bild in `public/art/` ist beim nächsten
  Lauf weg. Aufruf: `PYTHONIOENCODING=utf-8 python scripts/build-art.py`
- **Kein Bild wird erfunden.** Fehlt ein Motiv, wird die Lücke benannt und beim
  Auftraggeber angefordert — mit Inhalt, Format, Mindestgröße und dem Hinweis
  „kein Text, keine Zahlen, keine UI im Bild". Das hat am 18.08.2026 funktioniert
- **Vorab-Cache der PWA liegt bei 2,87 MB, Grenze 3,5 MB.** Prüfen mit
  `npm run build 2>&1 | grep precache`
- Alles, was ein Spieler liest, ist Deutsch und liegt in `src/content/`, nicht im JSX
- Zielflächen mindestens 44 px, kein Hover als einzige Rückmeldung
- Keine neue Abhängigkeit ohne echten Grund. Framer Motion wurde am 17.08.2026 abgelehnt
- Bewegung respektiert `data-motion="off"` (`src/index.css`), niemals mit `!important`
  aushebeln
- Vor jedem Push muss `npm run build` durchlaufen (enthält `tsc -b`; `vite build` allein
  reicht NICHT)

### Arbeitsweise

1. Alle oben gelisteten Dateien VOLLSTÄNDIG lesen, bevor du planst
2. Die Lücken als getrennte Schritte planen — Reihenfolge 1, 2, 3, 4
3. Bei Lücke 3 und 4 ZUERST die offene Frage stellen (Zugangsdaten bzw. zweite Währung),
   bevor Code entsteht
4. Eine Lücke nach der anderen umsetzen, jede mit Codeänderung und `npx tsc -b`
5. Nach jeder Lücke: `npm test` und `npm run build` als Rückfallnetz
6. Ein Commit je Lücke mit aussagekräftiger Nachricht auf Deutsch
7. Jede sichtbare Änderung im Browser bei 390 × 844 mit einem Bildschirmfoto belegen,
   nicht behaupten

Hinweis zu Git: Im Repo ist KEINE Identität konfiguriert. Commits brauchen
`git -c user.name="Marcel-Fe" -c user.email="marcelfehse22@gmx.de" commit -F <datei>`.
Nachrichten mit Umlauten immer über `-F <datei>`.

Hinweis zu Prettier: Es gibt KEINE Prettier-Konfiguration. `npx prettier --write` schreibt
den gesamten Projektstil um (doppelte Anführungszeichen, Semikolons). Nicht ausführen.

Hinweis zu Python: Skripte, die deutschen Text ausgeben, brauchen `PYTHONIOENCODING=utf-8`.

Hinweis zu Playwright: `browser.new_context(..., service_workers="block")` setzen, sonst
liefert der Service Worker den alten Stand. `page.goto()` auf dieselbe Hash-Route lädt
NICHT neu — dafür `page.reload()` nehmen. Ein Rundenende lässt sich erzwingen: Tempelpaare
gewinnen (jeder Stein trägt sein Symbol im `aria-label`), Sudoku auf Stufe SCHWER durch
drei Fehleingaben verlieren.

### Überprüfung

- `npx tsc -b`
- `npm test` — muss mindestens 392 grüne Tests zeigen
- `npm run build`
- `PYTHONIOENCODING=utf-8 python scripts/build-art.py && git status --short` — der
  Arbeitsbaum muss danach sauber sein, sonst ist die Grafik nicht reproduzierbar
- `npm run build 2>&1 | grep precache` — Vorab-Cache soll unter 3,5 MB bleiben
- `grep -c "kommt später dazu" src/content/shop.ts` — muss nach Lücke 1 auf 0 stehen
- `grep -rln "PauseOverlay" src/games/ | wc -l` — muss nach Lücke 2 auf 7 stehen
- `npx vite preview --port 4195 --strictPort` und mit Playwright bei 390 × 844 den Shop,
  eine Runde mit gekauftem Booster und eine Pause in einem zweiten Spiel abbilden

### Was du NICHT tun darfst

- **Minigolf NICHT zurückholen.** Am 17.08.2026 auf Entscheidung des Auftraggebers
  entfernt (`docs/05-roadmap.md`, Nachtrag). Es gibt sieben Spiele, `SAVE_VERSION` steht
  deshalb auf 4
- **Die bildreiche Oberfläche NICHT umbauen.** Sie wurde am 18.08.2026 in sieben Runden
  fertiggestellt und ist im Browser belegt: `public/art/shop/` (15 Warenbilder),
  `public/art/moments/` (6 Einblendungen), `public/art/ui/` (3 Währungssymbole,
  10 Navigationsmasken), die Weltkulissen, `CurrencyIcon.tsx`, `NavIcon.tsx`,
  `PauseOverlay.tsx`, die Kopfbereiche von Shop und Missionen
- **`src/core/round.ts` NICHT um Uhr, Zufall oder Speicherzugriff erweitern**
- **`src/save/types.ts` NICHT ohne SAVE_VERSION-Erhöhung und Migration ändern**
- Bilder NICHT von Hand nach `public/art/` legen und NICHT als CSS nachbauen
- Die Konzeptbilder in `docs/referenzen/` NICHT verändern — sie sind die Quelle
- KEINE Bezahlung einbauen. Die Euro-Preise im Shop bleiben Anzeige ohne Funktion
- KEIN achtes Spiel. Die Liste ist geschlossen; ein weiteres bräuchte zuerst ein
  Konzeptbild (CLAUDE.md)
- `npx prettier --write` NICHT ausführen — es gibt keine Konfiguration im Projekt
```
