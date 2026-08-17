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

Klondike über **zwölf Level**, die nacheinander freigeschaltet werden. Schwerer wird nie
das Blatt, sondern nur der Weg an die Karten: eine oder drei gezogene Karten, begrenzte
Talon-Durchläufe, weniger Hinweise. Die Leveltabelle steht im [Gamedesign](01-gamedesign.md).

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
- **Freigeschaltet wird durch einen Sieg**, nicht durchs Spielen: Ans Rundenergebnis
  wird `level` nur bei Gewinn gemeldet. Sonst käme man durch zwölfmaliges Aufgeben ans
  Ende der Leiter.
- **Vorgelegte Asse** in Level 1 und 2 werden vor dem Austeilen aus dem Blatt genommen.
  Der Ziehstapel ist dann kleiner — keine Karte ist doppelt im Spiel.
- **Sackgassen-Erkennung**, nötig geworden durch die begrenzten Talon-Durchläufe. Der
  Rückweg vom Ablagestapel zählt dabei nicht als Zug: Er ist fast immer möglich und
  würde jede Sackgasse verdecken.
- **Karten so groß wie möglich**: Sieben Spalten auf 390 px sind die harte Grenze. Das
  Spielfeld läuft am Handy darum bis an den Bildschirmrand statt im 16-px-Raster der
  übrigen Bildschirme — das allein bringt 32 px, also gut 4 px je Karte.

**Nachgewiesen**: 69 Tests. Im Browser bei 390 × 844 geprüft: sieben Spalten passen ohne
waagerechtes Scrollen nebeneinander (Kartenfläche 52 × 73 px), das Austeilen ergibt 1 bis
7 Karten je Spalte, vier Karten wurden auf die Ablagestapel sortiert (50 Punkte),
Rückgängig nahm die letzte Ablage zurück (4/52 → 3/52), Hinweis und Talon-Umdrehen
funktionieren. Zum Levelsystem: Level 1 legt zwei Asse vor (HUD zeigt 2/52), Aufgeben
lässt Level 2 gesperrt, ein Spielstand mit `highestLevel: 3` öffnet genau Level 1 bis 4,
Level 12 zieht drei Karten auf einmal, zeigt „Talon: noch 1×" und sperrt den
Hinweisknopf. Keine Konsolenfehler.

### ✅ Fynnox Minigolf

Sechs Bahnen, nacheinander freigeschaltet. Eine Bahn ist eine Runde.

- **Keine Engine.** CLAUDE.md hat diese Entscheidung bis Minigolf offengehalten; hier ist
  sie gefallen. Es braucht Kreis-gegen-Strecke, Reflexion und Reibung — rund 180 Zeilen
  in `logic/physics.ts`. PixiJS oder Phaser hätten ein Megabyte Abhängigkeit gebracht und
  gegen die Regel „Spiellogik frei von React und ohne Rendering testbar" gearbeitet.
- **Feste Schrittweite von 1/240 s** statt der Bildrate. Das war die riskanteste Annahme:
  Bei großen Schritten legt ein schneller Ball in einem Sprung mehr zurück, als die Bande
  dick ist, und fliegt hindurch. Ein Test schießt aus sechs Richtungen mit voller Kraft
  und prüft, dass der Ball im Feld bleibt.
- **Einlochen wird auf der Strecke geprüft**, nicht am Endpunkt. Bei knapp erlaubtem Tempo
  läge der Ball sonst in einem Schritt vor und im nächsten hinter dem Loch.
- **Zwei echte Fehler, die die Tests gefunden haben**: Die Piratenbucht war unspielbar,
  weil ihre Bande über die ganze Breite lief und den Startbereich zu einem geschlossenen
  Kasten machte. Und der Wind beschleunigte auch einen liegenden Ball weiter — Reibung
  bremst anteilig, Wind schiebt absolut, beide finden sich bei rund 10 Einheiten/s und
  damit über der Ruhegrenze. Wind wirkt jetzt nur auf einen rollenden Ball.
- **Kein Zufall**: das einzige der acht Spiele, das keine Zufallszahl braucht. Richtung
  und Kraft des Schlags bestimmen alles.

