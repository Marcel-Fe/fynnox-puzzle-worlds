# Art- und UI-Guide

Alle Farbwerte hier wurden **pixelgenau aus den Konzeptbildern gemessen**
(dominante Farbe je Bildbereich), nicht geschätzt. Quelle jeweils in Klammern.

---

## Grafik: die Konzeptbilder sind das Material

Die Illustrationen aus [`referenzen/`](referenzen/) lassen sich mit CSS nicht nachbauen —
gerenderte Figuren, gemalte Kulissen und Lichtstimmungen entstehen nicht aus Farbflächen.
Deshalb werden sie **als Bilder verwendet**, nicht nachgeahmt.

`scripts/build-art.py` schneidet alles heraus und legt es unter `public/art/` ab:

| Ordner | Inhalt | Quelle im Referenzordner |
|---|---|---|
| `chars/` | 10 runde Porträts (Fynnox + 9 Begleiter) | Charakterleiste unten in `gameplay-regeln-und-missionen.png` |
| `chars/fynnox-jubel.jpg` | Fynnox freut sich — Ergebnisbildschirm nach einem Sieg | Start-Pop-up in `handy-flow-start-bis-minigolf.png` |
| `chars/fynnox-still.jpg` | Fynnox gedämpft — Ergebnisbildschirm nach einer Niederlage | Übergangsbildschirm in `handy-flow-start-bis-minigolf.png` |
| `bg/` | 7 Weltkulissen (Sonnenwald, Piratenbucht, Kristallhöhle, Lavatal, Wolkeninsel, Wintergipfel, Tempel) | Minigolf-Bahnen in `charaktere-spiele-minigolf.png` |
| `games/` | 8 Kachelbilder | Spielkarten in `dashboard-hauptansicht.png` |
| `hero.jpg` | Begrüßungsbanner mit Fynnox in der Landschaft | `dashboard-hauptansicht.png` |

**Regeln dazu:**

1. Soll ein Ausschnitt anders sitzen, wird die Koordinate im **Skript** geändert und das
   Skript erneut ausgeführt — nie von Hand nachgeschnitten. Sonst ist der Stand nicht
   reproduzierbar.
2. **Alles JPEG.** Die Motive haben keine Transparenz; als PNG wäre die App viermal so
   schwer zu laden (gemessen: 2,8 MB gegenüber 0,9 MB).
3. **Beim Zuschneiden auf fremde Beschriftungen achten.** In den Mockups steht überall
   UI mit auf den Bildern. Zwei Beispiele, die schon danebengingen: Das Begrüßungsbanner
   enthielt die Mockup-Karte „LEVEL 12 · 2.450 XP" und widersprach damit den echten Werten
   des Spielers; die Blockfall-Kachel zeigte ein angeschnittenes „NEU"-Fähnchen als „EU".
4. **Freistellen ist nicht möglich.** Eine Figur sauber aus einem KI-Bild zu lösen gelingt
   nicht — deshalb wird Fynnox samt Landschaft als ganzer Bildausschnitt gezeigt.
   Auf den Mockups steht er ohnehin mitten in der Kulisse.
5. **Belichtung darf angehoben werden, das Motiv nicht verändert.** `fynnox-still` stammt
   aus einer Dämmerungsszene und kam mit einer mittleren Helligkeit von 35 bei einer
   Streuung von 16 heraus — auf der dunklen Ergebniskarte war bei 56 px nichts mehr zu
   erkennen. Helligkeit und Kontrast werden darum **im Skript** angehoben (auf 54 bzw. 33)
   und bleiben damit reproduzierbar. Er ist weiterhin sichtbar gedämpfter als
   `fynnox-jubel` mit 84.

### Es gibt keinen traurigen Fynnox

In **keinem** der elf Konzeptbilder ist Fynnox traurig, enttäuscht oder ärgerlich — er
lächelt auf jedem einzelnen. Wer eine solche Miene braucht, findet sie hier nicht und
darf sie auch nicht aus einem vorhandenen Bild herausretuschieren. Der
Ergebnisbildschirm löst das über **Licht und Text**: dieselbe Figur in gedämpfter
Beleuchtung, dazu eine ermutigende Zeile (docs/02-charakterbibel.md). Ein wirklich
trauriger Fynnox bräuchte ein neues Konzeptbild.

### Fynnox in 3D

