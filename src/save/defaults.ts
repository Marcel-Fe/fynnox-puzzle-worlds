import { GAMES, type GameId } from '../content/games'
import { createAchievements } from '../core/achievements'
import { createMissions } from '../core/missions'
import type { GameProgress, SaveData } from './types'

/**
 * Aktuelle Version der Datenstruktur. Bei Änderungen erhöhen + Migration ergänzen.
 *
 * 2 (17.08.2026): `ownedItems` kam für den Shop dazu.
 */
export const SAVE_VERSION = 2

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
    missions: createMissions(now),
    achievements: createAchievements(),
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
    ownedItems: [],
  }
}