**Nachgewiesen**: 50 Tests, darunter für jede Bahn eine Suche, die tatsächlich einlocht.
Im Browser bei 390 × 844 gespielt: Bahn 1 offen und 2 bis 6 gesperrt, Zielen setzt die
Linie, der Ball rollt von (37, 138) los und bleibt bei (52, 92) liegen, der Schlagzähler
geht auf 1/8, die Kraftskala greift, kein waagerechtes Scrollen, keine Konsolenfehler.

**Phase 6 ist damit abgeschlossen** — alle acht Spiele sind spielbar.

---

## Phase 7 — Meta-Systeme ✅

Abenteuerpfad, Missionsbildschirm mit drei Reitern, Erfolge, tägliche Belohnung,
Shop-Oberfläche (ohne Bezahlung), Events.

**Fertig, wenn**: Der Abenteuerpfad zeigt echten Fortschritt und Belohnungen sind abholbar.

Der frühere Vorbehalt „Widerspruch zwischen elf Welten und einem Pfad bis Level 100" ist
seit dem 29.07.2026 erledigt: Das [Gamedesign](01-gamedesign.md) legt Entwurf B verbindlich
fest — Kapitel zu 15 Leveln, **ein Kapitel je Welt**. Neun Kapitel ergeben 135 Stufen und
damit mehr als die 100 Level des alten Entwurfs, nur in Kapitel geschnitten.

### Zuerst entschieden, dann gebaut

Fünf Balancing-Fragen waren im Gamedesign als *OFFEN* markiert und wurden dort mit
Begründung festgelegt, bevor eine Zeile Code entstand: Missionspool und Reset-Zeitpunkt,
Belohnungsleiter der Tagesbelohnung, Verhalten auf einem Abenteuer-Knoten, Eventkatalog
und Erfolgsliste.

Die wichtigste davon: **Ein Knoten ist eine Runde in einem vorgegebenen Spiel und gilt ab
einem Stern als geschafft.** Ein eigenes Punkteziel je Knoten schied aus, weil die
Punktebereiche der acht Spiele um den Faktor zehn auseinanderliegen (Minigolf rund 300 bis
1.500, Sudoku bis 4.700) — es hätte eine zweite Balancing-Tabelle neben den bereits
geeichten Sternschwellen gebraucht.

### Was dazukam

- **Reine Module** nach dem Muster von `energy.ts`, alle ohne Uhr: `core/time.ts`
  (Kalenderrechnung in Ortszeit), `missions.ts`, `dailyReward.ts`, `adventure.ts`,
  `events.ts`, `shop.ts`, `achievements.ts`
- **`core/round.ts` blieb unangetastet** — `missionDelta` zählte alle Missionsarten schon
  seit Phase 3 hoch, es fehlten nur Inhalte und Oberfläche. Der Abenteuerpfad hängt am
  selben Rundenergebnis, steht aber daneben statt darin
- **Vier Platzhalter weniger**: Abenteuerpfad, Shop, Events und Erfolge sind echte
  Bildschirme. Freunde, Rangliste und Einstellungen bleiben bis Phase 8
- **`SAVE_VERSION` 1 → 2** mit Migration in `adapter.ts`: `ownedItems` für gekaufte Waren.
  Das war die einzige nötige Strukturänderung — Missionen, Erfolge und Abenteuerpfad waren
  im Datenmodell von Anfang an vollständig angelegt

Tage werden über den Date-Konstruktor addiert, nicht über Millisekunden: An den
Umstellungswochenenden ist ein Tag 23 bzw. 25 Stunden lang, mit fester Millisekundenzahl
läge der Tageswechsel danach eine Stunde daneben.

**Nachgewiesen**: 385 Tests (davon 70 neu). Im Browser bei 390 × 844 mit abgeschaltetem
Service Worker geprüft:

- Tagesbelohnung abgeholt — 500 → 600 Münzen, Knopf danach „Abgeholt", Anzeige „Tag 2 von 7 ·
  nächste in 13 h 50 m"
- Missionsreiter gewechselt: täglich „Erneuert sich in 13 h 50 m", wöchentlich und Event
  „6 T 13 h"
