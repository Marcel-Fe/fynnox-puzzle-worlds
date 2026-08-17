# Lessons

Korrekturen durch den Auftraggeber und was daraus für die weitere Arbeit folgt.
Neueste Einträge oben.

---

## 2026-08-17 — Eine flache Darstellung wird durch Schattierung nicht zum Spiel

**Was passiert ist**: Das Minigolf-Spielfeld wurde als „einfach nur schlimm, hat kein
Spielniveau" bewertet, mit der Vorgabe „auf 2,5D-Niveau anpassen". Der erste Anlauf legte
Verläufe, Schlagschatten, Texturen und Glanzlichter über die bestehende Draufsicht. Die
Antwort war: „sieht immer noch so aus wie vorher".

**Ursache**: Der Auftrag wurde als Stilfrage gelesen, war aber eine Strukturfrage. 2,5D
ist eine **Projektion**, keine Oberflächenbehandlung. Solange die Bahn senkrecht von oben
gezeigt wird, bleibt sie flach — ganz gleich, wie viele Schatten darauf liegen. Erst das
Kippen der Ebene samt Wandflächen, Krone und Plattendicke brachte den Sprung.

**Konsequenz**: Wird eine Darstellung **als Ganzes** abgelehnt, ist die Darstellungsart
gemeint und nicht ihre Ausschmückung. Dann die Ansicht wechseln, statt die vorhandene zu
verzieren. Ein zweiter Punkt aus demselben Durchgang: Die Kulisse hinter dem Spielfeld
wurde unscharf gerechnet, damit sie weniger stört — das fiel sofort negativ auf. Etwas
unkenntlich zu machen ist keine Lösung für „es konkurriert um Aufmerksamkeit"; das
Spielfeld muss sich aus eigener Kraft abheben.

**Und technisch**: Beim Zeichnen von Flächen aus einem Polygon wird die Umlaufrichtung
über die Flächenformel bestimmt — die misst jedoch für eine nach **oben** zeigende
Y-Achse. Auf dem Bildschirm zeigt Y nach unten, das Vorzeichen dreht sich also um. Beim
falschen Vorzeichen zeigen alle Normalen nach innen, und die Rückwand landet als Balken
quer über dem Bild.

---

## 2026-08-17 — Playwrights `set_offline` erreicht den Service Worker nicht

**Was passiert ist**: Der erste Offline-Test meldete, dass das 2,4 MB große 3D-Modell auch
ohne Netz lädt — obwohl es in keinem Cache lag. Das Ergebnis war geschönt.

**Ursache**: `context.set_offline(True)` kappt die Netzwerkanfragen der **Seite**. Ein
Service Worker holt seine Dateien in einem eigenen Kontext, den diese Schranke nicht
erfasst. Anfragen, die er beantwortet, gehen weiterhin ins Netz.

**Konsequenz**: Ein Offline-Test einer PWA ist nur dann aussagekräftig, wenn der Server
**wirklich gestoppt** wird. Das Testskript startet den Vorschauserver selbst, hält ihn nach
dem Aufwärmen an und fährt ihn zum Schluss wieder hoch. Gegenprobe: Fehlt in der Liste der
gescheiterten Anfragen genau das, was gar nicht im Vorab-Cache liegt, misst der Test nichts.

---

## 2026-07-29 — Ziehen auf Flächen, die sich neu zeichnen

**Was passiert ist**: In Bubble Shooter kam nur jeder dritte Schuss an. Zwei Anläufe zur
Behebung gingen daneben, weil ich die Ursache vermutet statt gemessen habe.

**Ursache** (durch Zählen der Zeigerereignisse im Browser gefunden): Chromium bindet einen
Zeigervorgang an das Element, auf dem er begonnen hat. Verschwindet dieses Element, bricht
der Vorgang mit `pointercancel` ab — `pointerup` kommt nie. Weil das Spielfeld nach jedem
Schuss neu gezeichnet wird, traf das ab dem zweiten Schuss immer zu.

**Konsequenz**: Bei Zieh-Gesten auf Flächen, die sich während der Geste neu aufbauen:

1. Alle Kinder der Fläche für den Zeiger durchlässig machen
   (`[&_*]:pointer-events-none`), damit die Berührung am stabilen Container beginnt.
2. `pointermove` und `pointerup` am **Fenster** behandeln, dauerhaft registriert, mit dem
   Zielzustand in einer Referenz statt im React-Zustand.

**Und methodisch**: Bei einem Fehler, der nach dem ersten Fix bestehen bleibt, nicht den
zweiten Fix raten — messen. Ein Zähler für die tatsächlich eintreffenden Ereignisse hat
die Ursache in einem Durchlauf gezeigt.

---

## 2026-07-29 — Browsertests gegen den Service Worker sind wertlos

**Was passiert ist**: Ein Fehler in Bubble Shooter blieb nach dem Fix scheinbar bestehen.
Zwei Runden Fehlersuche gingen in eine falsche Richtung, weil der Testbrowser gar nicht
den neuen Stand ausführte.

