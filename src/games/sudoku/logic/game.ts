import { CELLS, createPuzzle, isPeer, type Difficulty } from './grid'

/**
 * Rundenlogik für Sudoku (docs/01-gamedesign.md).
 *
 * Frei von React und ohne Uhr — die verstrichene Zeit wird von außen übergeben.
 */

export const MAX_MISTAKES = 3
export const START_HINTS = 3

export interface Cell {
  value: number
  /** Vorgegebene Zahlen lassen sich nicht ändern */
  fixed: boolean
  /** Eingetragen, aber falsch — bleibt sichtbar stehen */
  wrong: boolean
  /** Notizen des Spielers */
  notes: readonly number[]
}

export interface GameState {
  cells: readonly Cell[]
  solution: readonly number[]
  difficulty: Difficulty
  selected: number | null
  /** Notizmodus an oder aus */
  noteMode: boolean
  mistakes: number
  hints: number
  startedAt: number
  won: boolean
  lost: boolean
  /** Für Rückgängig: Zustände vor den letzten Zügen, neuester zuletzt */
  history: readonly (readonly Cell[])[]
}

export function createGame(seed: number, difficulty: Difficulty, startedAt: number): GameState {
  const { puzzle, solution } = createPuzzle(seed, difficulty)

  const cells: Cell[] = puzzle.map((value) => ({
    value,
    fixed: value !== 0,
    wrong: false,
    notes: [],
  }))

  return {
    cells,
    solution,
    difficulty,
    selected: null,
    noteMode: false,
    mistakes: 0,
    hints: START_HINTS,
    startedAt,
    won: false,
    lost: false,
    history: [],
  }
}

export function selectCell(state: GameState, index: number): GameState {
  if (state.won || state.lost) return state
  return { ...state, selected: state.selected === index ? null : index }
}

export function toggleNoteMode(state: GameState): GameState {
  return { ...state, noteMode: !state.noteMode }
}

/** Sichert den Zustand für Rückgängig. Mehr als 50 Schritte braucht niemand. */
function remember(state: GameState): readonly (readonly Cell[])[] {
  return [...state.history, state.cells].slice(-50)
}

export interface EnterResult {
  state: GameState
  outcome: 'set' | 'note' | 'wrong' | 'blocked' | 'cleared'
}

/**
 * Trägt eine Zahl ein — oder eine Notiz, wenn der Notizmodus an ist.
 *
 * Eine falsche Zahl bleibt rot stehen, statt zu verschwinden: Sie wortlos zu
 * schlucken würde den Spieler ratlos zurücklassen, warum sein Zug nichts bewirkt hat.
 */
export function enterValue(state: GameState, value: number): EnterResult {
  const index = state.selected
  if (index === null || state.won || state.lost) return { state, outcome: 'blocked' }

  const cell = state.cells[index]
  if (cell.fixed) return { state, outcome: 'blocked' }

  const history = remember(state)

  // Notizmodus: Zahl an- oder abwählen
  if (state.noteMode && value !== 0) {
    const notes = cell.notes.includes(value)
      ? cell.notes.filter((n) => n !== value)
      : [...cell.notes, value].sort((a, b) => a - b)

    const cells = state.cells.map((c, i) => (i === index ? { ...c, notes } : c))
    return { state: { ...state, cells, history }, outcome: 'note' }
  }

  // Feld leeren
  if (value === 0) {
    const cells = state.cells.map((c, i) =>
      i === index ? { ...c, value: 0, wrong: false, notes: [] } : c,
    )
    return { state: { ...state, cells, history }, outcome: 'cleared' }
  }

  const correct = state.solution[index] === value
  const mistakes = correct ? state.mistakes : state.mistakes + 1

  const cells = state.cells.map((c, i) => {
    if (i === index) return { ...c, value, wrong: !correct, notes: [] }
    // Nach einem richtigen Eintrag die Notiz dieser Zahl bei allen
    // betroffenen Feldern streichen — das erspart lästiges Nachpflegen.
    if (correct && isPeer(index, i) && c.notes.includes(value)) {
      return { ...c, notes: c.notes.filter((n) => n !== value) }
    }
    return c
  })

  // Gewonnen heisst: jedes Feld traegt die Zahl aus der Loesung. Das ist
  // gleichbedeutend mit einem regelkonform vollen Gitter, aber ein Durchlauf
  // statt eines Vergleichs jedes Feldes mit jedem anderen.
  const won = cells.every((c, i) => c.value === state.solution[i])
  const lost = !won && mistakes >= MAX_MISTAKES

  return {
    state: { ...state, cells, mistakes, history, won, lost },
    outcome: correct ? 'set' : 'wrong',
  }
}

/** Macht den letzten Zug rückgängig. Fehler werden dabei nicht zurückgenommen. */
export function undo(state: GameState): GameState {
  if (state.history.length === 0 || state.won || state.lost) return state
  const previous = state.history[state.history.length - 1]
  return {
    ...state,
    cells: previous,
    history: state.history.slice(0, -1),
  }
}

export interface HintResult {
  state: GameState
  /** Welches Feld gefüllt wurde */
  index: number | null
}

/**
 * Trägt die richtige Zahl in ein Feld ein. Bevorzugt das ausgewählte Feld,
 * sonst das erste leere.
 */
export function useHint(state: GameState): HintResult {
  if (state.hints === 0 || state.won || state.lost) return { state, index: null }

  const candidate =
    state.selected !== null &&
    !state.cells[state.selected].fixed &&
    state.cells[state.selected].value !== state.solution[state.selected]
      ? state.selected
      : state.cells.findIndex((c, i) => !c.fixed && c.value !== state.solution[i])

  if (candidate === -1 || candidate === undefined) return { state, index: null }

  const value = state.solution[candidate]
  const cells = state.cells.map((c, i) => {
    if (i === candidate) return { ...c, value, wrong: false, notes: [], fixed: true }
    if (isPeer(candidate, i) && c.notes.includes(value)) {
      return { ...c, notes: c.notes.filter((n) => n !== value) }
    }
    return c
  })

  return {
    state: {
      ...state,
      cells,
      hints: state.hints - 1,
      history: remember(state),
      won: cells.every((c, i) => c.value === state.solution[i]),
      selected: candidate,
    },
    index: candidate,
  }
}

/** Wie viele Felder noch offen sind. */
export function remainingCells(state: GameState): number {
  return state.cells.filter((c, i) => c.value !== state.solution[i]).length
}

/** Wie oft eine Zahl schon richtig gesetzt ist — für den Zahlenblock. */
export function countPlaced(state: GameState, value: number): number {
  return state.cells.filter((c, i) => c.value === value && state.solution[i] === value).length
}

/** Sterne nach Zeit und Fehlerfreiheit (docs/01-gamedesign.md). */
export function starsFor(state: GameState, elapsedMs: number): 0 | 1 | 2 | 3 {
  if (!state.won) return 0
  if (state.mistakes === 0 && elapsedMs <= 10 * 60_000) return 3
  if (elapsedMs <= 20 * 60_000) return 2
  return 1
}

/** Punkte: Grundwert nach Schwierigkeit, Abzug je Fehler, Bonus für Tempo. */
export function scoreFor(state: GameState, elapsedMs: number): number {
  if (!state.won) return 0
  const base = { leicht: 1000, mittel: 2000, schwer: 3500 }[state.difficulty]
  const timeBonus = Math.max(0, 1200 - Math.floor(elapsedMs / 1000) * 2)
  return Math.max(0, base + timeBonus - state.mistakes * 250)
}

export { CELLS }
export type { Difficulty }
