# Fynnox Puzzle Worlds

Acht Puzzle- und Kartenspiele mit dem Fuchs **Fynnox** — ein gemeinsames Profil, XP, Münzen, Kristalle,
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
npm test         # Logik-Tests (399 Stück) — müssen grün sein
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
| 5 | Spieleauswahl, Profil, Ergebnisbildschirm, Laden | ✅ |
| 5b | Echte Spielgrafik aus den Konzeptbildern, Fynnox in 3D | ✅ |
| 6 | Die weiteren sieben Spiele | ✅ 7 von 7 |
| 7 | **Meta-Systeme: Abenteuerpfad, Missionen, Tagesbelohnung, Shop, Events, Erfolge** | ✅ |
| 8 | Cloud-Save, Ranglisten, Freunde, Ton | offen · Einstellungen ✅ |

**Spielbar: alle acht** — Waldblöcke, Blockfall, Tempelpaare, Kristallmix, Sudoku,
Bubble Shooter, Fynnox Solitaire (zwölf Level) und Fynnox Minigolf (sechs Bahnen),
jeweils nacheinander freigeschaltet.
Eine Runde kostet 1 Energie, bringt XP und Münzen, lässt
Tagesmissionen hochzählen und wird lokal gespeichert. Danach zeigt ein
Ergebnisbildschirm Sterne und Belohnungen.

**Was die Spiele zusammenhält**

- **Abenteuerpfad** — neun Kapitel zu je 15 Knoten. Ein Knoten ist eine Runde in einem
  vorgegebenen Spiel und gilt ab einem Stern als geschafft; am Kapitelende wartet eine Truhe,
  deren Inhalt mit den gesammelten Sternen wächst.
- **Missionen** — drei Reiter: täglich (Wechsel um Mitternacht), wöchentlich (Montag) und Event.
- **Tägliche Belohnung** — Leiter über sieben Tage; ein ausgelassener Tag setzt die Serie zurück.
- **Shop** — Outfits, Helfer und Booster gegen Kristalle. Euro-Preise stehen als Anzeige da,
  es gibt keine Bezahlung.
- **Events** — vier Events im Wochenwechsel, jedes mit eigener Mission.
- **Erfolge** — 24 Stück, alle aus dem Spielstand messbar.

**Fertige Bildschirme**: Laden · Dashboard · Spieleauswahl · acht Spiele · Missionen ·
Abenteuerpfad · Shop · Events · Erfolge · Profil · Einstellungen · Mehr.
Nur Freunde und Rangliste sind noch Platzhalter — beide brauchen einen Server (Phase 8).

## Dokumentation

Die Dokumente in [`docs/`](docs/) sind verbindlich — Regeln, Farben, Charaktere und
Datenstrukturen werden dort nachgelesen, nicht erfunden. Einstieg: [CLAUDE.md](CLAUDE.md).

## Technik

Vite · React 19 · TypeScript · TailwindCSS v4 · zustand · vite-plugin-pwa ·
Deployment über GitHub Actions nach GitHub Pages.

---

© Marcel Fehse. Alle Rechte vorbehalten.
