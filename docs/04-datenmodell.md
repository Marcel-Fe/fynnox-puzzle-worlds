# Datenmodell und Speicherung

Dieses Dokument legt fest, **welche Daten es gibt** und **wie sie gespeichert werden**.
Es ist die teuerste Stelle, um es später falsch zu haben: Ändert sich hier etwas, müssen
alle Spielstände migriert werden.

---

## Grundregel

> **Kein Spielcode ruft jemals direkt `localStorage` auf.**

Aller Zugriff läuft über die Schnittstelle `SaveAdapter`. Heute steckt localStorage dahinter,
später Supabase — der Spielcode merkt davon nichts.

---

## Typen

Diese Typen leben in `src/save/types.ts`.

### Spiele

```ts
export type GameId =
  | 'blockfall'
  | 'waldbloecke'
  | 'tempelpaare'
  | 'kristallmix'
  | 'solitaire'
  | 'minigolf'
```

### Profil

```ts
export interface Profile {
  name: string
  level: number
  xp: number                  // XP innerhalb des aktuellen Levels
  coins: number
  crystals: number
  energy: number              // aktuell verfügbar
  energyMax: number           // 5 laut Mockup
  energyRefilledAt: number    // Zeitstempel der letzten Regeneration
  createdAt: number           // "Mitglied seit"
  favoriteGame: GameId | null // meistgespieltes Spiel, berechnet
}
```

### Fortschritt pro Spiel

Jedes Spiel hat einen anderen „Bestwert" — deshalb ein gemeinsamer Teil plus ein freies Feld.

```ts
export interface GameProgress {
  gamesPlayed: number
  gamesWon: number
  highScore: number
  highestLevel: number
  totalPlaytimeMs: number
  /** spielspezifisch: Bestzeit (Tempelpaare, Solitaire), bestes Par-Ergebnis (Minigolf) */
  bestTimeMs?: number
  bestUnderPar?: number
  starsCollected?: number
}
```

### Missionen

```ts
export type MissionKind = 'daily' | 'weekly' | 'event'

export interface Mission {
  id: string
  kind: MissionKind
  text: string                // deutscher Anzeigetext, z. B. "Spiele 3 Runden Blockfall"
  goal: number
  progress: number
  rewardCoins: number
  rewardCrystals?: number
  claimed: boolean
  expiresAt: number
  /** woran die Mission andockt — siehe Rundenauswertung weiter unten */
  track: MissionTrack
}

export type MissionTrack =
  | { type: 'playRounds'; game?: GameId }        // ohne game = irgendein Spiel
  | { type: 'winRounds'; game?: GameId }
  | { type: 'collectCoins' }
  | { type: 'collectCrystals' }
  | { type: 'reachScore'; game: GameId }
  | { type: 'custom'; key: string }              // z. B. "combos", "holeInOne", "noHint"
```

`custom` ist der Auffangfall: Jedes Spiel darf beim Rundenende eigene Zähler melden
(`combos: 3`, `rowsCleared: 10`, `hintsUsed: 0`), und Missionen können darauf hören,
ohne dass dieser Typ für jedes neue Spiel wächst.

### Erfolge

```ts
export interface Achievement {
  id: string
  title: string               // "Sammler"
  description: string         // "Sammle 10.000 Münzen"
  goal: number
  progress: number
  unlockedAt: number | null
}
```

### Abenteuerpfad

Nach Entwurf B aus dem [Gamedesign](01-gamedesign.md): Kapitel mit nummerierten Knoten,
je Knoten null bis drei Sterne.

```ts
export interface AdventurePath {
  chapter: number                    // z. B. 4 = "Kristallhöhle"
  nodeInChapter: number              // z. B. 8 von 15
  /** Sterne je abgeschlossenem Knoten, Schlüssel "kapitel:knoten" */
  stars: Record<string, 0 | 1 | 2 | 3>
  claimedChests: string[]            // bereits abgeholte Truhen
}
```

### Einstellungen

```ts
export interface Settings {
  music: boolean
  sound: boolean
  vibration: boolean
  powerSaving: boolean
  language: 'de'
  notifications: boolean
}
```

### Der komplette Spielstand

```ts
export interface SaveData {
  version: number             // für Migrationen — bei jeder Strukturänderung erhöhen
  profile: Profile
  progress: Record<GameId, GameProgress>
  missions: Mission[]
  achievements: Achievement[]
  adventure: AdventurePath
  stats: GlobalStats
  settings: Settings
  lastDailyRewardAt: number | null
  dailyRewardStreak: number
  /** zuletzt gespielte Spiele für die "Weiterspielen"-Reihe auf dem Dashboard */
  recentGames: GameId[]
}

export interface GlobalStats {
  totalGames: number
  totalWins: number
  bestLevel: number
  totalPlaytimeMs: number
  coinsEarnedTotal: number
  crystalsEarnedTotal: number
}
```

---

## Rundenauswertung — das Bindeglied

Der wichtigste Vertrag im Projekt. **Jedes** Spiel meldet am Ende einer Runde genau dieses
Objekt, und **nur** dieses Objekt verändert danach das Profil:

