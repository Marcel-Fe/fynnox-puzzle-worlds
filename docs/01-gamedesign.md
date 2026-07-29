# Gamedesign

Alle Regeln und Zahlen hier stammen aus [den Konzeptbildern](referenzen/) oder dem
[Masterprompt](00-masterprompt.md). Was dort nicht steht, ist als **OFFEN** markiert und
wird nicht geraten.

---

## Die sechs Spiele

Technische IDs sind unveränderlich: `blockfall`, `waldbloecke`, `tempelpaare`,
`kristallmix`, `solitaire`, `minigolf`.

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
- **OFFEN**: Feldgröße, Kristallfarben und ihre Anzahl, genaue Power-Up-Regeln (4er/5er/L/T)

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
- **OFFEN**: Punktesystem, ob eine oder drei Karten gezogen werden, Anzahl der Hilfen

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

## Geteilte Systeme

Alle sechs Spiele zahlen auf **ein** Profil ein.

### Level und XP

- Fortschrittsbalken mit „aktuelle XP / XP für nächstes Level" (Mockup: Level 12, 2.450 / 3.500)
- Bei jedem Levelaufstieg gibt es eine Belohnung (Mockup: 2.000 Münzen + 50 Kristalle)
- **OFFEN**: XP pro Runde je Spiel, XP-Kurve pro Level, Belohnungstabelle

### Währungen

| Währung | Symbol | Wofür |
|---|---|---|
| Münzen | goldene Pfoten-Münze | Standardwährung, aus Runden und Missionen |
| Kristalle | violetter Kristall | Premiumwährung, seltener |
| Energie | Blitz, Anzeige „5/5 Max." | Verbrauch pro Spielstart, regeneriert über Zeit |

- **OFFEN**: Energiekosten pro Runde, Regenerationsdauer, Münzen/Kristalle pro Runde

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

Ein Levelpfad quer über alle Spiele, in Weltabschnitten zu je 20 Leveln:

| Abschnitt | Welt | Level |
|---|---|---|
| 1 | Sunforest | 1–20 |
| 2 | Kristallhöhlen | 21–40 |
| 3 | Lavawelt | 41–60 |
| 4 | Pirateninsel | 61–80 |
| 5 | gesperrt (`???`) | 81–100 |

Auf dem Pfad liegen Truhen, Kristalle, Sterne und Meilensteine (Krone).
Jeder Abschnitt zeigt Sterne als Fortschritt.

- **Konflikt, muss geklärt werden**: Der Masterprompt nennt **elf** Welten
  (Sunforest, Schnee, Lava, Candy, Kristallhöhlen, Pirateninsel, Unterwasser, Steampunk,
  Weltraum, Halloween, Weihnachten), der Pfad in den Mockups zeigt aber nur vier plus
  einen gesperrten Abschnitt und endet bei Level 100. Entweder wächst der Pfad auf
  220 Level, oder ein Teil der Welten sind reine Saison-/Event-Welten
  (Halloween, Weihnachten, Candy sprechen dafür). → **OFFEN**

### Events

Zeitlich begrenzt, mit eigenem Fortschrittsbalken und eigenem Shop.
Mockup-Beispiel: „Sommer Cup", Restzeit 16 h 45 m, Fortschritt 3.250 / 10.000,
Belohnung 1.000 Münzen + 100 Kristalle. **OFFEN**: Eventkatalog und Rhythmus.

### Ranglisten und Freunde

- Freundesliste mit Level und Status (Online / Im Spiel / zuletzt aktiv), Anfragen, Bestenliste
- Rangliste nach Punkten, eigene Position hervorgehoben
- Freunde können herausgefordert werden
- **OFFEN**: Wie ohne Backend? Bis zur Cloud-Phase sind Freunde/Ranglisten Platzhalter
  mit den Spielfiguren als Gegner

### Erfolge

Dauerhafte Ziele mit Fortschritt, z. B. „Abenteurer — Spiele 100 Spiele" (erfüllt),
„Sammler — Sammle 10.000 Münzen" (8.450/10.000), „Meister — Erreiche Level 50" (34/50).
**OFFEN**: vollständige Erfolgsliste.

### Statistik

Gesamtspiele, gewonnene Spiele, bestes Level, Spielzeit, gesammelte Münzen, gesammelte Kristalle.
Pro Spiel zusätzlich ein eigener Bestwert (Bestscore, Bestzeit oder bestes Ergebnis unter Par).

### Shop

Kategorien: **Angebote**, **Outfits**, **Booster**, **Münzen**, **Kristalle**.
Auf den Mockups stehen Euro-Preise (2,49 € / 4,99 € / 9,99 €) — das sind **Platzhalter**.
Es ist keine Bezahlung geplant oder implementiert.

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
