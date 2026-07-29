# Art- und UI-Guide

Alle Farbwerte hier wurden **pixelgenau aus den Konzeptbildern gemessen**
(dominante Farbe je Bildbereich), nicht geschätzt. Quelle jeweils in Klammern.

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

| Spiel | Token | Wert | Beleg |
|---|---|---|---|
| Blockfall | `game-blockfall` | `#552ABE` (Violett) | „Spielen"-Knopf |
| Waldblöcke | `game-waldbloecke` | `#2C7B0E` (Laubgrün) | „Spielen"-Knopf |
| Tempelpaare | `game-tempelpaare` | `#D26A03` (Orange) | „Spielen"-Knopf |
| Kristallmix | `game-kristallmix` | `#CA314D` (Pink-Rot) | „Spielen"-Knopf |
| Solitaire | `game-solitaire` | `#135EB0` (Blau) | „Spielen"-Knopf |
| Minigolf | `game-minigolf` | `#057336` (Rasengrün) | „Spielen"-Knopf |

> **Zu klären**: Waldblöcke (`#2C7B0E`) und Minigolf (`#057336`) sind beide grün und auf
> kleinen Handy-Kacheln kaum auseinanderzuhalten. Vorschlag: Minigolf bleibt Rasengrün,
> Waldblöcke wechselt auf ein helleres Limettengrün oder Türkis. Nicht eigenmächtig ändern —
> erst hier festhalten, dann umsetzen.

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
