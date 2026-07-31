import { describe, expect, it } from 'vitest'
import { createDeck, KING, shuffleDeck, SUITS, type Card, type Suit } from './cards'
import {
  canDrop,
  COLUMNS,
  createGame,
  drawFromStock,
  finalScore,
  findMove,
  isRun,
  moveTo,
  movingCards,
  placedCards,
  POINTS_FOUNDATION_BACK,
  POINTS_REVEAL,
  POINTS_TO_FOUNDATION,
  POINTS_WASTE_TO_TABLEAU,
  select,
  starsFor,
  undo,
  useHint,
  type GameState,
} from './game'

/** Einzelne Karte bauen — die ID entspricht der aus `createDeck`. */
function card(suit: Suit, rank: number, faceUp = true): Card {
  return { id: SUITS.indexOf(suit) * KING + (rank - 1), suit, rank, faceUp }
}

/** Leerer Tisch, auf den ein Test genau die Karten legt, die er prüfen will. */
function stateWith(patch: Partial<GameState>): GameState {
  return {
    ...createGame(1, 0),
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    ...patch,
  }
}

/** Karte auswählen und ablegen — der Weg, den auch die Oberfläche geht. */
function play(state: GameState, from: Parameters<typeof select>[1], to: Parameters<typeof moveTo>[1]) {
  return moveTo(select(state, from).state, to)
}

describe('Kartenblatt', () => {
  it('hat 52 verschiedene Karten', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map((c) => `${c.suit}-${c.rank}`)).size).toBe(52)
    expect(new Set(deck.map((c) => c.id)).size).toBe(52)
  })

  it('hat je Farbe 13 Werte von Ass bis König', () => {
    const deck = createDeck()
    for (const suit of SUITS) {
      const ranks = deck.filter((c) => c.suit === suit).map((c) => c.rank)
      expect(ranks.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    }
  })

  it('verliert beim Mischen keine Karte', () => {
    const { cards } = shuffleDeck(createDeck(), 99)
    expect(new Set(cards.map((c) => c.id)).size).toBe(52)
  })
})

describe('Austeilen', () => {
  it('legt sieben Spalten mit 1 bis 7 Karten', () => {
    const game = createGame(42, 0)
    expect(game.tableau).toHaveLength(COLUMNS)
    game.tableau.forEach((column, i) => expect(column).toHaveLength(i + 1))
  })

  it('deckt in jeder Spalte genau die oberste Karte auf', () => {
    const game = createGame(42, 0)
    for (const column of game.tableau) {
      expect(column.filter((c) => c.faceUp)).toHaveLength(1)
      expect(column[column.length - 1].faceUp).toBe(true)
    }
  })

  it('legt die restlichen 24 Karten verdeckt auf den Ziehstapel', () => {
    const game = createGame(42, 0)
    expect(game.stock).toHaveLength(24)
    expect(game.stock.every((c) => !c.faceUp)).toBe(true)
    expect(game.waste).toHaveLength(0)
    expect(game.foundations.flat()).toHaveLength(0)
  })

  it('bringt jede der 52 Karten genau einmal ins Spiel', () => {
    const game = createGame(42, 0)
    const ids = [...game.tableau.flat(), ...game.stock].map((c) => c.id)
    expect(ids).toHaveLength(52)
    expect(new Set(ids).size).toBe(52)
  })

  it('gibt bei gleichem Seed dieselbe Partie', () => {
    const a = createGame(7, 0)
    const b = createGame(7, 0)
    expect(a.tableau.map((col) => col.map((c) => c.id))).toEqual(
      b.tableau.map((col) => col.map((c) => c.id)),
    )
    expect(a.stock.map((c) => c.id)).toEqual(b.stock.map((c) => c.id))
  })

  it('gibt bei anderem Seed eine andere Partie', () => {
    const a = createGame(7, 0)
    const b = createGame(8, 0)
    expect(a.stock.map((c) => c.id)).not.toEqual(b.stock.map((c) => c.id))
  })
})

