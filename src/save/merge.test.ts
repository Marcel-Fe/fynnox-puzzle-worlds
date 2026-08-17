import { describe, expect, it } from 'vitest'
import { createNewSave } from './defaults'
import { mergeSaves } from './merge'
import type { SaveData } from './types'

const NOW = new Date(2026, 7, 17, 12, 0, 0).getTime()

function saveWith(games: number, updatedAt: number): SaveData {
  const save = createNewSave(NOW)
  save.stats.totalGames = games
  save.updatedAt = updatedAt
  return save
}

describe('mergeSaves', () => {
  it('gibt null zurück, wenn es nirgends einen Stand gibt', () => {
    expect(mergeSaves(null, null)).toBeNull()
  })

  it('nimmt den lokalen, wenn die Cloud leer ist', () => {
    const local = saveWith(5, NOW)
    expect(mergeSaves(local, null)).toEqual({ save: local, winner: 'local', reason: 'nur-lokal' })
  })

  it('nimmt den Cloud-Stand, wenn lokal nichts liegt — der Fall „neues Gerät"', () => {
    const remote = saveWith(5, NOW)
    expect(mergeSaves(null, remote)).toEqual({
      save: remote,
      winner: 'remote',
      reason: 'nur-cloud',
    })
  })

  it('lässt mehr gespielte Runden gewinnen', () => {
    const local = saveWith(50, NOW)
    const remote = saveWith(12, NOW)
    expect(mergeSaves(local, remote)?.winner).toBe('local')
    expect(mergeSaves(remote, local)?.winner).toBe('remote')
  })

  it('lässt Fortschritt auch gegen eine falsch gestellte Geräteuhr gewinnen', () => {
    // Der Kern der Regel: Das Handy steht ein Jahr in der Zukunft, hat aber
    // kaum gespielt. Es darf den echten Fortschritt nicht überschreiben.
    const wrongClock = saveWith(3, NOW + 365 * 86_400_000)
    const realProgress = saveWith(400, NOW)
    const merged = mergeSaves(wrongClock, realProgress)
    expect(merged?.winner).toBe('remote')
    expect(merged?.reason).toBe('mehr-runden')
    expect(merged?.save.stats.totalGames).toBe(400)
  })

  it('entscheidet bei gleich vielen Runden über den Zeitstempel', () => {
    const older = saveWith(20, NOW - 60_000)
    const newer = saveWith(20, NOW)
    expect(mergeSaves(older, newer)).toMatchObject({ winner: 'remote', reason: 'neuer' })
    expect(mergeSaves(newer, older)).toMatchObject({ winner: 'local', reason: 'neuer' })
  })

  it('erkennt zwei gleiche Stände und behält den lokalen', () => {
    const merged = mergeSaves(saveWith(20, NOW), saveWith(20, NOW))
    expect(merged).toMatchObject({ winner: 'local', reason: 'gleichstand' })
  })

  it('verliert nie Fortschritt — der Sieger hat immer mindestens so viele Runden', () => {
    const cases: [number, number][] = [
      [0, 0],
      [10, 3],
      [3, 10],
      [99, 99],
    ]
    for (const [a, b] of cases) {
      const merged = mergeSaves(saveWith(a, NOW), saveWith(b, NOW + 1))
      expect(merged!.save.stats.totalGames).toBe(Math.max(a, b))
    }
  })
})
