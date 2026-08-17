import { describe, expect, it } from 'vitest'
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

  it('lässt echten Fortschritt unangetastet', () => {
    for (const version of [1, 2, 3]) {
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
