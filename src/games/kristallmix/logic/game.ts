import {
  areNeighbours,
  colOf,
  collapse,
  COLORS,
  createBoard,
  findMatches,
  hasValidMove,
  indexOf,
  nextRandom,
  reshuffle,
  rowOf,
  SIZE,
  wouldMatch,
  type Board,
  type Gem,
  type Match,
  type Power,
} from './board'

/**
 * Rundenlogik für Kristallmix (docs/01-gamedesign.md).
 *
 * Zugbegrenzung statt Zeit, dazu ein Sammelziel in einer ausgelosten Farbe.
 */

export const MOVES_PER_ROUND = 25
export const GOAL_AMOUNT = 20

export interface GameState {
  board: Board
  movesLeft: number
  score: number
  /** Farbe, die gesammelt werden soll */
  goalColor: number
  /** Wie viele davon schon gesammelt sind */
  goalCollected: number
  /** Wie oft ein Power-Up ausgelöst wurde — für Missionen */
  explosions: number
  rainbowsMade: number
  seed: number
  startedAt: number
  won: boolean
  lost: boolean
}

export function createGame(seed: number, startedAt: number): GameState {
  const created = createBoard(seed)
  const r = nextRandom(created.seed)

  return {
    board: created.board,
    movesLeft: MOVES_PER_ROUND,
    score: 0,
    goalColor: Math.floor(r.value * COLORS),
    goalCollected: 0,
    explosions: 0,
    rainbowsMade: 0,
    seed: r.seed,
    startedAt,
    won: false,
    lost: false,
  }
}

/** Welches Power-Up aus einer Reihe entsteht. */
function powerFor(match: Match): Power {
  if (match.corner) return 'bomb'
  if (match.length >= 5) return 'rainbow'
  if (match.length === 4) return match.horizontal ? 'stripeV' : 'stripeH'
  return 'none'
}

/** Punkte für eine einzelne Reihe, vor dem Kettenfaktor. */
function scoreFor(length: number): number {
  if (length >= 5) return 100
  if (length === 4) return 60
  return 30
}

/**
 * Sammelt alle Felder ein, die ein Power-Up mitreißt. Ausgelöste Power-Ups
 * können weitere auslösen, deshalb wird die Liste solange erweitert, bis
 * nichts Neues mehr dazukommt.
 */
function expandPowers(board: Board, initial: Iterable<number>): Set<number> {
  const cleared = new Set<number>(initial)
  const queue = [...cleared]

  while (queue.length > 0) {
    const index = queue.pop()!
    const gem = board[index]
    if (!gem || gem.power === 'none') continue

    const add = (i: number) => {
      if (i >= 0 && i < SIZE * SIZE && !cleared.has(i)) {
        cleared.add(i)
        queue.push(i)
      }
    }

    if (gem.power === 'stripeH') {
      for (let c = 0; c < SIZE; c++) add(indexOf(rowOf(index), c))
    } else if (gem.power === 'stripeV') {
      for (let r = 0; r < SIZE; r++) add(indexOf(r, colOf(index)))
    } else if (gem.power === 'bomb') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = rowOf(index) + dr
          const c = colOf(index) + dc
          if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) add(indexOf(r, c))
        }
      }
    } else if (gem.power === 'rainbow') {
      // Räumt alle Kristalle der Farbe, die hier liegt
      for (let i = 0; i < board.length; i++) {
        if (board[i]?.color === gem.color) add(i)
      }
    }
  }

  return cleared
}

export interface ResolveStep {
  /** Felder, die in diesem Schritt verschwinden */
  cleared: number[]
  /** Punkte dieses Schritts */
  gained: number
  /** Der wievielte Schritt der Kette — bestimmt den Faktor */
  chain: number
}

export interface MoveResult {
  state: GameState
  /** Alle Auflösungen der Reihe nach, für die Darstellung */
  steps: ResolveStep[]
  /** War der Zug überhaupt erlaubt? */
  valid: boolean
}

/**
 * Löst das Feld auf, bis keine Reihe mehr entsteht. Jede Folgeauflösung zählt
 * einen Faktor höher — eine Kettenreaktion ist mehr wert als drei einzelne Züge.
 *
 * `placePower` markiert das Feld, auf dem ein neu entstandenes Power-Up liegen
 * bleiben soll (das zuletzt bewegte).
 */
