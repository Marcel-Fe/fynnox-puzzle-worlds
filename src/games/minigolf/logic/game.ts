import { COURSES, courseAt, HOLE_RADIUS, type Course } from './courses'
import {
  atRest,
  distance,
  insidePolygon,
  insideRect,
  length,
  scale,
  step,
  vec,
  type Ball,
  type Field,
  type Vec,
} from './physics'

/**
 * Rundenlogik für Fynnox Minigolf (docs/01-gamedesign.md, Abschnitt 6).
 *
 * Frei von React und ohne Uhr — die verstrichene Zeit gibt die Komponente
 * herein. Ohne Zufall: Richtung und Kraft des Schlags bestimmen alles.
 */

/** Höchste Anfangsgeschwindigkeit eines Schlags, in Einheiten je Sekunde. */
export const MAX_SHOT_SPEED = 120
/** Schneller als das springt der Ball über das Loch hinweg. */
export const HOLE_CAPTURE_SPEED = 45
/** Feste Schrittweite. Größere Schritte lassen schnelle Bälle durch die Bande. */
export const STEP_SECONDS = 1 / 240
/** Wie viele Schläge über Par eine Bahn höchstens dauern darf. */
export const STROKE_ALLOWANCE = 5
/** Notbremse gegen Endlosläufe, falls ein Ball doch einmal nicht zur Ruhe kommt. */
const MAX_STEPS_PER_SHOT = 240 * 20

export interface GameState {
  course: number
  ball: Ball
  /** Letzte Ruheposition — dorthin geht es nach einer Gefahrenfläche zurück */
  lastRest: Vec
  strokes: number
  /** Strafschläge aus Lava oder Wasser, in `strokes` bereits enthalten */
  penalties: number
  /** Der Ball rollt gerade */
  moving: boolean
  holed: boolean
  /** Schlaggrenze gerissen */
  lost: boolean
  startedAt: number
}

export function maxStrokes(course: Course): number {
  return course.par + STROKE_ALLOWANCE
}

export function createGame(courseNumber: number, startedAt: number): GameState {
  const course = courseAt(courseNumber)
  return {
    course: course.number,
    ball: { position: course.start, velocity: vec(0, 0) },
    lastRest: course.start,
    strokes: 0,
    penalties: 0,
    moving: false,
    holed: false,
    lost: false,
    startedAt,
  }
}

export function courseOf(state: GameState): Course {
  return courseAt(state.course)
}

function fieldOf(course: Course): Field {
  return {
    boundary: course.boundary,
    obstacles: course.obstacles,
    friction: course.friction,
    wind: course.wind,
    updrafts: course.updrafts,
    restitution: 0.72,
  }
}

export function finished(state: GameState): boolean {
  return state.holed || state.lost
}

/**
 * Schlägt den Ball. `direction` muss nicht normiert sein, `power` läuft von
 * 0 bis 1.
 */
export function shoot(state: GameState, direction: Vec, power: number): GameState {
  if (finished(state) || state.moving) return state
  const speed = Math.max(0, Math.min(1, power)) * MAX_SHOT_SPEED
  if (speed === 0 || length(direction) === 0) return state

  const unit = scale(direction, 1 / length(direction))
  return {
    ...state,
    ball: { position: state.ball.position, velocity: scale(unit, speed) },
    lastRest: state.ball.position,
    strokes: state.strokes + 1,
    moving: true,
  }
}

export type Outcome = 'rolling' | 'stopped' | 'holed' | 'hazard' | 'lost'

export interface AdvanceResult {
  state: GameState
  outcome: Outcome
}

/**
 * Rechnet `seconds` Spielzeit weiter — in festen kleinen Schritten, damit das
 * Ergebnis nicht von der Bildrate abhängt.
 */
export function advance(state: GameState, seconds: number): AdvanceResult {
  if (!state.moving || finished(state)) return { state, outcome: 'rolling' }

  const course = courseOf(state)
  const field = fieldOf(course)
  let ball = state.ball
  let steps = Math.min(MAX_STEPS_PER_SHOT, Math.round(seconds / STEP_SECONDS))

  while (steps-- > 0) {
    const before = ball
    ball = step(ball, field, STEP_SECONDS)

    // Einlochen wird auf der Strecke zwischen zwei Schritten geprüft: Bei hohem
    // Tempo läge der Ball sonst in einem Schritt vor und im nächsten hinter dem Loch.
    if (crossesHole(before.position, ball.position, course.hole)) {
      if (length(ball.velocity) <= HOLE_CAPTURE_SPEED) {
        return {
          state: { ...state, ball: { position: course.hole, velocity: vec(0, 0) }, moving: false, holed: true },
          outcome: 'holed',
        }
      }
    }

    if (course.hazards.some((h) => insideRect(ball.position, h))) {
      const strokes = state.strokes + 1
      const lost = strokes >= maxStrokes(course)
      return {
        state: {
          ...state,
          ball: { position: state.lastRest, velocity: vec(0, 0) },
          strokes,
          penalties: state.penalties + 1,
          moving: false,
          lost,
        },
        outcome: lost ? 'lost' : 'hazard',
      }
    }

    if (atRest(ball)) {
      const resting = restingPosition(ball.position, course)
      const lost = state.strokes >= maxStrokes(course)
      return {
        state: {
          ...state,
          ball: { position: resting, velocity: vec(0, 0) },
          lastRest: resting,
          moving: false,
          lost,
        },
        outcome: lost ? 'lost' : 'stopped',
      }
    }
  }

  return { state: { ...state, ball }, outcome: 'rolling' }
}

/**
 * Ist der Ball zwischen zwei Rechenschritten am Loch vorbeigekommen? Geprüft
 * wird der Abstand des Lochs zur zurückgelegten Strecke, nicht nur zum Endpunkt.
 */
function crossesHole(from: Vec, to: Vec, hole: Vec): boolean {
  if (distance(to, hole) <= HOLE_RADIUS) return true
  const dx = to.x - from.x
  const dy = to.y - from.y
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) return false
  const t = Math.max(0, Math.min(1, ((hole.x - from.x) * dx + (hole.y - from.y) * dy) / lengthSq))
  return distance(vec(from.x + dx * t, from.y + dy * t), hole) <= HOLE_RADIUS
}

/**
 * Sicherheitsnetz: Sollte der Ball je außerhalb der Bande zur Ruhe kommen —
 * etwa an einer Ecke, die ihn nach außen drückt —, wird er zurückgeholt statt
 * unerreichbar liegen zu bleiben.
 */
function restingPosition(position: Vec, course: Course): Vec {
  return insidePolygon(position, course.boundary) ? position : course.start
}

/** Sterne nach Schlagzahl (docs/01-gamedesign.md). */
export function starsFor(state: GameState): 0 | 1 | 2 | 3 {
  if (!state.holed) return 0
  const { par } = courseOf(state)
  if (state.strokes <= par) return 3
  if (state.strokes === par + 1) return 2
  return 1
}

export function isHoleInOne(state: GameState): boolean {
  return state.holed && state.strokes === 1
}

/** Punkte am Rundenende (docs/01-gamedesign.md). */
export function finalScore(state: GameState): number {
  if (!state.holed) return 0
  const course = courseOf(state)
  const spare = Math.max(0, maxStrokes(course) - state.strokes)
  return 300 + spare * 120 + (isHoleInOne(state) ? 500 : 0) + course.number * 100
}

export { COURSES, courseAt, HOLE_RADIUS }
export type { Course }
