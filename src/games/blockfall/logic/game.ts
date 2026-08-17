import { PIECE_IDS, PIECES, type PieceId } from './pieces'

/**
 * Spiellogik für Blockfall (docs/01-gamedesign.md).
 *
 * Frei von React und ohne Seiteneffekte. Der Zufall läuft über einen
 * mitgeführten Seed — dieselbe Startzahl ergibt immer dieselbe Partie
 * (siehe CLAUDE.md). Auch die Zeit kommt von außen: Die Logik weiß nicht,
 * wie spät es ist, sie bekommt gesagt, dass ein Schritt fällig ist.
 */

export const COLS = 10
export const ROWS = 20

/** Leeres Feld = null, gefülltes Feld = die Kennung des Steins, der dort liegt. */
export type Board = readonly (PieceId | null)[]

export interface ActivePiece {
  id: PieceId
  rotation: number
  row: number
  col: number
}

export interface GameState {
  board: Board
  active: ActivePiece
  next: PieceId
  score: number
  lines: number
  level: number
  over: boolean
  seed: number
  /** Rest des 7er-Beutels, aus dem gezogen wird */
  bag: readonly PieceId[]
  startedAt: number
}

export function indexOf(row: number, col: number): number {
  return row * COLS + col
}

/** Deterministischer Zufall (Mulberry32) — klein, schnell, gut genug. */
function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

/**
 * 7er-Beutel: Jeder der sieben Steine kommt genau einmal vor, bevor sich
 * einer wiederholt. Ohne das kann rein zufällig minutenlang das gebrauchte
 * lange Stück ausbleiben — das empfindet niemand als fair.
 */