describe('Züge in den Spalten', () => {
  it('erlaubt absteigend mit wechselnder Farbe', () => {
    const state = stateWith({
      tableau: [[card('spades', 8)], [card('hearts', 7)], [], [], [], [], []],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'tableau', column: 0 })

    expect(out.outcome).toBe('moved')
    expect(out.state.tableau[0].map((c) => c.rank)).toEqual([8, 7])
    expect(out.state.tableau[1]).toHaveLength(0)
  })

  it('verbietet gleiche Kartenfarbe', () => {
    const state = stateWith({
      tableau: [[card('diamonds', 8)], [card('hearts', 7)], [], [], [], [], []],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'tableau', column: 0 })
    expect(out.outcome).toBe('blocked')
    expect(out.state.tableau[1]).toHaveLength(1)
  })

  it('verbietet die falsche Reihenfolge', () => {
    const state = stateWith({
      tableau: [[card('spades', 6)], [card('hearts', 7)], [], [], [], [], []],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'tableau', column: 0 })
    expect(out.outcome).toBe('blocked')
  })

  it('lässt nur einen König auf eine leere Spalte', () => {
    const state = stateWith({
      tableau: [[], [card('hearts', KING)], [card('hearts', 5)], [], [], [], []],
    })
    expect(canDrop(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'tableau', column: 0 })).toBe(
      true,
    )
    expect(canDrop(state, { zone: 'tableau', column: 2, index: 0 }, { zone: 'tableau', column: 0 })).toBe(
      false,
    )
  })

  it('deckt die darunterliegende Karte auf und zählt Punkte', () => {
    const state = stateWith({
      tableau: [[card('spades', 8)], [card('clubs', 4, false), card('hearts', 7)], [], [], [], [], []],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 1 }, { zone: 'tableau', column: 0 })

    expect(out.state.tableau[1]).toHaveLength(1)
    expect(out.state.tableau[1][0].faceUp).toBe(true)
    expect(out.state.score).toBe(POINTS_REVEAL)
  })

  it('lässt eine Karte nicht in ihrer eigenen Spalte ab', () => {
    const state = stateWith({
      tableau: [[card('spades', 8), card('hearts', 7)], [], [], [], [], [], []],
    })
    expect(
      canDrop(state, { zone: 'tableau', column: 0, index: 1 }, { zone: 'tableau', column: 0 }),
    ).toBe(false)
  })
})

describe('Folgen bewegen', () => {
  it('erkennt eine gültige Folge', () => {
    expect(isRun([card('hearts', 7), card('spades', 6), card('diamonds', 5)])).toBe(true)
  })

  it('erkennt gleiche Kartenfarbe als ungültig', () => {
    expect(isRun([card('hearts', 7), card('diamonds', 6)])).toBe(false)
  })

  it('erkennt eine Lücke im Wert als ungültig', () => {
    expect(isRun([card('hearts', 7), card('spades', 5)])).toBe(false)
  })

  it('nimmt eine verdeckte Karte nicht mit', () => {
    const state = stateWith({
      tableau: [[card('hearts', 7, false), card('spades', 6)], [], [], [], [], [], []],
    })
    expect(movingCards(state, { zone: 'tableau', column: 0, index: 0 })).toBeNull()
  })

  it('verschiebt drei Karten am Stück', () => {
    const state = stateWith({
      tableau: [
        [card('clubs', 8)],
        [card('hearts', 7), card('spades', 6), card('diamonds', 5)],
        [],
        [],
        [],
        [],
        [],
      ],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'tableau', column: 0 })

    expect(out.outcome).toBe('moved')
    expect(out.state.tableau[0].map((c) => c.rank)).toEqual([8, 7, 6, 5])
    expect(out.state.tableau[1]).toHaveLength(0)
  })

  it('verschiebt auch nur den oberen Teil einer Folge', () => {
    const state = stateWith({
      tableau: [
        [card('hearts', 7)],
        [card('hearts', 9), card('spades', 8), card('diamonds', 7), card('clubs', 6)],
        [],
        [],
        [],
        [],
        [],
      ],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 3 }, { zone: 'tableau', column: 0 })

    expect(out.state.tableau[0].map((c) => c.rank)).toEqual([7, 6])
    expect(out.state.tableau[1].map((c) => c.rank)).toEqual([9, 8, 7])
  })

  it('lehnt eine unterbrochene Folge ab', () => {
    const state = stateWith({
      tableau: [[card('clubs', 8)], [card('hearts', 7), card('hearts', 6)], [], [], [], [], []],
    })
    const out = play(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'tableau', column: 0 })
    expect(out.outcome).toBe('blocked')
  })
})

