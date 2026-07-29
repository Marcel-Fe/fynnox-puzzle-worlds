import type { GameId } from '../content/games'

/** Vollständige Datenstruktur eines Spielstands (docs/04-datenmodell.md). */

export interface Profile {
  name: string
  level: number
  /** XP innerhalb des aktuellen Levels, nicht insgesamt */
  xp: number
  coins: number
  crystals: number
  energy: number
  energyMax: number
  /** Zeitstempel, bis zu dem die Energie bereits gutgeschrieben wurde */
  energyRefilledAt: number
  createdAt: number
  favoriteGame: GameId | null
}

export interface GameProgress {
  gamesPlayed: number
  gamesWon: number
  highScore: number
  highestLevel: number
  totalPlaytimeMs: number
  bestTimeMs?: number
  starsCollected?: number
}

export type MissionKind = 'daily' | 'weekly' | 'event'

export type MissionTrack =
  | { type: 'playRounds'; game?: GameId }
  | { type: 'winRounds'; game?: GameId }
  | { type: 'collectCoins' }
  | { type: 'collectCrystals' }
  | { type: 'reachScore'; game: GameId }
  /** Auffangfall: Spiele melden eigene Zähler, z. B. "rowsCleared" oder "combos" */
  | { type: 'custom'; key: string; game?: GameId }

export interface Mission {
  id: string
  kind: MissionKind
  text: string
  goal: number
  progress: number
  rewardCoins: number
  rewardCrystals?: number
  claimed: boolean
  expiresAt: number
  track: MissionTrack
}

export interface Achievement {
  id: string
  title: string
  description: string
  goal: number
  progress: number
  unlockedAt: number | null
}

export interface AdventurePath {
  chapter: number
  nodeInChapter: number
  /** Schlüssel "kapitel:knoten" -> Sterne */
  stars: Record<string, 0 | 1 | 2 | 3>
  claimedChests: string[]
}

export interface Settings {
  music: boolean
  sound: boolean
  vibration: boolean
  powerSaving: boolean
  language: 'de'
  notifications: boolean
}

export interface GlobalStats {
  totalGames: number
  totalWins: number
  bestLevel: number
  totalPlaytimeMs: number
  coinsEarnedTotal: number
  crystalsEarnedTotal: number
}

export interface SaveData {
  /** Bei jeder Strukturänderung erhöhen und eine Migration ergänzen */
  version: number
  profile: Profile
  progress: Record<GameId, GameProgress>
  missions: Mission[]
  achievements: Achievement[]
  adventure: AdventurePath
  settings: Settings
  stats: GlobalStats
  lastDailyRewardAt: number | null
  dailyRewardStreak: number
  /** Für die "Weiterspielen"-Reihe, zuletzt gespieltes zuerst */
  recentGames: GameId[]
}

/**
 * Ergebnis einer Runde — der einzige Weg, auf dem ein Spiel das Profil verändert.
 * `counters` nimmt spielspezifische Werte auf, an die Missionen andocken können.
 */
export interface RoundResult {
  game: GameId
  won: boolean
  score: number
  durationMs: number
  level?: number
  counters?: Record<string, number>
}