```ts
export interface RoundResult {
  game: GameId
  won: boolean
  score: number
  durationMs: number
  level?: number
  /** spielspezifische Zähler für Missionen: { combos: 3, rowsCleared: 10, hintsUsed: 0 } */
  counters?: Record<string, number>
}
```

Die zentrale Funktion in `src/core/round.ts`:

```ts
export function applyRoundResult(save: SaveData, result: RoundResult): SaveData
```

Sie erledigt in dieser Reihenfolge:

1. `progress[result.game]` fortschreiben (Spiele, Siege, Bestwert, Spielzeit)
2. `stats` fortschreiben
3. XP gutschreiben und bei Überschreiten der Schwelle das Level erhöhen
   (Levelaufstieg gibt zusätzlich Münzen und Kristalle)
4. Münzen und Kristalle gutschreiben
5. **alle** Missionen prüfen, deren `track` zum Ergebnis passt, und ihren Fortschritt erhöhen
6. Erfolge prüfen
7. `favoriteGame` neu berechnen

Sie ist **rein**: gleicher Spielstand + gleiches Ergebnis = gleiches Resultat, keine Seiteneffekte,
kein Zugriff auf Uhr oder Speicher. Dadurch ist sie ohne Browser testbar — und genau hier
werden die meisten Fehler entstehen, wenn sechs Spiele darauf einzahlen.

**OFFEN**: Wie viel XP, Münzen und Kristalle eine Runde bringt.
Steht als offener Punkt im [Gamedesign](01-gamedesign.md) und muss vor Phase 3 festgelegt werden.

---

## Speicher-Schnittstelle

`src/save/adapter.ts`:

```ts
export interface SaveAdapter {
  load(): Promise<SaveData | null>
  save(data: SaveData): Promise<void>
  clear(): Promise<void>
}
```

Alle Methoden sind `async` — auch die localStorage-Fassung, die sofort zurückkehrt.
Grund: Beim Wechsel auf Supabase ändert sich damit **keine einzige Aufrufstelle**.
Wären sie synchron, müsste später jeder Aufruf im Projekt angefasst werden.

**Umsetzungen:**

- `LocalSaveAdapter` — Schlüssel `fynnox-puzzle-worlds:save`.
  Der Schlüssel trägt den Projektnamen, weil alle Fynnox-Apps unter derselben Domain
  `marcel-fe.github.io` liegen und sich sonst gegenseitig überschreiben würden.
- `SupabaseSaveAdapter` — später, gleiche Schnittstelle.

**Speicherzeitpunkte**: nach jeder beendeten Runde, nach dem Abholen einer Belohnung,
nach einem Kauf und beim Verlassen der Seite (`visibilitychange`).
Nicht bei jedem einzelnen Zug — das würde bei Blockfall hunderte Schreibvorgänge auslösen.

---

## Migration

`SaveData.version` beginnt bei `1`. Ändert sich die Struktur:

1. `version` erhöhen
2. eine Migrationsfunktion `v1 → v2` in `src/save/migrations.ts` ergänzen
3. beim Laden alle Migrationen der Reihe nach anwenden

Fehlt eine Migration oder schlägt das Laden fehl, wird ein frischer Spielstand angelegt —
aber der defekte vorher unter `fynnox-puzzle-worlds:save-backup` weggesichert,
damit nichts unwiederbringlich verloren geht.

---

## Zustandsverwaltung

Ein zustand-Store in `src/store/` hält `SaveData` im Speicher und stellt Aktionen bereit
(`finishRound`, `claimMission`, `claimDailyReward`, `spendEnergy`).
Komponenten lesen nur aus dem Store, nie aus dem Adapter. Der Store ruft nach schreibenden
Aktionen `adapter.save()` auf.

---

## Probe: reicht das für Waldblöcke?

Durchgespielt am geplanten Ablauf einer Runde:

| Schritt | Gedeckt durch |
|---|---|
| Spieler tippt „Spielen" | `spendEnergy()` prüft und verringert `profile.energy` |
| Runde läuft, Punkte steigen | reine Spiellogik in `games/waldbloecke/logic/`, ohne Speicher |
| Feld ist voll, Runde endet | Spiel baut `RoundResult` mit `score`, `durationMs`, `counters: { rowsCleared, combos, stars }` |
| XP und Münzen gutschreiben | `applyRoundResult` Schritte 3 und 4 |
| Mission „Fülle 10 Reihen" | `track: { type: 'custom', key: 'rowsCleared' }`, Schritt 5 |
| Mission „Spiele 3 Runden Blockfall" | zählt hier **nicht** hoch, weil `game` nicht passt — richtig |
| Bestwert aktualisieren | `progress.waldbloecke.highScore` |
| Anzeige „Beste: 4.680" | liest `progress.waldbloecke.highScore` |
| Speichern | Store ruft `adapter.save()` |

Es fehlt nichts. Einzige Lücke sind die XP-/Münz-Zahlen selbst — die sind bewusst offen
und gehören ins Gamedesign, nicht hierher.
