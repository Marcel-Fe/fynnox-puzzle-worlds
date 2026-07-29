# Roadmap

Eine Phase gilt erst als fertig, wenn ihr Abschlusskriterium **gezeigt** wurde —
nicht, wenn der Code geschrieben ist.

---

## Phase 1 — Fundament ✅

Konzeptbilder und Masterprompt in verbindliche Dokumente überführt, Repo aufgesetzt.

**Fertig, wenn**: CLAUDE.md und die sechs docs-Dateien existieren, das Repo auf GitHub liegt
und die App über GitHub Pages erreichbar ist.

---

## Phase 2 — Gerüst und Handy-Installation

Vite + React + TypeScript + Tailwind + PWA. Layout-Rahmen mit Kopfzeile (Währungen),
Navigation (Tab-Leiste am Handy, Seitenleiste am Desktop) und leeren Bildschirmen.
Design-Tokens aus dem [Art-Guide](03-art-ui-guide.md) als CSS-Variablen.

**Fertig, wenn**: Die Seite lässt sich auf dem Smartphone über „Zum Home-Bildschirm"
installieren, startet ohne Browserleiste und zeigt Navigation samt Platzhalter-Bildschirmen.

---

## Phase 3 — Profil und Speicherung ✅

`SaveData`, `SaveAdapter` mit localStorage, zustand-Store, `applyRoundResult`, Energie-Nachfüllung.
Währungsleiste, Level-Karte und Missionen zeigen echte Werte.
Balancing-Zahlen stehen im [Gamedesign](01-gamedesign.md) und wurden aus den Mockup-Werten
abgeleitet.

**Nachgewiesen**: 27 Tests in `src/core/round.test.ts` und `src/games/waldbloecke/logic/game.test.ts`
(`npm test`). Im Browser geprüft: Energie sinkt beim Spielstart von 5 auf 4 und ist nach dem
Neuladen der Seite immer noch 4.

---

## Phase 4 — Waldblöcke, vollständig ✅

Das erste echte Spiel und die Vorlage für alle weiteren:
8×8-Raster, drei Vorratsblöcke, Reihen und Spalten räumen, Kombos, Sterne, Spielende.
Logik in `logic/` ohne React, Darstellung getrennt, Zufall über einen Seed.
Am Rundenende wird ein `RoundResult` gemeldet und über `applyRoundResult` verrechnet.

**Bedienung**: erst Block antippen, dann Feld antippen — bewusst kein Ziehen, weil auf
dem Handy sonst der Finger die Zielstelle verdeckt.

**Nachgewiesen**: Im Browser gespielt, Punkte steigen, Reihen werden geräumt, Energie
wird abgezogen und bleibt nach dem Neuladen erhalten.

---

## Phase 5 — Restliche Bildschirme mit echten Daten ✅

- **Spieleauswahl** mit Filterleiste (Alle · Puzzle · Karten · Sport)
- **Profil** mit Statistik, Erfolgen, Bestwerten je Spiel und änderbarem Namen
- **Ergebnisbildschirm** nach einer Runde — als gemeinsamer Baustein
  `components/RoundResult.tsx`, den alle künftigen Spiele verwenden
- **Ladebildschirm** mit Fynnox, Sprechblase und echtem Fortschritt
- **Weiterspielen-Reihe** auf dem Dashboard aus `recentGames`
- Die Spielkachel liegt in `components/GameTile.tsx` — eine einzige Stelle, damit
  Dashboard und Spieleliste nicht auseinanderlaufen

**Nachgewiesen** im Browser (390 × 844): Eine volle Runde bis „Feld voll!" gespielt
(35 Züge, 1.216 Punkte, 10 Reihen). Der Ergebnisbildschirm zeigte einen von drei Sternen,
32 XP, 12 Münzen, „Neuer Bestwert!" und „1 Mission geschafft".
Das Profil wies danach 1 Spiel, 12 gesammelte Münzen und Waldblöcke als Lieblingsspiel aus.
Eine Namensänderung überlebte das Neuladen der Seite.

