# Lessons

Korrekturen durch den Auftraggeber und was daraus für die weitere Arbeit folgt.
Neueste Einträge oben.

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
