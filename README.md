# Fynnox Puzzle Worlds

Sieben Puzzle- und Kartenspiele mit dem Fuchs **Fynnox** — ein gemeinsames Profil, XP, Münzen, Kristalle,
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
npm test         # Logik-Tests (392 Stück) — müssen grün sein
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
| 6 | Die weiteren Spiele | ✅ 6 von 6 |
| 7 | **Meta-Systeme: Abenteuerpfad, Missionen, Tagesbelohnung, Shop, Events, Erfolge** | ✅ |
| 8 | **Ton, Freunde, Rangliste, Cloud-Save, Offline, Feinschliff** | ✅ · Cloud noch ohne Server |

**Spielbar: alle sieben** — Waldblöcke, Blockfall, Tempelpaare, Kristallmix, Sudoku,
Bubble Shooter und Fynnox Solitaire (zwölf Level), jeweils nacheinander freigeschaltet.
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
- **Erfolge** — 23 Stück, alle aus dem Spielstand messbar.
- **Freunde und Rangliste** — neun Begleitfiguren als Gegner, mit festen Werten aus einem
  gesäten Generator. Beide Bildschirme schreiben hin, dass es Spielfiguren sind und keine
  echten Menschen.

**Alle Bildschirme sind gebaut**: Laden · Dashboard · Spieleauswahl · sieben Spiele ·
Missionen · Abenteuerpfad · Shop · Events · Erfolge · Freunde · Rangliste · Profil ·
Einstellungen · Mehr. Es gibt keinen Platzhalter mehr.

**Ton**: Klänge bei Sieg, Niederlage, Belohnung, Truhe und Kauf — prozedural über WebAudio
erzeugt, ohne Audiodateien. Hintergrundmusik lässt sich zuschalten; sie wird beim ersten
Einschalten geladen und ist danach auch offline da.

**Offline**: Ohne Netz startet die App, alle Kulissen sind da, eine Runde läuft durch und
der Spielstand bleibt erhalten. Zwei große Dateien laden erst beim ersten Gebrauch nach —
die Musik und das 3D-Modell von Fynnox.

**Cloud-Speicherung**: Zwei Geräte teilen sich einen Spielstand über einen sechsstelligen
Kopplungscode — ohne Konto, ohne E-Mail, ohne Passwort. Der Code steht in den Einstellungen.
Dafür braucht es ein eigenes Supabase-Projekt; siehe [`.env.example`](.env.example) und
[`supabase/schema.sql`](supabase/schema.sql). **Ohne diese Zugangsdaten bleibt der
Spielstand rein lokal, und die App läuft unverändert weiter.**

## Dokumentation

Die Dokumente in [`docs/`](docs/) sind verbindlich — Regeln, Farben, Charaktere und
Datenstrukturen werden dort nachgelesen, nicht erfunden. Einstieg: [CLAUDE.md](CLAUDE.md).

## Technik

Vite · React 19 · TypeScript · TailwindCSS v4 · zustand · vite-plugin-pwa ·
Deployment über GitHub Actions nach GitHub Pages.

Bewusst **ohne** Animationsbibliothek und **ohne** Supabase-Client: Beides wäre für das,
was hier gebraucht wird, mehr Gewicht als eigener Code — die Begründungen stehen in
[docs/01-gamedesign.md](docs/01-gamedesign.md) und [docs/04-datenmodell.md](docs/04-datenmodell.md).

---

© Marcel Fehse. Alle Rechte vorbehalten.