**Ursache**: Die App registriert einen Service Worker. Der lieferte im Testbrowser die
zwischengespeicherte alte JavaScript-Datei aus — der frisch gebaute Code kam nie zur
Ausführung.

**Konsequenz**: In jedem Playwright-Skript den Service Worker abschalten:
`browser.new_context(..., service_workers="block")`. Zusätzlich vor dem Test prüfen, dass
der Vorschauserver wirklich neu gestartet ist — ein alter Prozess auf demselben Port
lässt den neuen mit „Port already in use" scheitern, ohne dass es auffällt.

---

## 2026-07-29 — Tailwind v4 wirft ungenutzte Design-Tokens weg

**Was passiert ist**: Die Kristalle in Kristallmix waren unsichtbar — nur die Glanzkanten
waren zu sehen. Die Farbvariablen `--color-gem-0` bis `--color-gem-5` standen in
`index.css`, fehlten aber im gebauten CSS vollständig.

**Ursache**: Tailwind v4 entfernt aus einem `@theme`-Block jede Variable, deren Name
nicht **wörtlich** im Quelltext vorkommt. Der Name wurde hier zur Laufzeit
zusammengesetzt (`var(--color-gem-${farbe})`), also hat Tailwind ihn nie gesehen.
Bei den Blockfall-Steinen fiel es nicht auf, weil dort die vollen Namen als Zeichenketten
in `pieces.ts` stehen — reiner Zufall, der jederzeit hätte kippen können.

**Konsequenz**: Tokens, deren Namen zur Laufzeit gebildet werden, gehören in einen
normalen `:root`-Block, nicht in `@theme`. Nach jeder neuen Token-Gruppe im gebauten
CSS prüfen, ob sie tatsächlich angekommen ist:
`grep -o '\-\-color-xyz[^;]*' dist/assets/*.css`

---

## 2026-07-29 — Mockups sind Bildmaterial, nicht nur Vorlage

**Was passiert ist**: Die Oberfläche wurde als reines CSS nachgebaut — flache Farbflächen
statt der gerenderten Figuren und Kulissen aus den Konzeptbildern. Der Auftraggeber wies
darauf hin, dass die Grafik so aussehen soll wie auf den Bildern.

**Ursache**: Die Konzeptbilder wurden als *Layoutvorlage* gelesen, nicht als *Materiallager*.
Illustrationen dieser Art lassen sich mit CSS grundsätzlich nicht nachbauen.

**Konsequenz**: Figuren, Kulissen und Kachelbilder werden aus den Referenzbildern
geschnitten und als echte Bilddateien eingebunden (`scripts/extract-art.py` → `public/art/`).
Bei jedem neuen Bildschirm zuerst prüfen, ob es dafür bereits Bildmaterial im
Referenzordner gibt, bevor etwas als Farbfläche gebaut wird.

---

## 2026-07-29 — Keine Textdateien mit PowerShell schreiben

**Was passiert ist**: `Set-Content` schrieb `games.ts` in einer Kodierung, die alle Umlaute
zerstörte („Waldblöcke" wurde zu „WaldblÃ¶cke"). Eine zweite Panne: `ConvertTo-Json`
ersetzte `&&` in `package.json` durch `&&`, was den Build zerbrach.

**Ursache**: PowerShell-Textwerkzeuge legen eigene Kodierungs- und Escaping-Regeln an,
die für Quelltext nicht passen.

**Konsequenz**: Quell- und Konfigurationsdateien ausschließlich mit den Datei-Werkzeugen
schreiben. PowerShell nur für Befehle, nie für Dateiinhalte. Commit-Nachrichten mit
Sonderzeichen über `git commit -F datei` statt über die Befehlszeile.

---

## 2026-07-29 — Bestehende Projekte prüfen, bevor ein Stack gewählt wird

**Was passiert ist**: Der Tech-Stack wurde aus dem Masterprompt abgeleitet (Next.js) und in
CLAUDE.md geschrieben, ohne vorher zu schauen, wie die bestehenden Fynnox-Projekte gebaut sind.
Der Hinweis „wie die anderen Fynnox Spiele" brachte zutage, dass `fynnox-adventure`
auf Vite + React 19 + zustand + vite-plugin-pwa mit GitHub-Pages-Deployment läuft.

**Ursache**: Der Masterprompt nennt einen Wunsch-Stack, das bestehende Repo zeigt den
tatsächlich gelebten. Nur der erste wurde gelesen.

**Konsequenz**: Bei jedem neuen Projekt in diesem Umfeld zuerst `gh repo list` und die
Konfiguration des nächstverwandten Repos ansehen. Ein bestehendes, funktionierendes Muster
schlägt einen aufgeschriebenen Wunsch — Abweichungen davon werden begründet und
in CLAUDE.md vermerkt (hier: TailwindCSS, weil dieses Projekt UI-lastig ist).
