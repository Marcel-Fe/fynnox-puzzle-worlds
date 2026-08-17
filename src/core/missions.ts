import { DAILY_POOL, WEEKLY_POOL, type MissionTemplate } from '../content/missions'
import type { Mission } from '../save/types'
import { createEventMission } from './events'
import { dayIndex, endOfDay, endOfWeek, weekIndex } from './time'

/**
 * Auswahl und Erneuerung der Missionen (docs/01-gamedesign.md).
 *
 * Rein: `now` wird übergeben. `core/round.ts` bleibt dadurch ohne Uhr —
 * es zählt nur hoch, während hier entschieden wird, was überhaupt aktiv ist.
 */

export const DAILY_COUNT = 3
export const WEEKLY_COUNT = 3

/**
 * Wählt Vorlagen ohne Zufall: Der Zeitraum bestimmt den Startpunkt, von dort
 * werden fortlaufende Einträge genommen. Weil weniger genommen als angeboten
 * werden, kann keine Vorlage doppelt vorkommen.
 */
export function pickTemplates(
  pool: MissionTemplate[],
  count: number,
  period: number,
): MissionTemplate[] {
  const picked: MissionTemplate[] = []
  for (let i = 0; i < count; i++) {
    picked.push(pool[(period * count + i) % pool.length])
  }
  return picked
}

/**
 * Der Zeitraum steckt in der ID. Ohne ihn wäre die heutige „Spiele 5 Runden"
 * nicht von der gestrigen zu unterscheiden — beim Tageswechsel würde die alte
 * Mission die neue verdecken.
 */
function toMission(
  template: MissionTemplate,
  kind: Mission['kind'],
  period: number,
  expiresAt: number,
): Mission {
  return {
    id: `${template.id}#${period}`,
    kind,
    text: template.text,
    goal: template.goal,
    progress: 0,
    rewardCoins: template.rewardCoins,
    rewardCrystals: template.rewardCrystals,
    claimed: false,
    expiresAt,
    track: template.track,
  }
}

export function createDailyMissions(now: number): Mission[] {
  const day = dayIndex(now)
  return pickTemplates(DAILY_POOL, DAILY_COUNT, day).map((t) =>
    toMission(t, 'daily', day, endOfDay(now)),
  )
}

export function createWeeklyMissions(now: number): Mission[] {
  const week = weekIndex(now)
  return pickTemplates(WEEKLY_POOL, WEEKLY_COUNT, week).map((t) =>
    toMission(t, 'weekly', week, endOfWeek(now)),
  )
}

/** Der vollständige Satz für einen frischen Spielstand. */
export function createMissions(now: number): Mission[] {
  return [...createDailyMissions(now), ...createWeeklyMissions(now), createEventMission(now)]
}

/**
 * Wirft abgelaufene Missionen weg und legt für jede leer gewordene Art neue an.
 * Nicht abgeholte Belohnungen abgelaufener Missionen verfallen (Gamedesign) —
 * sonst stapeln sie sich wochenlang und der tägliche Anreiz verschwindet.
 *
 * Läuft noch etwas, bleibt es samt Fortschritt stehen.
 */
export function refreshMissions(missions: Mission[], now: number): Mission[] {
  const kept = missions.filter((m) => m.expiresAt > now)
  const next = [...kept]

  if (!kept.some((m) => m.kind === 'daily')) next.push(...createDailyMissions(now))
  if (!kept.some((m) => m.kind === 'weekly')) next.push(...createWeeklyMissions(now))
  if (!kept.some((m) => m.kind === 'event')) next.push(createEventMission(now))

  return next
}

/** Missionen einer Art, in der Reihenfolge des Pools. */
export function missionsOfKind(missions: Mission[], kind: Mission['kind']): Mission[] {
  return missions.filter((m) => m.kind === kind)
}

/** Wie viele Belohnungen gerade abholbereit sind. */
export function claimableCount(missions: Mission[]): number {
  return missions.filter((m) => !m.claimed && m.progress >= m.goal).length
}