Aus dem Schwesterprojekt `fynnox-adventure` stammt `public/models/fynnox.glb`
(2,4 MB, mit Skelett, ohne Animationen). Eingebunden ist es auf dem Profilbildschirm
hinter einem Knopf.

- Der 3D-Teil wird **nachgeladen**, nie mitgeliefert: three.js wiegt gebaut rund 1 MB und
  damit mehr als die gesamte übrige App. Wer die Ansicht nicht öffnet, lädt sie nie.
- Das Modell steht **nicht** im Offline-Vorrat — 2,4 MB für ein Beiwerk wären zu viel.
- Beleuchtet wird von Hand. Die fertigen Umgebungen von `drei`
  (`<Stage environment="city">`) laden zur Laufzeit aus dem Netz nach und bleiben
  offline schwarz.
- Geräte ohne 3D-Unterstützung bekommen das Porträt und einen Hinweis statt eines
  leeren Kastens.

> Die Sprites aus `fynnox-adventure` (`public/art/fynnox/*.png`) zeigen einen **anderen**
> Fynnox — eine schlichte Vektorfigur im blauen Anzug, nicht den Fuchs mit Fliegerbrille,
> blauem Schal und grüner Kleidung aus dem Masterprompt. Sie werden hier **nicht** verwendet.

---

## Farben

### Grundflächen

| Token | Wert | Verwendung | Beleg |
|---|---|---|---|
| `bg-deep` | `#020C17` | Seitenhintergrund | Fläche zwischen den Kacheln (Dashboard-Übersicht) |
| `bg-sidebar` | `#010F1E` | Seitenleiste, untere Navigationsleiste | Seitenleiste (Dashboard-Übersicht) |
| `bg-card` | `#0A1626` | Karten und Panels | abgeleitet aus `#010E1B` (Statistik-Karte), leicht angehoben für sichtbare Abgrenzung |
| `bg-elevated` | `#112B44` | Währungs-Pillen in der Kopfzeile | Kopfleiste (Dashboard-Hauptansicht) |
| `border` | `#1F2838` | Kartenränder, Trennlinien | Kartenrand (Dashboard-Übersicht) |

Die Mockups sind KI-Renderings; ihre Hintergründe schwanken leicht ins Grünliche oder Bläuliche.
Oben steht die **normierte** Palette — ein sehr dunkles Navy als Grundton, konsequent durchgezogen.

### Akzente

| Token | Wert | Verwendung | Beleg |
|---|---|---|---|
| `gold` | `#F9B316` | Überschriften, Münzen, aktives Navigationselement, Hervorhebungen | „FYNNOX!"-Schriftzug |
| `gold-deep` | `#8C540D` | dunkles Ende der Gold-Verläufe | aktiver Navigationsknopf |
| `purple` | `#712DB7` | XP-Balken, Event-Panel, Premium-Elemente | XP-Balken der Seitenleiste |
| `purple-panel` | `#1C0F42` | Hintergrund des Event-Panels | Event-Panel „Sommer Cup" |

Gold ist die **Signalfarbe** der Marke: Was gerade wichtig oder aktiv ist, ist gold.
Violett steht für Fortschritt und Premium (XP, Events, Kristalle).

### Spielfarben

Jedes Spiel hat eine eigene Farbe — sie färbt Karte, Knopf und HUD-Rand.

| Spiel | Token | Wert | Schrift darauf | Herkunft |
|---|---|---|---|---|
| Blockfall | `game-blockfall` | `#552ABE` (Violett) | weiß | gemessen |
| Waldblöcke | `game-waldbloecke` | `#7CB518` (Limette) | dunkel | angepasst, siehe unten |
| Tempelpaare | `game-tempelpaare` | `#D26A03` (Orange) | weiß | gemessen |
| Kristallmix | `game-kristallmix` | `#CA314D` (Pink-Rot) | weiß | gemessen |
| Solitaire | `game-solitaire` | `#135EB0` (Blau) | weiß | gemessen |
| Minigolf | `game-minigolf` | `#057336` (Rasengrün) | weiß | gemessen |
| Sudoku | `game-sudoku` | `#0B7A6A` (Türkis) | weiß | neu vergeben |
| Bubble Shooter | `game-bubbleshooter` | `#A02BA8` (Magenta) | weiß | neu vergeben |