Offen aus dieser Phase: Shop, Events, Freunde, Rangliste und Einstellungen sind noch
Platzhalter — sie gehören zu Phase 7 bzw. 8.

---

## Phase 5b — Echte Spielgrafik ✅

Die Oberfläche war bis dahin aus Farbflächen gebaut. Auf Hinweis des Auftraggebers
(„die Grafik genau so wie auf den Bildern") wurde sie auf das **Bildmaterial der
Konzeptbilder** umgestellt:

- `scripts/build-art.py` schneidet Porträts, Kulissen, Kachelbilder und App-Icons heraus
- Dashboard, Ladebildschirm, Spielkacheln, Kopfzeile, Profil und Waldblöcke nutzen sie
- Alles JPEG statt PNG: 2,8 MB → 0,9 MB
- Fynnox als **3D-Modell** aus `fynnox-adventure`, nachgeladen auf dem Profilbildschirm

**Nachgewiesen**: Alle Bildschirme im Browser bei 390 × 844 geprüft, keine Fehler.
Das 3D-Modell zeigt den richtigen Fynnox — orangefarbenes Fell, Fliegerbrille,
blauer Schal, grüne Kleidung, braune Handschuhe und Stiefel.

Dabei gefunden und behoben: `<Stage environment="city">` aus `drei` lädt seine
Beleuchtung zur Laufzeit aus dem Netz und bleibt offline schwarz — ersetzt durch
eigene Lichtquellen.

---

## Phase 6 — Die weiteren sieben Spiele

In dieser Reihenfolge, jedes nach dem Muster von Waldblöcke:

1. **Tempelpaare** — feste Layouts, keine Physik, keine Fallgeschwindigkeit
2. **Kristallmix** — Match-3 mit Nachrücken und Power-Ups
3. **Blockfall** — braucht als erstes eine Spielschleife mit Zeittakt
4. **Sudoku** — reine Logik, aber die Rätselerzeugung will durchdacht sein
5. **Bubble Shooter** — erste Schussbahn, versetztes Raster
6. **Solitaire** — umfangreichste Regeln, aber keine Animation nötig
7. **Minigolf** — zuletzt, weil Physik und sechs Bahnlayouts am meisten Aufwand sind

**Fertig, wenn**: Alle acht Spiele sind auf dem Handy spielbar und zahlen aufs selbe Profil ein.

---

## Phase 7 — Meta-Systeme

Abenteuerpfad, Missionsbildschirm mit drei Reitern, Erfolge, tägliche Belohnung,
Shop-Oberfläche (ohne Bezahlung), Events.

**Fertig, wenn**: Der Abenteuerpfad zeigt echten Fortschritt und Belohnungen sind abholbar.

Vorher zu klären: der Widerspruch zwischen elf Welten und einem Pfad bis Level 100
(siehe [Gamedesign](01-gamedesign.md)).

---

## Phase 8 — Cloud und Feinschliff

Supabase hinter dem bestehenden `SaveAdapter`, Cloud-Save, echte Ranglisten, Freunde.
Ton und Musik, Feinschliff der Animationen, Offline-Verhalten prüfen.

**Fertig, wenn**: Derselbe Spielstand erscheint auf Handy und Desktop.

---

## Was die Reihenfolge trägt

- Phase 3 vor Phase 4: Ein Spiel ohne Profil müsste später umgebaut werden.
- Waldblöcke vor allen anderen: einfachste Regeln, keine Zeitschleife, keine Physik —
  dadurch trägt es die Architektur, ohne sie zu verdecken.
- Minigolf zuletzt: einziges Spiel, das eventuell eine Engine braucht.
  Diese Entscheidung wird so lange wie möglich hinausgezögert.
- Dashboard nach dem ersten Spiel: Vorher gäbe es keine echten Zahlen anzuzeigen.