- Abenteuerpfad Kapitel 1 Sonnenwald, Knoten 1 verlangt Blockfall, „Starten" führt nach
  `#/spiel/blockfall`. Mit Teilfortschritt: Knoten 1–3 mit Sternen, Knoten 4 hervorgehoben,
  ab 5 gesperrt, Kopf „★ 6 von 45 Sternen", Balken 3/15
- Volles Kapitel: Truhe geöffnet → 500 → 1.620 Münzen (31 Sterne × 20 + 500) und 50 → 75
  Kristalle, danach Kapitel 2 Kristallhöhlen. Überlebt das Neuladen
- Shop: Piratenoutfit zunächst „Zu teuer · 💎 1.200", nach Aufstocken gekauft — Kristalle
  5.000 → 3.800, Sammlung 1/12, bleibt nach dem Neuladen erhalten. Euro-Waren tragen
  „Keine Bezahlung" und sind nicht anklickbar
- Events: Hauptevent Monsterjagd mit Mission „Räume 200 Reihen", Täglicher Bonus als
  aktives Event mit „Bereit!", drei kommende Events mit Countdown
- Kein waagerechtes Scrollen auf einem der sechs Bildschirme, keine Konsolenfehler

### Nachtrag: zwei Kapitel aus den Nachbarprojekten

Auf Hinweis des Auftraggebers wurde das Bildmaterial von `fynnox-adventure` (140 Blätter)
und `fynnox-city` (533 sortierte Bilder) gesichtet. Brauchbar waren **zwei** Kulissen:

- **Kapitel 8 „Unterwasserwelt"** — eine gemalte Über-/Unterwasserszene aus
  `fynnox-adventure`. Damit ist der Satz „für Unterwasser gibt es kein Bildmaterial" im
  Gamedesign hinfällig und wurde korrigiert.
- **Kapitel 9 „Fynnox City"** — die Hafenpromenade aus dem Produktionspaket von
  `fynnox-city`, auf ausdrücklichen Wunsch des Auftraggebers. Sie ist die **erste Welt
  außerhalb der elf Welten des Masterprompts**; der Widerspruch ist im Gamedesign benannt
  und entschieden. Sie ist außerdem die einzige 3D-Renderansicht unter lauter gemalten
  Kulissen — hinter dem dunklen Verlauf des Kapitelkopfs fällt das kaum auf.

Beide Vorlagen liegen jetzt in `docs/referenzen/`, nicht als Pfad ins Nachbarprojekt:
Ein solcher Pfad wäre auf keinem zweiten Rechner reproduzierbar.

Dabei aufgefallen: Mit neun Kapiteln und acht Spielen **muss** sich eine Startreihenfolge
wiederholen — Kapitel 9 beginnt wie Kapitel 1. Der Test, der vorher „kein Kapitel beginnt
wie ein anderes" verlangte, wurde darauf umgestellt, dass erst alle acht Spiele drankommen,
bevor eines wiederkehrt. Das ist keine Abschwächung, sondern die Obergrenze dessen, was mit
acht Spielen überhaupt geht.

Candy, Steampunk und Weltraum fehlen weiterhin — was dort danach aussieht, sind Rennstrecken
aus Pet Cars. Was sonst gesichtet und **nicht** übernommen wurde, steht mit Begründung im
[Art-Guide](03-art-ui-guide.md), damit niemand ein zweites Mal sucht.

---

## Phase 8 — Cloud und Feinschliff

Supabase hinter dem bestehenden `SaveAdapter`, Cloud-Save, echte Ranglisten, Freunde.
Ton und Musik, Feinschliff der Animationen, Offline-Verhalten prüfen.

**Fertig, wenn**: Derselbe Spielstand erscheint auf Handy und Desktop.

### ✅ Einstellungen — vorgezogen am 17.08.2026

Der einzige Teil dieser Phase, der **kein Backend** braucht, und darum vorgezogen:
`settings` stand seit Phase 3 im Spielstand, wurde aber von keiner Zeile gelesen.

