import { buildLayout, SYMBOLS, type Position } from './layout'

/**
 * Spiellogik für Tempelpaare (docs/01-gamedesign.md).
 *
 * Frei von React, ohne Uhr, mit Seed — dieselbe Startzahl ergibt dasselbe
 * Rätsel (siehe CLAUDE.md).
 */

export interface Tile extends Position {
  id: number
  symbol: string
  removed: boolean
}

export interface GameState {
  tiles: readonly Tile[]
  /** Angetippter, noch nicht bestätigter Stein */
  selected: number | null
  score: number
  /** Wie viele Paare bereits weg sind */
  matched: number
  /** Verbleibende Hinweise */
  hints: number
  /** Verbleibende Mischvorgänge */
  shuffles: number
  seed: number
  startedAt: number
  won: boolean
  /** Kein Zug mehr möglich und kein Mischen mehr übrig */
  stuck: boolean
  /**
   * Die Zugfolge, mit der das Rätsel gebaut wurde — sie führt garantiert zum
   * Ziel. Der Hinweis greift zuerst hierauf zurück: Ein beliebiges Paar zu
   * nennen kann in eine Sackgasse führen, und ein Hinweis, der ins Aus führt,
   * wäre keine Hilfe.
   */
  solution: readonly (readonly [number, number])[]
}

export const START_HINTS = 3
export const START_SHUFFLES = 2
/** Zeitvorgabe aus dem Mockup: „Schaffe es unter 3 Minuten". */
export const TIME_LIMIT_MS = 3 * 60 * 1000

const POINTS_PER_PAIR = 100

/** Deterministischer Zufall (Mulberry32). */
function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

/**
 * Ein Stein ist frei, wenn nichts auf ihm liegt und mindestens eine
 * Seite offen ist — die klassische Mahjong-Regel.
 */
export function isFree(tiles: readonly Tile[], tile: Tile): boolean {
  if (tile.removed) return false

  const blocking = (l: number, r: number, c: number) =>
    tiles.some((t) => !t.removed && t.layer === l && t.row === r && t.col === c)

  if (blocking(tile.layer + 1, tile.row, tile.col)) return false
  const left = blocking(tile.layer, tile.row, tile.col - 1)
  const right = blocking(tile.layer, tile.row, tile.col + 1)
  return !left || !right
}

export function freeTiles(tiles: readonly Tile[]): Tile[] {
  return tiles.filter((t) => isFree(tiles, t))
}

/** Gibt es noch ein Paar unter den freien Steinen? */
export function findPair(tiles: readonly Tile[]): [number, number] | null {
  const free = freeTiles(tiles)
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (free[i].symbol === free[j].symbol) return [free[i].id, free[j].id]
    }
  }
  return null
}

/**
 * Belegt die übergebenen Plätze mit Symbolpaaren und liefert die Zugfolge,
 * die dabei entstand. Gemeinsame Grundlage von `createGame` und `shuffle` —
 * beide brauchen dieselbe Garantie.
 *
 * Gibt `null` zurück, wenn der Aufbau in eine Lage gerät, in der weniger als
 * zwei Steine frei liegen.
 */
function assignPairs(
  slots: readonly Tile[],
  symbolPool: readonly string[],
  seed: number,
): { symbols: Map<number, string>; solution: [number, number][]; seed: number } | null {
  const working = slots.map((t) => ({ ...t, removed: false }))
  const symbols = new Map<number, string>()
  const solution: [number, number][] = []
  let s = seed
  let symbolIndex = 0

  while (working.some((t) => !t.removed)) {
    const free = freeTiles(working)
    // Beide Steine eines Zuges müssen **gleichzeitig** frei liegen: Beim Spielen
    // wird der erste erst entfernt, nachdem der zweite angetippt wurde.
    // Den zweiten aus der Lage nach Entfernen des ersten zu wählen, ergäbe
    // Züge, die im Spiel gar nicht erlaubt sind.
    if (free.length < 2) return null

    const r1 = nextRandom(s)
    s = r1.seed
    const firstIndex = Math.floor(r1.value * free.length)
    const first = free[firstIndex]

    const others = free.filter((_, i) => i !== firstIndex)
    const r2 = nextRandom(s)
    s = r2.seed
    const second = others[Math.floor(r2.value * others.length)]

    first.removed = true
    second.removed = true

    const symbol = symbolPool[symbolIndex++ % symbolPool.length]
    symbols.set(first.id, symbol)
    symbols.set(second.id, symbol)
    solution.push([first.id, second.id])
  }

  // Die Reihenfolge bleibt, wie sie entstanden ist: Es wurde von oben nach
  // unten abgeräumt, genau so wird auch gespielt.
  return { symbols, solution, seed: s }
}

