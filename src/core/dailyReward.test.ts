import { describe, expect, it } from 'vitest'
import { createNewSave } from '../save/defaults'
import type { SaveData } from '../save/types'
import { claimDailyReward, DAILY_REWARDS, dailyRewardState, rewardForStreak } from './dailyReward'
import { addDays } from './time'

const NOW = new Date(2026, 7, 17, 10, 0, 0).getTime()

function fresh(): SaveData {
  return createNewSave(NOW)
}

describe('Belohnungsleiter', () => {
  it('hat sieben Stufen und wiederholt sich danach', () => {
    expect(DAILY_REWARDS).toHaveLength(7)
    expect(rewardForStreak(8)).toEqual(rewardForStreak(1))
    expect(rewardForStreak(14)).toEqual(rewardForStreak(7))
  })

  it('die siebte Stufe ist die größte', () => {
    expect(rewardForStreak(7)).toEqual({ coins: 1000, crystals: 50 })
  })
})

describe('dailyRewardState', () => {
  it('liegt bei einem neuen Spielstand sofort bereit', () => {
    const state = dailyRewardState(fresh(), NOW)
    expect(state.available).toBe(true)
    expect(state.step).toBe(1)
  })

  it('ist nach dem Abholen bis Mitternacht gesperrt', () => {
    const save = claimDailyReward(fresh(), NOW)
    const state = dailyRewardState(save, NOW + 60_000)
    expect(state.available).toBe(false)
    expect(state.msUntilNext).toBeGreaterThan(0)
    // Der Countdown endet mit dem Kalendertag, nicht 24 h nach dem Abholen.
    expect(state.msUntilNext).toBeLessThan(14 * 60 * 60_000)
  })

  it('zeigt im gesperrten Zustand die Belohnung von morgen', () => {
    const save = claimDailyReward(fresh(), NOW)
    expect(dailyRewardState(save, NOW + 60_000).step).toBe(2)
  })
})

describe('claimDailyReward', () => {
  it('schreibt Münzen gut und merkt sich den Tag', () => {
    const save = fresh()
    const next = claimDailyReward(save, NOW)
    expect(next.profile.coins).toBe(save.profile.coins + 100)
    expect(next.stats.coinsEarnedTotal).toBe(100)
    expect(next.dailyRewardStreak).toBe(1)
    expect(next.lastDailyRewardAt).toBe(NOW)
  })

  it('gibt bei einem zweiten Versuch am selben Tag denselben Spielstand zurück', () => {
    const once = claimDailyReward(fresh(), NOW)
    const twice = claimDailyReward(once, NOW + 3 * 60 * 60_000)
    expect(twice).toBe(once)
  })

  it('zählt die Serie an aufeinanderfolgenden Tagen hoch', () => {
    let save = fresh()
    for (let day = 0; day < 7; day++) {
      save = claimDailyReward(save, addDays(NOW, day))
      expect(save.dailyRewardStreak).toBe(day + 1)
    }
    // Tag 7 zahlt 1.000 Münzen und 50 Kristalle.
    expect(save.profile.crystals).toBe(fresh().profile.crystals + 10 + 20 + 50)
  })

  it('beginnt die Serie nach einem ausgelassenen Tag wieder bei eins', () => {
    let save = claimDailyReward(fresh(), NOW)
    save = claimDailyReward(save, addDays(NOW, 1))
    expect(save.dailyRewardStreak).toBe(2)

    // Tag 3 ausgelassen, erst an Tag 4 wieder da.
    save = claimDailyReward(save, addDays(NOW, 3))
    expect(save.dailyRewardStreak).toBe(1)
  })

  it('läuft über die achte Stufe hinaus wieder bei Tag 1 los', () => {
    let save = fresh()
    for (let day = 0; day < 8; day++) save = claimDailyReward(save, addDays(NOW, day))
    expect(save.dailyRewardStreak).toBe(8)
    // Stufe 8 ist wieder die erste: 100 Münzen.
    expect(rewardForStreak(save.dailyRewardStreak)).toEqual({ coins: 100, crystals: 0 })
  })

  it('verändert den übergebenen Spielstand nicht', () => {
    const save = fresh()
    const before = JSON.stringify(save)
    claimDailyReward(save, NOW)
    expect(JSON.stringify(save)).toBe(before)
  })
})
