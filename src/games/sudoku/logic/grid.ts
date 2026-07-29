/**
 * Sudoku-Gitter: erzeugen, lösen, auf Eindeutigkeit prüfen
 * (docs/01-gamedesign.md).
 *
 * Frei von React, ohne Uhr, mit Seed — dieselbe Startzahl ergibt dasselbe Rätsel.
 */

export const SIZE = 9
export const BOX = 3
export const CELLS = SIZE * SIZE

/** 0 heißt: Feld ist leer. */
export type Grid = readonly number[]

export function indexOf(row: number, col: number): number {
  return row * SIZE + col
}

export function rowOf(index: number): number {
  return Math.floor(index / SIZE)
}

export function colOf(index: number): number {
  return index % SIZE
}

/** Nummer des 3×3-Blocks, in dem das Feld liegt (0 bis 8). */
export function boxOf(index: number): number {
  return Math.floor(rowOf(index) / BOX) * BOX + Math.floor(colOf(index) / BOX)
}

/** Deterministischer Zufall (Mulberry32). */
function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

function shuffled<T>(items: readonly T[], seed: number): { items: T[]; seed: number } {
  const out = [...items]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    const r = nextRandom(s)
    s = r.seed
    const j = Math.floor(r.value * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return { items: out, seed: s }
}

/**
 * Darf die Zahl in dieses Feld? Prüft Zeile, Spalte und Block.
 * Das Feld selbst wird übersprungen, damit die Prüfung auch für ein
 * bereits gefülltes Feld funktioniert.
 */
export function isAllowed(grid: Grid, index: number, value: number): boolean {
  if (value === 0) return true
  const row = rowOf(index)
  const col = colOf(index)
  const box = boxOf(index)

  for (let i = 0; i < CELLS; i++) {
    if (i === index || grid[i] !== value) continue
    if (rowOf(i) === row || colOf(i) === col || boxOf(i) === box) return false
  }
  return true
}

/**
 * Alle Felder, die mit diesem in Zeile, Spalte oder Block liegen.
 *
 * Einmal berechnet und dann nachgeschlagen: Die Nachbarschaften ändern sich
 * nie, werden aber bei jedem Zug gebraucht. Ohne diese Tabelle summierte sich
 * das spürbar — pro Zug wurden 81-mal 81 Felder durchlaufen.
 */
const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, index) => {
  const peers: number[] = []
  for (let i = 0; i < CELLS; i++) {
    if (i === index) continue
    if (rowOf(i) === rowOf(index) || colOf(i) === colOf(index) || boxOf(i) === boxOf(index)) {
      peers.push(i)
    }
  }
  return peers
})

const PEER_SETS: readonly ReadonlySet<number>[] = PEERS.map((p) => new Set(p))

export function peersOf(index: number): readonly number[] {
  return PEERS[index]
}

/** Schnelle Prüfung, ob zwei Felder einander beeinflussen. */
export function isPeer(index: number, other: number): boolean {
  return PEER_SETS[index].has(other)
}

/**
 * Zählt Lösungen, hört aber bei `limit` auf.
 *
 * Mehr als zwei Lösungen zu zählen bringt nichts: Für die Frage „ist das
 * Rätsel eindeutig?" genügt zu wissen, ob es eine zweite gibt.
 *
 * Gerechnet wird mit Bitmasken statt mit `isAllowed`: Je Zeile, Spalte und
 * Block merkt eine Zahl, welche Ziffern schon liegen. Bit 1 steht für die 1,
 * Bit 2 für die 2 und so fort. Damit ist die Frage „passt hier eine 5?" ein
 * einzelner Vergleich statt eines Durchlaufs über alle 81 Felder.
 *
 * Der Unterschied ist erheblich: Die Rätselerzeugung ruft diese Funktion
 * für jedes zu leerende Feld einmal auf. Mit der einfachen Prüfung dauerte
 * das Erzeugen eines schweren Rätsels mehrere Minuten.
 */
