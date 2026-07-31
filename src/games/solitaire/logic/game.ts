import {
  ACE,
  alternates,
  createDeck,
  KING,
  shuffleDeck,
  SUITS,
  type Card,
} from './cards'

/**
 * Spiellogik für Fynnox Solitaire — Klondike (docs/01-gamedesign.md, Abschnitt 5).
 *
 * Frei von React, ohne Uhr, mit Seed. Die verstrichene Zeit wird von außen
 * hereingegeben, wie bei Tempelpaare und Sudoku.
 *
 * In jedem Stapel ist das **letzte** Element die oberste, sichtbare Karte.
 */

export const COLUMNS = 7
export const START_HINTS = 3

/** Punkte je Aktion (docs/01-gamedesign.md). */
export const POINTS_TO_FOUNDATION = 10
export const POINTS_REVEAL = 5
export const POINTS_WASTE_TO_TABLEAU = 5
export const POINTS_FOUNDATION_BACK = -15
export const WIN_BONUS = 500
/** Ab dieser Sekundenzahl gibt es keinen Zeitbonus mehr. */
export const TIME_BONUS_SECONDS = 900

/** Woher eine Karte kommt. */
export type Selection =
  | { zone: 'waste' }
  | { zone: 'foundation'; pile: number }
  /** `index` ist die unterste Karte der mitgenommenen Folge */
  | { zone: 'tableau'; column: number; index: number }

/** Wohin sie soll. */
export type Target = { zone: 'foundation'; pile: number } | { zone: 'tableau'; column: number }

/** Alles, was Rückgängig zurückholen muss. */
interface Snapshot {
  stock: readonly Card[]
  waste: readonly Card[]
  foundations: readonly (readonly Card[])[]
  tableau: readonly (readonly Card[])[]
  score: number
  moves: number
  redeals: number
  won: boolean
}

export interface GameState extends Snapshot {
  /** Angetippte, noch nicht abgelegte Karte(n) */
  selected: Selection | null
  /** Verbleibende Hinweise */
  hints: number
  /** Wie oft zurückgenommen wurde — die Mission „Ohne Rückgängig gewinnen" liest das */
  undos: number
  seed: number
  startedAt: number
  history: readonly Snapshot[]
}

export type Outcome = 'selected' | 'deselected' | 'moved' | 'drawn' | 'redeal' | 'blocked'

export interface MoveResult {
  state: GameState
  outcome: Outcome
}

/** Zu welchem Ablagestapel eine Karte gehört. Die Reihenfolge ist die aus `SUITS`. */
export function foundationFor(card: Card): number {
  return SUITS.indexOf(card.suit)
}

/**
 * Teilt aus: Spalte 1 bekommt eine Karte, Spalte 7 sieben — je die oberste
 * offen. Der Rest wird zum Ziehstapel.
 */
export function createGame(seed: number, startedAt: number): GameState {
  const { cards, seed: nextSeed } = shuffleDeck(createDeck(), seed)

  const tableau: Card[][] = []
  let dealt = 0
  for (let column = 0; column < COLUMNS; column++) {
    const pile: Card[] = []
    for (let row = 0; row <= column; row++) {
      pile.push({ ...cards[dealt++], faceUp: row === column })
    }
    tableau.push(pile)
  }

  return {
    stock: cards.slice(dealt).map((c) => ({ ...c, faceUp: false })),
    waste: [],
    foundations: SUITS.map(() => []),
    tableau,
    selected: null,
    score: 0,
    moves: 0,
    redeals: 0,
    hints: START_HINTS,
    undos: 0,
    seed: nextSeed,
    startedAt,
    won: false,
    history: [],
  }
}

/** Sichert den Zustand für Rückgängig. Mehr als 200 Schritte braucht niemand. */
function remember(state: GameState): readonly Snapshot[] {
  const snapshot: Snapshot = {
    stock: state.stock,
    waste: state.waste,
    foundations: state.foundations,
    tableau: state.tableau,
    score: state.score,
    moves: state.moves,
    redeals: state.redeals,
    won: state.won,
  }
  return [...state.history, snapshot].slice(-200)
}

/**
 * Bilden die Karten eine gültige Folge? Absteigend, mit wechselnder Farbe,
 * und alle offen — nur so darf sie am Stück bewegt werden.
 */
export function isRun(cards: readonly Card[]): boolean {
  if (cards.length === 0) return false
  if (!cards[0].faceUp) return false
  for (let i = 0; i + 1 < cards.length; i++) {
    if (!cards[i + 1].faceUp) return false
    if (cards[i].rank !== cards[i + 1].rank + 1) return false
    if (!alternates(cards[i], cards[i + 1])) return false
  }
  return true
}

