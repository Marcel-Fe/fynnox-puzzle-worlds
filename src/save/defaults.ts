import { GAMES, type GameId } from '../content/games'
import type { GameProgress, Mission, SaveData } from './types'

/** Aktuelle Version der Datenstruktur. Bei Änderungen erhöhen + Migration ergänzen. */
export const SAVE_VERSION = 1

/** Startwerte für ein neues Profil (docs/01-gamedesign.md). */
export const START_COINS = 500
export const START_CRYSTALS = 50
export const ENERGY_MAX = 5
/** Eine Energieeinheit alle 10 Minuten — volle 5 nach 50 Minuten. */
export const ENERGY_REFILL_MS = 10 * 60 * 1000

function emptyProgress(): GameProgress {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    highScore: 0,
    highestLevel: 0,
    totalPlaytimeMs: 0,
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Tagesmissionen aus den Mockups (docs/01-gamedesign.md). */
export function createDailyMissions(now: number): Mission[] {
  const expiresAt = now + DAY_MS
  return [
    {
      id: 'daily-play-waldbloecke',
      kind: 'daily',
      text: 'Spiele 3 Runden Waldblöcke',
      goal: 3,
      progress: 0,
      rewardCoins: 100,
      claimed: false,
      expiresAt,
      track: { type: 'playRounds', game: 'waldbloecke' },
    },
    {
      id: 'daily-rows',
      kind: 'daily',
      text: 'Fülle 10 Reihen',
      goal: 10,
      progress: 0,
      rewardCoins: 150,
      claimed: false,
      expiresAt,
      track: { type: 'custom', key: 'rowsCleared' },
    },
    {
      id: 'daily-combos',
      kind: 'daily',
      text: 'Erziele 5 Kombos',
      goal: 5,
      progress: 0,
      rewardCoins: 200,
      claimed: false,
      expiresAt,
      track: { type: 'custom', key: 'combos' },
    },
  ]
}

export function createNewSave(now: number): SaveData {
  const progress = Object.fromEntries(GAMES.map((g) => [g.id, emptyProgress()])) as Record<
    GameId,
    GameProgress
  >

  return {
    version: SAVE_VERSION,
    profile: {
      name: 'Fynnox',
      level: 1,
      xp: 0,
      coins: START_COINS,
      crystals: START_CRYSTALS,
      energy: ENERGY_MAX,
      energyMax: ENERGY_MAX,
      energyRefilledAt: now,
      createdAt: now,
      favoriteGame: null,
    },
    progress,
    missions: createDailyMissions(now),
    achievements: [
      {
        id: 'adventurer',
        title: 'Abenteurer',
        description: 'Spiele 100 Spiele',
        goal: 100,
        progress: 0,
        unlockedAt: null,
      },
      {
        id: 'collector',
        title: 'Sammler',
        description: 'Sammle 10.000 Münzen',
        goal: 10000,
        progress: 0,
        unlockedAt: null,
      },
      {
        id: 'master',
        title: 'Meister',
        description: 'Erreiche Level 50',
        goal: 50,
        progress: 1,
        unlockedAt: null,
      },
    ],
    adventure: { chapter: 1, nodeInChapter: 1, stars: {}, claimedChests: [] },
    settings: {
      music: true,
      sound: true,
      vibration: true,
      powerSaving: false,
      language: 'de',
      notifications: true,
    },
    stats: {
      totalGames: 0,
      totalWins: 0,
      bestLevel: 1,
      totalPlaytimeMs: 0,
      coinsEarnedTotal: 0,
      crystalsEarnedTotal: 0,
    },
    lastDailyRewardAt: null,
    dailyRewardStreak: 0,
    recentGames: [],
  }
}
