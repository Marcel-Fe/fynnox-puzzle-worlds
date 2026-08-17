import type { SaveData } from '../save/types'
import { dayIndex, endOfDay, isSameDay } from './time'

/**
 * Tägliche Belohnung (docs/01-gamedesign.md, Abschnitt „Tägliche Belohnung").
 *
 * Rein: `now` kommt von außen, kein Zugriff auf Uhr oder Speicher.
 * Gerechnet wird in **Kalendertagen**, nicht in 24-Stunden-Schritten — sonst
 * wandert der Abholzeitpunkt mit jedem Abholen nach hinten und liegt nach einer
 * Woche mitten in der Nacht.
 */

export interface DailyReward {
  coins: number
  crystals: number
}

/** Die Leiter über sieben Tage. Danach beginnt sie wieder bei Tag 1. */
export const DAILY_REWARDS: DailyReward[] = [
  { coins: 100, crystals: 0 },
  { coins: 200, crystals: 0 },
  { coins: 0, crystals: 10 },
  { coins: 300, crystals: 0 },
  { coins: 0, crystals: 20 },
  { coins: 500, crystals: 0 },
  { coins: 1000, crystals: 50 },
]

/** Welche Stufe der Leiter zu einer Seriennummer gehört (Serie 8 = Stufe 1). */
export function rewardForStreak(streak: number): DailyReward {
  return DAILY_REWARDS[(Math.max(1, streak) - 1) % DAILY_REWARDS.length]
}

export interface DailyRewardState {
  available: boolean
  /** Seriennummer, die beim nächsten Abholen erreicht wird */
  streak: number
  /** Stufe 1 bis 7, die beim nächsten Abholen ausgezahlt wird */
  step: number
  reward: DailyReward
  /** Millisekunden bis zur nächsten Abholung; 0, wenn sie jetzt bereitliegt */
  msUntilNext: number
}

/**
 * Was gerade abholbar ist. Eine Lücke von mehr als einem Tag setzt die Serie
 * zurück — das ist der Grund, überhaupt täglich zurückzukommen.
 */
export function dailyRewardState(save: SaveData, now: number): DailyRewardState {
  const last = save.lastDailyRewardAt
  const alreadyToday = last !== null && isSameDay(last, now)
  const continues = last !== null && dayIndex(now) === dayIndex(last) + 1

  // Heute schon abgeholt: Die Anzeige zeigt, was morgen wartet.
  const streak = alreadyToday
    ? save.dailyRewardStreak + 1
    : continues
      ? save.dailyRewardStreak + 1
      : 1

  return {
    available: !alreadyToday,
    streak,
    step: ((streak - 1) % DAILY_REWARDS.length) + 1,
    reward: rewardForStreak(streak),
    msUntilNext: alreadyToday ? endOfDay(now) - now : 0,
  }
}

/**
 * Holt die Belohnung ab. Liegt keine bereit, kommt der Spielstand unverändert
 * zurück — die Entscheidung darüber gehört hierher, nicht in die Oberfläche.
 */
export function claimDailyReward(save: SaveData, now: number): SaveData {
  const state = dailyRewardState(save, now)
  if (!state.available) return save

  const { coins, crystals } = state.reward
  return {
    ...save,
    profile: {
      ...save.profile,
      coins: save.profile.coins + coins,
      crystals: save.profile.crystals + crystals,
    },
    stats: {
      ...save.stats,
      coinsEarnedTotal: save.stats.coinsEarnedTotal + coins,
      crystalsEarnedTotal: save.stats.crystalsEarnedTotal + crystals,
    },
    lastDailyRewardAt: now,
    dailyRewardStreak: state.streak,
  }
}