describe('Ablagestapel', () => {
  it('nimmt zuerst nur ein Ass', () => {
    const state = stateWith({
      tableau: [[card('hearts', 1)], [card('hearts', 2)], [], [], [], [], []],
    })
    expect(canDrop(state, { zone: 'tableau', column: 0, index: 0 }, { zone: 'foundation', pile: 0 })).toBe(
      true,
    )
    expect(canDrop(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'foundation', pile: 0 })).toBe(
      false,
    )
  })

  it('nimmt danach nur den nächsthöheren Wert derselben Farbe', () => {
    const state = stateWith({
      foundations: [[card('hearts', 1)], [], [], []],
      tableau: [[card('hearts', 2)], [card('hearts', 3)], [card('spades', 2)], [], [], [], []],
    })
    expect(canDrop(state, { zone: 'tableau', column: 0, index: 0 }, { zone: 'foundation', pile: 0 })).toBe(
      true,
    )
    expect(canDrop(state, { zone: 'tableau', column: 1, index: 0 }, { zone: 'foundation', pile: 0 })).toBe(
      false,
    )
    expect(canDrop(state, { zone: 'tableau', column: 2, index: 0 }, { zone: 'foundation', pile: 0 })).toBe(
      false,
    )
  })

  it('nimmt keine Folge, sondern nur einzelne Karten', () => {
    const state = stateWith({
      tableau: [[card('hearts', 2), card('spades', 1)], [], [], [], [], [], []],
    })
    expect(canDrop(state, { zone: 'tableau', column: 0, index: 0 }, { zone: 'foundation', pile: 2 })).toBe(
      false,
    )
  })

  it('zählt beim Ablegen Punkte', () => {
    const state = stateWith({ tableau: [[card('hearts', 1)], [], [], [], [], [], []] })
    const out = play(state, { zone: 'tableau', column: 0, index: 0 }, { zone: 'foundation', pile: 0 })
    expect(out.state.score).toBe(POINTS_TO_FOUNDATION)
    expect(placedCards(out.state)).toBe(1)
  })

  it('lässt eine Karte zurück in eine Spalte und zieht dafür Punkte ab', () => {
    const state = stateWith({
      score: 100,
      foundations: [[card('hearts', 1)], [], [], []],
      tableau: [[card('spades', 2)], [], [], [], [], [], []],
    })
    const out = play(state, { zone: 'foundation', pile: 0 }, { zone: 'tableau', column: 0 })

    expect(out.outcome).toBe('moved')
    expect(out.state.foundations[0]).toHaveLength(0)
    expect(out.state.score).toBe(100 + POINTS_FOUNDATION_BACK)
  })

  it('lässt die Punkte nicht ins Minus rutschen', () => {
    const state = stateWith({
      score: 0,
      foundations: [[card('hearts', 1)], [], [], []],
      tableau: [[card('spades', 2)], [], [], [], [], [], []],
    })
    const out = play(state, { zone: 'foundation', pile: 0 }, { zone: 'tableau', column: 0 })
    expect(out.state.score).toBe(0)
  })

  it('meldet gewonnen, wenn alle 52 Karten abgelegt sind', () => {
    const foundations = SUITS.map((suit) =>
      Array.from({ length: 12 }, (_, i) => card(suit, i + 1)),
    )
    let state = stateWith({
      foundations,
      tableau: [
        [card('hearts', KING)],
        [card('diamonds', KING)],
        [card('spades', KING)],
        [card('clubs', KING)],
        [],
        [],
        [],
      ],
    })

    for (let pile = 0; pile < 4; pile++) {
      expect(state.won).toBe(false)
      state = play(state, { zone: 'tableau', column: pile, index: 0 }, { zone: 'foundation', pile })
        .state
    }

    expect(state.won).toBe(true)
    expect(placedCards(state)).toBe(52)
  })
})

