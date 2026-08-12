import {
  ACE,
  alternates,
  createDeck,
  KING,
  shuffleDeck,
  SUITS,
  type Card,
} from './cards'
import { levelAt, type Level } from './levels'

/**
 * Spiellogik für Fynnox Solitaire — Klondike (docs/01-gamedesign.md, Abschnitt 5).
 *
 * Frei von React, ohne Uhr, mit Seed. Die verstrichene Zeit wird von außen
 * hereingegeben, wie bei Tempelpaare und Sudoku.
 *
 * In jedem Stapel ist das **letzte** Element die oberste, sichtbare Karte.
 */

export const COLUMNS = 7

/** Punkte je Aktion (docs/01-gamedesign.md). */
export const POINTS_TO_FOUNDATION = 10
export const POINTS_REVEAL = 5
export const POINTS_WASTE_TO_TABLEAU = 5
export const POINTS_FOUNDATION_BACK = -15
/** Siegbonus: Grundwert plus Zuschlag je Level — schwerere Level zahlen mehr. */
export const WIN_BONUS_BASE = 300
export const WIN_BONUS_PER_LEVEL = 100
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
  /** Wie oft der Talon bereits umgedreht wurde */
  redeals: number
  won: boolean
  /** Kein regelkonformer Zug mehr möglich — die Runde ist verloren */
  stuck: boolean
}

