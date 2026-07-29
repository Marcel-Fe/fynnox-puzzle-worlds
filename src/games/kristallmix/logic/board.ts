/**
 * Feldlogik für Kristallmix (docs/01-gamedesign.md).
 *
 * Frei von React, ohne Uhr, mit Seed. Diese Datei kennt nur das Feld:
 * Was passt zusammen, was fällt nach, was rückt auf. Die Regeln der Runde
 * (Züge, Ziel, Punkte) stehen in game.ts.
 */

export const SIZE = 8
export const COLORS = 6

/** Ein Kristall: Farbe 0..5, dazu ggf. ein Power-Up. */
export type Power = 'none' | 'stripeH' | 'stripeV' | 'bomb' | 'rainbow'

export interface Gem {
  color: number
  power: Power
}

/** `null` heißt: Feld ist gerade leer und wird aufgefüllt. */
export type Board = readonly (Gem | null)[]

export function indexOf(row: number, col: number): number {
  return row * SIZE + col
}

export function rowOf(index: number): number {
  return Math.floor(index / SIZE)
}

export function colOf(index: number): number {
  return index % SIZE
}

/** Deterministischer Zufall (Mulberry32). */
export function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

/**
 * Eine gefundene Reihe: welche Felder, wie lang, und ob sie über Eck geht.
 */
export interface Match {
  cells: number[]
  length: number
  /** Über Eck (L oder T) — daraus entsteht eine Bombe */
  corner: boolean
  /** Nur bei geraden Reihen gesetzt: waagerecht oder senkrecht */
  horizontal: boolean
}

/**
 * Sucht alle Dreier-und-mehr-Reihen.
 *
 * Erst werden waagerechte und senkrechte Läufe getrennt gesammelt, danach
 * werden überlappende zu einer Gruppe verschmolzen — eine L- oder T-Form ist
 * ein einziger Treffer und ergibt eine Bombe, nicht zwei getrennte Reihen.
 */
export function findMatches(board: Board): Match[] {
  const runs: { cells: number[]; horizontal: boolean }[] = []

  for (let row = 0; row < SIZE; row++) {
    let start = 0
    for (let col = 1; col <= SIZE; col++) {
      const prev = board[indexOf(row, col - 1)]
      const cur = col < SIZE ? board[indexOf(row, col)] : null
      if (!cur || !prev || cur.color !== prev.color) {
        if (col - start >= 3) {
          const cells = []
          for (let c = start; c < col; c++) cells.push(indexOf(row, c))
          runs.push({ cells, horizontal: true })
        }
        start = col
      }
    }
  }

  for (let col = 0; col < SIZE; col++) {
    let start = 0
    for (let row = 1; row <= SIZE; row++) {
      const prev = board[indexOf(row - 1, col)]
      const cur = row < SIZE ? board[indexOf(row, col)] : null
      if (!cur || !prev || cur.color !== prev.color) {
        if (row - start >= 3) {
          const cells = []
          for (let r = start; r < row; r++) cells.push(indexOf(r, col))
          runs.push({ cells, horizontal: false })
        }
        start = row
      }
    }
  }

  // Überlappende Läufe zusammenfassen
  const merged: Match[] = []
  const used = new Set<number>()

  for (let i = 0; i < runs.length; i++) {
    if (used.has(i)) continue
    const group = [i]
    const cells = new Set(runs[i].cells)
    let changed = true
    while (changed) {
      changed = false
      for (let j = 0; j < runs.length; j++) {
        if (used.has(j) || group.includes(j)) continue
        if (runs[j].cells.some((c) => cells.has(c))) {
          group.push(j)
          for (const c of runs[j].cells) cells.add(c)
          changed = true
        }
      }
    }
    for (const j of group) used.add(j)

    const corner = group.length > 1
    merged.push({
      cells: [...cells],
      length: cells.size,
      corner,
      horizontal: runs[i].horizontal,
    })
  }

  return merged
}

/** Wirkt sich der Tausch dieser beiden Felder aus? */
export function wouldMatch(board: Board, a: number, b: number): boolean {
  const swapped = [...board]
  ;[swapped[a], swapped[b]] = [swapped[b], swapped[a]]
  return findMatches(swapped).length > 0
}

