# Gamedesign

Alle Regeln und Zahlen hier stammen aus [den Konzeptbildern](referenzen/) oder dem
[Masterprompt](00-masterprompt.md). Was dort nicht steht, ist als **OFFEN** markiert und
wird nicht geraten.

---

## Die sechs Kernspiele

Technische IDs sind unveränderlich: `blockfall`, `waldbloecke`, `tempelpaare`,
`kristallmix`, `solitaire`, `minigolf`.

Jedes Spiel hat eine **Begleitfigur**, die es erklärt (siehe [Charakterbibel](02-charakterbibel.md)),
und einen **Bestwert**, der auf der Spielkachel steht:

| Spiel | Begleitfigur | Bestwert auf der Kachel |
|---|---|---|
| Blockfall | Fynnox | Bestes Level |
| Waldblöcke | Mira | Bestes Level |
| Tempelpaare | Finn | Bestzeit |
| Kristallmix | Lumo | Bestes Level |
| Solitaire | Fynnox | Bestzeit |
| Minigolf | Pip | Bestes Level (= erreichte Bahn) |

### 1. Blockfall — `blockfall`

Fallende Blöcke, klassisch. *"Räume Reihen ab und verhindere, dass die Blöcke den Himmel erreichen!"*

- **Ablauf**: Bewegen → Drehen → Platzieren → volle Reihe wird entfernt
- **Regeln**: Blöcke fallen von oben; vollständig gefüllte Reihen verschwinden;
  das Spiel endet, wenn der Stapel oben anstößt (Endlos-Modus, kein Sieg)
- **HUD**: Hold-Feld, Nächster Block, Level, Punkte, Linien, Linien-Ziel
- **Extras**: Combo-Zähler (`COMBO x4`), Sonderanzeige bei vier Reihen gleichzeitig (`TETRIS!`),
  vier Power-Up-Plätze mit Anzahl
- **Missionsbeispiele**: „Räume 40 Reihen ab" (100 Münzen), „Erreiche 25.000 Punkte" (150),
  „Nutze 3 Bomben" (100)

**Festgelegt in Phase 6, nachgetragen am 17.08.2026** (stand hier zu lange als *OFFEN*,
obwohl der Code die Werte längst hatte):

| Punkt | Festlegung |
|---|---|
| Punkte je Räumung | 40 / 100 / 300 / 1.200 für ein bis vier Reihen, mal aktuelles Level |
| Levelaufstieg | alle 10 geräumte Reihen |
| Fallgeschwindigkeit | `max(110, 1.200 − (Level − 1) × 70)` Millisekunden je Schritt |

