import { SHAPES, type Shape } from './shapes'

/**
 * Spiellogik für Waldblöcke (docs/01-gamedesign.md).
 *
 * Frei von React und ohne Seiteneffekte: Jede Funktion nimmt einen Zustand entgegen
 * und gibt einen neuen zurück. Der Zufall läuft über einen mitgeführten Seed —
 * dieselbe Startzahl ergibt immer dieselbe Partie, sonst wären Fehler nicht
 * reproduzierbar (siehe CLAUDE.md).
 */

export const BOARD_SIZE = 8
export const TRAY_SIZE = 3

/** Punkte, abgeleitet aus den Mockup-Werten (3.680 Punkte bei 3 Sternen). */
const POINTS_PER_CELL = 1
const POINTS_PER_LINE = 100
/** Zwei Linien in einem Zug zählen doppelt, drei dreifach usw. */
const COMBO_BONUS = 50

export type Board = readonly boolean[]

export interface GameState {
  board: Board
  tray: readonly (Shape | null)[]
  score: number
  linesCleared: number
  combos: number
  /** Höchste Anzahl Linien, die ein einzelner Zug geräumt hat */
  bestCombo: number
  over: boolean
  seed: number
  startedAt: number
}

/** Deterministischer Zufall (Mulberry32) — klein, schnell, gut genug für Formenwahl. */
function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, seed: t }
}

function drawShape(seed: number): { shape: Shape; seed: number } {
  const r = nextRandom(seed)
  return { shape: SHAPES[Math.floor(r.value * SHAPES.length)], seed: r.seed }
}

function fillTray(seed: number): { tray: Shape[]; seed: number } {
  const tray: Shape[] = []
  let s = seed
  for (let i = 0; i < TRAY_SIZE; i++) {
    const drawn = drawShape(s)
    tray.push(drawn.shape)
    s = drawn.seed
  }
  return { tray, seed: s }
}

export function createGame(seed: number, startedAt: number): GameState {
  const filled = fillTray(seed)
  return {
    board: new Array(BOARD_SIZE * BOARD_SIZE).fill(false),
    tray: filled.tray,
    score: 0,
    linesCleared: 0,
    combos: 0,
    bestCombo: 0,
    over: false,
    seed: filled.seed,
    startedAt,
  }
}

export function indexOf(row: number, col: number): number {
  return row * BOARD_SIZE + col
}

/** Passt die Form mit ihrer linken oberen Ecke auf (row, col)? */
export function canPlace(board: Board, shape: Shape, row: number, col: number): boolean {
  for (const [dr, dc] of shape.cells) {
    const r = row + dr
    const c = col + dc
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false
    if (board[indexOf(r, c)]) return false
  }
  return true
}

/** Gibt es für diese Form irgendeinen freien Platz? */
export function hasAnyPlacement(board: Board, shape: Shape): boolean {
  for (let row = 0; row <= BOARD_SIZE - shape.height; row++) {
    for (let col = 0; col <= BOARD_SIZE - shape.width; col++) {
      if (canPlace(board, shape, row, col)) return true
    }
  }
  return false
}

export interface PlaceOutcome {
  state: GameState
  /** Wie viele Reihen und Spalten dieser Zug geräumt hat */
  clearedLines: number
  gainedScore: number
}

/**
 * Legt die Form aus dem Vorrat auf das Feld. Gibt `null` zurück, wenn der Zug
 * nicht erlaubt ist — die Oberfläche darf dann einfach nichts tun.
 */
export function placeShape(
  state: GameState,
  trayIndex: number,
  row: number,
  col: number,
): PlaceOutcome | null {
  if (state.over) return null
  const shape = state.tray[trayIndex]
  if (!shape || !canPlace(state.board, shape, row, col)) return null

  const board = [...state.board]
  for (const [dr, dc] of shape.cells) {
    board[indexOf(row + dr, col + dc)] = true
  }

  const fullRows: number[] = []
  const fullCols: number[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    let full = true
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[indexOf(r, c)]) {
        full = false
        break
      }
    }
    if (full) fullRows.push(r)
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (!board[indexOf(r, c)]) {
        full = false
        break
      }
    }
    if (full) fullCols.push(c)
  }

  // Erst alle vollen Linien bestimmen, dann räumen — sonst würde eine geräumte
  // Reihe eine gerade noch volle Spalte unvollständig machen.
  for (const r of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) board[indexOf(r, c)] = false
  }
  for (const c of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) board[indexOf(r, c)] = false
  }

  const clearedLines = fullRows.length + fullCols.length
  const comboBonus = clearedLines > 1 ? (clearedLines - 1) * COMBO_BONUS * clearedLines : 0
  const gainedScore = shape.size * POINTS_PER_CELL + clearedLines * POINTS_PER_LINE + comboBonus

  // Vorrat: benutzte Form entfernen, erst bei leerem Vorrat neu auffüllen.
  let tray: (Shape | null)[] = state.tray.map((s, i) => (i === trayIndex ? null : s))
  let seed = state.seed
  if (tray.every((s) => s === null)) {
    const filled = fillTray(seed)
    tray = filled.tray
    seed = filled.seed
  }

  const remaining = tray.filter((s): s is Shape => s !== null)
  const over = !remaining.some((s) => hasAnyPlacement(board, s))

  return {
    state: {
      ...state,
      board,
      tray,
      seed,
      score: state.score + gainedScore,
      linesCleared: state.linesCleared + clearedLines,
      combos: state.combos + (clearedLines > 1 ? 1 : 0),
      bestCombo: Math.max(state.bestCombo, clearedLines),
      over,
    },
    clearedLines,
    gainedScore,
  }
}

/** Sternschwellen — drei Sterne entsprechen etwa dem Mockup-Wert von 3.680 Punkten. */
export const STAR_THRESHOLDS = [1000, 2500, 3500] as const

export function starsFor(score: number): 0 | 1 | 2 | 3 {
  let stars = 0
  for (const threshold of STAR_THRESHOLDS) {
    if (score >= threshold) stars++
  }
  return stars as 0 | 1 | 2 | 3
}