export function areNeighbours(a: number, b: number): boolean {
  const dr = Math.abs(rowOf(a) - rowOf(b))
  const dc = Math.abs(colOf(a) - colOf(b))
  return dr + dc === 1
}

/** Gibt es überhaupt noch einen Zug, der etwas bewirkt? */
export function hasValidMove(board: Board): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const here = indexOf(row, col)
      if (col + 1 < SIZE && wouldMatch(board, here, indexOf(row, col + 1))) return true
      if (row + 1 < SIZE && wouldMatch(board, here, indexOf(row + 1, col))) return true
    }
  }
  return false
}

/**
 * Räumt die angegebenen Felder und lässt alles darüber nachrutschen.
 * Oben aufgefüllt wird mit neuen Kristallen aus dem Seed.
 */
export function collapse(
  board: Board,
  cleared: Iterable<number>,
  seed: number,
): { board: Gem[]; seed: number } {
  const next = [...board] as (Gem | null)[]
  for (const index of cleared) next[index] = null

  let s = seed
  for (let col = 0; col < SIZE; col++) {
    // Von unten nach oben: bestehende Kristalle einsammeln …
    const column: Gem[] = []
    for (let row = SIZE - 1; row >= 0; row--) {
      const gem = next[indexOf(row, col)]
      if (gem) column.push(gem)
    }
    // … und von unten wieder einsetzen, oben mit neuen auffüllen
    for (let row = SIZE - 1, i = 0; row >= 0; row--, i++) {
      if (i < column.length) {
        next[indexOf(row, col)] = column[i]
      } else {
        const r = nextRandom(s)
        s = r.seed
        next[indexOf(row, col)] = { color: Math.floor(r.value * COLORS), power: 'none' }
      }
    }
  }

  return { board: next as Gem[], seed: s }
}

/**
 * Erzeugt ein Startfeld ohne fertige Reihen und mit mindestens einem Zug.
 *
 * Ein Feld einfach zufällig zu füllen liefert regelmäßig Felder, die sich beim
 * ersten Blick von selbst auflösen — der Spieler bekäme Punkte, ohne etwas
 * getan zu haben.
 */
export function createBoard(seed: number): { board: Gem[]; seed: number } {
  let s = seed

  for (let attempt = 0; attempt < 100; attempt++) {
    const board: Gem[] = []
    for (let i = 0; i < SIZE * SIZE; i++) {
      const forbidden = new Set<number>()

      // Farbe meiden, die hier sofort eine Dreierreihe schlösse
      const row = rowOf(i)
      const col = colOf(i)
      if (col >= 2 && board[i - 1].color === board[i - 2].color) forbidden.add(board[i - 1].color)
      if (row >= 2 && board[i - SIZE].color === board[i - 2 * SIZE].color) {
        forbidden.add(board[i - SIZE].color)
      }

      const allowed = [...Array(COLORS).keys()].filter((c) => !forbidden.has(c))
      const r = nextRandom(s)
      s = r.seed
      board.push({ color: allowed[Math.floor(r.value * allowed.length)], power: 'none' })
    }

    if (findMatches(board).length === 0 && hasValidMove(board)) {
      return { board, seed: s }
    }
  }

  // Sollte nicht eintreten; dann lieber ein Feld mit Zug als gar keines.
  const fallback: Gem[] = []
  for (let i = 0; i < SIZE * SIZE; i++) {
    const r = nextRandom(s)
    s = r.seed
    fallback.push({ color: Math.floor(r.value * COLORS), power: 'none' })
  }
  return { board: fallback, seed: s }
}

/** Verteilt die vorhandenen Kristalle neu, wenn kein Zug mehr möglich ist. */
export function reshuffle(board: Board, seed: number): { board: Gem[]; seed: number } {
  const gems = board.filter((g): g is Gem => g !== null)
  let s = seed

  for (let attempt = 0; attempt < 100; attempt++) {
    const pool = [...gems]
    for (let i = pool.length - 1; i > 0; i--) {
      const r = nextRandom(s)
      s = r.seed
      const j = Math.floor(r.value * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    if (findMatches(pool).length === 0 && hasValidMove(pool)) return { board: pool, seed: s }
  }

  return createBoard(s)
}
