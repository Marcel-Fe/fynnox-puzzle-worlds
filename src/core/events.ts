import { EVENT_CATALOG, type EventInfo } from '../content/events'
import type { Mission } from '../save/types'
import { addDays, endOfWeek, startOfWeek, weekIndex } from './time'

/**
 * Eventplan (docs/01-gamedesign.md, Abschnitt „Events").
 *
 * Rein: `now` kommt von außen. Aus der Wochennummer ergibt sich ohne Zufall,
 * welches Event läuft — auf jedem Gerät dasselbe.
 */

export type EventRole = 'main' | 'side' | 'upcoming'

export interface ScheduledEvent {
  info: EventInfo
  role: EventRole
  startsAt: number
  endsAt: number
}

/** Das Nebenevent startet am Donnerstag, also am vierten Tag der Woche. */
const SIDE_EVENT_START_DAY = 3

function at(index: number): EventInfo {
  return EVENT_CATALOG[((index % EVENT_CATALOG.length) + EVENT_CATALOG.length) % EVENT_CATALOG.length]
}

/** Das Hauptevent der laufenden Woche. */
export function mainEvent(now: number): ScheduledEvent {
  const week = weekIndex(now)
  return {
    info: at(week),
    role: 'main',
    startsAt: startOfWeek(now),
    endsAt: endOfWeek(now),
  }
}

/**
 * Alle Events der kommenden zwei Wochen in der Reihenfolge des Mockups:
 * Hauptevent, aktive Events, kommende Events.
 *
 * Das Nebenevent steht vor Donnerstag unter „kommend" und danach unter „aktiv" —
 * es ist derselbe Eintrag, nur in einer anderen Gruppe.
 */
export function eventSchedule(now: number): ScheduledEvent[] {
  const week = weekIndex(now)
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  const sideStart = addDays(weekStart, SIDE_EVENT_START_DAY)

  return [
    { info: at(week), role: 'main', startsAt: weekStart, endsAt: weekEnd },
    {
      info: at(week + 1),
      role: now >= sideStart ? 'side' : 'upcoming',
      startsAt: sideStart,
      endsAt: weekEnd,
    },
    {
      info: at(week + 2),
      role: 'upcoming',
      startsAt: weekEnd,
      endsAt: addDays(weekEnd, 7),
    },
    {
      info: at(week + 3),
      role: 'upcoming',
      startsAt: addDays(weekEnd, 7),
      endsAt: addDays(weekEnd, 14),
    },
  ]
}

/**
 * Die Event-Mission der laufenden Woche. Die Wochennummer steckt in der ID,
 * damit die Mission der Vorwoche nicht mit der neuen verwechselt wird.
 */
export function createEventMission(now: number): Mission {
  const event = at(weekIndex(now))
  const { mission } = event
  return {
    id: `event-${event.id}#${weekIndex(now)}`,
    kind: 'event',
    text: mission.text,
    goal: mission.goal,
    progress: 0,
    rewardCoins: mission.rewardCoins,
    rewardCrystals: mission.rewardCrystals,
    claimed: false,
    expiresAt: endOfWeek(now),
    track: mission.track,
  }
}