**Warum Waldblöcke gewechselt hat** (entschieden am 29.07.2026): Der gemessene Wert
`#2C7B0E` lag zu nah an Minigolfs `#057336` — auf kleinen Handy-Kacheln waren beide
schlicht „grün". Das neue `#7CB518` ist deutlich heller und dadurch klar unterscheidbar,
passt aber weiter zum Waldthema. Weil es hell ist, steht darauf **dunkle** Schrift
(`bg-deep`): weiß auf Limette erreicht nur ein Kontrastverhältnis von 2,2 : 1 und wäre
schlecht lesbar; dunkel auf Limette erreicht 7,8 : 1.

**Kontrastregel**: Jede Spielfarbe muss mit ihrer Schriftfarbe mindestens **4,5 : 1**
erreichen. Alle acht Werte oben erfüllen das. Wird eine Farbe geändert, ist das
nachzurechnen — nicht nach Augenmaß entscheiden.

---

## Typografie

Aus den Mockups abgelesen, ohne dass Schriftnamen bekannt wären:

- **Überschriften und Logo**: sehr fett, leicht gerundet, Großbuchstaben, goldener Verlauf
  mit dunklem Rand und Schattenwurf. Ein Comic-/Game-Charakter, keine Systemschrift.
- **Zahlenanzeigen** (Punkte, Münzen, Level): fett, tabellarische Ziffern, damit beim
  Hochzählen nichts springt.
- **Fließtext und Sprechblasen**: normale, gut lesbare serifenlose Schrift; Sprechblasen
  haben hellen Hintergrund mit dunklem Text — der einzige Ort, an dem die App hell wird.
- **Beschriftungen** (`LEVEL`, `PUNKTE`, `ZÜGE`, `ZIEL`): klein, Großbuchstaben, gesperrt,
  gedämpfte Farbe; direkt darunter der Wert groß.

**OFFEN**: konkrete Schriftarten. Bis zur Festlegung eine kostenlose, gut lesbare Google-Schrift
mit kräftigen Schnitten verwenden und die Wahl hier eintragen.

---

## Bausteine

**Karten** — abgerundete Ecken (deutlich, ca. 16–20 px), dünner heller Rand (`border`),
dunkler halbtransparenter Hintergrund mit leichtem Weichzeichner dahinter (Glassmorphism),
weicher Schatten nach unten. Bei Spielkarten läuft die Spielfarbe als Rand oder Verlauf mit.

**Knöpfe** — kräftig gefüllt in der jeweiligen Spielfarbe oder in Gold, Großbuchstaben,
weiß, abgerundet, mit sichtbarem Druck-Effekt beim Antippen. Mindesthöhe 44 px.

**Fortschrittsbalken** — abgerundete Kapsel, dunkle Spur, gefüllt in Violett (XP) oder
Gold (Missionen); der Zahlenwert steht rechts daneben oder direkt darauf.

**Sprechblasen** — heller Untergrund, dunkler Text, kleiner Zipfel zur Figur.
Immer direkt neben dem Charakter, der spricht.

**Währungs-Pillen** — dunkle abgerundete Kapsel, links das Symbol, dann der Wert,
rechts ein `+`-Knopf, der in den Shop führt. Reihenfolge auf allen Bildschirmen gleich:
**Münzen → Kristalle → Energie**.

> Die älteren Desktop-Mockups zeigen die umgekehrte Reihenfolge (Energie zuerst).
> Verbindlich ist die neuere Handy-Fassung, weil das Handy der Hauptfall ist.

---

## Aufbau der Bildschirme

### Smartphone (Hochformat — der Hauptfall)

```
┌──────────────────────────────┐
│ 🦊 Fynnox      LEVEL 12   ☰ │  Profilkopf: Bild, Name, XP-Balken
│    ▓▓▓▓▓▓░░ 2.450/3.500      │
│ 🪙12.580  💎320  ⚡5/5        │  Währungen
├──────────────────────────────┤
│   Fynnox + „Willkommen       │
│   zurück, Abenteurer!"       │
│                              │
│   [Tägl.] [Event] [Abent.]   │  drei Schnellzugriff-Kacheln
│   WEITERSPIELEN  🎮🎮🎮🎮     │  zuletzt gespielte Spiele
├──────────────────────────────┤
│ 🏠     🎮     🎯    🛒    ☰ │  Tab-Leiste, feststehend
│ Start Spiele Missionen Shop  │
│                        Mehr  │
└──────────────────────────────┘
```

Die Tab-Leiste hat genau **fünf** Punkte: **Start · Spiele · Missionen · Shop · Mehr**.
Hinter „Mehr" liegen Abenteuerpfad, Events, Freunde, Rangliste, Profil, Erfolge und
Einstellungen. Grund: Mehr als fünf Symbole sind auf einem Handy nicht mehr treffsicher tippbar.