describe('Talon', () => {
  it('deckt eine Karte nach der anderen auf', () => {
    let state = stateWith({
      stock: [card('hearts', 1, false), card('spades', 2, false), card('clubs', 3, false)],
    })

    state = drawFromStock(state).state
    expect(state.waste.map((c) => c.rank)).toEqual([3])
    expect(state.waste[0].faceUp).toBe(true)
    expect(state.stock).toHaveLength(2)

    state = drawFromStock(state).state
    state = drawFromStock(state).state
    expect(state.waste.map((c) => c.rank)).toEqual([3, 2, 1])
    expect(state.stock).toHaveLength(0)
  })

  it('legt den Ablagestapel in ursprünglicher Reihenfolge zurück', () => {
    let state = stateWith({
      stock: [card('hearts', 1, false), card('spades', 2, false), card('clubs', 3, false)],
    })
    for (let i = 0; i < 3; i++) state = drawFromStock(state).state

    const out = drawFromStock(state)
    expect(out.outcome).toBe('redeal')
    expect(out.state.redeals).toBe(1)
    expect(out.state.waste).toHaveLength(0)
    expect(out.state.stock.every((c) => !c.faceUp)).toBe(true)

    // Nach dem Umdrehen kommt wieder dieselbe Karte zuerst
    expect(drawFromStock(out.state).state.waste.map((c) => c.rank)).toEqual([3])
  })

  it('macht nichts, wenn Ziehstapel und Ablage leer sind', () => {
    const state = stateWith({})
    expect(drawFromStock(state).outcome).toBe('blocked')
  })

  it('gibt Punkte, wenn eine Talonkarte in eine Spalte wandert', () => {
    const state = stateWith({
      waste: [card('hearts', 7)],
      tableau: [[card('spades', 8)], [], [], [], [], [], []],
    })
    const out = play(state, { zone: 'waste' }, { zone: 'tableau', column: 0 })

    expect(out.outcome).toBe('moved')
    expect(out.state.waste).toHaveLength(0)
    expect(out.state.score).toBe(POINTS_WASTE_TO_TABLEAU)
  })
})

describe('Auswahl', () => {
  it('wählt beim ersten Antippen aus und beim zweiten wieder ab', () => {
    const state = stateWith({ tableau: [[card('hearts', 7)], [], [], [], [], [], []] })
    const picked = select(state, { zone: 'tableau', column: 0, index: 0 })
    expect(picked.outcome).toBe('selected')

    const dropped = select(picked.state, { zone: 'tableau', column: 0, index: 0 })
    expect(dropped.outcome).toBe('deselected')
    expect(dropped.state.selected).toBeNull()
  })

  it('weist eine leere Spalte als Griff ab', () => {
    const state = stateWith({})
    expect(select(state, { zone: 'tableau', column: 3, index: 0 }).outcome).toBe('blocked')
  })
})

describe('Rückgängig', () => {
  it('stellt den vorigen Zustand vollständig wieder her', () => {
    const before = stateWith({
      tableau: [[card('spades', 8)], [card('clubs', 4, false), card('hearts', 7)], [], [], [], [], []],
    })
    const after = play(before, { zone: 'tableau', column: 1, index: 1 }, { zone: 'tableau', column: 0 })
      .state

    const back = undo(after)
    expect(back.tableau.map((col) => col.map((c) => c.id))).toEqual(
      before.tableau.map((col) => col.map((c) => c.id)),
    )
    expect(back.tableau[1][0].faceUp).toBe(false)
    expect(back.score).toBe(before.score)
    expect(back.moves).toBe(before.moves)
    expect(back.undos).toBe(1)
  })

  it('nimmt auch das Ziehen zurück', () => {
    const state = stateWith({ stock: [card('hearts', 1, false), card('spades', 2, false)] })
    const drawn = drawFromStock(state).state
    const back = undo(drawn)
    expect(back.stock).toHaveLength(2)
    expect(back.waste).toHaveLength(0)
  })

  it('macht nichts, wenn es nichts zurückzunehmen gibt', () => {
    const state = stateWith({})
    expect(undo(state)).toBe(state)
  })

  it('geht mehrere Züge zurück', () => {
    let state = createGame(5, 0)
    const stockBefore = state.stock.length
    for (let i = 0; i < 3; i++) state = drawFromStock(state).state
    for (let i = 0; i < 3; i++) state = undo(state)

    expect(state.stock).toHaveLength(stockBefore)
    expect(state.moves).toBe(0)
    expect(state.undos).toBe(3)
  })
})

