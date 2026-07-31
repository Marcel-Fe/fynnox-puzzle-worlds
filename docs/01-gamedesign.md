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
- **OFFEN**: Punkteformel, Level-Aufstiegskurve, Fallgeschwindigkeit, welche vier Power-Ups genau

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

**Festgelegt am 31.07.2026** (war offen: Punktesystem, eine oder drei Karten ziehen,
Anzahl der Hilfen):

| Punkt | Festlegung | Begründung |
|---|---|---|
| Karten ziehen | **eine** je Tipp | Bei drei Karten ist jede dritte Talonkarte nur über mehrere Durchläufe erreichbar. Auf dem Handy ist das viel Tippen für wenig Spiel |
| Talon-Durchläufe | **unbegrenzt** | Mit einer Karte und unbegrenzten Durchläufen ist der weitaus größte Teil der Blätter gewinnbar. Eine Begrenzung würde Partien beenden, die noch lösbar sind |
| Hinweise | **3** je Runde | Gleiche Zahl wie bei Tempelpaare und Sudoku — der Spieler soll nicht je Spiel neu lernen, wie viel Hilfe er hat |
| Rückgängig | **unbegrenzt** | Solitaire lebt vom Ausprobieren. Ein Zug, der eine Sackgasse erzeugt, ist sonst das Ende der Runde |
| Zeitlimit | **keins** | Die Kachel verspricht „Klassisch. Entspannt. Zeitlos." Die Zeit zählt nur für Punkte und Sterne, sie beendet nichts |

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

Bei Sieg zusätzlich **500 Punkte** plus einen Zeitbonus von `900 − verbrauchte Sekunden`
(mindestens 0). Nach 15 Minuten gibt es also keinen Bonus mehr.

**Sterne**: drei bei einem Sieg unter 5 Minuten, zwei unter 10 Minuten, sonst einer.
Wer aufgibt, bekommt keinen.

**Keine Lösbarkeitsgarantie** — bewusst anders als bei Tempelpaare, Kristallmix und
Sudoku. Klondike ist gerade deshalb ein Klassiker, weil nicht jedes Blatt aufgeht; ein
Spiel, das man immer gewinnt, verliert seinen Reiz. Gegen den Frust helfen das
unbegrenzte Rückgängig und ein **Aufgeben**-Knopf, der die Runde ohne Sterne beendet.

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
- **OFFEN**: Physikwerte (Reibung, Windstärke), Sternvergabe je nach Schlagzahl, Bahnlayouts

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
- **OFFEN**: Missionspool, wie viele gleichzeitig aktiv sind, Zeitpunkt des täglichen Resets

### Tägliche Belohnung

*„Komme jeden Tag zurück und erhalte tolle Belohnungen!"* — Staffelung mit Münzen und
Kristallen, Abholen per Knopf. **OFFEN**: Belohnungsleiter und Verhalten bei Aussetzern.

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

**OFFEN**: Was auf einem Knoten passiert — eine Runde in einem bestimmten Spiel mit
vorgegebenem Ziel, oder freie Wahl des Spiels. Wird in Phase 7 entschieden, wenn mehrere
Spiele fertig sind.

### Events

Zeitlich begrenzt, mit eigenem Fortschrittsbalken und eigenem Shop.
Der Eventbildschirm zeigt drei Gruppen:

| Gruppe | Beispiele aus den Mockups |
|---|---|
| Laufendes Hauptevent | „Sommer Cup" — „Kämpfe um den Sieg und gewinne großartige Preise!", eigene Platzierung (Platz 245), Restzeit, Fortschritt 3.250 / 10.000, Belohnung 1.000 Münzen + 100 Kristalle |
| Aktive Events | „Kristalljagd" (endet in 2 T 6 h), „Täglicher Bonus" (Zustand *Bereit!* mit Knopf „Abholen") |
| Kommende Events | „Piratenfest", „Monsterjagd" |

**OFFEN**: vollständiger Eventkatalog und Rhythmus.

### Ranglisten und Freunde

- Reiter: **Freunde · Anfragen · Bestenliste**
- Freunde erscheinen gruppiert nach **Online** und **Alle Freunde**
- Je Freund: Bild, Name, Trophäenpunkte und Status — entweder was gerade gespielt wird
  („Spielt Blockfall") oder wann zuletzt online („Zuletzt online: 1 h")
- Knopf „Freunden einladen"; Freunde können herausgefordert werden
- **OFFEN**: Wie ohne Backend? Bis zur Cloud-Phase sind Freunde und Ranglisten Platzhalter
  mit den Spielfiguren als Gegner

### Erfolge

Dauerhafte Ziele mit Fortschritt, z. B. „Abenteurer — Spiele 100 Spiele" (erfüllt),
„Sammler — Sammle 10.000 Münzen" (8.450/10.000), „Meister — Erreiche Level 50" (34/50).
Im Profil steht ein Gesamtstand (Mockup: **25 / 60**) mit Abzeichen in Bronze, Silber und Gold.
**OFFEN**: vollständige Erfolgsliste.

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
