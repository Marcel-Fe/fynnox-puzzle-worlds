/**
 * Versetztes Raster für Bubble Shooter (docs/01-gamedesign.md).
 *
 * Die Reihen sind abwechselnd um einen halben Blasendurchmesser versetzt —
 * so liegen die Blasen dicht an dicht, wie beim Original. Gerade Reihen haben
 * 11 Blasen, ungerade 10.
 *
 * Frei von React, ohne Uhr.
 */

export const COLS = 11
export const ROWS = 13
/** Ab dieser Reihe ist die Runde verloren. */
export const LOSE_ROW = 12
export const COLORS = 5

/** Durchmesser einer Blase in Rastereinheiten. */
export const D = 1
export const R = D / 2
/** Reihenabstand: Höhe eines gleichseitigen Dreiecks über der Blasenbreite. */
export const ROW_HEIGHT = Math.sqrt(3) / 2

export interface Pos {
  row: number
  col: number
}

/** Wie viele Blasen in diese Reihe passen. */
export function colsIn(row: number): number {
  return row % 2 === 0 ? COLS : COLS - 1
}

export function isInside(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < colsIn(row)
}

export function keyOf(row: number, col: number): string {
  return `${row},${col}`
}

export function parseKey(key: string): Pos {
  const [row, col] = key.split(',').map(Number)
  return { row, col }
}

/** Mittelpunkt einer Blase in Rastereinheiten. */
export function centerOf(row: number, col: number): { x: number; y: number } {
  const offset = row % 2 === 0 ? R : D
  return { x: col * D + offset, y: row * ROW_HEIGHT + R }
}

/** Gesamtbreite und -höhe des Feldes in Rastereinheiten. */
export const FIELD_WIDTH = COLS * D
export const FIELD_HEIGHT = (ROWS - 1) * ROW_HEIGHT + D

/**
 * Die sechs Nachbarn einer Blase. Bei versetzten Reihen hängt es von der
 * Reihennummer ab, welche Felder darüber und darunter anliegen — genau hier
 * gehen die meisten Fehler in Bubble-Shooter-Umsetzungen ein.
 */
export function neighboursOf(row: number, col: number): Pos[] {
  const even = row % 2 === 0
  const candidates: Pos[] = even
    ? [
        { row: row - 1, col: col - 1 },
        { row: row - 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
        { row: row + 1, col: col - 1 },
        { row: row + 1, col },
      ]
    : [
        { row: row - 1, col },
        { row: row - 1, col: col + 1 },
        { row, col: col - 1 },
        { row, col: col + 1 },
        { row: row + 1, col },
        { row: row + 1, col: col + 1 },
      ]

  return candidates.filter((p) => isInside(p.row, p.col))
}

/**
 * Findet den freien Rasterplatz, der einem Punkt am nächsten liegt und an eine
 * belegte Blase (oder die Decke) grenzt.
 *
 * Ohne die Bedingung „grenzt an etwas an" könnte eine Blase mitten im leeren
 * Raum kleben bleiben.
 */
export function nearestFreeSlot(
  bubbles: ReadonlyMap<string, number>,
  x: number,
  y: number,
): Pos | null {
  let best: Pos | null = null
  let bestDistance = Infinity

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < colsIn(row); col++) {
      if (bubbles.has(keyOf(row, col))) continue

      const grenztAn =
        row === 0 || neighboursOf(row, col).some((n) => bubbles.has(keyOf(n.row, n.col)))
      if (!grenztAn) continue

      const c = centerOf(row, col)
      const distance = (c.x - x) ** 2 + (c.y - y) ** 2
      if (distance < bestDistance) {
        bestDistance = distance
        best = { row, col }
      }
    }
  }

  return best
}

/** Alle zusammenhängenden Blasen gleicher Farbe ab einem Startpunkt. */
export function connectedSameColor(
  bubbles: ReadonlyMap<string, number>,
  start: Pos,
): Pos[] {
  const color = bubbles.get(keyOf(start.row, start.col))
  if (color === undefined) return []

  const seen = new Set<string>([keyOf(start.row, start.col)])
  const group: Pos[] = [start]
  const queue: Pos[] = [start]

  while (queue.length > 0) {
    const current = queue.pop()!
    for (const n of neighboursOf(current.row, current.col)) {
      const key = keyOf(n.row, n.col)
      if (seen.has(key)) continue
      if (bubbles.get(key) !== color) continue
      seen.add(key)
      group.push(n)
      queue.push(n)
    }
  }

  return group
}

/**
 * Alle Blasen, die keine Verbindung mehr zur Decke haben.
 *
 * Gesucht wird umgekehrt: Von der obersten Reihe aus wird alles markiert, was
 * erreichbar ist. Was übrig bleibt, hängt in der Luft und fällt.
 */
export function floatingBubbles(bubbles: ReadonlyMap<string, number>): Pos[] {
  const anchored = new Set<string>()
  const queue: Pos[] = []

  for (let col = 0; col < colsIn(0); col++) {
    const key = keyOf(0, col)
    if (bubbles.has(key)) {
      anchored.add(key)
      queue.push({ row: 0, col })
    }
  }

  while (queue.length > 0) {
    const current = queue.pop()!
    for (const n of neighboursOf(current.row, current.col)) {
      const key = keyOf(n.row, n.col)
      if (anchored.has(key) || !bubbles.has(key)) continue
      anchored.add(key)
      queue.push(n)
    }
  }

  const floating: Pos[] = []
  for (const key of bubbles.keys()) {
    if (!anchored.has(key)) floating.push(parseKey(key))
  }
  return floating
}
