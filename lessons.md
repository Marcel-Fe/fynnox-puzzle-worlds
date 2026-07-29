# Lessons

Korrekturen durch den Auftraggeber und was daraus für die weitere Arbeit folgt.
Neueste Einträge oben.

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
