import { describe, expect, it } from 'vitest'
import { GAMES } from '../content/games'
import { migrate, stampSave } from './adapter'
import { createNewSave, SAVE_VERSION } from './defaults'
import type { SaveData } from './types'

const NOW = new Date(2026, 7, 17, 12, 0, 0).getTime()

/** Ein Spielstand, wie ihn eine ältere Fassung geschrieben hätte. */
function oldSave(version: number): SaveData {
  const save = createNewSave(NOW)
  save.version = version
  save.profile.level = 9
  save.stats.totalGames = 123
  if (version < 2) delete (save as Partial<SaveData>).ownedItems
  if (version < 3) delete (save as Partial<SaveData>).updatedAt
  if (version < 4) {
    // So sah ein Stand aus, solange es Minigolf noch gab.
    ;(save.progress as Record<string, unknown>).minigolf = {
      gamesPlayed: 12,
      gamesWon: 5,
      highScore: 400,
      highestLevel: 3,
      totalPlaytimeMs: 60_000,
    }
    save.recentGames = ['minigolf', 'sudoku'] as SaveData['recentGames']
    save.profile.favoriteGame = 'minigolf' as SaveData['profile']['favoriteGame']
    save.missions = [
      {
        id: 'alt-minigolf',
        kind: 'daily',
        text: 'Loche drei Bahnen ein',
        goal: 3,
        progress: 0,
        rewardCoins: 100,
        claimed: false,
        expiresAt: NOW + 86_400_000,
        track: { type: 'winRounds', game: 'minigolf' } as never,
      },
      {
        id: 'alt-sudoku',
        kind: 'daily',
        text: 'Löse ein Sudoku',
        goal: 1,
        progress: 0,
        rewardCoins: 100,
        claimed: false,
        expiresAt: NOW + 86_400_000,
        track: { type: 'winRounds', game: 'sudoku' },
      },
    ]
  }
  return save
}

describe('migrate', () => {
  it('lehnt einen Stand ohne Versionsnummer ab', () => {
    expect(migrate({} as SaveData)).toBeNull()
  })

  it('lehnt einen Stand aus der Zukunft ab', () => {
    const future = createNewSave(NOW)
    future.version = SAVE_VERSION + 1
    expect(migrate(future)).toBeNull()
  })

  it('hebt Version 1 in einem Rutsch auf die aktuelle', () => {
    const migrated = migrate(oldSave(1))!
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.ownedItems).toEqual([])
    expect(migrated.updatedAt).toBe(0)
  })

  it('ergänzt bei Version 2 nur den Zeitstempel', () => {
    const migrated = migrate(oldSave(2))!
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.updatedAt).toBe(0)
  })

  it('setzt alte Stände auf updatedAt 0 statt auf die aktuelle Uhrzeit', () => {
    // Absicht: Ein Stand ohne Zeitstempel soll im Zweifel nicht gegen einen
    // mit Zeitstempel gewinnen (docs/04-datenmodell.md, Version 3).
    expect(migrate(oldSave(2))!.updatedAt).toBe(0)
  })

  it('entfernt bei Version 3 alle Spuren entfernter Spiele', () => {
    const migrated = migrate(oldSave(3))!
    expect(migrated.version).toBe(SAVE_VERSION)
    expect('minigolf' in migrated.progress).toBe(false)
    expect(migrated.recentGames).toEqual(['sudoku'])
    expect(migrated.profile.favoriteGame).toBeNull()
    expect(migrated.missions.map((m) => m.id)).toEqual(['alt-sudoku'])
  })

  it('lässt den Fortschritt der verbliebenen Spiele stehen', () => {
    const migrated = migrate(oldSave(3))!
    for (const game of GAMES) {
      expect(migrated.progress[game.id]).toBeDefined()
    }
    expect(Object.keys(migrated.progress)).toHaveLength(GAMES.length)
  })

  it('lässt echten Fortschritt unangetastet', () => {
    for (const version of [1, 2, 3, 4]) {
      const migrated = migrate(oldSave(version))!
      expect(migrated.profile.level).toBe(9)
      expect(migrated.stats.totalGames).toBe(123)
    }
  })
})

describe('stampSave', () => {
  it('setzt den Zeitstempel und lässt alles andere stehen', () => {
    const save = createNewSave(NOW)
    const stamped = stampSave(save, NOW + 5000)
    expect(stamped.updatedAt).toBe(NOW + 5000)
    expect(stamped.profile).toBe(save.profile)
  })

  it('verändert das übergebene Objekt nicht', () => {
    const save = createNewSave(NOW)
    stampSave(save, NOW + 5000)
    expect(save.updatedAt).toBe(NOW)
  })
})