export function countSolutions(grid: Grid, limit = 2): number {
  const working = [...grid]
  const rowMask = new Array(SIZE).fill(0)
  const colMask = new Array(SIZE).fill(0)
  const boxMask = new Array(SIZE).fill(0)

  for (let i = 0; i < CELLS; i++) {
    const value = working[i]
    if (value === 0) continue
    const bit = 1 << value
    // Widerspruch schon im Ausgangsgitter
    if (rowMask[rowOf(i)] & bit || colMask[colOf(i)] & bit || boxMask[boxOf(i)] & bit) {
      return 0
    }
    rowMask[rowOf(i)] |= bit
    colMask[colOf(i)] |= bit
    boxMask[boxOf(i)] |= bit
  }

  /** Bits 1..9 gesetzt */
  const ALL = 0b1111111110

  function solve(): number {
    // Feld mit den wenigsten Möglichkeiten zuerst — das schneidet den
    // Suchbaum drastisch zusammen.
    let best = -1
    let bestBits = 0
    let bestCount = 10

    for (let i = 0; i < CELLS; i++) {
      if (working[i] !== 0) continue
      const used = rowMask[rowOf(i)] | colMask[colOf(i)] | boxMask[boxOf(i)]
      const free = ALL & ~used
      if (free === 0) return 0

      let count = 0
      for (let bits = free; bits; bits &= bits - 1) count++
      if (count < bestCount) {
        best = i
        bestBits = free
        bestCount = count
        if (count === 1) break
      }
    }

    if (best === -1) return 1 // alles gefüllt

    const row = rowOf(best)
    const col = colOf(best)
    const box = boxOf(best)
    let found = 0

    for (let bits = bestBits; bits; bits &= bits - 1) {
      const bit = bits & -bits
      const value = Math.log2(bit)

      working[best] = value
      rowMask[row] |= bit
      colMask[col] |= bit
      boxMask[box] |= bit

      found += solve()

      working[best] = 0
      rowMask[row] &= ~bit
      colMask[col] &= ~bit
      boxMask[box] &= ~bit

      if (found >= limit) break
    }
    return found
  }

  return solve()
}

export function isSolved(grid: Grid): boolean {
  for (let i = 0; i < CELLS; i++) {
    if (grid[i] === 0 || !isAllowed(grid, i, grid[i])) return false
  }
  return true
}

/**
 * Erzeugt ein vollständig gefülltes, gültiges Gitter.
 * Ebenfalls mit Bitmasken — aus demselben Geschwindigkeitsgrund.
 */
export function createSolution(seed: number): { grid: number[]; seed: number } {
  const grid = new Array(CELLS).fill(0)
  const rowMask = new Array(SIZE).fill(0)
  const colMask = new Array(SIZE).fill(0)
  const boxMask = new Array(SIZE).fill(0)
  let s = seed

  function fill(index: number): boolean {
    if (index >= CELLS) return true

    const row = rowOf(index)
    const col = colOf(index)
    const box = boxOf(index)
    const used = rowMask[row] | colMask[col] | boxMask[box]

    const candidates = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], s)
    s = candidates.seed

    for (const value of candidates.items) {
      const bit = 1 << value
      if (used & bit) continue

      grid[index] = value
      rowMask[row] |= bit
      colMask[col] |= bit
      boxMask[box] |= bit

      if (fill(index + 1)) return true

      grid[index] = 0
      rowMask[row] &= ~bit
      colMask[col] &= ~bit
      boxMask[box] &= ~bit
    }
    return false
  }

  fill(0)
  return { grid, seed: s }
}

export type Difficulty = 'leicht' | 'mittel' | 'schwer'

/** Wie viele Zahlen stehen bleiben (docs/01-gamedesign.md). */
export const CLUES: Record<Difficulty, number> = {
  leicht: 42,
  mittel: 34,
  schwer: 26,
}

export interface Puzzle {
  /** Das Rätsel mit Lücken */
  puzzle: number[]
  /** Die eindeutige Lösung */
  solution: number[]
  difficulty: Difficulty
  seed: number
}

/**
 * Erzeugt ein Rätsel, das **genau eine** Lösung hat.
 *
 * Es werden Felder in zufälliger Reihenfolge geleert; vor jedem Leeren wird
 * geprüft, ob das Rätsel eindeutig bleibt. Bleibt es das nicht, bleibt die
 * Zahl stehen. Deshalb kann die Zahl der Vorgaben etwas über dem Zielwert
 * liegen — lieber ein etwas leichteres Rätsel als eines, das sich nur noch
 * raten lässt.
 */
export function createPuzzle(seed: number, difficulty: Difficulty): Puzzle {
  const created = createSolution(seed)
  const solution = created.grid
  const puzzle = [...solution]

  const order = shuffled([...Array(CELLS).keys()], created.seed)
  let s = order.seed
  const target = CLUES[difficulty]
  let filled = CELLS

  for (const index of order.items) {
    if (filled <= target) break
    const backup = puzzle[index]
    puzzle[index] = 0

    if (countSolutions(puzzle) === 1) {
      filled--
    } else {
      puzzle[index] = backup
    }
  }

  return { puzzle, solution, difficulty, seed: s }
}