/** Welche Karten dieser Griff mitnimmt — oder `null`, wenn er unzulässig ist. */
export function movingCards(state: GameState, selection: Selection): readonly Card[] | null {
  switch (selection.zone) {
    case 'waste':
      return state.waste.length > 0 ? [state.waste[state.waste.length - 1]] : null
    case 'foundation': {
      const pile = state.foundations[selection.pile]
      if (!pile || pile.length === 0) return null
      return [pile[pile.length - 1]]
    }
    case 'tableau': {
      const column = state.tableau[selection.column]
      if (!column || selection.index < 0 || selection.index >= column.length) return null
      const run = column.slice(selection.index)
      return isRun(run) ? run : null
    }
  }
}

export function canPickUp(state: GameState, selection: Selection): boolean {
  return !state.won && movingCards(state, selection) !== null
}

/** Darf die aufgenommene Karte (oder Folge) dort abgelegt werden? */
export function canDrop(state: GameState, selection: Selection, target: Target): boolean {
  if (state.won) return false
  const cards = movingCards(state, selection)
  if (!cards) return false

  if (target.zone === 'foundation') {
    // Ablagestapel nehmen nur einzelne Karten — eine Folge ist absteigend und
    // damit ohnehin nie aufsteigend ablegbar.
    if (cards.length !== 1) return false
    const card = cards[0]
    const pile = state.foundations[target.pile]
    if (!pile || SUITS[target.pile] !== card.suit) return false
    if (pile.length === 0) return card.rank === ACE
    return pile[pile.length - 1].rank === card.rank - 1
  }

  const column = state.tableau[target.column]
  if (!column) return false
  if (selection.zone === 'tableau' && selection.column === target.column) return false

  const head = cards[0]
  if (column.length === 0) return head.rank === KING
  const top = column[column.length - 1]
  return top.faceUp && top.rank === head.rank + 1 && alternates(top, head)
}

/** Karte antippen: auswählen, abwählen oder abweisen. */
export function select(state: GameState, selection: Selection): MoveResult {
  if (state.won) return { state, outcome: 'blocked' }

  if (state.selected && sameSelection(state.selected, selection)) {
    return { state: { ...state, selected: null }, outcome: 'deselected' }
  }
  if (!canPickUp(state, selection)) return { state, outcome: 'blocked' }
  return { state: { ...state, selected: selection }, outcome: 'selected' }
}

export function clearSelection(state: GameState): GameState {
  return state.selected === null ? state : { ...state, selected: null }
}

function sameSelection(a: Selection, b: Selection): boolean {
  if (a.zone !== b.zone) return false
  if (a.zone === 'foundation' && b.zone === 'foundation') return a.pile === b.pile
  if (a.zone === 'tableau' && b.zone === 'tableau') return a.column === b.column && a.index === b.index
  return true
}

/**
 * Legt die ausgewählte(n) Karte(n) am Ziel ab.
 *
 * Punkte werden nie negativ: Wer Karten zwischen Ablagestapel und Spalten hin
 * und her schiebt, soll sich nicht in den Minusbereich spielen können.
 */
export function moveTo(state: GameState, target: Target): MoveResult {
  const selection = state.selected
  if (!selection || !canDrop(state, selection, target)) return { state, outcome: 'blocked' }

  const cards = movingCards(state, selection)!
  const history = remember(state)

  let waste = state.waste
  const foundations = state.foundations.map((pile) => [...pile])
  const tableau = state.tableau.map((column) => [...column])
  let score = state.score

  // 1. Karten von der Quelle nehmen
  if (selection.zone === 'waste') {
    waste = waste.slice(0, -1)
    if (target.zone === 'tableau') score += POINTS_WASTE_TO_TABLEAU
  } else if (selection.zone === 'foundation') {
    foundations[selection.pile].pop()
    score += POINTS_FOUNDATION_BACK
  } else {
    const rest = tableau[selection.column].slice(0, selection.index)
    const below = rest[rest.length - 1]
    if (below && !below.faceUp) {
      rest[rest.length - 1] = { ...below, faceUp: true }
      score += POINTS_REVEAL
    }
    tableau[selection.column] = rest
  }

  // 2. Karten am Ziel ablegen
  if (target.zone === 'foundation') {
    foundations[target.pile].push({ ...cards[0], faceUp: true })
    score += POINTS_TO_FOUNDATION
  } else {
    tableau[target.column] = [
      ...tableau[target.column],
      ...cards.map((c) => ({ ...c, faceUp: true })),
    ]
  }

  return {
    state: {
      ...state,
      waste,
      foundations,
      tableau,
      score: Math.max(0, score),
      moves: state.moves + 1,
      selected: null,
      won: foundations.every((pile) => pile.length === KING),
      history,
    },
    outcome: 'moved',
  }
}

/**
 * Eine Karte vom Ziehstapel aufdecken. Ist er leer, wandert der Ablagestapel
 * in ursprünglicher Reihenfolge zurück — unbegrenzt oft (docs/01-gamedesign.md).
 */
