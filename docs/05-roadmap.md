# Roadmap

Eine Phase gilt erst als fertig, wenn ihr Abschlusskriterium **gezeigt** wurde —
nicht, wenn der Code geschrieben ist.

---

## Phase 1 — Fundament ✅

Konzeptbilder und Masterprompt in verbindliche Dokumente überführt, Repo aufgesetzt.

**Fertig, wenn**: CLAUDE.md und die sechs docs-Dateien existieren, das Repo auf GitHub liegt
und die App über GitHub Pages erreichbar ist.

---

## Phase 2 — Gerüst und Handy-Installation

Vite + React + TypeScript + Tailwind + PWA. Layout-Rahmen mit Kopfzeile (Währungen),
Navigation (Tab-Leiste am Handy, Seitenleiste am Desktop) und leeren Bildschirmen.
Design-Tokens aus dem [Art-Guide](03-art-ui-guide.md) als CSS-Variablen.

**Fertig, wenn**: Die Seite lässt sich auf dem Smartphone über „Zum Home-Bildschirm"
installieren, startet ohne Browserleiste und zeigt Navigation samt Platzhalter-Bildschirmen.

---

## Phase 3 — Profil und Speicherung ✅

`SaveData`, `SaveAdapter` mit localStorage, zustand-Store, `applyRoundResult`, Energie-Nachfüllung.
Währungsleiste, Level-Karte und Missionen zeigen echte Werte.
Balancing-Zahlen stehen im [Gamedesign](01-gamedesign.md) und wurden aus den Mockup-Werten
abgeleitet.

**Nachgewiesen**: 27 Tests in `src/core/round.test.ts` und `src/games/waldbloecke/logic/game.test.ts`
(`npm test`). Im Browser geprüft: Energie sinkt beim Spielstart von 5 auf 4 und ist nach dem
Neuladen der Seite immer noch 4.

---

## Phase 4 — Waldblöcke, vollständig ✅

Das erste echte Spiel und die Vorlage für alle weiteren:
8×8-Raster, drei Vorratsblöcke, Reihen und Spalten räumen, Kombos, Sterne, Spielende.
Logik in `logic/` ohne React, Darstellung getrennt, Zufall über einen Seed.
Am Rundenende wird ein `RoundResult` gemeldet und über `applyRoundResult` verrechnet.

**Bedienung**: erst Block antippen, dann Feld antippen — bewusst kein Ziehen, weil auf
dem Handy sonst der Finger die Zielstelle verdeckt.

**Nachgewiesen**: Im Browser gespielt, Punkte steigen, Reihen werden geräumt, Energie
wird abgezogen und bleibt nach dem Neuladen erhalten.

---

## Phase 5 — Restliche Bildschirme mit echten Daten ✅

- **Spieleauswahl** mit Filterleiste (Alle · Puzzle · Karten · Sport)
- **Profil** mit Statistik, Erfolgen, Bestwerten je Spiel und änderbarem Namen
- **Ergebnisbildschirm** nach einer Runde — als gemeinsamer Baustein
  `components/RoundResult.tsx`, den alle künftigen Spiele verwenden
- **Ladebildschirm** mit Fynnox, Sprechblase und echtem Fortschritt
- **Weiterspielen-Reihe** auf dem Dashboard aus `recentGames`
- Die Spielkachel liegt in `components/GameTile.tsx` — eine einzige Stelle, damit
  Dashboard und Spieleliste nicht auseinanderlaufen

**Nachgewiesen** im Browser (390 × 844): Eine volle Runde bis „Feld voll!" gespielt
(35 Züge, 1.216 Punkte, 10 Reihen). Der Ergebnisbildschirm zeigte einen von drei Sternen,
32 XP, 12 Münzen, „Neuer Bestwert!" und „1 Mission geschafft".
Das Profil wies danach 1 Spiel, 12 gesammelte Münzen und Waldblöcke als Lieblingsspiel aus.
Eine Namensänderung überlebte das Neuladen der Seite.

Offen aus dieser Phase: Shop, Events, Freunde, Rangliste und Einstellungen sind noch
Platzhalter — sie gehören zu Phase 7 bzw. 8.

---

## Phase 5b — Echte Spielgrafik ✅