/**
 * Versucht die Zuweisung mehrfach. Sie kann scheitern, wenn zuletzt zwei
 * Steine übereinander liegen und damit nur einer frei ist — dann wird mit
 * verändertem Zufall neu angesetzt statt ein unspielbares Rätsel abzuliefern.
 */
function assignPairsWithRetry(
  slots: readonly Tile[],
  symbolPool: readonly string[],
  seed: number,
): { symbols: Map<number, string>; solution: [number, number][]; seed: number } {
  let s = seed
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = assignPairs(slots, symbolPool, s)
    if (result) return result
    s = nextRandom(s).seed
  }
  // Nach 50 Versuchen ohne Erfolg: Reihenfolge der Plätze als Notlösung.
  // Bei den hier verwendeten Aufbauten tritt das nicht ein.
  const symbols = new Map<number, string>()
  const solution: [number, number][] = []
  for (let i = 0; i + 1 < slots.length; i += 2) {
    const symbol = symbolPool[(i / 2) % symbolPool.length]
    symbols.set(slots[i].id, symbol)
    symbols.set(slots[i + 1].id, symbol)
    solution.push([slots[i].id, slots[i + 1].id])
  }
  return { symbols, solution, seed: s }
}

/**
 * Erzeugt ein Rätsel, das **sicher lösbar ist**.
 *
 * Rückwärts gebaut: Es werden wiederholt zwei gerade freie Plätze gewählt,
 * mit demselben Symbol belegt und als abgeräumt vermerkt. Wer die Züge in
 * umgekehrter Reihenfolge spielt, räumt den Tempel leer.
 *
 * Symbole einfach zufällig zu verteilen wäre viel kürzer — dabei entstehen
 * aber regelmäßig Rätsel, in denen die letzten Steine einander gegenseitig
 * blockieren und die Runde unverschuldet verloren ist.
 */
export function createGame(seed: number, startedAt: number): GameState {
  const positions = buildLayout()
  const slots: Tile[] = positions.map((pos, id) => ({
    ...pos,
    id,
    symbol: '',
    removed: false,
  }))

  const pool = SYMBOLS.slice(0, slots.length / 2)
  const { symbols, solution, seed: nextSeed } = assignPairsWithRetry(slots, pool, seed)
  const tiles = slots.map((t) => ({ ...t, symbol: symbols.get(t.id) ?? SYMBOLS[0] }))

  return {
    tiles,
    selected: null,
    score: 0,
    matched: 0,
    hints: START_HINTS,
    shuffles: START_SHUFFLES,
    seed: nextSeed,
    startedAt,
    won: false,
    stuck: false,
    solution,
  }
}

export interface TapResult {
  state: GameState
  /** Was der Zug bewirkt hat — für Rückmeldung an den Spieler */
  outcome: 'selected' | 'deselected' | 'matched' | 'mismatch' | 'blocked'
}