export interface GameState extends Snapshot {
  /** Gespieltes Level, 1 bis 12 (siehe levels.ts) */
  level: number
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

export function configOf(state: GameState): Level {
  return levelAt(state.level)
}

/** Wie oft der Talon noch umgedreht werden darf. `null` heißt unbegrenzt. */
export function redealsLeft(state: GameState): number | null {
  const { redeals } = configOf(state)
  return redeals === null ? null : Math.max(0, redeals - state.redeals)
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
 *
 * In den ersten beiden Leveln liegen ein oder zwei Asse von vornherein auf den
 * Ablagestapeln. Sie werden vor dem Austeilen aus dem Blatt genommen, damit
 * keine Karte doppelt im Spiel ist.
 */
export function createGame(seed: number, startedAt: number, level = 1): GameState {
  const config = levelAt(level)
  const { cards, seed: nextSeed } = shuffleDeck(createDeck(), seed)

  const foundations: Card[][] = SUITS.map(() => [])
  const remaining: Card[] = []
  for (const card of cards) {
    if (card.rank === ACE && foundationFor(card) < config.placedAces) {
      foundations[foundationFor(card)].push({ ...card, faceUp: true })
    } else {
      remaining.push(card)
    }
  }

  const tableau: Card[][] = []
  let dealt = 0
  for (let column = 0; column < COLUMNS; column++) {
    const pile: Card[] = []
    for (let row = 0; row <= column; row++) {
      pile.push({ ...remaining[dealt++], faceUp: row === column })
    }
    tableau.push(pile)
  }

  return {
    level: config.number,
    stock: remaining.slice(dealt).map((c) => ({ ...c, faceUp: false })),
    waste: [],
    foundations,
    tableau,
    selected: null,
    score: 0,
    moves: 0,
    redeals: 0,
    hints: config.hints,
    undos: 0,
    seed: nextSeed,
    startedAt,
    won: false,
    stuck: false,
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
    stuck: state.stuck,
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
  return !finished(state) && movingCards(state, selection) !== null
}

/** Runde vorbei — gewonnen oder festgefahren. */
export function finished(state: GameState): boolean {
  return state.won || state.stuck
}

/** Darf die aufgenommene Karte (oder Folge) dort abgelegt werden? */
export function canDrop(state: GameState, selection: Selection, target: Target): boolean {
  if (finished(state)) return false
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
  if (finished(state)) return { state, outcome: 'blocked' }

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

  const next: GameState = {
    ...state,
    waste,
    foundations,
    tableau,
    score: Math.max(0, score),
    moves: state.moves + 1,
    selected: null,
    won: foundations.every((pile) => pile.length === KING),
    history,
  }
  return { state: { ...next, stuck: !next.won && !hasAnyMove(next) }, outcome: 'moved' }
}

/**
 * Karten vom Ziehstapel aufdecken — je nach Level eine oder drei. Ist er leer,
 * wandert der Ablagestapel in ursprünglicher Reihenfolge zurück, sofern das
 * Level noch einen Durchlauf erlaubt (docs/01-gamedesign.md).
 */
export function drawFromStock(state: GameState): MoveResult {
  if (finished(state)) return { state, outcome: 'blocked' }
  const config = configOf(state)
  const history = remember(state)

  if (state.stock.length === 0) {
    const left = redealsLeft(state)
    if (state.waste.length === 0 || left === 0) return { state, outcome: 'blocked' }
    const next: GameState = {
      ...state,
      // Umdrehen: Die zuerst gezogene Karte kommt auch als Erste wieder.
      stock: [...state.waste].reverse().map((c) => ({ ...c, faceUp: false })),
      waste: [],
      selected: null,
      moves: state.moves + 1,
      redeals: state.redeals + 1,
      history,
    }
    return { state: { ...next, stuck: !hasAnyMove(next) }, outcome: 'redeal' }
  }

  // Beim Dreierzug bleibt die zuletzt gezogene Karte obenauf — nur sie ist
  // spielbar, die beiden darunter kommen erst nach ihr wieder frei.
  const count = Math.min(config.draw, state.stock.length)
  const taken = state.stock.slice(state.stock.length - count)
  const next: GameState = {
    ...state,
    stock: state.stock.slice(0, state.stock.length - count),
    waste: [...state.waste, ...taken.map((c) => ({ ...c, faceUp: true }))],
    selected: null,
    moves: state.moves + 1,
    history,
  }
  return { state: { ...next, stuck: !hasAnyMove(next) }, outcome: 'drawn' }
}

/**
 * Gibt es überhaupt noch einen regelkonformen Zug?
 *
 * Der Rückweg vom Ablagestapel in eine Spalte zählt bewusst **nicht** mit: Er
 * ist fast immer möglich und würde jede Sackgasse verdecken. Alles andere zählt,
 * auch Züge, die nichts bringen — lieber einmal zu selten „Schluss" sagen als
 * eine Runde zu beenden, die noch zu gewinnen wäre.
 */
export function hasAnyMove(state: GameState): boolean {
  if (state.won) return false
  if (state.stock.length > 0) return true
  if (state.waste.length > 0 && redealsLeft(state) !== 0) return true

  const sources: Selection[] = []
  if (state.waste.length > 0) sources.push({ zone: 'waste' })
  for (let column = 0; column < COLUMNS; column++) {
    for (let index = 0; index < state.tableau[column].length; index++) {
      if (state.tableau[column][index].faceUp) sources.push({ zone: 'tableau', column, index })
    }
  }

  const open: GameState = { ...state, stuck: false }
  for (const from of sources) {
    if (movingCards(open, from) === null) continue
    for (let pile = 0; pile < SUITS.length; pile++) {
      if (canDrop(open, from, { zone: 'foundation', pile })) return true
    }
    for (let column = 0; column < COLUMNS; column++) {
      if (canDrop(open, from, { zone: 'tableau', column })) return true
    }
  }
  return false
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
  if (finished(state)) return null

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

  if (state.stock.length > 0) return { kind: 'draw' }
  // Umdrehen lohnt nur mit mehr als einer Karte und wenn das Level es hergibt —
  // sonst käme dieselbe Karte gleich wieder.
  if (state.waste.length > 1 && redealsLeft(state) !== 0) return { kind: 'draw' }
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

/**
 * Sterne nach Zeit (docs/01-gamedesign.md). Die Zielzeit steht je Level fest;
 * bis zum Doppelten gibt es zwei Sterne. Wer aufgibt oder feststeckt, bekommt keinen.
 */
export function starsFor(elapsedMs: number, won: boolean, level = 1): 0 | 1 | 2 | 3 {
  if (!won) return 0
  const { targetMs } = levelAt(level)
  if (elapsedMs <= targetMs) return 3
  if (elapsedMs <= targetMs * 2) return 2
  return 1
}

/** Punkte am Rundenende: erspielter Stand, bei Sieg plus Levelbonus und Tempo. */
export function finalScore(state: GameState, elapsedMs: number): number {
  if (!state.won) return state.score
  const seconds = Math.floor(elapsedMs / 1000)
  const winBonus = WIN_BONUS_BASE + state.level * WIN_BONUS_PER_LEVEL
  return state.score + winBonus + Math.max(0, TIME_BONUS_SECONDS - seconds)
}