Die Oberfläche war bis dahin aus Farbflächen gebaut. Auf Hinweis des Auftraggebers
(„die Grafik genau so wie auf den Bildern") wurde sie auf das **Bildmaterial der
Konzeptbilder** umgestellt:

- `scripts/build-art.py` schneidet Porträts, Kulissen, Kachelbilder und App-Icons heraus
- Dashboard, Ladebildschirm, Spielkacheln, Kopfzeile, Profil und Waldblöcke nutzen sie
- Alles JPEG statt PNG: 2,8 MB → 0,9 MB
- Fynnox als **3D-Modell** aus `fynnox-adventure`, nachgeladen auf dem Profilbildschirm

**Nachgewiesen**: Alle Bildschirme im Browser bei 390 × 844 geprüft, keine Fehler.
Das 3D-Modell zeigt den richtigen Fynnox — orangefarbenes Fell, Fliegerbrille,
blauer Schal, grüne Kleidung, braune Handschuhe und Stiefel.

Dabei gefunden und behoben: `<Stage environment="city">` aus `drei` lädt seine
Beleuchtung zur Laufzeit aus dem Netz und bleibt offline schwarz — ersetzt durch
eigene Lichtquellen.

---

## Phase 6 — Die weiteren sieben Spiele

Jedes nach dem Muster von Waldblöcke: reine Logik in `logic/`, Darstellung in
`components/`, Zufall über einen Seed, Rundenergebnis über `applyRoundResult`.

### ✅ Blockfall

Das klassische Fallspiel. Erstes Spiel mit **Zeittakt** — die Logik kennt keine Uhr,
der Takt liegt in der Komponente.

- Sieben Steine mit je vier Drehungen, als fertige Feldlisten hinterlegt statt zur
  Laufzeit gedreht: Beim Rechnen mit Drehmatrizen verrutscht besonders das I-Stück.
- **7er-Beutel**: Jeder Stein kommt einmal vor, bevor sich einer wiederholt. Rein
  zufällig kann das gebrauchte lange Stück minutenlang ausbleiben — das empfindet
  niemand als fair.
- **Ausweichen beim Drehen**: Passt die Drehung nicht, wird sie um bis zu zwei Felder
  seitlich versetzt versucht. Ohne das ließe sich an der Wand nicht drehen.
- **Landepunkt-Anzeige** als Schatten — auf einem kleinen Bildschirm sonst kaum zu treffen.
- Punkte klassisch gestaffelt (40 / 100 / 300 / 1200 je nach Reihenzahl, mal Level),
  alle zehn Reihen ein Level höher.
- Bedienung über Knöpfe statt Wischgesten: Ein Stein muss oft mehrmals schnell
  hintereinander bewegt werden, dafür sind Knöpfe treffsicherer.

### ✅ Tempelpaare

Paare finden nach Mahjong-Regeln, 36 Steine in drei Schichten, drei Minuten Zeit.

- Ganzzahliges Raster **ohne** den halben Versatz des klassischen Mahjong: Versetzte
  Steine wären auf dem Handy zu klein zum Treffen.
- **Garantiert lösbar**: Das Rätsel wird rückwärts gebaut — es werden wiederholt zwei
  gleichzeitig freie Plätze gewählt und mit demselben Symbol belegt. Die dabei
  entstehende Zugfolge wird mitgeführt und räumt den Tempel sicher leer.
- Der **Hinweis** greift auf diese Zugfolge zurück statt auf ein beliebiges Paar.
  Ein Hinweis, der in eine Sackgasse führt, wäre keine Hilfe.
- **Mischen** verteilt die übrigen Symbole neu, und zwar nach demselben Verfahren —
  das Rätsel bleibt danach lösbar.

**Nachgewiesen**: 48 Tests für beide Spiele. Darunter der Beweis, dass die mitgelieferte
Zugfolge bei 40 verschiedenen Startzahlen regelkonform zum Sieg führt, und dass nach
dem Mischen wieder eine solche Folge existiert.

### ✅ Kristallmix

Match-3 auf 8 × 8 mit sechs Farben, 25 Zügen und einem Sammelziel.
Die festgelegten Regeln stehen im [Gamedesign](01-gamedesign.md).

- **Startfeld ohne fertige Reihen und mit garantiertem Zug.** Ein zufällig gefülltes Feld
  löst sich sonst beim ersten Blick von selbst auf — der Spieler bekäme Punkte, ohne
  etwas getan zu haben.
- **L- und T-Formen** werden als *ein* Treffer erkannt, nicht als zwei Reihen. Dafür
  werden überlappende Läufe verschmolzen; daraus entsteht die Bombe.
- **Kettenreaktionen**: Jede Folgeauflösung zählt einen Faktor höher.
- **Wirkungslose Tausche kosten keinen Zug** — sonst wären die 25 Züge mit Fehlversuchen
  verbraucht.
- Gibt es keinen Zug mehr, wird automatisch neu gemischt.

**Nachgewiesen**: 32 Tests, darunter Startfeld-Garantien über 30 Startzahlen und der
Nachweis, dass nach jedem Zug wieder ein Zug möglich ist.

Dabei gefunden: Tailwind v4 entfernt aus `@theme` alle Variablen, deren Namen nicht
wörtlich im Quelltext stehen. Weil die Kristallfarben zur Laufzeit zusammengesetzt werden
(`var(--color-gem-${farbe})`), fehlten sie im gebauten CSS und die Kristalle waren
unsichtbar. Solche Tokens stehen jetzt in einem normalen `:root`-Block.

### ✅ Sudoku

Klassisches 9 × 9 mit drei Stufen, drei Fehlern und drei Hinweisen.
Die festgelegten Regeln stehen im [Gamedesign](01-gamedesign.md).

- **Jedes Rätsel hat genau eine Lösung.** Vor dem Leeren eines Feldes wird geprüft, ob
  das Rätsel eindeutig bleibt; sonst bleibt die Zahl stehen. Ein mehrdeutiges Rätsel
  lässt sich nicht mehr durch Folgern lösen, nur noch raten.
- Der Löser rechnet mit **Bitmasken** je Zeile, Spalte und Block. Mit der einfachen
  Prüfung — jedes Feld gegen alle anderen — lief schon ein einzelner Testlauf minutenlang.
- **Falsche Zahlen bleiben rot stehen**, statt zu verschwinden. Kommentarloses Schlucken
  ließe den Spieler ratlos zurück, warum sein Zug nichts bewirkt hat.
- Notizen werden beim Setzen einer Zahl automatisch bei allen betroffenen Feldern
  gestrichen.

**Nachgewiesen**: 37 Tests, darunter Eindeutigkeit für alle drei Stufen über je fünf
Startzahlen. Vier Messungen halten die Erzeugungsdauer fest, damit der Rundenstart nicht
unbemerkt langsam wird. Im Browser geprüft: genau 42 Vorgaben auf „leicht" wie
dokumentiert, Hinweis füllt ein Feld, Fehlerzähler und Notizmodus reagieren.

### ✅ Bubble Shooter

Versetztes Raster mit 11 Spalten, fünf Farben, Zielhilfe mit Abprallern.
Die festgelegten Regeln stehen im [Gamedesign](01-gamedesign.md).

- **Versetztes Raster**: Gerade Reihen haben 11 Plätze, ungerade 10. Welche Felder
  aneinandergrenzen, hängt von der Reihennummer ab — dort gehen die meisten Fehler in
  Bubble-Shooter-Umsetzungen ein. Ein Test rechnet für **jedes** Feld nach, dass jeder
  Nachbar genau einen Durchmesser entfernt liegt.
- **Zielhilfe**: Die Bahn wird vollständig in der Logik berechnet, inklusive der
  Abpraller an den Seitenwänden, und als gepunktete Linie samt Landepunkt gezeigt.
  Ohne sie ist auf einem Handybildschirm kaum zu zielen.
- **Halt verlieren**: Gesucht wird umgekehrt — von der Decke aus wird markiert, was
  erreichbar ist; was übrig bleibt, fällt. Abgetrennte Blasen zählen doppelt.
- Es werden nur Farben ausgegeben, die auf dem Feld noch vorkommen. Eine Farbe, die es
  nicht mehr gibt, wäre ein sicherer Fehlschuss.

**Nachgewiesen**: 39 Tests. Im Browser gespielt: Zielhilfe folgt dem Finger, Schüsse
kommen an, Blasen platzen.

Zwei Fehler dabei gefunden:

1. **Nur jeder dritte Schuss kam an.** Chromium bindet einen Zeigervorgang an das Element,
   auf dem er begonnen hat; verschwindet dieses Element, bricht der Vorgang mit
   `pointercancel` ab und `pointerup` kommt nie. Weil das Feld nach jedem Schuss neu
   gezeichnet wird, traf das ab dem zweiten Schuss immer zu.
   Behoben durch zwei Maßnahmen zusammen: Alle Kinder des Feldes sind für den Zeiger
   durchlässig, sodass die Berührung am stabilen Container beginnt — und `pointerup`
   wird dauerhaft am Fenster abgefangen.
   Gemessen vorher: erster Zug `up`, danach nur `cancel`. Nachher: `cancel` bleibt bei
   null, jeder Schuss zählt.
2. Beim Nachrücken verschwanden Blasen, die unten aus dem Feld geschoben wurden,
   stillschweigend — das Feld leerte sich heimlich. Jetzt ist die Runde damit verloren.

### ✅ Fynnox Solitaire

Klondike mit einer gezogenen Karte, unbegrenztem Nachziehen, drei Hinweisen und
unbegrenztem Rückgängig. Die festgelegten Regeln stehen im [Gamedesign](01-gamedesign.md).

- **Keine Lösbarkeitsgarantie** — als einziges der bisherigen Spiele. Klondike lebt
  davon, dass nicht jedes Blatt aufgeht. Gegen den Frust helfen unbegrenztes
  Rückgängig und ein Aufgeben-Knopf; die Runde zählt dann als gespielt, aber ohne Sterne.
- **Rückgängig sichert den ganzen Zustand**, nicht nur den letzten Zug. Dadurch werden
  Punkte, Züge und aufgedeckte Karten gemeinsam zurückgenommen — ein Strafabzug als
  zweite Regel entfällt.
- **Punkte können nicht ins Minus rutschen.** Wer Karten zwischen Ablagestapel und
  Spalten hin und her schiebt, verliert 15 Punkte je Rückweg, kommt aber nie unter null.
- Der **Hinweis** schlägt nur Züge vor, die etwas bewirken: eine verdeckte Karte
  aufdecken, eine Spalte leeren oder ablegen. Karten zwischen zwei Spalten hin und her
  zu schieben ist erlaubt, aber keine Hilfe.
- **Stapel ohne Messung**: Karten überlappen über negative Prozent-Außenabstände.
  Prozentwerte bei `margin-top` rechnen gegen die Breite des Umfelds, nicht gegen die
  Höhe — dadurch skaliert der Stapel mit der Bildschirmbreite, ohne dass die
  Kartengröße im Code gemessen werden muss.

**Nachgewiesen**: 48 Tests. Im Browser bei 390 × 844 gespielt: sieben Spalten passen
ohne waagerechtes Scrollen nebeneinander (Kartenfläche 46 × 64 px), das Austeilen ergibt
1 bis 7 Karten je Spalte und 24 im Ziehstapel, vier Karten wurden auf die Ablagestapel
sortiert (50 Punkte), Rückgängig nahm die letzte Ablage zurück (4/52 → 3/52),
Hinweis und Talon-Umdrehen funktionieren, keine Konsolenfehler.

### Noch offen

1. **Minigolf** — zuletzt, weil Physik und sechs Bahnlayouts am meisten Aufwand sind

**Fertig, wenn**: Alle acht Spiele sind auf dem Handy spielbar und zahlen aufs selbe Profil ein.

---

## Phase 7 — Meta-Systeme

Abenteuerpfad, Missionsbildschirm mit drei Reitern, Erfolge, tägliche Belohnung,
Shop-Oberfläche (ohne Bezahlung), Events.

**Fertig, wenn**: Der Abenteuerpfad zeigt echten Fortschritt und Belohnungen sind abholbar.

Vorher zu klären: der Widerspruch zwischen elf Welten und einem Pfad bis Level 100
(siehe [Gamedesign](01-gamedesign.md)).

---

## Phase 8 — Cloud und Feinschliff

Supabase hinter dem bestehenden `SaveAdapter`, Cloud-Save, echte Ranglisten, Freunde.
Ton und Musik, Feinschliff der Animationen, Offline-Verhalten prüfen.

**Fertig, wenn**: Derselbe Spielstand erscheint auf Handy und Desktop.

---

## Was die Reihenfolge trägt

- Phase 3 vor Phase 4: Ein Spiel ohne Profil müsste später umgebaut werden.
- Waldblöcke vor allen anderen: einfachste Regeln, keine Zeitschleife, keine Physik —
  dadurch trägt es die Architektur, ohne sie zu verdecken.
- Minigolf zuletzt: einziges Spiel, das eventuell eine Engine braucht.
  Diese Entscheidung wird so lange wie möglich hinausgezögert.
- Dashboard nach dem ersten Spiel: Vorher gäbe es keine echten Zahlen anzuzeigen.