describe('Hinweis', () => {
  it('nennt einen Zug, der wirklich erlaubt ist', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const game = createGame(seed, 0)
      const { state, hint } = useHint(game)

      expect(hint, `Seed ${seed}: kein Hinweis`).not.toBeNull()
      expect(state.hints).toBe(game.hints - 1)
      if (hint!.kind === 'move') {
        expect(canDrop(game, hint!.from, hint!.to), `Seed ${seed}: Hinweis ist kein gültiger Zug`).toBe(
          true,
        )
      }
    }
  })

  it('schickt ein Ass auf den Ablagestapel, sobald es frei liegt', () => {
    const state = stateWith({
      tableau: [[card('hearts', 9)], [card('spades', 1)], [], [], [], [], []],
    })
    expect(findMove(state)).toEqual({
      kind: 'move',
      from: { zone: 'tableau', column: 1, index: 0 },
      to: { zone: 'foundation', pile: 2 },
    })
  })

  // ♥7 dürfte auf ♣8 — darunter liegt aber schon eine offene Karte, und die
  // Spalte wird auch nicht leer. Der Zug bringt also nichts.
  const ohneNutzen: Partial<GameState> = {
    tableau: [
      [card('clubs', 8)],
      [card('spades', 10), card('hearts', 9), card('spades', 8), card('hearts', 7)],
      [],
      [],
      [],
      [],
      [],
    ],
  }

  it('empfiehlt keinen Zug, der nichts aufdeckt', () => {
    const state = stateWith(ohneNutzen)
    expect(canDrop(state, { zone: 'tableau', column: 1, index: 3 }, { zone: 'tableau', column: 0 })).toBe(
      true,
    )
    expect(findMove(state)).toBeNull()
  })

  it('empfiehlt einen Zug, der eine Spalte leert', () => {
    const state = stateWith({
      tableau: [[card('clubs', 8)], [card('hearts', 7)], [], [], [], [], []],
    })
    expect(findMove(state)).toEqual({
      kind: 'move',
      from: { zone: 'tableau', column: 1, index: 0 },
      to: { zone: 'tableau', column: 0 },
    })
  })

  it('rät zum Ziehen, wenn auf dem Tisch nichts geht', () => {
    const state = stateWith({ ...ohneNutzen, stock: [card('clubs', 9, false)] })
    expect(findMove(state)).toEqual({ kind: 'draw' })
  })

  it('verbraucht keinen Hinweis mehr, wenn keiner übrig ist', () => {
    let game = createGame(8, 0)
    for (let i = 0; i < 3; i++) game = useHint(game).state
    expect(game.hints).toBe(0)

    const out = useHint(game)
    expect(out.hint).toBeNull()
    expect(out.state.hints).toBe(0)
  })
})

describe('Wertung', () => {
  it('vergibt drei Sterne nur bei einem schnellen Sieg', () => {
    expect(starsFor(4 * 60_000, true)).toBe(3)
    expect(starsFor(8 * 60_000, true)).toBe(2)
    expect(starsFor(20 * 60_000, true)).toBe(1)
  })

  it('vergibt beim Aufgeben keine Sterne', () => {
    expect(starsFor(60_000, false)).toBe(0)
  })

  it('gibt Siegbonus und Zeitbonus nur bei Sieg', () => {
    const base = stateWith({ score: 600 })
    const won: GameState = { ...base, won: true }

    expect(finalScore(base, 60_000)).toBe(600)
    expect(finalScore(won, 60_000)).toBe(600 + 500 + (900 - 60))
    // Nach 15 Minuten bleibt nur der Siegbonus
    expect(finalScore(won, 20 * 60_000)).toBe(600 + 500)
  })
})
