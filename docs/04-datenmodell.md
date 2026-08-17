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
  | 'sudoku'
  | 'bubbleshooter'
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
  | { type: 'custom'; key: string; game?: GameId } // z. B. "combos", "holeInOne", "stars"
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
  /** IDs gekaufter Shop-Waren (ab Version 2) */
  ownedItems: string[]
  /** Zeitpunkt des letzten Speicherns — entscheidet beim Cloud-Abgleich (ab Version 3) */
  updatedAt: number
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
- `CloudSaveAdapter` — legt sich **über** den lokalen Adapter, siehe unten.

**Speicherzeitpunkte**: nach jeder beendeten Runde, nach dem Abholen einer Belohnung,
nach einem Kauf und beim Verlassen der Seite (`visibilitychange`).
Nicht bei jedem einzelnen Zug — das würde bei Blockfall hunderte Schreibvorgänge auslösen.

---

## Cloud-Speicher — festgelegt am 17.08.2026 (Phase 8)

### Der Widerspruch, der zuerst zu klären war

CLAUDE.md sagt **„keine Accounts"**. Das Abschlusskriterium von Phase 8 verlangt
**„derselbe Spielstand erscheint auf Handy und Desktop"**. Ohne irgendeine Identität
kann ein Server aber nicht wissen, welcher Stand zu welchem Spieler gehört.

**Entschieden**: anonyme **Geräte-ID plus Kopplungscode** — kein Konto, keine E-Mail,
kein Passwort, kein Anmeldebildschirm.

| | Geräte-ID + Kopplungscode | Echtes Login |
|---|---|---|
| Konto nötig | nein | ja |
| Persönliche Daten | keine | E-Mail |
| Gerät verloren | Stand weg, wenn der Code nicht notiert ist | wiederherstellbar |
| Widerspruch zu CLAUDE.md | keiner | direkter |

Der Preis ist offen zu nennen: **Wer sein einziges Gerät verliert und keinen Kopplungscode
notiert hat, verliert den Spielstand.** Für ein Familienprojekt ohne Echtgeld ist das
tragbar; ein Konto samt Passwortrücksetzung wäre für diesen Fall unverhältnismäßig.

### Wie es funktioniert

1. Jedes Gerät legt beim ersten Start eine `deviceId` an (`crypto.randomUUID()`),
   lokal unter `fynnox-puzzle-worlds:device`.
2. Der Spielstand hängt an einer `cloudId`. Anfangs ist sie gleich der `deviceId`.
3. **Koppeln**: Gerät A lässt sich einen sechsstelligen Code geben (gültig 15 Minuten).
   Gerät B gibt ihn ein und übernimmt damit A's `cloudId`. Ab da schreiben beide
   in dieselbe Zeile.
4. Die `cloudId` steht **nicht** im Spielstand — sie ist gerätelokal. Sonst würde sie
   beim Abgleich mitwandern und sich selbst überschreiben.

### Zusammenführen zweier Stände

Beim Start hält das Gerät zwei Stände in der Hand: den lokalen und den aus der Cloud.
Die Regel steht in `src/save/merge.ts` und ist rein (ohne Uhr, ohne Netz, testbar):

1. **Mehr gespielte Runden gewinnt** (`stats.totalGames`).
2. Bei Gleichstand gewinnt der **neuere `updatedAt`**.

Warum nicht einfach „neuer gewinnt"? Weil ein Zeitstempel von der Geräteuhr kommt und
eine falsch gestellte Uhr damit echten Fortschritt löschen könnte. Die Zahl gespielter
Runden kann dagegen nur wachsen — sie ist der verlässlichere Maßstab.

Die bewusste Lücke: Wird auf dem zurückliegenden Gerät **nur** eine Einstellung geändert
und keine Runde gespielt, geht diese Änderung beim nächsten Abgleich verloren. Das ist
der Preis dafür, dass niemals Spielfortschritt verschwindet — die falsche Richtung wäre
teurer.

### Warum kein `@supabase/supabase-js`

Gebraucht werden vier Aufrufe. Supabase stellt sie als REST-Endpunkte bereit
(`POST /rest/v1/rpc/<name>` mit dem `apikey`-Kopf) — das sind rund 30 Zeilen `fetch`.
Die Bibliothek bringt zusätzlich Auth, Realtime, Storage und Postgrest-Abfragebau mit,
also gut 100 KB für Dinge, die dieses Projekt nicht benutzt. CLAUDE.md verlangt für jede
Abhängigkeit ein echtes Problem, das eigener Code teuer machen würde. Das liegt hier
nicht vor.

### Sicherheit: warum vier Funktionen statt zweier Tabellen

Der `anon key` steht im ausgelieferten JavaScript und ist damit öffentlich. Läge auf
`saves` eine gewöhnliche Lesefreigabe, könnte jeder **alle** Spielstände abrufen.

Darum: Beide Tabellen sind für `anon` vollständig gesperrt (RLS an, keine Policy).
Erreichbar sind ausschließlich vier `security definer`-Funktionen, die jeweils **genau
eine** Zeile über ihren Schlüssel anfassen:

| Funktion | Zweck |
|---|---|
| `save_load(p_cloud_id)` | Stand dieser einen ID lesen |
| `save_store(p_cloud_id, p_data)` | Stand dieser einen ID schreiben |
| `pair_create(p_cloud_id)` | sechsstelligen Code erzeugen, 15 Minuten gültig |
| `pair_redeem(p_code)` | Code einlösen, gibt die zugehörige `cloud_id` zurück |

Eine `cloudId` ist eine UUID; sie zu erraten ist praktisch ausgeschlossen. Der
Kopplungscode ist dagegen kurz — deshalb läuft er nach 15 Minuten ab und wird beim
Einlösen sofort gelöscht.

Das vollständige SQL liegt in [`supabase/schema.sql`](../supabase/schema.sql).

### Einrichtung

`VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` kommen in eine lokale `.env`
(Vorlage: `.env.example`). Sie gehören **nie** ins Repo — `.gitignore` sperrt `.env`.

**Fehlt eine der beiden Angaben, bleibt alles beim lokalen Speicher.** Der Store baut
den Cloud-Adapter dann gar nicht erst; die App läuft unverändert weiter, und der
Einstellungsbildschirm sagt „Nicht eingerichtet". Damit ist kein Zwischenzustand
möglich, in dem die App eine Cloud vortäuscht, die es nicht gibt.

---

## Migration

`SaveData.version` beginnt bei `1`. Ändert sich die Struktur:

1. `version` erhöhen
2. eine Migrationsfunktion ergänzen — sie steht in `src/save/adapter.ts` (`migrate()`),
   nicht in einer eigenen Datei; für zwei Versionen wäre eine eigene Datei Überbau
3. beim Laden alle Migrationen der Reihe nach anwenden

**Version 2** (17.08.2026, Phase 7): `ownedItems: string[]` kam dazu, damit ein Kauf im
Shop im Spielstand landet. Alte Stände bekommen eine leere Liste. Andere Felder blieben
unverändert — Missionen, Erfolge und Abenteuerpfad waren von Anfang an vollständig
angelegt und mussten für Phase 7 nur gefüllt werden.

**Version 3** (17.08.2026, Phase 8): `updatedAt: number` kam für den Cloud-Abgleich dazu.
Alte Stände bekommen `0` — der niedrigstmögliche Wert. Das ist Absicht: Ein Stand ohne
Zeitstempel darf im Zweifel nicht gegen einen mit Zeitstempel gewinnen. Die erste Regel
(mehr gespielte Runden) greift ohnehin zuerst, sodass echter Fortschritt auch dann nicht
verlorengeht.

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
