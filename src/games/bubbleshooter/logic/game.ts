import {
  centerOf,
  colsIn,
  COLORS,
  connectedSameColor,
  D,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  floatingBubbles,
  keyOf,
  LOSE_ROW,
  nearestFreeSlot,
  R,
  ROW_HEIGHT,
  ROWS,
  type Pos,
} from './grid'

/**
 * Spiellogik für Bubble Shooter (docs/01-gamedesign.md).
 *
 * Frei von React, ohne Uhr, mit Seed. Die Flugbahn wird vollständig hier
 * berechnet: `shoot` liefert die Punkte der Bahn mit, damit die Oberfläche
 * sie nachzeichnen kann, ohne selbst rechnen zu müssen.
 */

export const START_ROWS = 5
/** Nach so vielen Schüssen rückt eine neue Reihe von oben nach. */
export const SHOTS_PER_ROW = 6

/** Schlüssel „reihe,spalte" → Farbe */
export type Bubbles = ReadonlyMap<string, number>

export interface GameState {
  bubbles: Bubbles
  /** Farbe der Blase im Rohr */
  current: number
  /** Farbe der übernächsten Blase */
  next: number
  score: number
  shots: number
  /** Wie oft schon eine Reihe nachgerückt ist */
  rowsAdded: number
  seed: number
  startedAt: number
  won: boolean
  lost: boolean
}

/** Deterministischer Zufall (Mulberry32). */
function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

/**
 * Zieht eine Farbe, die auf dem Feld noch vorkommt.
 *
 * Eine Farbe auszugeben, die es gar nicht mehr gibt, wäre ein sicherer
 * Fehlschuss — der Spieler kann damit nichts anfangen.
 */
function drawColor(bubbles: Bubbles, seed: number): { color: number; seed: number } {
  const vorhanden = [...new Set(bubbles.values())]
  const auswahl = vorhanden.length > 0 ? vorhanden : [...Array(COLORS).keys()]
  const r = nextRandom(seed)
  return { color: auswahl[Math.floor(r.value * auswahl.length)], seed: r.seed }
}

export function createGame(seed: number, startedAt: number): GameState {
  const bubbles = new Map<string, number>()
  let s = seed

  for (let row = 0; row < START_ROWS; row++) {
    for (let col = 0; col < colsIn(row); col++) {
      const r = nextRandom(s)
      s = r.seed
      bubbles.set(keyOf(row, col), Math.floor(r.value * COLORS))
    }
  }

  const first = drawColor(bubbles, s)
  const second = drawColor(bubbles, first.seed)

  return {
    bubbles,
    current: first.color,
    next: second.color,
    score: 0,
    shots: 0,
    rowsAdded: 0,
    seed: second.seed,
    startedAt,
    won: false,
    lost: false,
  }
}

/** Startpunkt des Schusses: mittig unter dem Feld. */
export const LAUNCHER = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT + R }

export interface Trajectory {
  /** Punkte der Bahn, für die Zielhilfe */
  path: { x: number; y: number }[]
  /** Wo die Blase landet, oder null wenn kein Platz gefunden wurde */
  slot: Pos | null
}

/**
 * Verfolgt die Flugbahn, bis die Blase eine andere berührt oder die Decke
 * erreicht. An den Seitenwänden prallt sie ab.
 *
 * `angle` in Radiant, gemessen von der Senkrechten nach oben:
 * 0 = gerade hoch, negativ = nach links, positiv = nach rechts.
 */
export function traceShot(bubbles: Bubbles, angle: number): Trajectory {
  const STEP = 0.06
  const MAX_STEPS = 4000

  let x = LAUNCHER.x
  let y = LAUNCHER.y
  let dx = Math.sin(angle) * STEP
  let dy = -Math.cos(angle) * STEP

  const path: { x: number; y: number }[] = [{ x, y }]

  for (let i = 0; i < MAX_STEPS; i++) {
    x += dx
    y += dy

    // Seitenwände: Richtung umkehren und zurück ins Feld schieben
    if (x < R) {
      x = R + (R - x)
      dx = -dx
      path.push({ x, y })
    } else if (x > FIELD_WIDTH - R) {
      x = FIELD_WIDTH - R - (x - (FIELD_WIDTH - R))
      dx = -dx
      path.push({ x, y })
    }

    // Decke erreicht
    if (y <= R) {
      path.push({ x, y: R })
      return { path, slot: nearestFreeSlot(bubbles, x, R) }
    }

    // Berührt sie eine liegende Blase?
    for (const [key, _color] of bubbles) {
      const [brow, bcol] = key.split(',').map(Number)
      const c = centerOf(brow, bcol)
      const dist2 = (c.x - x) ** 2 + (c.y - y) ** 2
      if (dist2 < D * D) {
        path.push({ x, y })
        return { path, slot: nearestFreeSlot(bubbles, x, y) }
      }
    }
  }

  path.push({ x, y })
  return { path, slot: nearestFreeSlot(bubbles, x, y) }
}