function refillBag(seed: number): { bag: PieceId[]; seed: number } {
  const bag = [...PIECE_IDS]
  let s = seed
  for (let i = bag.length - 1; i > 0; i--) {
    const r = nextRandom(s)
    s = r.seed
    const j = Math.floor(r.value * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return { bag, seed: s }
}

function draw(bag: readonly PieceId[], seed: number): { id: PieceId; bag: PieceId[]; seed: number } {
  if (bag.length === 0) {
    const filled = refillBag(seed)
    return { id: filled.bag[0], bag: filled.bag.slice(1), seed: filled.seed }
  }
  return { id: bag[0], bag: bag.slice(1), seed }
}

/** Startposition: waagerecht mittig, oberste Zeile des Steinkastens auf Zeile 0. */
function spawn(id: PieceId): ActivePiece {
  const box = PIECES[id].box
  return { id, rotation: 0, row: 0, col: Math.floor((COLS - box) / 2) }
}

export function createGame(seed: number, startedAt: number): GameState {
  const first = draw([], seed)
  const second = draw(first.bag, first.seed)
  return {
    board: new Array(COLS * ROWS).fill(null),
    active: spawn(first.id),
    next: second.id,
    score: 0,
    lines: 0,
    level: 1,
    over: false,
    seed: second.seed,
    bag: second.bag,
    startedAt,
  }
}

/** Die belegten Felder eines Steins in Feldkoordinaten. */
export function cellsOf(piece: ActivePiece): [number, number][] {
  return PIECES[piece.id].rotations[piece.rotation].map(
    ([r, c]) => [piece.row + r, piece.col + c] as [number, number],
  )
}

export function fits(board: Board, piece: ActivePiece): boolean {
  for (const [r, c] of cellsOf(piece)) {
    if (c < 0 || c >= COLS || r >= ROWS) return false
    // Oberhalb des Feldes ist erlaubt: Steine erscheinen teilweise über der Kante.
    if (r >= 0 && board[indexOf(r, c)] !== null) return false
  }
  return true
}

export function moveLeft(state: GameState): GameState {
  const moved = { ...state.active, col: state.active.col - 1 }
  return fits(state.board, moved) ? { ...state, active: moved } : state
}

export function moveRight(state: GameState): GameState {
  const moved = { ...state.active, col: state.active.col + 1 }
  return fits(state.board, moved) ? { ...state, active: moved } : state
}

/**
 * Drehen mit Ausweichen: Passt die Drehung nicht, wird sie um bis zu zwei
 * Felder seitlich und eines nach oben versetzt versucht. Ohne das ließe sich
 * an der Wand und in engen Lücken nicht drehen.
 */
const KICKS: readonly [number, number][] = [
  [0, 0],
  [0, -1],
  [0, 1],
  [0, -2],
  [0, 2],
  [-1, 0],
]

export function rotate(state: GameState): GameState {
  const rotation = (state.active.rotation + 1) % 4
  for (const [dr, dc] of KICKS) {
    const turned = {
      ...state.active,
      rotation,
      row: state.active.row + dr,
      col: state.active.col + dc,
    }
    if (fits(state.board, turned)) return { ...state, active: turned }
  }
  return state
}

/** Punkte je geräumter Reihenzahl, klassische Staffelung. */
const LINE_SCORES = [0, 40, 100, 300, 1200] as const

export interface StepResult {
  state: GameState
  /** Wie viele Reihen dieser Schritt geräumt hat */
  clearedLines: number
  /** Ob der Stein liegen geblieben ist */
  locked: boolean
}

/**
 * Ein Schritt nach unten. Geht es nicht weiter, wird der Stein festgesetzt,
 * volle Reihen werden geräumt und der nächste Stein erscheint.
 */
export function stepDown(state: GameState): StepResult {
  if (state.over) return { state, clearedLines: 0, locked: false }

  const moved = { ...state.active, row: state.active.row + 1 }
  if (fits(state.board, moved)) {
    return { state: { ...state, active: moved }, clearedLines: 0, locked: false }
  }
  return lockPiece(state)
}

function lockPiece(state: GameState): StepResult {
  const board = [...state.board]
  for (const [r, c] of cellsOf(state.active)) {
    // Felder oberhalb der Kante fallen weg — sie führen unten zum Spielende.
    if (r >= 0) board[indexOf(r, c)] = state.active.id
  }

  // Volle Reihen von unten nach oben einsammeln
  const kept: (PieceId | null)[][] = []
  let clearedLines = 0
  for (let r = ROWS - 1; r >= 0; r--) {
    const row = board.slice(r * COLS, r * COLS + COLS)
    if (row.every((cell) => cell !== null)) clearedLines++
    else kept.push(row)
  }
  while (kept.length < ROWS) kept.push(new Array(COLS).fill(null))
  const cleared = kept.reverse().flat()

  const lines = state.lines + clearedLines
  // Alle zehn Reihen ein Level höher — die Steine fallen dann schneller.
  const level = Math.floor(lines / 10) + 1
  const score = state.score + LINE_SCORES[clearedLines] * state.level

  const drawn = draw(state.bag, state.seed)
  const active = spawn(state.next)

  return {
    state: {
      ...state,
      board: cleared,
      active,
      next: drawn.id,
      bag: drawn.bag,
      seed: drawn.seed,
      score,
      lines,
      level,
      // Passt der neue Stein schon beim Erscheinen nicht, ist das Feld voll.
      over: !fits(cleared, active),
    },
    clearedLines,
    locked: true,
  }
}

/** Sofort ganz nach unten. Gibt zusätzlich zwei Punkte je gefallenem Feld. */
export function hardDrop(state: GameState): StepResult {
  if (state.over) return { state, clearedLines: 0, locked: false }

  let piece = state.active
  let dropped = 0
  while (fits(state.board, { ...piece, row: piece.row + 1 })) {
    piece = { ...piece, row: piece.row + 1 }
    dropped++
  }
  const result = lockPiece({ ...state, active: piece })
  return {
    ...result,
    state: { ...result.state, score: result.state.score + dropped * 2 },
  }
}

/**
 * Wie lange ein Stein je Level für einen Schritt braucht.
 *
 * Level 1 lag bis zum 17.08.2026 bei 800 ms — dem Wert der Vorlage aus den
 * Achtzigern. Auf dem Handy wird aber mit Knöpfen gesteuert statt mit einer
 * Tastatur: Ein Stein an den linken Rand und zweimal gedreht sind vier Tipps,
 * und die waren in 800 ms nicht zu schaffen. Der Einstieg beginnt darum bei
 * 1.200 ms; ab Level 6 ist das alte Tempo erreicht, ab Level 17 die Untergrenze.
 */
export function dropIntervalMs(level: number): number {
  return Math.max(110, 1200 - (level - 1) * 70)
}

/**
 * Wo der Stein landen würde. Die Oberfläche zeichnet das als Schatten —
 * ohne diese Hilfe ist auf einem kleinen Handybildschirm kaum zu treffen.
 */
export function ghostRow(state: GameState): number {
  let piece = state.active
  while (fits(state.board, { ...piece, row: piece.row + 1 })) {
    piece = { ...piece, row: piece.row + 1 }
  }
  return piece.row
}

/** Sternschwellen für die Rundenwertung. */
export const STAR_THRESHOLDS = [2000, 6000, 12000] as const

export function starsFor(score: number): 0 | 1 | 2 | 3 {
  let stars = 0
  for (const threshold of STAR_THRESHOLDS) {
    if (score >= threshold) stars++
  }
  return stars as 0 | 1 | 2 | 3
}