/** Ein Stein wurde angetippt. */
export function tapTile(state: GameState, id: number): TapResult {
  if (state.won || state.stuck) return { state, outcome: 'blocked' }

  const tile = state.tiles.find((t) => t.id === id)
  if (!tile || tile.removed || !isFree(state.tiles, tile)) {
    return { state, outcome: 'blocked' }
  }

  if (state.selected === id) {
    return { state: { ...state, selected: null }, outcome: 'deselected' }
  }

  if (state.selected === null) {
    return { state: { ...state, selected: id }, outcome: 'selected' }
  }

  const first = state.tiles.find((t) => t.id === state.selected)
  if (!first || first.symbol !== tile.symbol) {
    // Auswahl auf den neuen Stein umlegen statt sie ganz aufzuheben —
    // sonst muss nach jedem Fehlgriff zweimal getippt werden.
    return { state: { ...state, selected: id }, outcome: 'mismatch' }
  }

  const tiles = state.tiles.map((t) =>
    t.id === id || t.id === first.id ? { ...t, removed: true } : t,
  )
  const matched = state.matched + 1
  const won = tiles.every((t) => t.removed)

  return {
    state: {
      ...state,
      tiles,
      selected: null,
      matched,
      score: state.score + POINTS_PER_PAIR,
      won,
      stuck: !won && findPair(tiles) === null && state.shuffles === 0,
      // Erledigte Züge aus dem Plan streichen — egal, in welcher Reihenfolge
      // der Spieler sie gemacht hat.
      solution: state.solution.filter(([a, b]) => a !== id && b !== id && a !== first.id && b !== first.id),
    },
    outcome: 'matched',
  }
}

/**
 * Verrät ein Paar, sofern noch Hinweise übrig sind.
 *
 * Bevorzugt wird ein Zug aus dem Lösungsplan, dessen beide Steine gerade frei
 * liegen. Erst wenn dort keiner passt — etwa weil der Spieler die Reihenfolge
 * durcheinandergebracht hat — wird irgendein spielbares Paar genannt.
 */
export function useHint(state: GameState): { state: GameState; pair: [number, number] | null } {
  if (state.hints === 0) return { state, pair: null }

  const playable = (a: number, b: number) => {
    const ta = state.tiles.find((t) => t.id === a)
    const tb = state.tiles.find((t) => t.id === b)
    return Boolean(ta && tb && isFree(state.tiles, ta) && isFree(state.tiles, tb))
  }

  const planned = state.solution.find(([a, b]) => playable(a, b))
  const pair: [number, number] | null = planned ? [planned[0], planned[1]] : findPair(state.tiles)
  if (!pair) return { state, pair: null }

  return { state: { ...state, hints: state.hints - 1 }, pair }
}

/**
 * Verteilt die Symbole der übrigen Steine neu — und zwar wieder so, dass
 * das Rätsel lösbar bleibt. Ein bloßes Durchmischen könnte eine Lage
 * erzeugen, aus der es keinen Ausweg gibt.
 */
export function shuffle(state: GameState): GameState {
  if (state.shuffles === 0) return state

  const remaining = state.tiles.filter((t) => !t.removed)

  // Die noch vorhandenen Symbole paarweise einsammeln — es wird nur neu
  // verteilt, nicht ausgetauscht.
  const pool: string[] = []
  const counts = new Map<string, number>()
  for (const tile of remaining) counts.set(tile.symbol, (counts.get(tile.symbol) ?? 0) + 1)
  for (const [symbol, count] of counts) {
    for (let i = 0; i < Math.floor(count / 2); i++) pool.push(symbol)
  }

  const { symbols, solution, seed } = assignPairsWithRetry(remaining, pool, state.seed)
  const tiles = state.tiles.map((t) => (symbols.has(t.id) ? { ...t, symbol: symbols.get(t.id)! } : t))

  return {
    ...state,
    tiles,
    selected: null,
    seed,
    shuffles: state.shuffles - 1,
    stuck: false,
    solution,
  }
}

/**
 * Sterne nach verbrauchter Zeit. Drei Sterne unter zwei Minuten —
 * das Mockup zeigt „02:10" bei drei Sternen.
 */
export function starsFor(elapsedMs: number, won: boolean): 0 | 1 | 2 | 3 {
  if (!won) return 0
  if (elapsedMs <= 120_000) return 3
  if (elapsedMs <= 150_000) return 2
  return 1
}

/** Punkte am Rundenende: Grundwert plus Zeitbonus. */
export function finalScore(state: GameState, elapsedMs: number): number {
  if (!state.won) return state.score
  const secondsLeft = Math.max(0, Math.floor((TIME_LIMIT_MS - elapsedMs) / 1000))
  return state.score + secondsLeft * 10
}