**Zur Fallgeschwindigkeit** — geändert am 17.08.2026 auf Hinweis des Auftraggebers
(„bei Level 1 sollen die Blöcke nicht sofort so schnell runtergehen"):

Level 1 lag bei **800 ms**, dem Wert der Vorlage aus den Achtzigern. Der passt hier nicht:
Dort wurde mit einer Tastatur gespielt, hier mit Knöpfen auf einem Handybildschirm. Einen
Stein an den linken Rand zu schieben und zweimal zu drehen sind vier Tipps — in 800 ms
nicht zu schaffen. Der Einstieg beginnt darum bei **1.200 ms**; das alte Tempo ist ab
Level 6 erreicht, die Untergrenze von 110 ms ab Level 17.

- **OFFEN**: welche vier Power-Ups genau (die Mockups zeigen vier Plätze, aber keine Wirkung)

### 2. Waldblöcke — `waldbloecke` ← **erstes zu bauendes Spiel**

Block-Puzzle ohne Zeitdruck. *"Fülle das Raster mit Blöcken und sammle Sterne!"*

- **Ablauf**: Block aus dem Vorrat wählen → auf das Raster ziehen → volle Reihe/Spalte
  verschwindet → Sterne sammeln
- **Regeln**: Drei Blockformen liegen als Vorrat bereit; Blöcke werden **nicht gedreht**;
  gefüllte Reihen **und** Spalten werden entfernt; das Spiel endet, wenn keiner der
  drei Vorratsblöcke mehr irgendwo passt
- **HUD**: bis zu 3 Sterne, aktuelle Punkte, Bestwert
- **Extras**: Kombo-Wertung bei mehreren Reihen gleichzeitig, Punkteanzeige am Ort des Zuges (`+240`)
- **Missionsbeispiele**: „Fülle 10 Reihen" (100), „Erziele 5 Kombos" (150), „Erreiche 5 Sterne" (200)
- **Raster**: 8×8 (aus den Mockups abgelesen)
- **OFFEN**: Punkte pro Feld/Reihe/Kombo, Sternschwellen, Formenkatalog des Vorrats

### 3. Tempelpaare — `tempelpaare`

Mahjong-Paare. *"Finde alle passenden Paare und räume den Tempel!"*

- **Ablauf**: Stein wählen → passenden freien Stein finden → Paar verschwindet → Tempel leeren
- **Regeln**: Nur freiliegende Steine sind wählbar; gleiche Symbole bilden ein Paar;
  gewonnen ist, wenn das Brett leer ist; verloren bei Zeitablauf
- **HUD**: Countdown, Züge
- **Hilfen**: Hinweis, Mischen, Rückgängig — jeweils mit begrenzter Anzahl
- **Extras**: Kombo bei schnellen Paaren hintereinander
- **Missionsbeispiele**: „Räume den Tempel" (100), „Schaffe es unter 3 Minuten" (150),
  „Nutze keinen Hinweis" (200)
- **OFFEN**: Startzeit pro Level, Steinlayouts, Symbolsatz, Anzahl der Hilfen pro Level

### 4. Kristallmix — `kristallmix`

Match-3. *"Kombiniere Kristalle und erzeuge mächtige Explosionen!"*

- **Ablauf**: Zwei benachbarte Kristalle tauschen → ab drei gleichen in einer Reihe
  verschwinden sie → ab vier entsteht ein Power-Up → Power-Up auslösen
- **Regeln**: Zugbegrenzung statt Zeit; jedes Level hat ein Sammelziel
  (z. B. 12 blaue Kristalle); verloren, wenn die Züge aufgebraucht sind
- **HUD**: verbleibende Züge, Levelziel mit Symbol und Anzahl
- **Extras**: Regenbogenstein als stärkstes Power-Up, Lob-Einblendungen (`Sweet!`)
- **Missionsbeispiele**: „Sammle 100 blaue Kristalle" (100), „Erzeuge 5 Regenbogensteine" (150),
  „Schaffe 20 Explosionen" (100)

**Festgelegt am 29.07.2026** (war offen: Feldgröße, Farben, Power-Up-Regeln):

| Punkt | Festlegung | Begründung |
|---|---|---|
| Feldgröße | 8 × 8 | Passt hochkant aufs Handy; bei 44 px Zielfläche bleiben die Kristalle gut treffbar |
| Farben | 6 | Bei 5 räumt sich das Feld fast von allein, bei 7 wird das Sammelziel zäh |
| Züge je Runde | 25 | |
| Sammelziel | 20 Kristalle einer Farbe | Die Farbe wird zu Rundenbeginn ausgelost |

**Power-Ups**:

| Entsteht aus | Power-Up | Wirkung |
|---|---|---|
| 4 in einer Reihe | Streifenkristall | Räumt die ganze Zeile bzw. Spalte |
| 5 in einer Reihe | **Regenbogenstein** | Räumt alle Kristalle einer Farbe |
| L- oder T-Form (5 über Eck) | Bombe | Räumt das 3 × 3-Feld ringsum |

Ein Power-Up entsteht auf dem Feld, das zuletzt bewegt wurde, und löst aus, sobald es
selbst Teil eines Zuges wird.

**Punkte**: 30 für drei Kristalle, 60 für vier, 100 für fünf, 20 je Kristall, den ein
Power-Up räumt. Jede Folgeauflösung derselben Kette zählt einen Multiplikator höher
(erste Auflösung × 1, zweite × 2, dritte × 3 …).

**Startfeld**: enthält nie bereits fertige Dreierreihen und immer mindestens einen
möglichen Zug. Gibt es später keinen Zug mehr, wird automatisch neu gemischt.

### 5. Fynnox Solitaire — `solitaire`

Klondike-Solitaire. *"Sortiere alle Karten auf die Stapel und gewinne das Spiel!"*

- **Ablauf**: Karte wählen → verschieben → die vier Ablagestapel aufbauen → gewinnen
- **Regeln**: In den Spalten absteigend und mit wechselnder Farbe ablegen;
  die vier Ablagestapel aufsteigend nach Farbe von Ass bis König; gewonnen, wenn alle
  52 Karten abgelegt sind
- **HUD**: Zeit, Punkte, Züge
- **Hilfen**: Hinweis, Rückgängig, Neu mischen
- **Missionsbeispiele**: „Gewinne 3 Spiele" (150), „Unter 5 Minuten gewinnen" (150),
  „Ohne Rückgängig gewinnen" (200)

**Festgelegt am 12.08.2026** (war offen: Punktesystem, eine oder drei Karten ziehen,
Anzahl der Hilfen):

| Punkt | Festlegung | Begründung |
|---|---|---|
| Karten ziehen | **eine** im Einstieg, **drei** ab Level 7 | Bei drei Karten ist jede dritte Talonkarte nur über mehrere Durchläufe erreichbar — als Einstieg zu zäh, als Steigerung genau richtig |
| Talon-Durchläufe | **unbegrenzt**, in hohen Leveln begrenzt | Mit einer Karte und unbegrenzten Durchläufen ist der weitaus größte Teil der Blätter gewinnbar. Die Begrenzung ist die schärfste Schraube und kommt darum zuletzt |
| Hinweise | **3**, sinkt bis auf 0 | Startwert wie bei Tempelpaare und Sudoku — der Spieler soll nicht je Spiel neu lernen, wie viel Hilfe er hat |
| Rückgängig | **unbegrenzt**, in jedem Level | Solitaire lebt vom Ausprobieren. Ein Zug, der eine Sackgasse erzeugt, wäre sonst das Ende der Runde |
| Zeitlimit | **keins** | Die Kachel verspricht „Klassisch. Entspannt. Zeitlos." Die Zeit zählt nur für Punkte und Sterne, sie beendet nichts |

**Ergänzt am 17.08.2026 auf Wunsch des Auftraggebers:**

| Punkt | Festlegung | Begründung |
|---|---|---|
| Ein Tipp legt ab | Passt die angetippte Karte auf **ihren Ablagestapel**, wandert sie sofort dorthin. Sonst wird sie wie bisher nur ausgewählt | Auf einem Ablagestapel hat jede Karte genau einen richtigen Platz — „wo sie hingehört" ist dort eindeutig |
| Nicht in die Spalten | In eine Spalte wird **nie** automatisch gelegt | Dieselbe Karte passt oft auf mehrere Spalten, und welche davon weiterhilft, weiß nur der Spieler. Automatisch abgelegt nähme ihm das Antippen die Entscheidung ab |
| Nur einzelne Karten | Eine angefasste Folge bleibt zusammen | Wer mehrere Karten aufnimmt, will sie in eine Spalte legen, nicht auseinanderreißen |
| Dreierzug frei wählbar | Drei Karten sind in **jedem** Level einstellbar, auch in Level 1 | Der Dreierzug ist die klassische Variante. Sie erst nach sechs gewonnenen Leveln freizugeben hält Spieler von dem Spiel fern, das sie eigentlich kennen |
| Umgekehrt nicht | Ein Level, das drei Karten vorsieht, lässt sich **nicht** auf eine herunterstellen | Sonst wäre die Freischaltleiter über eine Einstellung auszuhebeln: Level 7 auf Einsteigerbedingungen gewinnen und trotzdem Level 8 öffnen |

Die Variante wird beim Levelwechsel auf den Wert des Levels zurückgesetzt — eine einmal
gewählte Einstellung soll sich nicht unbemerkt durch die ganze Leiter schleppen.

**„Neu mischen"** aus der Hilfenliste ist bei Klondike das Umdrehen des Talons: Ist der
Ziehstapel leer, wandern die abgelegten Karten in der ursprünglichen Reihenfolge zurück.
Ein Neumischen des ganzen Blattes gibt es nicht — das wäre eine neue Partie, kein Zug.

**Punkte** — je Aktion, sichtbar während der Partie:

| Aktion | Punkte |
|---|---|
| Karte auf einen Ablagestapel | +10 |
| verdeckte Spaltenkarte aufgedeckt | +5 |
| Karte vom Talon in eine Spalte | +5 |
| Karte vom Ablagestapel zurück in eine Spalte | −15 |

Der Abzug für den Rückweg vom Ablagestapel verhindert, dass sich durch Hin- und
Herlegen beliebig viele Punkte sammeln lassen. **Rückgängig nimmt auch die Punkte
zurück** — es wird der komplette vorige Zustand wiederhergestellt. Das ist ehrlicher
als ein Strafabzug und braucht keine zweite Regel.

Bei Sieg zusätzlich einen Siegbonus von `300 + Level × 100` plus einen Zeitbonus von
`900 − verbrauchte Sekunden` (mindestens 0). Nach 15 Minuten gibt es also keinen
Zeitbonus mehr. Der Levelanteil sorgt dafür, dass sich die schweren Level lohnen —
sonst spielt jeder ewig Level 1.

**Sterne**: drei, wer die Zielzeit seines Levels unterbietet, zwei bis zum Doppelten
dieser Zeit, sonst einer. Wer aufgibt oder feststeckt, bekommt keinen.

**Keine Lösbarkeitsgarantie** — bewusst anders als bei Tempelpaare, Kristallmix und
Sudoku. Klondike ist gerade deshalb ein Klassiker, weil nicht jedes Blatt aufgeht; ein
Spiel, das man immer gewinnt, verliert seinen Reiz. Gegen den Frust helfen das
unbegrenzte Rückgängig und ein **Aufgeben**-Knopf, der die Runde ohne Sterne beendet.

#### Zwölf Level — festgelegt am 12.08.2026

Eine einzelne Variante war zu wenig; das Spiel braucht einen Fortschritt. Schwerer wird
**nie das Blatt**, sondern immer nur der Weg an die Karten heran. Vier Dreiergruppen
über vier Achsen:

| Level | Name | Ziehen | Talon umdrehen | Hinweise | Vorgelegt | 3 Sterne unter |
|---|---|---|---|---|---|---|
| 1 | Erste Runde | 1 | beliebig | 3 | 2 Asse | 6:00 |
| 2 | Aufwärmen | 1 | beliebig | 3 | 1 Ass | 6:00 |
| 3 | Klassisch | 1 | beliebig | 3 | — | 5:00 |
| 4 | Weniger Hilfe | 1 | beliebig | 2 | — | 5:00 |
| 5 | Dreimal durch | 1 | 3× | 2 | — | 5:00 |
| 6 | Zweimal durch | 1 | 2× | 2 | — | 4:30 |
| 7 | Dreierzug | 3 | beliebig | 2 | — | 5:00 |
| 8 | Sparsam | 3 | beliebig | 1 | — | 4:30 |
| 9 | Enger Talon | 3 | 3× | 1 | — | 4:30 |
| 10 | Knapp | 3 | 2× | 1 | — | 4:00 |
| 11 | Ohne Hilfe | 3 | 2× | 0 | — | 4:00 |
| 12 | Meisterrunde | 3 | 1× | 0 | — | 3:30 |

- **Vorgelegte Asse** (Level 1 und 2) werden vor dem Austeilen aus dem Blatt genommen
  und liegen von Anfang an auf ihrem Ablagestapel. Der Ziehstapel ist dann entsprechend
  kleiner; keine Karte ist doppelt im Spiel. Sie nehmen dem Einstieg die Anlaufhürde,
  ohne eine Regel zu verbiegen.
- **Level 7 springt bei der Zielzeit zurück** auf 5:00. Der Dreierzug kostet Zeit — die
  gleiche Vorgabe wie in Level 6 wäre eine versteckte doppelte Verschärfung.
- **Freigeschaltet wird durch einen Sieg**, nicht durchs Spielen. Sonst käme man durch
  zwölfmaliges Aufgeben bis ans Ende.

**Sackgasse**: Mit begrenzten Talon-Durchläufen kann eine Partie wirklich feststecken.
Ist kein regelkonformer Zug mehr möglich, ist die Runde verloren und das Spiel sagt es.
Der Rückweg vom Ablagestapel in eine Spalte zählt dabei **nicht** als Zug — er ist fast
immer möglich und würde jede Sackgasse verdecken. Alles andere zählt mit, auch Züge, die
nichts bringen: Lieber einmal zu selten „Schluss" sagen als eine Runde beenden, die noch
zu gewinnen wäre.

### 6. Fynnox Minigolf — `minigolf`

Minigolf mit Physik. *"Ziele, schlage und loch ein! Hole in One für extra Sterne!"*

- **Ablauf**: Zielen → Schlagkraft über eine Kraftleiste bestimmen → schlagen → einlochen
- **Regeln**: Jede Bahn hat ein Par; Ziel ist, mit möglichst wenigen Schlägen einzulochen;
  Hindernisse und bahnspezifische Effekte beeinflussen den Ball
- **HUD**: Bahn-Nummer, Par, bisherige Schläge, bis zu 3 Sterne
- **Bahnen** (aus den Mockups, mit ihrem jeweiligen Kniff):

  | # | Bahn | Par | Besonderheit |
  |---|---|---|---|
  | 1 | Sonnenwald | 3 | Hindernisse und Wind |
  | 2 | Piratenbucht | 4 | starker Wind |
  | 3 | Kristallhöhle | 3 | Kristalle lenken den Ball ab |
  | 4 | Lavatal | 5 | Brücken über Lava |
  | 5 | Wolkeninsel | 3 | Aufwind trägt den Ball |
  | 6 | Wintergipfel | 4 | rutschiger Untergrund |

- **Missionsbeispiele**: „Hole in One" (200), „Unter Par abschließen" (150), „Sammle alle 3 Sterne" (100)

**Festgelegt am 12.08.2026** (war offen: Physikwerte, Sternvergabe, Bahnlayouts):

**Keine Engine.** CLAUDE.md hält diese Entscheidung bis Minigolf offen — hier ist sie:
2D-Minigolf braucht Kreis-gegen-Strecke-Kollision, Reflexion und Reibung. Das sind rund
180 Zeilen Vektormathematik. PixiJS oder Phaser brächten rund ein Megabyte Abhängigkeit,
arbeiteten gegen die Regel „Spiellogik frei von React und ohne Rendering testbar" und
lösen kein Problem, das eigener Code teuer machte.

**Eine Bahn ist eine Runde.** Die sechs Bahnen werden nacheinander freigeschaltet, so wie
die zwölf Solitaire-Level. Sechs Bahnen am Stück wären für eine Energieeinheit eine sehr
lange Runde, und `games.ts` führt Minigolf ohnehin mit „Bestes Level".

**Spielfeld**: 100 × 160 Einheiten im Hochformat. Ball hat Radius 2, das Loch 3,5.

| Wert | Festlegung | Begründung |
|---|---|---|
| Höchste Schlagkraft | 120 Einheiten/s | Ein voller Schlag rollt rund 87 Einheiten weit — gut die halbe Bahn, also nie ein Treffer aus dem Nichts |
| Reibung | Geschwindigkeit sinkt je Sekunde auf 25 % | Der Ball kommt nach etwa drei Sekunden zur Ruhe. Länger wird das Warten zäh |
| Abprallverlust | 28 % je Bande | Deutlich spürbar, aber ein Abpraller bleibt ein brauchbarer Zug |
| Stillstand | unter 1,5 Einheiten/s | Ohne Schwelle zittert der Ball ewig weiter |
| Einlochen | Mitte im Loch **und** langsamer als 45 Einheiten/s | Ein zu harter Schlag springt über das Loch. Genau das macht die Kraftwahl zur Entscheidung statt zur Formalität |
| Schlaggrenze | Par + 5 | Darüber ist die Bahn verloren. Ohne Grenze könnte man sich zum Loch schubsen |
| Rechenschritt | fest 1/240 s | Bei großen Schritten springt ein schneller Ball durch die Bande hindurch |

**Sterne**: drei bei Par oder besser, zwei bei einem Schlag darüber, einer bei zwei
darüber und bei allem Weiteren. Wer die Schlaggrenze reißt, bekommt keinen.

**Punkte**: 300 Grundwert je eingelochter Bahn, 120 je Schlag, den man unter der
Schlaggrenze bleibt, 500 für ein Hole in One, dazu 100 je Bahnnummer — sonst lohnt sich
Bahn 6 nicht mehr als Bahn 1.

**Kein Zufall.** Minigolf ist das einzige der acht Spiele, das keine Zufallszahl braucht:
Richtung und Kraft des Schlags bestimmen alles. Damit ist jede Partie ohnehin
reproduzierbar.

**Bahnlayouts** — jede Bahn ist ein geschlossener Linienzug (die Bande), dazu runde
Hindernisse, Gefahrenflächen und höchstens ein bahnspezifischer Effekt:

| # | Bahn | Par | Form | Kniff |
|---|---|---|---|---|
| 1 | Sonnenwald | 3 | leichter Knick | ein Findling in der Mitte, schwacher Seitenwind |
| 2 | Piratenbucht | 4 | L-förmig | starker Seitenwind, der über die ganze Bahn drückt |
| 3 | Kristallhöhle | 3 | enger Korridor | drei Kristalle, die den Ball **schneller** zurückwerfen als sie ihn annehmen |
| 4 | Lavatal | 5 | lang, dreigeteilt | Lavafelder zwischen den Abschnitten; nur schmale Brücken führen hinüber |
| 5 | Wolkeninsel | 3 | zweistufig | eine Aufwindzone beschleunigt den Ball nach oben |
| 6 | Wintergipfel | 4 | Zickzack | rutschiges Eis: die Geschwindigkeit sinkt je Sekunde nur auf 60 % |

**Gefahrenflächen** (Lava, Wasser) setzen den Ball an seine letzte Ruheposition zurück
und kosten einen Strafschlag. Ihn an den Start zurückzuschicken wäre härter, als das
Spiel sein will.

**Bedienung**: Richtung durch Antippen des Spielfelds, Kraft über eine Farbskala,
danach der Knopf „Schlagen" — die drei Schritte aus dem Mockup
(`docs/referenzen/charaktere-spiele-minigolf.png`, Reihe „Minigolf – Gameplay").
Bewusst **kein Ziehen**: Die Bedienelemente zeichnen sich dadurch nie unter dem Finger
neu (siehe `lessons.md`). Die Kraftanzeige ist im Mockup ein Halbkreis, hier eine
waagerechte Skala mit demselben Farbverlauf — auf einem 390 px breiten Bildschirm ist
eine liegende Skala mit 44 px Höhe treffsicherer als ein Bogen.

---

## Spiele 7 und 8 — entschieden am 29.07.2026

Beide gehören zum festen Umfang (Entscheidung des Auftraggebers), werden aber
**nach** den sechs Kernspielen gebaut.

### 7. Sudoku — `sudoku`

Zahlenrätsel, klassisch. Begleitfigur: **Elda** (Dorfälteste, bedächtig — passt zum Grübeln).

- **Regeln**: 9×9-Feld in neun Blöcken; in jeder Zeile, jeder Spalte und jedem Block
  kommt jede Ziffer von 1 bis 9 genau einmal vor; vorgegebene Ziffern sind fest
- **HUD**: Zeit, Schwierigkeit, Fehlerzähler
- **Hilfen**: Notizen, Hinweis, Rückgängig

**Festgelegt am 29.07.2026** (war offen: Stufen, Fehlergrenze, Rätselerzeugung):

| Stufe | Vorgegebene Zahlen | Gedacht für |
|---|---|---|
| Leicht | 42 | Einstieg, ohne Verzweigen lösbar |
| Mittel | 34 | Standard |
| Schwer | 26 | Für Geübte |

- **Drei Fehler**, dann ist die Runde verloren. Ein falscher Eintrag bleibt sichtbar rot
  stehen, bis er ersetzt wird — kommentarloses Verschwinden würde verwirren.
- **Drei Hinweise** je Runde: Ein Hinweis trägt die richtige Zahl in ein leeres Feld ein.
- **Notizen** und **Rückgängig** sind unbegrenzt.

**Rätselerzeugung** — zwei Schritte:

1. Ein vollständig gefülltes, gültiges Gitter wird durch Rückverfolgung erzeugt.
2. Danach werden Felder in zufälliger Reihenfolge geleert. **Vor jedem Leeren wird
   geprüft, ob das Rätsel weiterhin genau eine Lösung hat.** Ist das nicht der Fall,
   bleibt die Zahl stehen.

Der zweite Punkt ist der Kern: Ein Rätsel mit mehreren Lösungen lässt sich nicht mehr
durch Folgern lösen, nur noch durch Raten. Deshalb zählt der Löser Lösungen und bricht
ab, sobald er die zweite findet.

**Sterne**: drei bei fehlerfreier Lösung unter 10 Minuten, zwei unter 20 Minuten,
sonst einer. Wer verliert, bekommt keinen.

### 8. Bubble Shooter — `bubbleshooter`

Blasen abschießen. Begleitfigur: **Juno** (Musiker, fröhlich-leicht).

- **Regeln**: Von unten wird eine farbige Blase nach oben geschossen; drei oder mehr
  gleichfarbige, die sich berühren, platzen; Blasen, die dadurch den Halt verlieren,
  fallen herunter; verloren, wenn die Blasen die untere Linie erreichen
- **HUD**: Punkte, verbleibende Schüsse oder Reihen, nächste Blase

**Festgelegt am 29.07.2026** (war offen: Feldgröße, Farbanzahl, Punkteformel):

| Punkt | Festlegung | Begründung |
|---|---|---|
| Raster | 11 Spalten, versetzte Reihen mit 10 | Versetztes Raster wie beim Original; hochkant gut treffbar |
| Sichtbare Reihen | 13 | Darunter die Verlustlinie |
| Startreihen | 5 gefüllt | |
| Farben | 5 | Bei 6 wird das Aufräumen zäh, bei 4 zu leicht |
| Nachrücken | alle 6 Schüsse eine neue Reihe von oben | Erzeugt Druck, ohne zu hetzen |

- **Verloren**, wenn eine Blase die Verlustlinie erreicht.
- **Gewonnen**, wenn das Feld leer ist.
- **Punkte**: 10 je geplatzter Blase, zusätzlich 20 je Blase, die dadurch den Halt
  verliert und herunterfällt. Abgetrennte Blasen zu belohnen ist der Reiz des Spiels —
  ein guter Schuss räumt mehr weg, als er trifft.

**Zielhilfe**: Die Schussbahn wird als gepunktete Linie angezeigt, inklusive der
Abpraller an den Seitenwänden. Ohne sie ist auf einem Handybildschirm kaum zu zielen.

### „Mehr Spiele"

Eine Kachel am Ende der Spieleliste, die auf künftige Spiele verweist. Kein eigenes Spiel.

### Kategorien in der Spieleauswahl

Filterleiste über der Spieleliste: **Alle Spiele · Puzzle · Karten · Sport**

| Kategorie | Spiele |
|---|---|
| Puzzle | Blockfall, Waldblöcke, Tempelpaare, Kristallmix, Sudoku, Bubble Shooter |
| Karten | Fynnox Solitaire |
| Sport | Fynnox Minigolf |

---

## Rundenablauf und Rückmeldungen

Aus den Mockups belegte Einblendungen, die in **jedem** Spiel gleich aussehen sollen:

| Moment | Anlass |
|---|---|
| `SIEG!` | Runde gewonnen |
| `LEVEL UP!` | Levelaufstieg des Profils |
| `BELOHNUNG!` | Truhe oder Belohnung freigeschaltet |
| `NEUES LEVEL!` | nächstes Spiellevel erreicht |
| `FEHLER!` | Fehlzug oder verlorene Runde |
| `PAUSE` | Spiel angehalten |

Dazu spielspezifisch: `COMBO x4` / `KOMBO x3` / `Combo x5!` (Blockfall, Tempelpaare, Kristallmix),
`TETRIS!` (Blockfall), `Sweet!` (Kristallmix), `PERFEKT!` und `HOLE IN ONE!` (Minigolf).

**Gewonnen-Bildschirm** (aus dem Solitaire-Mockup, gilt als Vorlage für alle Spiele):
Überschrift „GEWONNEN!", bis zu drei Sterne, die erreichten Werte (Zeit, Punkte)
und ein Knopf „WEITER".

**Pause** ist in jedem Spiel oben rechts erreichbar.

### Ton und Musik — festgelegt am 17.08.2026 (Phase 8)

**Klangeffekte werden prozedural erzeugt**, nicht als Dateien ausgeliefert.
Jeder Klang ist eine Handvoll Oszillatoren mit Hüllkurve über die WebAudio-Schnittstelle
(`src/core/audio.ts`, Muster aus `fynnox-adventure/src/audio/sfx.ts`). Begründung:
keine fremden Samples und damit keine Lizenzfrage, kein einziges Byte zusätzlich im
PWA-Cache, sofort offline verfügbar.

Fünf Klänge, jeweils an einen belegten Moment gebunden:

| Klang | Anlass | Bildschirm |
|---|---|---|
| `win` | Runde gewonnen | Ergebnisbildschirm |
| `lose` | Runde verloren | Ergebnisbildschirm |
| `reward` | Belohnung abgeholt | Tagesbelohnung, Missionen |
| `chest` | Truhe geöffnet | Abenteuerpfad |
| `purchase` | Ware gekauft | Shop |

**Musik**: Die lizenzfreie Schleife aus `fynnox-adventure` (`public/audio/musik.mp3`,
4,0 MB, phatphrogstudio) kommt mit, aber **nicht in den Vorab-Cache**. `mp3` fällt aus
`globPatterns` heraus; stattdessen holt eine Laufzeit-Regel (`CacheFirst`) die Datei
beim ersten Einschalten und behält sie danach offline.

Begründung, mit gemessenen Zahlen: Der Vorab-Cache umfasst **47 Einträge / 2,58 MB** —
das ist, was jeder Spieler beim Installieren herunterlädt. Die Musikdatei allein wiegt
3,97 MB und hätte diesen Wert auf rund 6,6 MB gebracht, also **mehr als verdoppelt** —
auch für jeden Spieler, der die Musik nie einschaltet. (Der Ordner `dist` wächst von
5,0 MB auf 9,0 MB, weil die Datei auf dem Server liegt; heruntergeladen wird sie
dadurch nicht.)

Der Preis dieser Entscheidung ist ehrlich zu nennen: Wer die Musik zum allerersten Mal
ohne Netzverbindung einschaltet, hört nichts. Ab dem zweiten Mal ist sie da. Der
Einstellungsbildschirm sagt das in seinem Hinweistext.

**Autoplay-Sperre**: Browser lehnen Ton vor der ersten Nutzergeste ab. Der AudioContext
entsteht darum erst beim ersten Klang, die Musik startet beim ersten Antippen — dasselbe
Muster wie `requestFullscreenOnFirstTap` in `src/core/fullscreen.ts`.

Beide Schalter im Einstellungsbildschirm wirken damit; die Marke „später" fällt dort weg.

### Bewegung — festgelegt am 17.08.2026 (Phase 8)

**Keine Animationsbibliothek.** CLAUDE.md nennt Framer Motion im Stack mit dem Zusatz
„erst einbauen, wenn tatsächlich animiert wird". Geprüft wurde, was animiert werden soll:

| Kandidat | Entscheidung |
|---|---|
| Zahlenanstieg im Ergebnisbildschirm | **ja** — 25 Zeilen `requestAnimationFrame` |
| Truhe im Abenteuerpfad, wenn sie bereitliegt | **ja** — reine CSS-Keyframes |
| Kartenzug bei Solitaire | **nein** |

Der Kartenzug bliebe der einzige Grund für eine Bibliothek — und er verlangte einen
Eingriff in die Darstellung eines fertigen, im Browser belegten Spiels. Der Nutzen
rechtfertigt das nicht. Damit löst Framer Motion kein Problem, das eigener Code teuer
machen würde, und bleibt draußen.

**Der Energiesparmodus wirkt ab jetzt** (`settings.powerSaving`). Er setzt zusammen mit
der Systemeinstellung `prefers-reduced-motion` das Attribut `data-motion="off"` auf das
Wurzelelement. Eine einzige CSS-Regel kürzt daraufhin **alle** Übergänge und Animationen
der App auf nahezu null — auch die, die schon vorher da waren (Reiter, Navigation,
Schalter). Der Zähler springt dann sofort auf seinen Endwert, statt hochzulaufen.

Die Systemeinstellung wird **mitgelesen, nicht überschrieben**: Wer auf dem Gerät
„Bewegung reduzieren" eingeschaltet hat, hat das aus einem Grund getan — oft wegen
Schwindel oder Migräne. Ein Spiel darf sich darüber nicht hinwegsetzen.

---

## Start der App

Belegter Ablauf aus den Mockups:

1. **Ladebildschirm** — Logo „Fynnox Puzzle Worlds", Fynnox winkt, Sprechblase
   („Schön, dass du wieder da bist! Ein neues Abenteuer wartet auf uns!"),
   Fortschrittsbalken mit Prozentzahl
2. **Übergang** — Fynnox: „Fast geschafft! Packen wir's an!"
3. **Dashboard**

---

## Geteilte Systeme

Alle Spiele zahlen auf **ein** Profil ein.

### Level und XP

Fortschrittsbalken mit „aktuelle XP / XP für nächstes Level".

**XP-Kurve** — aus dem Mockup abgeleitet, nicht geraten:

```
xpForNextLevel(level) = 500 + level * 250
```

Probe: Level 12 → 500 + 12 × 250 = **3.500**. Genau der Wert auf dem Mockup („2.450 / 3.500").

**Belohnung je Levelaufstieg** — ebenfalls aus dem Mockup abgeleitet
(dort steht bei Level 12: 2.000 Münzen + 50 Kristalle):

```
coins    = 200 + level * 150      →  Level 12: 200 + 1.800 = 2.000  ✓
crystals = 10 + floor(level / 3) * 10  →  Level 12: 10 + 40 = 50     ✓
```

Beide Formeln treffen die Mockup-Werte exakt. Das ist ein starkes Indiz, dass sie der
gedachten Kurve entsprechen — trotzdem sind es **Startwerte**, die nach dem ersten
Spieltest angepasst werden dürfen.

### Belohnung pro Runde

```
xp     = 20 + floor(score / 100)      bei Sieg × 1,5 (abgerundet)
coins  = 10 + floor(score / 500)      bei Sieg + 20
```

Kristalle gibt es **nicht** pro Runde — nur aus Missionen, Levelaufstiegen, Events und Truhen.
Das hält sie wertvoll und macht den Shop sinnvoll.

Beispiel Waldblöcke mit 3.680 Punkten (Mockup-Wert), Runde regulär beendet:
20 + 36 = **56 XP**, 10 + 7 = **17 Münzen**.

### Währungen

| Währung | Symbol | Wofür |
|---|---|---|
| Münzen | goldene Pfoten-Münze | Standardwährung, aus Runden und Missionen |
| Kristalle | violetter Kristall | Premiumwährung, seltener |
| Energie | Blitz, Anzeige „5/5 Max." | Verbrauch pro Spielstart, regeneriert über Zeit |

**Energie**: 1 Einheit je gestarteter Runde, Höchststand 5.
Regeneration: **1 Einheit alle 10 Minuten**, also volle 5 nach 50 Minuten.
Läuft auch weiter, während die App geschlossen ist (Berechnung über den Zeitstempel
`energyRefilledAt`, siehe [Datenmodell](04-datenmodell.md)).

Startwerte für ein neues Profil: Level 1, 0 XP, 500 Münzen, 50 Kristalle, 5/5 Energie.

### Missionen

Drei Arten, als Reiter getrennt: **Täglich**, **Wöchentlich**, **Event**.

- Jede Mission: Text, Fortschritt (z. B. 2/3), Belohnung in Münzen
- Tägliche Missionen laufen ab und erneuern sich (Mockup zeigt Restzeit 16 h 45 m)
- Beispiele täglich: „Spiele 3 Runden Blockfall" (100), „Sammle 200 Kristalle" (150),
  „Gewinne 1 Spiel in Minigolf" (200)
- Beispiele wöchentlich: „Spiele 5 Runden irgendein Spiel" (150), „Sammle 500 Münzen" (250),
  „Gewinne 2 Spiele" (180)
- Missionen greifen auf Spielereignisse zu — jedes Spiel meldet am Rundenende ein einheitliches
  Ergebnis (siehe [Datenmodell](04-datenmodell.md))

**Festgelegt am 17.08.2026** (war offen bis Phase 7):

| Frage | Festlegung | Begründung |
|---|---|---|
| Wie viele gleichzeitig | 3 täglich, 3 wöchentlich, 1 Event | Drei Einträge passen ohne Scrollen auf einen Handy-Reiter. Mehr gleichzeitige Ziele verwässern die Führung, statt sie zu geben |
| Poolgröße | 8 tägliche, 5 wöchentliche Vorlagen | Genug, dass sich zwei Tage nie exakt gleichen, ohne Vorlagen zu erfinden, die kein Spiel bedienen kann |
| Auswahl aus dem Pool | ohne Zufall: aus der Tagesnummer gedreht (`(tag * 3 + i) % 8`) | Ungesäter Zufall ist im Projekt verboten (CLAUDE.md). So ergibt derselbe Tag auf jedem Gerät dieselben Missionen und ein Fehler ist reproduzierbar |
| Reset täglich | **Mitternacht Ortszeit** | Das Mockup zeigt „16 h 45 m" Restzeit — das ist ein Countdown auf einen festen Tageswechsel, nicht auf 24 h ab dem ersten Start |
| Reset wöchentlich | **Montag 0 Uhr Ortszeit** | Gleiches Prinzip eine Ebene höher; Montag ist der Wochenanfang nach DIN 1355 |
| Beim Wechsel | abgelaufene Missionen werden ersetzt, nicht abgeholte Belohnungen verfallen | Sonst stapeln sich Belohnungen wochenlang und der tägliche Anreiz verschwindet |
| Nicht abgelaufene | behalten ihren Fortschritt | Eine Wochenmission darf durch das Öffnen der App nicht zurückgesetzt werden |

Nur Vorlagen, die auch ein Spiel meldet, dürfen in den Pool — sonst gäbe es unerfüllbare
Missionen. Verfügbar sind `stars` (alle acht Spiele), `rowsCleared` (Waldblöcke, Blockfall),
`combos` (Waldblöcke, Kristallmix), `pairs` (Tempelpaare), `crystalsCollected` und `rainbows`
(Kristallmix), `strokes` und `holeInOne` (Minigolf), `moves`/`undos` (Solitaire), `mistakes` (Sudoku).
`winRounds` ohne Spielangabe zählt nur bei den sechs gewinnbaren Spielen — Waldblöcke und
Blockfall sind Endlosspiele und melden nie einen Sieg.

**Tagespool** (8):

| Mission | Ziel | Münzen |
|---|---|---|
| Spiele 5 Runden | 5 | 120 |
| Spiele 3 Runden Waldblöcke | 3 | 100 |
| Spiele 3 Runden Blockfall | 3 | 100 |
| Räume 10 Reihen | 10 | 150 |
| Erziele 5 Kombos | 5 | 200 |
| Sammle 5 Sterne | 5 | 180 |
| Sammle 300 Münzen | 300 | 150 |
| Gewinne 2 Runden | 2 | 200 |

**Wochenpool** (5) — größere Ziele, dafür zusätzlich Kristalle:

| Mission | Ziel | Belohnung |
|---|---|---|
| Spiele 25 Runden | 25 | 400 Münzen + 10 Kristalle |
| Gewinne 10 Runden | 10 | 450 Münzen + 10 Kristalle |
| Sammle 2.000 Münzen | 2.000 | 500 Münzen + 10 Kristalle |
| Sammle 30 Sterne | 30 | 600 Münzen + 15 Kristalle |
| Finde 100 Paare in Tempelpaare | 100 | 400 Münzen + 10 Kristalle |

Die Event-Mission kommt aus dem laufenden Hauptevent (siehe [Events](#events)).

### Tägliche Belohnung

*„Komme jeden Tag zurück und erhalte tolle Belohnungen!"* — Staffelung mit Münzen und
Kristallen, Abholen per Knopf.

**Festgelegt am 17.08.2026** (war offen bis Phase 7) — Leiter über sieben Tage, danach
beginnt sie wieder bei Tag 1:

| Tag | Belohnung |
|---|---|
| 1 | 100 Münzen |
| 2 | 200 Münzen |
| 3 | 10 Kristalle |
| 4 | 300 Münzen |
| 5 | 20 Kristalle |
| 6 | 500 Münzen |
| 7 | 1.000 Münzen + 50 Kristalle |

Begründung der Zahlen: Tag 7 ist mit 1.000 Münzen ungefähr eine ganze Levelaufstiegs-Prämie
wert (Level 12 gibt 2.000) und damit spürbar, ohne den Wert einer gespielten Runde
(10–40 Münzen) sinnlos zu machen. Kristalle stehen nur auf drei der sieben Stufen — sie sind
laut Währungstabelle die seltene Währung, und der Shop verlangt bis zu 2.500 davon.

**Verhalten bei Aussetzern**: Wird ein Tag ausgelassen, beginnt die Serie wieder bei Tag 1.
Begründung: Die Leiter ist genau dann ein Grund zurückzukommen, wenn Lücken etwas kosten.
Sie ist mit sieben Tagen kurz genug, dass die Spitze schnell wieder erreichbar ist —
ein härterer Verfall (etwa gesammelte Belohnungen einziehen) wäre für ein Kinderspiel
ohne Echtgeld unangemessen.

Abgeholt wird pro **Kalendertag in Ortszeit**, nicht alle 24 Stunden. Sonst wandert der
Zeitpunkt bei jedem Abholen nach hinten und liegt nach einer Woche mitten in der Nacht.

### Abenteuerpfad

Ein Levelpfad quer über alle Spiele. Die Mockups zeigen dazu **zwei verschiedene Entwürfe**:

**Entwurf A — Weltabschnitte zu je 20 Leveln** (ältere Bilder, Desktop-Ansicht):

| Abschnitt | Welt | Level |
|---|---|---|
| 1 | Sunforest | 1–20 |
| 2 | Kristallhöhlen | 21–40 |
| 3 | Lavawelt | 41–60 |
| 4 | Pirateninsel | 61–80 |
| 5 | gesperrt (`???`) | 81–100 |

**Entwurf B ist verbindlich** (entschieden am 29.07.2026). Entwurf A steht nur noch
zur Erklärung der älteren Bilder hier.

**Entwurf B — Kapitel** (neuere Handy-Bilder, deutlich weiter ausgearbeitet):

- Überschrift „Kapitel 4 · Kristallhöhle" mit eigenem Fortschrittsbalken **8/15**
- Der Pfad schlängelt sich durch die Weltkulisse; darauf sitzen **nummerierte Knoten**
- Jeder abgeschlossene Knoten zeigt **1 bis 3 Sterne**, der nächste ist hervorgehoben,
  spätere sind grau und gesperrt
- Am Kapitelende eine Truhe
- Fynnox kommentiert: „Je weiter wir reisen, desto mehr Freunde und Schätze warten auf uns!"

Begründung der Wahl: Entwurf B ist konkreter, passt aufs Handy (senkrechter Pfad statt
waagerechter Abschnittsleiste), und Kapitel zu 15 Leveln lassen sich beliebig fortsetzen —
damit löst sich auch der Widerspruch zu den elf Welten des Masterprompts von selbst:
**ein Kapitel je Welt**, weitere Kapitel kommen später dazu.

Kapitelreihenfolge nach den Welten des Masterprompts: Sonnenwald → Kristallhöhlen →
Lavawelt → Pirateninsel → Schneewelt → Candy → Unterwasser → Steampunk → Weltraum.
Halloween und Weihnachten sind **Saison-Kapitel** und erscheinen nur zur passenden Zeit.

**Festgelegt am 17.08.2026** (war offen bis Phase 7):

**Ein Knoten ist eine Runde in einem vorgegebenen Spiel.** Er gilt als geschafft, sobald
diese Runde mindestens **einen Stern** erreicht; die Sterne der Runde werden unverändert
auf den Knoten übertragen.

Begründung gegen die Alternative „freie Wahl des Spiels": Bei freier Wahl wäre der Pfad nur
ein zweiter Rundenzähler neben der Statistik — er würde nirgends hinführen. Ein vorgegebenes
Spiel führt dagegen durch alle acht Spiele und passt zur Weltkulisse des Kapitels.

Begründung gegen ein **Punkteziel** je Knoten: Die Punktebereiche der acht Spiele liegen um
den Faktor zehn auseinander (Minigolf rund 300–1.500, Sudoku bis 4.700, Waldblöcke mehrere
Tausend). Ein Punkteziel bräuchte deshalb eine zweite Balancing-Tabelle je Spiel, die neben
den bereits kalibrierten Sternschwellen (`starsFor` in jedem Spiel) herliefe und mit ihnen
auseinanderlaufen könnte. Die Sterne sind bereits pro Spiel geeicht — genau das wird benutzt.

| Frage | Festlegung | Begründung |
|---|---|---|
| Knoten je Kapitel | 15 | Aus dem Mockup („8/15") |
| Welches Spiel | fest je Knoten, reihum durch alle acht: `spiele[(knoten - 1 + (kapitel - 1) * 3) % 8]` | Ohne Zufall und dadurch reproduzierbar. Der Versatz von 3 je Kapitel sorgt dafür, dass die ersten acht Kapitel unterschiedlich beginnen. Ab dem neunten wiederholt sich die Reihenfolge zwangsläufig — acht Spiele geben nicht mehr her |
| Bestanden ab | 1 Stern | Der Pfad soll führen, nicht blockieren. Die Tiefe liegt im Nachspielen für 3 Sterne, nicht im Wiederholenmüssen |
| Zurückspringen | nicht möglich | Ein abgeschlossener Knoten behält seine Sterne. Ein Auswahlmodus für alte Knoten bräuchte zusätzlichen Zustand im Spielstand, ohne etwas hinzuzufügen |
| Energie | ja, wie jede Runde | Ein Knoten *ist* eine normale Runde — er läuft über dieselbe Rundenauswertung |
| Truhe am Kapitelende | 500 Münzen + 25 Kristalle, plus 20 Münzen je gesammeltem Stern (max. 45) | Damit lohnt sich Genauigkeit: 45 Sterne bringen 900 Münzen zusätzlich |
| Nach der Truhe | nächstes Kapitel | Die Truhe ist der Abschluss, nicht ein Nebenpreis |

**Kapitel** — je Kapitel eine Welt mit vorhandener Kulisse aus `public/art/bg/`:

| Kapitel | Welt | Kulisse |
|---|---|---|
| 1 | Sonnenwald | `bg/sonnenwald.jpg` |
| 2 | Kristallhöhlen | `bg/kristallhoehle.jpg` |
| 3 | Lavawelt | `bg/lavatal.jpg` |
| 4 | Pirateninsel | `bg/piratenbucht.jpg` |
| 5 | Schneewelt | `bg/wintergipfel.jpg` |
| 6 | Wolkeninsel | `bg/wolkeninsel.jpg` |
| 7 | Tempelruinen | `bg/tempel.jpg` |
| 8 | Unterwasserwelt | `bg/unterwasser.jpg` |
| 9 | Fynnox City | `bg/stadt.jpg` |

Neun Kapitel zu 15 Knoten sind 135 Stufen — mehr als die 100 Level aus Entwurf A, nur in
Kapitel geschnitten. Keine zwei Kapitel tragen dieselbe Farbe, damit sich
Fortschrittsbalken und Knoten zweier Kapitel nie gleich anfühlen.

**Nachtrag vom 17.08.2026**: Kapitel 8 und 9 kamen am selben Tag dazu. Ihre Kulissen
stammen als einzige **nicht** aus den Puzzle-Worlds-Konzeptbildern, sondern aus dem
Bildmaterial der Nachbarprojekte `fynnox-adventure` und `fynnox-city`
(Quellen und Ausschnitte: [Art-Guide](03-art-ui-guide.md)). Der Satz „für Unterwasser
gibt es kein Bildmaterial" stand hier zuvor und war falsch — im Nachbarprojekt lag eine
gemalte Über-/Unterwasserszene im passenden Stil.

**Fynnox City ist eine Erweiterung über den Masterprompt hinaus.** Dessen Weltenliste
kennt elf Welten, eine Stadt ist nicht darunter. Der Auftraggeber hat sie am 17.08.2026
ausdrücklich gewünscht: Fynnox City ist das dritte Projekt der Familie und soll hier als
eigene Welt auftauchen. Damit ist die Stadt die erste Welt, die nicht aus dem Masterprompt
kommt — der Widerspruch ist benannt und entschieden, nicht übersehen.

Zu beachten: Die Stadtkulisse ist eine 3D-Renderansicht und dadurch sichtbar
fotorealistischer als die gemalten Welten davor. Auf dem Kapitelkopf liegt sie hinter
demselben dunklen Verlauf wie alle anderen, deshalb fällt der Unterschied dort kaum auf.
Sie sollte aber nicht ohne Not an weiteren Stellen auftauchen.

Candy, Steampunk und Weltraum fehlen weiterhin: Dafür gibt es in keinem der Fynnox-Projekte
eine brauchbare Kulisse. Was in `fynnox-adventure` unter *Zuckerwirbel* und *Neon* liegt,
sind Rennstrecken aus Pet Cars — mit Leitplanken und Fahrbahnmarkierung. Diese Kapitel
kommen dazu, sobald eine Kulisse existiert; erfunden wird keine (CLAUDE.md, Abschnitt Grafik).

### Events

Zeitlich begrenzt, mit eigenem Fortschrittsbalken und eigenem Shop.
Der Eventbildschirm zeigt drei Gruppen:

| Gruppe | Beispiele aus den Mockups |
|---|---|
| Laufendes Hauptevent | „Sommer Cup" — „Kämpfe um den Sieg und gewinne großartige Preise!", eigene Platzierung (Platz 245), Restzeit, Fortschritt 3.250 / 10.000, Belohnung 1.000 Münzen + 100 Kristalle |
| Aktive Events | „Kristalljagd" (endet in 2 T 6 h), „Täglicher Bonus" (Zustand *Bereit!* mit Knopf „Abholen") |
| Kommende Events | „Piratenfest", „Monsterjagd" |

**Festgelegt am 17.08.2026** (war offen bis Phase 7):

**Rhythmus**: Eine Woche ist ein Eventzyklus. Aus der Wochennummer (`floor(Ortszeit-Montag / 7 Tage)`)
ergibt sich ohne Zufall, welches Event läuft:

| Rolle | Event | Zeitraum |
|---|---|---|
| Hauptevent | `katalog[woche % 4]` | ganze Woche, Montag bis Sonntag |
| Nebenevent | `katalog[(woche + 1) % 4]` | zweite Wochenhälfte, ab Donnerstag 0 Uhr |
| Kommend | `katalog[(woche + 2) % 4]`, `katalog[(woche + 3) % 4]` | nächste und übernächste Woche |
| Dauerhaft aktiv | „Täglicher Bonus" | jeden Tag, führt zur Tagesbelohnung |

**Katalog** (4 Events, jedes trägt eine eigene Event-Mission):

| Event | Mission | Ziel | Belohnung |
|---|---|---|---|
| Sommer Cup | Sammle 10.000 Münzen | 10.000 | 1.000 Münzen + 100 Kristalle |
| Kristalljagd | Sammle 300 Kristalle in Kristallmix | 300 | 500 Münzen + 50 Kristalle |
| Piratenfest | Loche 15 Bahnen ein | 15 | 600 Münzen + 60 Kristalle |
| Monsterjagd | Räume 200 Reihen | 200 | 700 Münzen + 70 Kristalle |

Der Sommer Cup übernimmt die Zahlen des Mockups (3.250 / 10.000, 1.000 Münzen + 100 Kristalle)
unverändert. Vier Events bei einem Wochenzyklus heißt: Jedes Event ist alle vier Wochen einmal
Hauptevent und einmal Nebenevent — oft genug, um vertraut zu werden, selten genug, um nicht
zur Pflicht zu werden.

Bewusst **nicht** umgesetzt: der eigene Event-Shop und die Platzierung („Platz 245") aus dem
Mockup. Eine Platzierung ohne Server wäre eine erfundene Zahl, und ein zweiter Shop mit
zweiter Währung verdoppelt das Kaufsystem, bevor das erste benutzt wurde. Beides gehört
zu Phase 8 (Cloud).

### Ranglisten und Freunde

- Reiter: **Freunde · Anfragen · Bestenliste**
- Freunde erscheinen gruppiert nach **Online** und **Alle Freunde**
- Je Freund: Bild, Name, Trophäenpunkte und Status — entweder was gerade gespielt wird
  („Spielt Blockfall") oder wann zuletzt online („Zuletzt online: 1 h")
- Knopf „Freunden einladen"; Freunde können herausgefordert werden

**Festgelegt am 17.08.2026** (war offen bis Phase 8):

Auch mit der Cloud (Lücke 3) gibt es **keine echten Mitspieler**: Der Cloud-Speicher
kennt nur Spielstände, keine Konten und keine Beziehungen zwischen Geräten. Freunde und
Rangliste bleiben deshalb dauerhaft von den Begleitfiguren bevölkert — und sagen das auf
beiden Bildschirmen sichtbar, statt echte Menschen vorzutäuschen.

Es sind **neun** Figuren, nicht zehn: Mira, Lumo, Borin, Pip, Elda, Juno, Kori, Finn, Bree.
**Fynnox selbst tritt nicht als Gegner an.** Er ist der Begleiter des Spielers und steckt
bereits im eigenen Avatar; als elfte Zeile stünde bei einem frischen Profil zweimal
„Fynnox" in derselben Rangliste, weil das die Voreinstellung des Profilnamens ist.

**Trophäenpunkte** — eine Formel für alle, Spieler wie Figuren:

```
Trophäen = Level × 100 + gewonnene Runden × 25 + gespielte Runden × 5
```

Beim Spieler kommen die drei Zahlen aus dem Spielstand (`profile.level`,
`stats.totalWins`, `stats.totalGames`). Ein frisches Profil steht damit bei 100 Trophäen.

**Werte der Figuren**: aus einem **gesäten** Generator, Seed ist der Figurname —
dieselbe Figur hat auf jedem Gerät und nach jedem Neuladen dieselbe Zahl. Vier Level
sind aus den Mockups belegt und werden übernommen: **Mira 15, Lumo 14, Borin 13, Pip 11**.
Die übrigen sechs bekommen ein gesätes Level zwischen 2 und 16; Runden und Siege
ebenfalls gesät, passend zum Level.

Die Trophäenzahlen aus dem Mockup (Mira 24.580, Lumo 18.320, Borin 16.870, Spieler 12.580)
werden **nicht** übernommen. Sie sind laut [Charakterbibel](02-charakterbibel.md)
Beispielwerte, und sie ließen sich mit keiner nachvollziehbaren Formel aus Level 15
herleiten. Eine erfundene Zahl neben einer errechneten wäre der Anfang vom Ende der
Vergleichbarkeit.

Die schwächste Figur liegt bewusst bei Level 2: Die Rangliste muss von unten erreichbar
sein, sonst ist sie keine Rangliste, sondern eine Wand. Die Werte der Figuren wachsen
**nicht** mit dem Spieler mit — mitwachsende Gegner wären eine zweite Lüge.

**Online-Zustand**: ebenfalls gesät, Seed ist Figurname **plus Tagesnummer**. Damit
wechselt das Bild täglich, bleibt innerhalb eines Tages aber stehen und ist auf jedem
Gerät gleich. Vier bis fünf Figuren sind online und spielen eines der acht Spiele, die
übrigen tragen „Zuletzt online: 3 h".

**Reiter „Anfragen"**: bleibt leer und erklärt warum. Einladungen kämen von echten
Menschen; die gibt es nicht. Der Knopf „Freunden einladen" aus dem Mockup entfällt
deshalb — ein Knopf, der niemanden einlädt, ist eine Lüge in der Oberfläche
(dieselbe Regel wie bei den Einstellungsschaltern).

**Reiter „Bestenliste"** zeigt exakt dieselbe Liste wie der eigene Bildschirm
*Rangliste* — eine Komponente, eine Quelle. Zwei Ranglisten, die auseinanderlaufen
können, wären ein Fehler, der sich erst spät zeigt.

### Erfolge

Dauerhafte Ziele mit Fortschritt, z. B. „Abenteurer — Spiele 100 Spiele" (erfüllt),
„Sammler — Sammle 10.000 Münzen" (8.450/10.000), „Meister — Erreiche Level 50" (34/50).
Im Profil steht ein Gesamtstand (Mockup: **25 / 60**) mit Abzeichen in Bronze, Silber und Gold.

**Festgelegt am 17.08.2026** (war offen bis Phase 7) — **24 Erfolge**, nicht 60:

| # | ID | Titel | Ziel |
|---|---|---|---|
| 1 | `first-round` | Erste Schritte | Spiele deine erste Runde |
| 2 | `adventurer` | Abenteurer | Spiele 100 Runden |
| 3 | `veteran` | Vielspieler | Spiele 500 Runden |
| 4 | `winner` | Siegertyp | Gewinne 50 Runden |
| 5 | `collector` | Sammler | Sammle 10.000 Münzen |
| 6 | `crystal-collector` | Kristallsammler | Sammle 500 Kristalle |
| 7 | `climber` | Aufsteiger | Erreiche Level 10 |
| 8 | `master` | Meister | Erreiche Level 50 |
| 9 | `endurance` | Ausdauer | Spiele 10 Stunden |
| 10 | `allrounder` | Alleskönner | Spiele jedes der acht Spiele |
| 11 | `game-waldbloecke` | Waldläufer | 25 Runden Waldblöcke |
| 12 | `game-blockfall` | Stapelmeister | 25 Runden Blockfall |
| 13 | `game-tempelpaare` | Tempelforscher | 25 Runden Tempelpaare |
| 14 | `game-kristallmix` | Kristallschleifer | 25 Runden Kristallmix |
| 15 | `game-sudoku` | Zahlenfuchs | 25 Runden Sudoku |
| 16 | `game-bubbleshooter` | Blasenjäger | 25 Runden Bubble Shooter |
| 17 | `game-solitaire` | Kartenkünstler | 25 Runden Solitaire |
| 18 | `game-minigolf` | Bahnenkenner | 25 Runden Minigolf |
| 19 | `wanderer` | Wanderer | Schließe 15 Abenteuer-Knoten ab |
| 20 | `chapter-master` | Kapitelmeister | Schließe ein ganzes Kapitel ab |
| 21 | `star-hunter` | Sternensammler | Sammle 30 Sterne im Abenteuerpfad |
| 22 | `loyal` | Treuer Freund | Hole die Tagesbelohnung 7 Tage in Folge |
| 23 | `shopper` | Erster Einkauf | Kaufe etwas im Shop |
| 24 | `wardrobe` | Sammlerstück | Besitze 3 Gegenstände |

Begründung für 24 statt der 60 aus dem Mockup: **Jeder dieser Erfolge ist aus Daten
messbar, die der Spielstand ohnehin führt** — Statistik, Fortschritt je Spiel, Abenteuerpfad,
Serie der Tagesbelohnung, Besitz. Für 60 müssten 36 weitere Ziele erfunden werden, die
niemand zählt; die Zahl 60 auf dem Mockup ist eine Platzhalter-Beschriftung wie die
Euro-Preise im Shop. Die drei bereits vorhandenen IDs (`adventurer`, `collector`, `master`)
bleiben unverändert, damit gespeicherte Fortschritte die Migration überleben.

Die Abzeichenstufen aus dem Mockup (Bronze, Silber, Gold) ergeben sich aus der Zielgröße:
Bronze bis 25, Silber bis 100, Gold darüber.

### Statistik

Gesamtspiele, gewonnene Spiele, bestes Level, Spielzeit, gesammelte Münzen, gesammelte Kristalle.
Pro Spiel zusätzlich ein eigener Bestwert (bestes Level oder Bestzeit, siehe Tabelle oben).

### Shop

Reiter: **Empfohlen · Outfits · Helfer · Booster** (ältere Mockups nennen zusätzlich
*Angebote*, *Münzen*, *Kristalle*).

Belegte Waren:

| Ware | Preis |
|---|---|
| Fynnox Piraten Outfit | 1.200 Kristalle |
| Kristall Haustier | 800 Kristalle |
| Mega Booster Pack | 2.500 Kristalle |
| Münzpaket 10.000 | 2,49 € |
| Kristallpaket 500 | 4,99 € |
| Booster Pack | 5,99 € |

Dazu **tägliche Gratis-Angebote** mit Countdown: 500 Münzen, 10 Kristalle, Energie.

Die Euro-Preise sind **Platzhalter**. Es ist keine Bezahlung geplant oder implementiert.
Alles, was mit Kristallen bezahlt wird, ist dagegen umsetzbar.

**Festgelegt am 17.08.2026** (Phase 7):

- Waren mit Kristallpreis sind **einmalig** käuflich und landen als ID in `ownedItems`
  im Spielstand. Ohne diese Ablage wäre der Kauf wirkungslos — die Kristalle wären weg
  und nichts wäre da. Das ist die einzige Strukturänderung der Phase (`SAVE_VERSION` 2).
- Waren mit Euro-Preis werden angezeigt, sind aber **nicht anklickbar** und tragen den
  Hinweis „Keine Bezahlung". Sie stehen im Mockup und werden darum gezeigt, statt zu fehlen.
- Die **täglichen Gratis-Angebote** werden nicht doppelt gebaut: Diese Rolle füllt bereits
  die tägliche Belohnung auf dem Startbildschirm, mit derselben Staffelung aus Münzen und
  Kristallen und demselben Countdown. Zwei getrennte Tagesgeschenke wären zwei Systeme
  für denselben Zweck.
- Der Warenkatalog geht über die sechs belegten Einträge des Mockups hinaus, damit die
  vier Reiter nicht halb leer sind. Zusätzliche Waren übernehmen die Preislage der
  belegten: Outfits 800–1.500, Helfer 600–1.200, Booster 250–2.500 Kristalle.

### Einstellungen

Aus dem Handy-Mockup, in drei Gruppen:

| Gruppe | Einträge |
|---|---|
| Allgemein | Musik, Soundeffekte, Vibration, Energiesparmodus — jeweils Ein/Aus-Schalter |
| Spiel | Sprache (Deutsch), Benachrichtigungen, Cloud-Speicherung (Zustand „Verbunden"), Datenschutz |
| Support | Hilfe & Support, Über Fynnox Puzzle Worlds |

### Fynnox Club

Abo-Idee mit exklusiven Belohnungen, VIP-Abzeichen, doppelten Münzen und ohne Werbung.
Reines Konzept, nicht geplant.

---

## Welten

Aus dem Masterprompt: **Sunforest, Schnee, Lava, Candy, Kristallhöhlen, Pirateninsel,
Unterwasser, Steampunk, Weltraum, Halloween, Weihnachten.**

Welten liefern Kulisse und Farbstimmung. Sie sind auf drei Ebenen sichtbar:
im Abenteuerpfad (Abschnitte), in den Minigolf-Bahnen (Sonnenwald, Piratenbucht,
Kristallhöhle, Lavatal, Wolkeninsel, Wintergipfel) und als Hintergrund in den Spielen.

Namensdisziplin: In den Mockups treten Mischformen auf — „Sunforest" (englisch) neben
„Sonnenwald" (deutsch), „Lava" neben „Lavawelt" und „Lavatal". Festlegung für die Umsetzung:
**deutsche Anzeigenamen** (Sonnenwald, Kristallhöhlen, Lavawelt, Pirateninsel …),
technische IDs englisch und kleingeschrieben.