### Desktop

Seitenleiste links mit Profilkarte unten
(Dashboard · Spiele · Abenteuer · Missionen · Shop · Freunde · Rangliste · Events ·
Einstellungen), Inhalt rechts in mehreren Spalten.
Der aktive Punkt ist goldgefüllt, die übrigen sind einfarbig hell.

### Die Bildschirme im Einzelnen

Aus dem Handy-Design belegt — das ist die Liste der zu bauenden Ansichten:

| # | Bildschirm | Kern |
|---|---|---|
| 1 | Laden | Logo, Fynnox mit Sprechblase, Fortschrittsbalken mit Prozentzahl |
| 2 | Dashboard | Profilkopf, Begrüßung, drei Schnellzugriff-Kacheln, „Weiterspielen"-Reihe |
| 3 | Spiele | Filterleiste (Alle · Puzzle · Karten · Sport), Kacheln mit Bestwert |
| 4 | Spiel läuft | Sprechblase der Begleitfigur, Spielfeld, HUD, Power-Ups, Pause |
| 5 | Missionen | Reiter Täglich · Wöchentlich · Event, Liste mit Balken, „Alle Belohnungen" |
| 6 | Abenteuerpfad | Kapitelname, Fortschritt, senkrechter Pfad mit nummerierten Knoten |
| 7 | Shop | Reiter Empfohlen · Outfits · Helfer · Booster, Sonderangebot, Gratis-Angebote |
| 8 | Events | laufendes Hauptevent, aktive Events, kommende Events |
| 9 | Freunde | Reiter Freunde · Anfragen · Bestenliste, Online-Gruppe, „Freunden einladen" |
| 10 | Profil | Bild, Name, Level, Statistik, Erfolgsstand, „Anpassen" |
| 11 | Einstellungen | Allgemein, Spiel, Support — mit Schaltern |

### Feste Regeln

1. Währungsleiste **immer** oben, in gleicher Reihenfolge, auf jedem Bildschirm.
2. Navigation ist immer erreichbar — Tab-Leiste unten am Handy, Seitenleiste am Desktop.
3. Fynnox ist auf jedem Hauptbildschirm sichtbar.
4. Jede Spielkarte zeigt: Bild, Name, Kurzbeschreibung in drei Wörtern
   (z. B. „Klassisch. Schnell. Endloser Spaß.") und einen Knopf in der Spielfarbe.
5. Fortschritt wird **immer** als Zahl *und* Balken gezeigt, nie nur als Balken.
6. Neue Inhalte tragen ein `NEU`-Fähnchen oben links auf der Karte.

---

## Touch-Bedienung

- Zielflächen mindestens 44 × 44 px.
- Kein Effekt darf nur beim Überfahren mit der Maus sichtbar sein — am Handy gibt es kein Hover.
- Wichtige Knöpfe liegen im unteren Bildschirmdrittel, dort reicht der Daumen hin.
- Rückmeldung auf jeden Tipp: Bewegung, Farbe oder Ton — nie stille Reaktion.
- Spielfelder skalieren mit der Bildschirmbreite, statt zu scrollen.

---

## App-Symbol

Vorlage ist [`referenzen/app-icon.png`](referenzen/app-icon.png): Fynnox mittig mit erhobenem
Daumen, ringsum Bausteine, Kristalle, Mahjong-Steine, Spielkarten, Golfball und eine goldene
Pfotenmünze, darunter der Schriftzug auf blauem Schild, gerahmt von einem goldenen Rand.

Daraus werden abgeleitet: `pwa-192x192.png`, `pwa-512x512.png`,
`maskable-512x512.png` (mit Sicherheitsabstand am Rand, sonst schneidet Android den Rahmen an)
und `apple-touch-icon.png`.

Manifest-Farben: `theme_color` = `#020C17`, `background_color` = `#020C17` —
so bleibt der Startbildschirm dunkel und blitzt beim Öffnen nicht weiß auf.

---

## Was vermieden wird

- Weiße oder helle Flächen außerhalb von Sprechblasen und Spielkarten.
- Mehr als zwei Akzentfarben auf einem Bildschirm (Spielfarbe + Gold reichen).
- Schrift unter 12 px.
- Animationen, die den nächsten Tipp verzögern — Rückmeldung kommt sofort.