export function drawFromStock(state: GameState): MoveResult {
  if (state.won) return { state, outcome: 'blocked' }
  const history = remember(state)

  if (state.stock.length === 0) {
    if (state.waste.length === 0) return { state, outcome: 'blocked' }
    return {
      state: {
        ...state,
        // Umdrehen: Die zuerst gezogene Karte kommt auch als Erste wieder.
        stock: [...state.waste].reverse().map((c) => ({ ...c, faceUp: false })),
        waste: [],
        selected: null,
        moves: state.moves + 1,
        redeals: state.redeals + 1,
        history,
      },
      outcome: 'redeal',
    }
  }

  const card = state.stock[state.stock.length - 1]
  return {
    state: {
      ...state,
      stock: state.stock.slice(0, -1),
      waste: [...state.waste, { ...card, faceUp: true }],
      selected: null,
      moves: state.moves + 1,
      history,
    },
    outcome: 'drawn',
  }
}

/** Nimmt den letzten Zug zurück — Punkte inklusive. */
export function undo(state: GameState): GameState {
  if (state.history.length === 0) return state
  const previous = state.history[state.history.length - 1]
  return {
    ...state,
    ...previous,
    selected: null,
    undos: state.undos + 1,
    history: state.history.slice(0, -1),
  }
}

export type Hint =
  | { kind: 'move'; from: Selection; to: Target }
  /** Kein Zug auf dem Tisch — es hilft nur eine neue Karte */
  | { kind: 'draw' }

/**
 * Sucht einen sinnvollen Zug.
 *
 * Reihenfolge: erst auf einen Ablagestapel, dann ein Spaltenzug, der eine
 * verdeckte Karte aufdeckt oder eine Spalte leert, dann vom Talon in eine
 * Spalte, zuletzt ziehen.
 *
 * Ein Zug, der nichts aufdeckt, wird bewusst nicht vorgeschlagen: Karten
 * zwischen zwei Spalten hin und her zu schieben bringt den Spieler nicht weiter.
 */
export function findMove(state: GameState): Hint | null {
  if (state.won) return null

  const toFoundation = (from: Selection): Hint | null => {
    const cards = movingCards(state, from)
    if (!cards || cards.length !== 1) return null
    const target: Target = { zone: 'foundation', pile: foundationFor(cards[0]) }
    return canDrop(state, from, target) ? { kind: 'move', from, to: target } : null
  }

  for (let column = 0; column < COLUMNS; column++) {
    const pile = state.tableau[column]
    if (pile.length === 0) continue
    const hit = toFoundation({ zone: 'tableau', column, index: pile.length - 1 })
    if (hit) return hit
  }
  const fromWaste = toFoundation({ zone: 'waste' })
  if (fromWaste) return fromWaste

  for (let column = 0; column < COLUMNS; column++) {
    const pile = state.tableau[column]
    for (let index = 0; index < pile.length; index++) {
      if (!pile[index].faceUp) continue
      const from: Selection = { zone: 'tableau', column, index }
      if (!canPickUp(state, from)) continue

      for (let target = 0; target < COLUMNS; target++) {
        const to: Target = { zone: 'tableau', column: target }
        if (!canDrop(state, from, to)) continue
        const revealsCard = index > 0 && !pile[index - 1].faceUp
        // Eine Spalte zu leeren lohnt nur, wenn das Ziel nicht selbst leer ist —
        // sonst wandert ein König bloß von einer Lücke in die nächste.
        const emptiesColumn = index === 0 && state.tableau[target].length > 0
        if (revealsCard || emptiesColumn) return { kind: 'move', from, to }
      }
    }
  }

  if (state.waste.length > 0) {
    const from: Selection = { zone: 'waste' }
    for (let column = 0; column < COLUMNS; column++) {
      const to: Target = { zone: 'tableau', column }
      if (canDrop(state, from, to)) return { kind: 'move', from, to }
    }
  }

  if (state.stock.length > 0 || state.waste.length > 1) return { kind: 'draw' }
  return null
}

export function useHint(state: GameState): { state: GameState; hint: Hint | null } {
  if (state.hints === 0) return { state, hint: null }
  const hint = findMove(state)
  if (!hint) return { state, hint: null }
  return { state: { ...state, hints: state.hints - 1 }, hint }
}

/** Wie viele der 52 Karten schon abgelegt sind. */
export function placedCards(state: GameState): number {
  return state.foundations.reduce((sum, pile) => sum + pile.length, 0)
}

/** Sterne nach Zeit (docs/01-gamedesign.md). Wer aufgibt, bekommt keinen. */
export function starsFor(elapsedMs: number, won: boolean): 0 | 1 | 2 | 3 {
  if (!won) return 0
  if (elapsedMs <= 5 * 60_000) return 3
  if (elapsedMs <= 10 * 60_000) return 2
  return 1
}

/** Punkte am Rundenende: erspielter Stand, bei Sieg plus Bonus und Tempo. */
export function finalScore(state: GameState, elapsedMs: number): number {
  if (!state.won) return state.score
  const seconds = Math.floor(elapsedMs / 1000)
  return state.score + WIN_BONUS + Math.max(0, TIME_BONUS_SECONDS - seconds)
}
