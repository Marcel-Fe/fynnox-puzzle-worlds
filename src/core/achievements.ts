import { GAMES } from '../content/games'
import type { Achievement, SaveData } from '../save/types'
import { totalNodesDone, totalStars } from './adventure'

/**
 * Erfolgsliste (docs/01-gamedesign.md, Abschnitt „Erfolge").
 *
 * Jeder Erfolg misst sich an Daten, die der Spielstand ohnehin führt — darum
 * 24 und nicht die 60 aus dem Mockup: Für 60 müssten 36 Ziele erfunden werden,
 * die niemand zählt.
 *
 * `measure` ist rein. Der Zeitstempel der Freischaltung kommt von außen, weil
 * hier wie in `round.ts` keine Uhr stehen darf.
 */
export interface AchievementDef {
  id: string
  title: string
  description: string
  goal: number
  measure(save: SaveData): number
}

/** Abzeichenstufe nach Zielgröße (Mockup: Bronze, Silber, Gold). */
export type Badge = 'bronze' | 'silber' | 'gold'

export function badgeFor(goal: number): Badge {
  if (goal <= 25) return 'bronze'
  if (goal <= 100) return 'silber'
  return 'gold'
}

const PER_GAME_TITLES: Record<string, string> = {
  waldbloecke: 'Waldläufer',
  blockfall: 'Stapelmeister',
  tempelpaare: 'Tempelforscher',
  kristallmix: 'Kristallschleifer',
  sudoku: 'Zahlenfuchs',
  bubbleshooter: 'Blasenjäger',
  solitaire: 'Kartenkünstler',
  minigolf: 'Bahnenkenner',
}

const ROUNDS_PER_GAME = 25

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-round',
    title: 'Erste Schritte',
    description: 'Spiele deine erste Runde',
    goal: 1,
    measure: (s) => s.stats.totalGames,
  },
  {
    id: 'adventurer',
    title: 'Abenteurer',
    description: 'Spiele 100 Runden',
    goal: 100,
    measure: (s) => s.stats.totalGames,
  },
  {
    id: 'veteran',
    title: 'Vielspieler',
    description: 'Spiele 500 Runden',
    goal: 500,
    measure: (s) => s.stats.totalGames,
  },
  {
    id: 'winner',
    title: 'Siegertyp',
    description: 'Gewinne 50 Runden',
    goal: 50,
    measure: (s) => s.stats.totalWins,
  },
  {
    id: 'collector',
    title: 'Sammler',
    description: 'Sammle 10.000 Münzen',
    goal: 10000,
    measure: (s) => s.stats.coinsEarnedTotal,
  },
  {
    id: 'crystal-collector',
    title: 'Kristallsammler',
    description: 'Sammle 500 Kristalle',
    goal: 500,
    measure: (s) => s.stats.crystalsEarnedTotal,
  },
  {
    id: 'climber',
    title: 'Aufsteiger',
    description: 'Erreiche Level 10',
    goal: 10,
    measure: (s) => s.profile.level,
  },
  {
    id: 'master',
    title: 'Meister',
    description: 'Erreiche Level 50',
    goal: 50,
    measure: (s) => s.profile.level,
  },
  {
    id: 'endurance',
    title: 'Ausdauer',
    description: 'Spiele 10 Stunden',
    goal: 10,
    measure: (s) => Math.floor(s.stats.totalPlaytimeMs / 3_600_000),
  },
  {
    id: 'allrounder',
    title: 'Alleskönner',
    description: 'Spiele jedes der acht Spiele',
    goal: GAMES.length,
    measure: (s) => Object.values(s.progress).filter((p) => p.gamesPlayed > 0).length,
  },
  // Ein Erfolg je Spiel — erzeugt statt achtmal getippt, damit kein Spiel fehlt.
  ...GAMES.map((game) => ({
    id: `game-${game.id}`,
    title: PER_GAME_TITLES[game.id],
    description: `${ROUNDS_PER_GAME} Runden ${game.title}`,
    goal: ROUNDS_PER_GAME,
    measure: (s: SaveData) => s.progress[game.id].gamesPlayed,
  })),
  {
    id: 'wanderer',
    title: 'Wanderer',
    description: 'Schließe 15 Abenteuer-Knoten ab',
    goal: 15,
    measure: (s) => totalNodesDone(s.adventure),
  },
  {
    id: 'chapter-master',
    title: 'Kapitelmeister',
    description: 'Schließe ein ganzes Kapitel ab',
    goal: 1,
    measure: (s) => s.adventure.claimedChests.length,
  },
  {
    id: 'star-hunter',
    title: 'Sternensammler',
    description: 'Sammle 30 Sterne im Abenteuerpfad',
    goal: 30,
    measure: (s) => totalStars(s.adventure),
  },
  {
    id: 'loyal',
    title: 'Treuer Freund',
    description: 'Hole die Tagesbelohnung 7 Tage in Folge',
    goal: 7,
    measure: (s) => s.dailyRewardStreak,
  },
  {
    id: 'shopper',
    title: 'Erster Einkauf',
    description: 'Kaufe etwas im Shop',
    goal: 1,
    measure: (s) => s.ownedItems.length,
  },
  {
    id: 'wardrobe',
    title: 'Sammlerstück',
    description: 'Besitze 3 Gegenstände',
    goal: 3,
    measure: (s) => s.ownedItems.length,
  },
]

/** Die Liste für einen frischen Spielstand. */
export function createAchievements(): Achievement[] {
  return ACHIEVEMENTS.map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    goal: def.goal,
    progress: 0,
    unlockedAt: null,
  }))
}

/**
 * Rechnet alle Erfolge aus dem Spielstand neu aus. Einmal Freigeschaltetes
 * bleibt freigeschaltet, auch wenn der gemessene Wert später kleiner wird —
 * die Serie der Tagesbelohnung fällt bei einem Aussetzer schließlich zurück.
 *
 * Erfolge, die ein alter Spielstand noch nicht kennt, kommen dabei hinzu.
 * Eine eigene Migration braucht es dafür nicht: Die Liste wird aus dem
 * Katalog erzeugt, der Spielstand liefert nur den Freischaltzeitpunkt.
 */
export function syncAchievements(save: SaveData, now: number): Achievement[] {
  const known = new Map(save.achievements.map((a) => [a.id, a]))

  return ACHIEVEMENTS.map((def) => {
    const before = known.get(def.id)
    const progress = def.measure(save)
    const unlockedAt =
      before?.unlockedAt ?? (progress >= def.goal ? now : null)

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      goal: def.goal,
      progress,
      unlockedAt,
    }
  })
}

export function unlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlockedAt !== null).length
}
