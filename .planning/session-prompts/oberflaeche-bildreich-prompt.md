# Oberfläche bildreich machen — Session-Prompt für Claude Code
## Kopiere den Prompt unten und füge ihn als erste Nachricht in eine neue Claude-Code-Session ein

---

```
Du arbeitest am Projekt Fynnox Puzzle Worlds (c:\Users\admin\Desktop\Fynnox Strategie Spiele).
Lies ZUERST die CLAUDE.md im Projektwurzelverzeichnis — dort stehen Architektur, Regeln und Arbeitsweise.

## Aufgabe: Oberfläche bildreich und modern machen

### Worum geht es?

Der Auftraggeber will die App „hoch modern und sehr bildreich" sehen. Das Projekt hat dafür
alles im Haus: In `docs/referenzen/` liegen sieben Konzeptbilder mit fertigen Illustrationen,
und `scripts/build-art.py` schneidet daraus `public/art/`. Das Problem ist nicht fehlendes
Material, sondern ungenutztes.

Zwei Runden sind bereits gelaufen und haben den Ansatz bestätigt:
- Die **Spielkacheln** zeigten siebenmal dasselbe Fynnox-Gesicht, weil sie aus dem
  Dashboard-Streifen geschnitten waren. Sie kommen jetzt aus den echten Spielansichten.
- Der **Mehr-Bildschirm** war eine Textliste mit Emoji und ist jetzt ein Kachelraster
  mit Bildern.

Was noch flach ist: **Shop**, die drei Statistikkarten auf dem **Dashboard**, die im
Gamedesign vorgesehenen **Einblendungen** (SIEG!, LEVEL UP!, BELOHNUNG!, FEHLER!) und die
Kacheln von **Sudoku und Bubble Shooter**.

### Was BEREITS EXISTIERT (nicht neu bauen!)

Diese Dateien VOR jeder Änderung vollständig lesen:

1. `scripts/build-art.py` (186 Zeilen, VOLLSTÄNDIG) — die **einzige** Stelle, an der Grafik
   entsteht. `ref()` (Zeile ~26) lädt ein Referenzbild, `save_jpg()` schneidet und skaliert.
   Quellen als Variablen: `gameplay`, `dash`, `charsheet`, `ansichten`, `flow` (Zeilen ~34–39).
   `TILES` (Zeile ~147) erzeugt die Spielkacheln aus `ansichten`.
   Ausführen mit: `PYTHONIOENCODING=utf-8 python scripts/build-art.py`

2. `src/content/assets.ts` (38 Zeilen, VOLLSTÄNDIG) — `asset(path)` (Zeile ~14) baut den
   Pfad samt `BASE_URL`; `PORTRAITS` (Zeile ~19) hält die zehn Begleitfiguren.
   **Jeder Bildpfad läuft hier durch** — nie `/art/...` direkt ins JSX schreiben.

3. `src/content/shop.ts` (172 Zeilen, VOLLSTÄNDIG bis auf Bilder) — `ShopItem` (Zeile ~12)
   hat heute nur `icon: string` (ein Emoji). Ein Feld für ein Bild fehlt.
   `SHOP_ITEMS` (Zeile ~27) listet Outfits, Helfer, Booster und vier Waren mit Euro-Preis.

4. `src/screens/Shop.tsx` (126 Zeilen) — `ShopCard` (Zeile ~77) zeigt das Emoji in einem
   `<span className="text-3xl">`. Kein Bild, kein Kopfbereich.

5. `src/screens/Dashboard.tsx` (155 Zeilen) — `QuickTile` (Zeile ~129) sind die drei flachen
   Karten unter dem Begrüßungsbanner (Missionen, Kapitel, Gespielt), aufgerufen ab Zeile ~67.
   Das Banner darüber nutzt bereits `HERO_PORTRAIT` und sieht gut aus.

6. `src/screens/More.tsx` (61 Zeilen, FRISCH UMGEBAUT — als **Vorlage** lesen, nicht ändern)
   Zeigt das Muster für bildreiche Kacheln: Bild absolut, Verlauf darüber, Text darauf,
   `object-[center_45%]`. Die Daten dazu stehen in `src/content/navigation.ts` (`image`,
   `teaser` je Eintrag).

7. `src/components/RoundResult.tsx` (150 Zeilen) — `RoundResultOverlay` (Zeile ~14) ist der
   Ergebnisbildschirm aller sieben Spiele. `RewardLine` (Zeile ~139) zählt die Belohnung hoch.
   Zeigt heute Text und Sterne, kein Bild.

8. `src/components/Card.tsx` (51 Zeilen) — `Card` und `ProgressBar`, die Bausteine, aus denen
   fast jeder Bildschirm besteht.

**Bildmaterial, das noch niemand benutzt** (Koordinaten grob geschätzt, im Skript prüfen):

- `docs/referenzen/spiele-ansichten-und-charaktere.png` (1536×1024)
  → Block **„SPIEL MOMENTE"** unten rechts, sechs Kacheln à rund 112×85 px:
    SIEG! · LEVEL UP! · BELOHNUNG! (Reihe 1, y ≈ 847–932)
    FEHLER! · PAUSE · NEUES LEVEL! (Reihe 2, y ≈ 939–1006)
    Spalten x ≈ 1144–1256 · 1260–1376 · 1385–1496
  → Block **„SPIELENDE CHARAKTERE"** darüber (y ≈ 730–830)

- `docs/referenzen/dashboard-uebersicht-alle-bereiche.png` (1536×1024)
  → **„SHOP DASHBOARD"** unten links (x ≈ 10–270, y ≈ 750–960) mit drei Warenbildern:
    Goldpaket, Kristallpaket, Mega Truhe (x ≈ 85–140 · 148–200 · 208–260, y ≈ 800–915)
  → **Abenteuerpfad**-Weltkacheln oben rechts (Sunforest, Kristallhöhlen, Lavawelt,
    Pirateninsel), y ≈ 55–200

Ebenfalls lesen: `docs/01-gamedesign.md` Abschnitt „Rundenablauf und Rückmeldungen" —
dort sind die Einblendungen `SIEG!`, `LEVEL UP!`, `BELOHNUNG!`, `NEUES LEVEL!`, `FEHLER!`,
`PAUSE` als verbindlich festgelegt und bis heute **nicht umgesetzt**.

### Was FEHLT (deine Aufgabe — 4 Lücken)

**Lücke 1: Der Shop hat keine Bilder**
- Jede Ware zeigt ein Emoji in einem `<span>`; auf dem Bildschirm sind das zwölf graue
  Kästchen untereinander (`src/screens/Shop.tsx`, `ShopCard` Zeile ~77)
- `ShopItem` in `src/content/shop.ts` (Zeile ~13) braucht ein optionales `image`
- Aus dem „SHOP DASHBOARD" lassen sich Goldpaket, Kristallpaket und Truhe schneiden —
  die passen zu den vier Waren mit Euro-Preis. Für Outfits, Helfer und Booster gibt es
  **kein** eigenes Bildmaterial: Dort bleibt das Emoji, aber die Karte selbst darf
  räumlicher werden (Verlauf in der Spielfarbe, größeres Symbol, klarere Preiszeile)
- Ein Kopfbereich für den Shop-Bildschirm nach dem Muster von `More.tsx` wäre der
  zweite Gewinn

**Lücke 2: Die drei Statistikkarten auf dem Dashboard sind leer**
- `QuickTile` (`src/screens/Dashboard.tsx` Zeile ~129) ist ein Kasten mit farbigem Rand,
  Beschriftung und Zahl — mehr nicht
- Die Kapitelkarte weiß bereits, in welcher Welt der Spieler steht
  (`chapterAt(adventure.chapter).world`); das passende Kulissenbild liegt in
  `src/content/adventure.ts` als `image` je Kapitel
- Ansatz: dasselbe Muster wie `More.tsx` — Bild, Verlauf, Text darauf. Für Missionen und
  „Gespielt" ein Bild aus `public/art/bg/` wählen, das thematisch trägt

**Lücke 3: Die Einblendungen aus dem Gamedesign gibt es nicht**
- `docs/01-gamedesign.md` legt sechs Einblendungen fest; keine davon existiert im Code
- Der Ergebnisbildschirm (`src/components/RoundResult.tsx`, Zeile ~14) zeigt bei Sieg und
  Niederlage denselben Aufbau, nur mit anderem Titel
- Ansatz: Die Bilder „SIEG!" und „FEHLER!" aus dem Block „SPIEL MOMENTE" schneiden und im
  Ergebnisbildschirm zeigen; „BELOHNUNG!" passt zur Truhe im Abenteuerpfad
  (`src/screens/Adventure.tsx`) und zur Tagesbelohnung
  (`src/components/DailyRewardCard.tsx`)
- **Achtung**: Diese Ausschnitte tragen die Beschriftung im Bild. Das ist hier zulässig,
  weil der Text feststeht („SIEG!" ist immer „SIEG!") — aber dann darf die Oberfläche
  denselben Text nicht ein zweites Mal daneben schreiben

**Lücke 4: Sudoku und Bubble Shooter haben Platzhalter-Kacheln**
- `scripts/build-art.py` Zeile ~159 schneidet für beide einen **Charakterausschnitt** aus
  `charsheet`, weil es auf keinem Mockup eine Spielansicht gibt. In der Spieleliste stehen
  sie damit zwischen fünf echten Spielfeldern und fallen ab
- Prüfe die übrigen Referenzbilder (`handy-app-10-bildschirme.png`,
  `spiele-detail-und-bahnen.png`, `gameplay-regeln-und-missionen.png`), ob dort doch eine
  Ansicht liegt. Wenn nicht: eine Kulisse wählen, die zum Spiel passt, statt eines Gesichts

### Rahmenbedingungen

- **Grafik wird NICHT von Hand geschnitten.** Jede neue Koordinate gehört in
  `scripts/build-art.py`; danach das Skript laufen lassen. Ein von Hand erzeugtes Bild in
  `public/art/` ist beim nächsten Skriptlauf weg
- **Fremde Beschriftungen fernhalten**: Auf den Mockups steht überall UI mit im Bild
  („PUNKTE 18.450", „ZEIT 03:20", „ZÜGE 18", „NEU"-Fähnchen). Landet so etwas in einem
  Ausschnitt, widerspricht es später den echten Werten. Ausnahme: feststehende Wörter wie
  „SIEG!" (siehe Lücke 3)
- **Grafik wird NICHT als CSS nachgebaut** (CLAUDE.md). Farbflächen statt Bildern waren
  genau der Fehler, den Phase 5b behoben hat
- Alles, was ein Spieler liest, ist Deutsch und liegt in `src/content/`, nicht im JSX
- **Bildbudget im Blick behalten**: Der PWA-Vorab-Cache liegt bei rund 2,6 MB und ist das,
  was jeder Spieler beim Installieren lädt. Neue Bilder als JPEG, Größe prüfen
- Design-Tokens, deren Namen zur Laufzeit zusammengesetzt werden, gehören NICHT in den
  `@theme`-Block in `src/index.css` — Tailwind v4 entfernt sie dort. Sie kommen in den
  normalen `:root`-Block darunter
- **Bewegung respektiert den Energiesparmodus**: `data-motion="off"` am Wurzelelement kürzt
  alle Übergänge (`src/index.css`, gesetzt in `src/App.tsx`). Neue Animationen brauchen
  nichts weiter, dürfen die Regel aber nicht mit `!important` aushebeln
- Zielflächen mindestens 44 px, kein Hover als einzige Rückmeldung
- Keine neue Abhängigkeit. Framer Motion wurde am 17.08.2026 ausdrücklich abgelehnt, weil
  CSS-Übergänge und 25 Zeilen `requestAnimationFrame` reichen
- Vor jedem Push muss `npm run build` durchlaufen (enthält `tsc -b`; `vite build` allein
  reicht NICHT)

### Arbeitsweise

1. Alle oben gelisteten Dateien VOLLSTÄNDIG lesen, bevor du planst
2. Die Lücken als getrennte, unabhängige Schritte planen
3. Bei jedem neuen Ausschnitt: erst einen **Kontaktbogen** aus Probeausschnitten bauen und
   ansehen, bevor du ihn ins Skript übernimmst — die Koordinaten oben sind geschätzt
4. Eine Lücke nach der anderen umsetzen, jede mit Codeänderung und `npx tsc -b`
5. Nach allen Lücken: `npm test` und `npm run build` als Rückfallnetz
6. Ein Commit je Lücke mit aussagekräftiger Nachricht auf Deutsch
7. Jede sichtbare Änderung im Browser bei 390 × 844 mit einem Bildschirmfoto belegen,
   nicht behaupten

Hinweis zu Git: Im Repo ist **keine** Identität konfiguriert. Commits brauchen
`git -c user.name="Marcel-Fe" -c user.email="marcelfehse22@gmx.de" commit -F <datei>`.
Nachrichten mit Umlauten immer über `-F <datei>`.

Hinweis zu Python: Skripte, die deutschen Text ausgeben, brauchen `PYTHONIOENCODING=utf-8`.

Hinweis zu Playwright: `browser.new_context(..., service_workers="block")` setzen, sonst
liefert der Service Worker den alten Stand. `page.goto()` auf dieselbe Hash-Route lädt
**nicht** neu — dafür `page.reload()` nehmen.

### Überprüfung

- `npx tsc -b`
- `npm test` — muss 392 grüne Tests zeigen
- `npm run build`
- `PYTHONIOENCODING=utf-8 python scripts/build-art.py` — muss ohne Fehler durchlaufen
- `npm run build 2>&1 | grep precache` — Vorab-Cache soll unter 3,5 MB bleiben
- `ls -la public/art/games/` — sieben Kacheln, keine davon 0 Byte
- `grep -c "text-3xl" src/screens/Shop.tsx` — soll kleiner werden als 1, sobald die
  Euro-Waren ein Bild haben
- `npx vite preview --port 4195 --strictPort` und mit Playwright bei 390 × 844 die
  Bildschirme Shop, Dashboard, Spieleliste und ein Rundenende abbilden

### Was du NICHT tun darfst

- **Minigolf NICHT zurückholen.** Das Spiel wurde am 17.08.2026 auf Entscheidung des
  Auftraggebers entfernt (Begründung in `docs/05-roadmap.md`, Nachtrag). Es gibt sieben
  Spiele, und `SAVE_VERSION` steht deshalb auf 4
- Die sieben Spiele unter `src/games/` NICHT umbauen — weder Logik noch Darstellung.
  Diese Aufgabe betrifft ausschließlich Menü- und Meta-Bildschirme
- `src/save/types.ts` NICHT ohne SAVE_VERSION-Erhöhung und Migration ändern.
  `toV4` in `src/save/adapter.ts` (Zeile ~136) ist die Vorlage
- `src/core/round.ts` NICHT um Uhr, Zufall oder Speicherzugriff erweitern
- Bilder NICHT von Hand nach `public/art/` legen und NICHT als CSS nachbauen
- `src/screens/More.tsx` und die Spielkacheln NICHT umbauen — beide wurden gerade
  überarbeitet und sind im Browser belegt. Sie sind die Vorlage für alles Weitere
- KEINE Bezahlung einbauen. Die Euro-Preise im Shop bleiben Anzeige ohne Funktion
- KEINE neue Abhängigkeit ohne echten Grund
- Die Konzeptbilder in `docs/referenzen/` NICHT verändern — sie sind die Quelle
```

---

**Gespeichert unter**: `.planning/session-prompts/oberflaeche-bildreich-prompt.md`