Drei Gruppen wie im Mockup, dazu Datenschutz, Hilfe und ein Zurücksetzen mit
Rückfrage. Schalter, die heute noch nichts bewirken — Musik, Soundeffekte,
Energiesparmodus, Benachrichtigungen — tragen sichtbar die Marke **später**.
Ein Schalter, der nichts tut, ohne es zu sagen, ist eine Lüge in der Oberfläche.
Die Vibration wirkt bereits: Beim Einschalten rüttelt das Gerät kurz, sofern es das kann.

**Nachgewiesen** im Browser bei 390 × 844: Fünf Schalter, „Musik" umgestellt →
`aria-checked` und der gespeicherte Wert wechseln beide und überleben das Neuladen.
Zeilenhöhe 73 px, kein waagerechtes Scrollen, keine Konsolenfehler.

**Es bleiben Platzhalter**: Freunde und Rangliste. Beide brauchen einen Server,
sonst wären ihre Zahlen erfunden. *(Erledigt am 17.08.2026 — siehe unten.)*

### ✅ Ton und Musik

Klangeffekte prozedural über WebAudio (`src/core/audio.ts`), fünf Anlässe: Sieg,
Niederlage, Belohnung, Truhe, Kauf. Keine Dateien, keine Lizenzfrage, kein Byte
im Vorab-Cache. Die Musikschleife aus `fynnox-adventure` kommt mit, bleibt aber
aus dem Vorab-Cache heraus — Begründung mit gemessenen Zahlen in
[docs/01-gamedesign.md](01-gamedesign.md), „Ton und Musik".

**Nachgewiesen** bei 390 × 844: vor jeder Nutzergeste 0 AudioContext (Autoplay-Sperre
eingehalten), nach dem Abholen der Tagesbelohnung 1 Context und 3 Oszillatoren.
Frisches Profil mit ausgeschalteten Soundeffekten: 0 und 0.

### ✅ Freunde und Rangliste

Die letzten beiden Platzhalter sind weg. Neun Begleitfiguren mit **gesäten** Werten,
eigene Zeile aus echten Werten des Spielstands, eine Trophäenformel für alle.
Beide Bildschirme schreiben sichtbar hin, dass die Gegner Spielfiguren sind.
Festlegung samt Begründung in [docs/01-gamedesign.md](01-gamedesign.md).

**Nachgewiesen** bei 390 × 844: neun Freunde mit Porträt, Rolle und Zustand,
vier davon online; Rangliste mit zehn Zeilen und der eigenen auf Platz 10.
19 neue Tests.

### ✅ Cloud-Speicher

Anonyme Geräte-ID plus sechsstelliger Kopplungscode — kein Konto, kein Passwort.
Der Widerspruch zwischen „keine Accounts" (CLAUDE.md) und „derselbe Spielstand auf
Handy und Desktop" ist in [docs/04-datenmodell.md](04-datenmodell.md) aufgelöst und
begründet, ebenso die Regel zum Zusammenführen zweier Stände.

**Nachgewiesen** bei 390 × 844 und 1280 × 800, gegen einen im Test nachgebildeten
Server: Handy mit Level 9 und 123 Runden koppelt, Desktop mit frischem Profil
übernimmt Name, Level, Münzen und Runden; danach spielt der Desktop weiter und das
Handy holt es ab. Ein Stand der Version 2 überlebt die Migration vollständig.

**Noch offen**: `supabase/schema.sql` ist nie gegen ein echtes Supabase-Projekt
gelaufen — es gibt keins. Geprüft ist alles, was im Browser läuft; ungeprüft ist
das SQL selbst. Damit ist das Abschlusskriterium der Phase auf der Client-Seite
erfüllt, aber nicht im Betrieb.

### ✅ Offline-Verhalten — zum ersten Mal gemessen

Gemessen am 17.08.2026 mit **gestopptem Vorschau-Server**, nicht mit Playwrights
`set_offline()`: Das blockiert nur Anfragen der Seite, nicht die des Service Workers —
eine nachgeladene Datei käme trotz „offline" durch, und das Ergebnis wäre geschönt.

