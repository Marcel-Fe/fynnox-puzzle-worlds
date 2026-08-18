import { describe, expect, it } from 'vitest'
import { GAMES } from '../content/games'
import { createNewSave } from '../save/defaults'
import type { SaveData } from '../save/types'
import { ACHIEVEMENTS, badgeFor, createAchievements, syncAchievements, unlockedCount } from './achievements'
import { applyRoundResult } from './round'

const NOW = new Date(2026, 7, 17, 10, 0, 0).getTime()

describe('Erfolgskatalog', () => {
  it('hat eindeutige IDs — je Spiel einen plus 16 allgemeine', () => {
    // An GAMES gekoppelt statt an eine feste Zahl: Fällt ein Spiel weg oder
    // kommt eines dazu, soll der Test die Absicht prüfen, nicht den Zählstand.
    const expected = 16 + GAMES.length
    expect(ACHIEVEMENTS).toHaveLength(expected)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(expected)
  })

  it('behält die drei IDs aus Phase 3', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    for (const id of ['adventurer', 'collector', 'master']) expect(ids).toContain(id)
  })

  it('hat für jedes der acht Spiele einen eigenen Erfolg', () => {
    for (const game of GAMES) {
      const found = ACHIEVEMENTS.find((a) => a.id === `game-${game.id}`)
      expect(found?.title.length).toBeGreaterThan(0)
      expect(found?.description).toContain(game.title)
    }
  })

  it('stuft die Abzeichen nach Zielgröße', () => {
    expect(badgeFor(1)).toBe('bronze')
    expect(badgeFor(25)).toBe('bronze')
    expect(badgeFor(50)).toBe('silber')
    expect(badgeFor(10000)).toBe('gold')
  })

  it('startet vollständig und ohne Fortschritt', () => {
    const fresh = createAchievements()
    expect(fresh).toHaveLength(ACHIEVEMENTS.length)
    expect(fresh.every((a) => a.progress === 0 && a.unlockedAt === null)).toBe(true)
  })
})

describe('syncAchievements', () => {
  function synced(save: SaveData) {
    const list = syncAchievements(save, NOW)
    return Object.fromEntries(list.map((a) => [a.id, a]))
  }

  it('schaltet den ersten Erfolg nach der ersten Runde frei', () => {
    const save = createNewSave(NOW)
    const { save: after } = applyRoundResult(save, {
      game: 'waldbloecke',
      won: false,
      score: 500,
      durationMs: 30_000,
    })
    const list = synced(after)
    expect(list['first-round'].progress).toBe(1)
    expect(list['first-round'].unlockedAt).toBe(NOW)
    expect(list.adventurer.unlockedAt).toBeNull()
  })

  it('misst jeden Erfolg aus dem Spielstand', () => {
    const save: SaveData = {
      ...createNewSave(NOW),
      dailyRewardStreak: 7,
      ownedItems: ['a', 'b', 'c'],
    }
    save.stats.totalGames = 120
    save.stats.totalWins = 60
    save.profile.level = 12
    save.stats.totalPlaytimeMs = 11 * 3_600_000
    save.adventure.stars = { '1:1': 3, '1:2': 3 }
    save.adventure.claimedChests = ['chapter:1']

    const list = synced(save)
    expect(list.adventurer.progress).toBe(120)
    expect(list.winner.progress).toBe(60)
    expect(list.climber.unlockedAt).not.toBeNull()
    expect(list.master.unlockedAt).toBeNull()
    expect(list.endurance.progress).toBe(11)
    expect(list.wanderer.progress).toBe(2)
    expect(list['star-hunter'].progress).toBe(6)
    expect(list['chapter-master'].unlockedAt).not.toBeNull()
    expect(list.loyal.unlockedAt).not.toBeNull()
    expect(list.shopper.unlockedAt).not.toBeNull()
    expect(list.wardrobe.unlockedAt).not.toBeNull()
  })

  it('nimmt einen freigeschalteten Erfolg nicht wieder weg', () => {
    // Die Serie der Tagesbelohnung fällt bei einem Aussetzer zurück — der
    // Erfolg dafür darf trotzdem nicht verschwinden.
    const save: SaveData = { ...createNewSave(NOW), dailyRewardStreak: 7 }
    const once: SaveData = { ...save, achievements: syncAchievements(save, NOW) }
    expect(synced(once).loyal.unlockedAt).toBe(NOW)

    const fallen: SaveData = { ...once, dailyRewardStreak: 1 }
    const list = syncAchievements(fallen, NOW + 86_400_000)
    expect(list.find((a) => a.id === 'loyal')!.unlockedAt).toBe(NOW)
  })

  it('ergänzt Erfolge, die ein alter Spielstand noch nicht kannte', () => {
    // So sah die Liste bis Phase 6 aus.
    const old: SaveData = {
      ...createNewSave(NOW),
      achievements: [
        {
          id: 'adventurer',
          title: 'Abenteurer',
          description: 'Spiele 100 Spiele',
          goal: 100,
          progress: 40,
          unlockedAt: null,
        },
      ],
    }
    old.stats.totalGames = 40

    const list = syncAchievements(old, NOW)
    expect(list).toHaveLength(ACHIEVEMENTS.length)
    expect(list.find((a) => a.id === 'adventurer')!.progress).toBe(40)
    expect(list.find((a) => a.id === 'first-round')!.unlockedAt).toBe(NOW)
  })

  it('zählt die freigeschalteten Erfolge', () => {
    expect(unlockedCount(createAchievements())).toBe(0)
    const save: SaveData = { ...createNewSave(NOW), dailyRewardStreak: 7 }
    expect(unlockedCount(syncAchievements(save, NOW))).toBe(1)
  })
})
