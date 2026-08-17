import { describe, expect, it } from 'vitest'
import { DAILY_POOL, WEEKLY_POOL } from '../content/missions'
import { createNewSave } from '../save/defaults'
import type { Mission } from '../save/types'
import { createEventMission } from './events'
import {
  createDailyMissions,
  createMissions,
  createWeeklyMissions,
  DAILY_COUNT,
  pickTemplates,
  refreshMissions,
  WEEKLY_COUNT,
} from './missions'
import { addDays, dayIndex, endOfDay, endOfWeek, startOfWeek, weekIndex } from './time'

/** Ein fester Zeitpunkt in Ortszeit: 17.08.2026, 10:00 Uhr. */
const NOW = new Date(2026, 7, 17, 10, 0, 0).getTime()

describe('Kalenderrechnung', () => {
  it('der Tageswechsel liegt um Mitternacht Ortszeit', () => {
    const end = new Date(endOfDay(NOW))
    expect(end.getHours()).toBe(0)
    expect(end.getMinutes()).toBe(0)
    expect(dayIndex(end.getTime())).toBe(dayIndex(NOW) + 1)
  })

  it('die Woche beginnt am Montag', () => {
    expect(new Date(endOfWeek(NOW)).getDay()).toBe(1)
    expect(new Date(startOfWeek(NOW)).getDay()).toBe(1)
    expect(weekIndex(endOfWeek(NOW))).toBe(weekIndex(NOW) + 1)
  })

  it('überspringt beim Tageszählen keinen Tag über die Zeitumstellung', () => {
    // Ende März und Ende Oktober sind in Europa 23- bzw. 25-Stunden-Tage.
    for (const start of [new Date(2027, 2, 27, 12).getTime(), new Date(2027, 9, 30, 12).getTime()]) {
      expect(dayIndex(addDays(start, 1))).toBe(dayIndex(start) + 1)
      expect(dayIndex(addDays(start, 2))).toBe(dayIndex(start) + 2)
    }
  })

  it('ein Kalendertag später ist genau eine Tagesnummer weiter', () => {
    for (let i = 0; i < 400; i++) {
      expect(dayIndex(addDays(NOW, i + 1))).toBe(dayIndex(addDays(NOW, i)) + 1)
    }
  })
})

describe('Auswahl aus dem Pool', () => {
  it('ist ohne Zufall — derselbe Zeitraum ergibt dieselben Missionen', () => {
    expect(pickTemplates(DAILY_POOL, DAILY_COUNT, 7)).toEqual(
      pickTemplates(DAILY_POOL, DAILY_COUNT, 7),
    )
  })

  it('nimmt nie zweimal dieselbe Vorlage', () => {
    for (let period = 0; period < 100; period++) {
      for (const [pool, count] of [
        [DAILY_POOL, DAILY_COUNT],
        [WEEKLY_POOL, WEEKLY_COUNT],
      ] as const) {
        const ids = pickTemplates(pool, count, period).map((t) => t.id)
        expect(new Set(ids).size).toBe(count)
      }
    }
  })

  it('nutzt über die Zeit den ganzen Pool', () => {
    const seen = new Set<string>()
    for (let day = 0; day < 30; day++) {
      for (const t of pickTemplates(DAILY_POOL, DAILY_COUNT, day)) seen.add(t.id)
    }
    expect(seen.size).toBe(DAILY_POOL.length)
  })
})

describe('Missionssatz', () => {
  it('besteht aus drei täglichen, drei wöchentlichen und einer Event-Mission', () => {
    const missions = createMissions(NOW)
    expect(missions.filter((m) => m.kind === 'daily')).toHaveLength(DAILY_COUNT)
    expect(missions.filter((m) => m.kind === 'weekly')).toHaveLength(WEEKLY_COUNT)
    expect(missions.filter((m) => m.kind === 'event')).toHaveLength(1)
  })

  it('vergibt eindeutige IDs', () => {
    const ids = createMissions(NOW).map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gibt Tagesmissionen bis Mitternacht und Wochenmissionen bis Montag Zeit', () => {
    for (const m of createDailyMissions(NOW)) expect(m.expiresAt).toBe(endOfDay(NOW))
    for (const m of createWeeklyMissions(NOW)) expect(m.expiresAt).toBe(endOfWeek(NOW))
    expect(createEventMission(NOW).expiresAt).toBe(endOfWeek(NOW))
  })

  it('dockt nur an Zähler an, die ein Spiel auch meldet', () => {
    // Gemeldet werden diese Schlüssel (siehe docs/01-gamedesign.md).
    const reported = [
      'stars',
      'rowsCleared',
      'combos',
      'pairs',
      'crystalsCollected',
      'rainbows',
      'strokes',
      'holeInOne',
      'moves',
      'undos',
      'mistakes',
    ]
    for (const t of [...DAILY_POOL, ...WEEKLY_POOL]) {
      if (t.track.type === 'custom') expect(reported).toContain(t.track.key)
    }
  })

  it('verlangt keinen Sieg von den beiden Endlosspielen', () => {
    for (const t of [...DAILY_POOL, ...WEEKLY_POOL]) {
      if (t.track.type === 'winRounds' && t.track.game) {
        expect(['waldbloecke', 'blockfall']).not.toContain(t.track.game)
      }
    }
  })

  it('ein neuer Spielstand startet mit dem vollen Satz', () => {
    expect(createNewSave(NOW).missions).toHaveLength(DAILY_COUNT + WEEKLY_COUNT + 1)
  })
})

describe('refreshMissions', () => {
  it('lässt laufende Missionen samt Fortschritt stehen', () => {
    const missions = createMissions(NOW).map((m) => ({ ...m, progress: 1 }))
    const next = refreshMissions(missions, NOW + 60_000)
    expect(next).toHaveLength(missions.length)
    expect(next.every((m) => m.progress === 1)).toBe(true)
  })

  it('ersetzt abgelaufene Tagesmissionen durch neue', () => {
    const missions = createMissions(NOW)
    const tomorrow = addDays(NOW, 1)
    const next = refreshMissions(missions, tomorrow)

    const oldDaily = missions.filter((m) => m.kind === 'daily').map((m) => m.id)
    const newDaily = next.filter((m) => m.kind === 'daily').map((m) => m.id)
    expect(newDaily).toHaveLength(DAILY_COUNT)
    expect(newDaily.some((id) => oldDaily.includes(id))).toBe(false)
    // Die Wochenmissionen laufen weiter.
    expect(next.filter((m) => m.kind === 'weekly').map((m) => m.id)).toEqual(
      missions.filter((m) => m.kind === 'weekly').map((m) => m.id),
    )
  })

  it('nicht abgeholte Belohnungen abgelaufener Missionen verfallen', () => {
    const missions: Mission[] = createMissions(NOW).map((m) => ({
      ...m,
      progress: m.goal,
    }))
    const next = refreshMissions(missions, addDays(NOW, 8))
    expect(next.every((m) => m.progress === 0)).toBe(true)
  })

  it('erneuert auch nach langer Pause genau einen vollständigen Satz', () => {
    const next = refreshMissions(createMissions(NOW), addDays(NOW, 90))
    expect(next).toHaveLength(DAILY_COUNT + WEEKLY_COUNT + 1)
    expect(new Set(next.map((m) => m.id)).size).toBe(next.length)
  })
})