| Frage | Ergebnis |
|---|---|
| Startet die App ohne Netz? | ja |
| Fehlen Kulissen? | nein — 31 JPEG im Vorab-Cache, 0 kaputte Bilder |
| Läuft eine Runde durch? | ja — Tempelpaare gestartet, 38 Felder, 6 Züge, keine Fehler |
| Bleibt der Spielstand? | ja — Energie 5 → 4 abgezogen und über zwei Neuladungen gehalten |
| Wiederverbinden? | unauffällig, der Stand bleibt unverändert |

**Zwei Dateien fehlen offline bewusst**, weil beide zu groß für den Vorab-Cache sind
(zusammen 6,4 MB gegenüber heute 2,58 MB insgesamt):

- `musik.mp3` (3,97 MB) — der einzige fehlgeschlagene Netzaufruf im ganzen Offline-Lauf
- `models/fynnox.glb` (2,4 MB) — die 3D-Ansicht von Fynnox

Beide holen sich ihre Datei beim ersten Gebrauch über eine `CacheFirst`-Regel und
sind danach dauerhaft offline verfügbar.

**Dabei gefunden und behoben**: Die 3D-Ansicht riss ohne Netz den Ladezustand mit —
`useGLTF` wirft, und unter `Suspense` braucht ein geworfener Fehler eine Fehlergrenze.
Sie zeigt jetzt „Fynnox in 3D braucht beim ersten Mal eine Internetverbindung" samt
Knopf zum erneuten Versuch, und der Profilbildschirm bleibt vollständig stehen.
Ein Konsoleneintrag des GLTF-Laders bleibt — der kommt aus three selbst und ist
Rauschen, kein unbehandelter Zustand.

### ✅ Feinschliff der Animationen — ohne neue Abhängigkeit

Framer Motion bleibt draußen. Geprüft wurde, was animiert werden soll: Der
Zahlenanstieg im Ergebnisbildschirm sind 25 Zeilen `requestAnimationFrame`, die
Truhe im Abenteuerpfad sind CSS-Keyframes. Der Kartenzug bei Solitaire wäre der
einzige Grund für eine Bibliothek gewesen — er verlangte aber einen Eingriff in
ein fertiges, im Browser belegtes Spiel. Begründung in
[docs/01-gamedesign.md](01-gamedesign.md), „Bewegung".

**Der Energiesparmodus wirkt jetzt** — der vierte und letzte Schalter, der „später"
trug. Zusammen mit der Systemeinstellung `prefers-reduced-motion` setzt er
`data-motion="off"` auf das Wurzelelement; eine einzige CSS-Regel kürzt daraufhin
alle Übergänge der App, auch die aus früheren Phasen.

**Nachgewiesen** bei 390 × 844 in einem Lauf:

| Fall | Ergebnis |
|---|---|
| Voreinstellung | `data-motion="on"`, 15 Zwischenstände von „⭐ 0 XP · 🪙 0" bis „⭐ 20 XP · 🪙 10" |
| Energiesparmodus an | `data-motion="off"`, genau **ein** Stand — der Zähler springt sofort |
| Gerät meldet „Bewegung reduzieren" | `data-motion="off"`, ohne den Schalter im Spielstand zu verändern |

Übergangsdauer im Energiesparmodus gemessen: 1e-05s. Bewusst nicht 0s — bei genau
null feuert `transitionend` in manchen Browsern nicht mehr.

**Damit trägt kein Schalter im Einstellungsbildschirm mehr die Marke „später"**,
außer den Benachrichtigungen, die eine Geräteerlaubnis brauchen.

---

## Was die Reihenfolge trägt

- Phase 3 vor Phase 4: Ein Spiel ohne Profil müsste später umgebaut werden.
- Waldblöcke vor allen anderen: einfachste Regeln, keine Zeitschleife, keine Physik —
  dadurch trägt es die Architektur, ohne sie zu verdecken.
- Minigolf zuletzt: einziges Spiel, das eventuell eine Engine braucht.
  Diese Entscheidung wird so lange wie möglich hinausgezögert.
- Dashboard nach dem ersten Spiel: Vorher gäbe es keine echten Zahlen anzuzeigen.
