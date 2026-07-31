# Lessons

Korrekturen durch den Auftraggeber und was daraus für die weitere Arbeit folgt.
Neueste Einträge oben.

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