function resolve(
  state: GameState,
  placePower: number | null,
): { state: GameState; steps: ResolveStep[] } {
  let board = [...state.board] as Gem[]
  let seed = state.seed
  let score = state.score
  let goalCollected = state.goalCollected
  let explosions = state.explosions
  let rainbowsMade = state.rainbowsMade
  const steps: ResolveStep[] = []
  let chain = 0

  for (;;) {
    const matches = findMatches(board)
    if (matches.length === 0) break
    chain++

    // Power-Ups, die aus diesen Reihen entstehen, vor dem Räumen merken
    const newPowers: { index: number; power: Power; color: number }[] = []
    const base = new Set<number>()
    let gained = 0

    for (const match of matches) {
      gained += scoreFor(match.length)
      for (const cell of match.cells) base.add(cell)

      const power = powerFor(match)
      if (power !== 'none') {
        // Bevorzugt auf dem zuletzt bewegten Feld, sonst in der Mitte der Reihe
        const spot =
          placePower !== null && match.cells.includes(placePower)
            ? placePower
            : match.cells[Math.floor(match.cells.length / 2)]
        newPowers.push({ index: spot, power, color: board[spot]!.color })
        if (power === 'rainbow') rainbowsMade++
      }
    }

    // Power-Ups, die in den geräumten Feldern liegen, reißen weitere mit
    const cleared = expandPowers(board, base)
    for (const index of cleared) {
      if (board[index]?.power !== 'none') explosions++
    }

    // Zusätzliche Punkte für alles, was über die reinen Reihen hinaus fiel
    gained += (cleared.size - base.size) * 20
    gained *= chain

    for (const index of cleared) {
      if (board[index]?.color === state.goalColor) goalCollected++
    }
    score += gained
    steps.push({ cleared: [...cleared], gained, chain })

    // Felder der neuen Power-Ups nicht miträumen — dort soll das Power-Up liegen
    for (const p of newPowers) cleared.delete(p.index)

    const dropped = collapse(board, cleared, seed)
    board = dropped.board
    seed = dropped.seed

    for (const p of newPowers) {
      board[p.index] = { color: p.color, power: p.power }
    }

    placePower = null
  }

  // Ohne möglichen Zug bringt das Feld nichts mehr — neu mischen
  if (!hasValidMove(board)) {
    const mixed = reshuffle(board, seed)
    board = mixed.board
    seed = mixed.seed
  }

  return {
    state: { ...state, board, seed, score, goalCollected, explosions, rainbowsMade },
    steps,
  }
}

/**
 * Tauscht zwei benachbarte Kristalle. Bringt der Tausch nichts, bleibt alles,
 * wie es war, und der Zug zählt nicht — sonst wären die 25 Züge schnell mit
 * Fehlversuchen verbraucht.
 */
export function swap(state: GameState, a: number, b: number): MoveResult {
  if (state.won || state.lost) return { state, steps: [], valid: false }
  if (!areNeighbours(a, b)) return { state, steps: [], valid: false }

  const gemA = state.board[a]
  const gemB = state.board[b]
  if (!gemA || !gemB) return { state, steps: [], valid: false }

  // Ein Regenbogenstein wirkt auch ohne passende Reihe
  const rainbow = gemA.power === 'rainbow' || gemB.power === 'rainbow'
  if (!rainbow && !wouldMatch(state.board, a, b)) {
    return { state, steps: [], valid: false }
  }

  const board = [...state.board]
  ;[board[a], board[b]] = [board[b], board[a]]

  let working: GameState = { ...state, board, movesLeft: state.movesLeft - 1 }
  let steps: ResolveStep[] = []

  if (rainbow) {
    // Der Regenbogenstein räumt die Farbe des Steins, mit dem er getauscht wurde
    const rainbowIndex = board[a]!.power === 'rainbow' ? a : b
    const partner = rainbowIndex === a ? b : a
    const targetColor = board[partner]!.color

    const cleared = new Set<number>()
    for (let i = 0; i < board.length; i++) {
      if (board[i]?.color === targetColor) cleared.add(i)
    }
    cleared.add(rainbowIndex)

    const expanded = expandPowers(board, cleared)
    const gained = expanded.size * 20
    let goalCollected = working.goalCollected
    for (const index of expanded) {
      if (board[index]?.color === state.goalColor) goalCollected++
    }

    const dropped = collapse(board, expanded, working.seed)
    steps = [{ cleared: [...expanded], gained, chain: 1 }]
    working = {
      ...working,
      board: dropped.board,
      seed: dropped.seed,
      score: working.score + gained,
      goalCollected,
      explosions: working.explosions + 1,
    }
  }

  const resolved = resolve(working, rainbow ? null : b)
  const next = resolved.state
  const allSteps = [...steps, ...resolved.steps]

  const won = next.goalCollected >= GOAL_AMOUNT
  const lost = !won && next.movesLeft <= 0

  return {
    state: { ...next, won, lost },
    steps: allSteps,
    valid: true,
  }
}

/** Sternschwellen nach übrigen Zügen — wer sparsam war, bekommt mehr. */
export function starsFor(state: GameState): 0 | 1 | 2 | 3 {
  if (!state.won) return 0
  if (state.movesLeft >= 10) return 3
  if (state.movesLeft >= 5) return 2
  return 1
}

export { COLORS, SIZE, indexOf, rowOf, colOf }
export type { Board, Gem, Power }
