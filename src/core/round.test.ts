import { describe, expect, it } from 'vitest'
import { createNewSave } from '../save/defaults'
import type { RoundResult, SaveData } from '../save/types'
import { refillEnergy } from './energy'
import { levelUpCoins, levelUpCrystals, xpForNextLevel } from './progression'
import { applyRoundResult } from './round'

const NOW = 1_700_000_000_000

function round(overrides: Partial<RoundResult> = {}): RoundResult {
  return {
    game: 'waldbloecke',
    won: false,
    score: 1000,
    durationMs: 60_000,
    ...overrides,
  }
}

describe('Balancing-Formeln gegen die Mockup-Werte', () => {
  it('Level 12 braucht 3.500 XP', () => {
    expect(xpForNextLevel(12)).toBe(3500)
  })

  it('Levelaufstieg auf 12 gibt 2.000 Münzen und 50 Kristalle', () => {
    expect(levelUpCoins(12)).toBe(2000)
    expect(levelUpCrystals(12)).toBe(50)
  })
})

describe('applyRoundResult', () => {
  it('verändert den übergebenen Spielstand nicht', () => {
    const save = createNewSave(NOW)
    const before = JSON.stringify(save)
    applyRoundResult(save, round())
    expect(JSON.stringify(save)).toBe(before)
  })

  it('ist rein — gleiche Eingabe ergibt gleiches Ergebnis', () => {
    const save = createNewSave(NOW)
    const a = applyRoundResult(save, round())
    const b = applyRoundResult(save, round())
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('schreibt XP und Münzen gut', () => {
    const save = createNewSave(NOW)
    const { save: next, rewards } = applyRoundResult(save, round({ score: 1000 }))

    expect(rewards.xp).toBe(30) // 20 + floor(1000/100)
    expect(rewards.coins).toBe(12) // 10 + floor(1000/500)
    expect(next.profile.xp).toBe(30)
    expect(next.profile.coins).toBe(save.profile.coins + 12)
  })

  it('gibt bei Sieg mehr XP und Münzen', () => {
    const save = createNewSave(NOW)
    const lost = applyRoundResult(save, round({ won: false })).rewards
    const won = applyRoundResult(save, round({ won: true })).rewards
    expect(won.xp).toBeGreaterThan(lost.xp)
    expect(won.coins).toBe(lost.coins + 20)
  })

  it('gibt ohne Levelaufstieg keine Kristalle', () => {
    // Kristalle kommen nur aus Levelaufstiegen, Missionen, Events und Truhen —
    // nie aus der Runde selbst (docs/01-gamedesign.md).
    const save = createNewSave(NOW)
    const { rewards } = applyRoundResult(save, round({ score: 100, won: true }))
    expect(rewards.levelsGained).toBe(0)
    expect(rewards.crystals).toBe(0)
  })

  it('steigt im Level auf und schreibt die Aufstiegsbelohnung gut', () => {
    const save = createNewSave(NOW)
    // Level 1 braucht 750 XP -> ein Ergebnis mit sehr hohem Punktestand reicht
    const { save: next, rewards } = applyRoundResult(save, round({ score: 100_000 }))

    expect(rewards.levelsGained).toBeGreaterThan(0)
    expect(next.profile.level).toBeGreaterThan(1)
    expect(rewards.crystals).toBeGreaterThan(0)
    // Nach dem Aufstieg darf kein XP-Rest über der neuen Schwelle liegen
    expect(next.profile.xp).toBeLessThan(xpForNextLevel(next.profile.level))
  })

  it('merkt sich den Bestwert nur, wenn er übertroffen wird', () => {
    const save = createNewSave(NOW)
    const first = applyRoundResult(save, round({ score: 2000 }))
    expect(first.rewards.newHighScore).toBe(true)
    expect(first.save.progress.waldbloecke.highScore).toBe(2000)

    const second = applyRoundResult(first.save, round({ score: 500 }))
    expect(second.rewards.newHighScore).toBe(false)
    expect(second.save.progress.waldbloecke.highScore).toBe(2000)
  })
})

describe('Missionen', () => {
  it('zählt "Spiele 3 Runden Waldblöcke" nur bei Waldblöcken hoch', () => {
    const save = createNewSave(NOW)
    const id = 'daily-play-waldbloecke'

    const right = applyRoundResult(save, round({ game: 'waldbloecke' }))
    expect(right.save.missions.find((m) => m.id === id)!.progress).toBe(1)

    const wrong = applyRoundResult(save, round({ game: 'blockfall' }))
    expect(wrong.save.missions.find((m) => m.id === id)!.progress).toBe(0)
  })

  it('zählt eigene Zähler der Spiele hoch', () => {
    const save = createNewSave(NOW)
    const { save: next } = applyRoundResult(
      save,
      round({ counters: { rowsCleared: 4, combos: 2 } }),
    )
    expect(next.missions.find((m) => m.id === 'daily-rows')!.progress).toBe(4)
    expect(next.missions.find((m) => m.id === 'daily-combos')!.progress).toBe(2)
  })

  it('läuft nicht über das Ziel hinaus und meldet den Abschluss', () => {
    const save = createNewSave(NOW)
    const { save: next, rewards } = applyRoundResult(
      save,
      round({ counters: { rowsCleared: 99 } }),
    )
    const mission = next.missions.find((m) => m.id === 'daily-rows')!
    expect(mission.progress).toBe(mission.goal)
    expect(rewards.completedMissions).toContain('daily-rows')
  })
})

describe('Energie', () => {
  it('füllt eine Einheit alle 10 Minuten nach', () => {
    const save: SaveData = createNewSave(NOW)
    save.profile.energy = 2
    save.profile.energyRefilledAt = NOW

    expect(refillEnergy(save.profile, NOW + 9 * 60_000).energy).toBe(2)
    expect(refillEnergy(save.profile, NOW + 10 * 60_000).energy).toBe(3)
    expect(refillEnergy(save.profile, NOW + 25 * 60_000).energy).toBe(4)
  })

  it('läuft nicht über den Höchststand hinaus', () => {
    const save = createNewSave(NOW)
    save.profile.energy = 4
    save.profile.energyRefilledAt = NOW
    expect(refillEnergy(save.profile, NOW + 10 * 60 * 60_000).energy).toBe(5)
  })

  it('verschenkt bei vollem Stand keine angesammelte Zeit', () => {
    // Sonst gäbe es nach langer Pause beim ersten Verbrauch sofort alles zurück.
    const save = createNewSave(NOW)
    const later = NOW + 10 * 60 * 60_000
    const refilled = refillEnergy(save.profile, later)
    expect(refilled.energy).toBe(5)
    expect(refilled.energyRefilledAt).toBe(later)
  })
})
