# Fynnox Puzzle Worlds

Sechs Puzzle-Spiele mit dem Fuchs **Fynnox** — ein gemeinsames Profil, XP, Münzen, Kristalle,
Missionen und ein Abenteuerpfad über mehrere Welten. Installierbare PWA, gebaut fürs Smartphone.

**Live:** https://marcel-fe.github.io/fynnox-puzzle-worlds/

## Auf dem Handy installieren

1. Link im Browser öffnen — **Safari** auf dem iPhone, **Chrome** auf Android.
2. iPhone: Teilen-Symbol → „Zum Home-Bildschirm".
   Android: Menü (drei Punkte) → „App installieren" bzw. „Zum Startbildschirm hinzufügen".
3. Die App startet danach ohne Browserleiste, im Hochformat, und funktioniert auch offline.

## Lokal starten

```bash
npm install
npm run dev      # Entwicklungsserver, auch im Heimnetz übers Handy erreichbar
npm test         # Logik-Tests (27 Stück) — müssen grün sein
npm run build    # Produktionsbau — muss vor jedem Push durchlaufen
npm run preview  # gebauten Stand lokal ansehen
```

## Stand

| Phase | Inhalt | Status |
|---|---|---|
| 1 | Fundament: Dokumente, Repo, Deployment | ✅ |
| 2 | Gerüst: Navigation, Design-Tokens, PWA | ✅ |
| 3 | Profil und Speicherung | ✅ |
| 4 | **Waldblöcke — spielbar** | ✅ |
| 5 | Restliche Bildschirme mit echten Daten | offen |
| 6 | Die weiteren sieben Spiele | offen |
| 7 | Abenteuerpfad, Events, Erfolge, Shop | offen |
| 8 | Cloud-Save, Ranglisten, Ton | offen |

**Spielbar**: Waldblöcke. Eine Runde kostet 1 Energie, bringt XP und Münzen,
lässt Tagesmissionen hochzählen und wird lokal gespeichert.
Die übrigen sieben Spiele stehen als „Bald" auf dem Dashboard.

## Dokumentation

Die Dokumente in [`docs/`](docs/) sind verbindlich — Regeln, Farben, Charaktere und
Datenstrukturen werden dort nachgelesen, nicht erfunden. Einstieg: [CLAUDE.md](CLAUDE.md).

## Technik

Vite · React 19 · TypeScript · TailwindCSS v4 · zustand · vite-plugin-pwa ·
Deployment über GitHub Actions nach GitHub Pages.

---

© Marcel Fehse. Alle Rechte vorbehalten.