export interface ShotResult {
  state: GameState
  trajectory: Trajectory
  /** Blasen, die geplatzt sind */
  popped: Pos[]
  /** Blasen, die den Halt verloren haben */
  dropped: Pos[]
  gained: number
}

/**
 * Schießt eine Blase ab. Trifft sie auf drei oder mehr gleiche Farben,
 * platzen sie; Blasen, die dadurch den Halt verlieren, fallen herunter.
 */
export function shoot(state: GameState, angle: number): ShotResult {
  const leer: ShotResult = {
    state,
    trajectory: { path: [], slot: null },
    popped: [],
    dropped: [],
    gained: 0,
  }
  if (state.won || state.lost) return leer

  const trajectory = traceShot(state.bubbles, angle)
  if (!trajectory.slot) return { ...leer, trajectory }

  const bubbles = new Map(state.bubbles)
  bubbles.set(keyOf(trajectory.slot.row, trajectory.slot.col), state.current)

  // Gleichfarbige Gruppe ab der neuen Blase
  const group = connectedSameColor(bubbles, trajectory.slot)
  let popped: Pos[] = []
  let dropped: Pos[] = []

  if (group.length >= 3) {
    popped = group
    for (const p of popped) bubbles.delete(keyOf(p.row, p.col))

    dropped = floatingBubbles(bubbles)
    for (const p of dropped) bubbles.delete(keyOf(p.row, p.col))
  }

  const gained = popped.length * 10 + dropped.length * 20
  const shots = state.shots + 1

  let working: GameState = {
    ...state,
    bubbles,
    score: state.score + gained,
    shots,
  }

  // Alle paar Schüsse rückt eine Reihe nach
  if (shots % SHOTS_PER_ROW === 0 && bubbles.size > 0) {
    working = pushRow(working)
  }

  const nachgezogen = drawColor(working.bubbles, working.seed)
  const won = working.bubbles.size === 0
  const lost =
    !won &&
    (working.lost ||
      [...working.bubbles.keys()].some((k) => Number(k.split(',')[0]) >= LOSE_ROW))

  return {
    state: {
      ...working,
      current: state.next,
      next: nachgezogen.color,
      seed: nachgezogen.seed,
      won,
      lost,
    },
    trajectory,
    popped,
    dropped,
    gained,
  }
}

/**
 * Schiebt alles eine Reihe nach unten und setzt oben eine neue ein.
 *
 * Beim Verschieben wechselt jede Reihe die Versetzung, deshalb ändert sich
 * auch die Anzahl der Plätze. Blasen, für die in der neuen Reihe kein Platz
 * mehr ist, rücken auf den letzten gültigen — sie einfach verschwinden zu
 * lassen wäre für den Spieler nicht nachvollziehbar.
 *
 * Würde eine Blase unten aus dem Feld geschoben, ist die Runde verloren.
 * Sie stillschweigend zu verwerfen hieße, dass sich das Feld beim Nachrücken
 * heimlich leert — genau das Gegenteil des gewollten Drucks.
 */
export function pushRow(state: GameState): GameState {
  const verschoben = new Map<string, number>()
  let ueberRand = false

  for (const [key, color] of state.bubbles) {
    const [row, col] = key.split(',').map(Number)
    const neueReihe = row + 1
    if (neueReihe >= ROWS) {
      ueberRand = true
      continue
    }
    const neueSpalte = Math.min(col, colsIn(neueReihe) - 1)
    verschoben.set(keyOf(neueReihe, neueSpalte), color)
  }

  let s = state.seed
  for (let col = 0; col < colsIn(0); col++) {
    const r = nextRandom(s)
    s = r.seed
    verschoben.set(keyOf(0, col), Math.floor(r.value * COLORS))
  }

  return {
    ...state,
    bubbles: verschoben,
    seed: s,
    rowsAdded: state.rowsAdded + 1,
    lost: state.lost || ueberRand,
  }
}

/** Wie viele Blasen noch liegen. */
export function bubbleCount(state: GameState): number {
  return state.bubbles.size
}

/** Wie viele Schüsse noch bis zur nächsten nachrückenden Reihe. */
export function shotsUntilPush(state: GameState): number {
  return SHOTS_PER_ROW - (state.shots % SHOTS_PER_ROW)
}

/** Sternschwellen für die Rundenwertung. */
export const STAR_THRESHOLDS = [1500, 4000, 8000] as const

export function starsFor(score: number): 0 | 1 | 2 | 3 {
  let stars = 0
  for (const threshold of STAR_THRESHOLDS) {
    if (score >= threshold) stars++
  }
  return stars as 0 | 1 | 2 | 3
}

export { COLORS, FIELD_HEIGHT, FIELD_WIDTH, ROW_HEIGHT, centerOf, colsIn, keyOf, R, D, ROWS }
export type { Pos }
