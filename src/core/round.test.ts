import { describe, expect, it } from 'vitest'
import { createNewSave } from '../save/defaults'
import type { Mission, RoundResult, SaveData } from '../save/types'
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

  it('merkt sich die Bestzeit nur bei gewonnenen Runden', () => {
    // Sonst waere jedes schnelle Aufgeben in Tempelpaare die neue Bestzeit.
    const save = createNewSave(NOW)
    const lost = applyRoundResult(save, round({ game: 'tempelpaare', won: false, durationMs: 5000 }))
    expect(lost.save.progress.tempelpaare.bestTimeMs).toBeUndefined()

    const won = applyRoundResult(save, round({ game: 'tempelpaare', won: true, durationMs: 90_000 }))
    expect(won.save.progress.tempelpaare.bestTimeMs).toBe(90_000)
  })

  it('übernimmt eine neue Bestzeit nur, wenn sie schneller ist', () => {
    const save = createNewSave(NOW)
    const first = applyRoundResult(save, round({ game: 'tempelpaare', won: true, durationMs: 90_000 }))
    const slower = applyRoundResult(
      first.save,
      round({ game: 'tempelpaare', won: true, durationMs: 120_000 }),
    )
    expect(slower.save.progress.tempelpaare.bestTimeMs).toBe(90_000)

    const faster = applyRoundResult(
      first.save,
      round({ game: 'tempelpaare', won: true, durationMs: 60_000 }),
    )
    expect(faster.save.progress.tempelpaare.bestTimeMs).toBe(60_000)
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
  /**
   * Die Missionen werden hier gesetzt statt aus dem Spielstand genommen:
   * Welche Vorlagen ein Tag zeigt, entscheidet `core/missions.ts` aus der
   * Tagesnummer. Dieser Test prüft die Rundenauswertung, nicht die Auswahl.
   */
  function saveWith(...missions: Mission[]): SaveData {
    return { ...createNewSave(NOW), missions }
  }

  function mission(id: string, goal: number, track: Mission['track']): Mission {
    return {
      id,
      kind: 'daily',
      text: id,
      goal,
      progress: 0,
      rewardCoins: 100,
      claimed: false,
      expiresAt: NOW + 86_400_000,
      track,
    }
  }

  it('zählt "Spiele 3 Runden Waldblöcke" nur bei Waldblöcken hoch', () => {
    const save = saveWith(mission('play', 3, { type: 'playRounds', game: 'waldbloecke' }))

    const right = applyRoundResult(save, round({ game: 'waldbloecke' }))
    expect(right.save.missions[0].progress).toBe(1)

    const wrong = applyRoundResult(save, round({ game: 'blockfall' }))
    expect(wrong.save.missions[0].progress).toBe(0)
  })

  it('zählt eigene Zähler der Spiele hoch', () => {
    const save = saveWith(
      mission('rows', 10, { type: 'custom', key: 'rowsCleared' }),
      mission('combos', 5, { type: 'custom', key: 'combos' }),
    )
    const { save: next } = applyRoundResult(
      save,
      round({ counters: { rowsCleared: 4, combos: 2 } }),
    )
    expect(next.missions.find((m) => m.id === 'rows')!.progress).toBe(4)
    expect(next.missions.find((m) => m.id === 'combos')!.progress).toBe(2)
  })

  it('läuft nicht über das Ziel hinaus und meldet den Abschluss', () => {
    const save = saveWith(mission('rows', 10, { type: 'custom', key: 'rowsCleared' }))
    const { save: next, rewards } = applyRoundResult(
      save,
      round({ counters: { rowsCleared: 99 } }),
    )
    expect(next.missions[0].progress).toBe(10)
    expect(rewards.completedMissions).toContain('rows')
  })

  it('zählt einen spielgebundenen eigenen Zähler nur beim richtigen Spiel', () => {
    const save = saveWith(
      mission('pairs', 100, { type: 'custom', key: 'pairs', game: 'tempelpaare' }),
    )
    const right = applyRoundResult(save, round({ game: 'tempelpaare', counters: { pairs: 18 } }))
    expect(right.save.missions[0].progress).toBe(18)

    const wrong = applyRoundResult(save, round({ game: 'blockfall', counters: { pairs: 18 } }))
    expect(wrong.save.missions[0].progress).toBe(0)
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
