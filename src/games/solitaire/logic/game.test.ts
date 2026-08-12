import { describe, expect, it } from 'vitest'
import { createDeck, KING, shuffleDeck, SUITS, type Card, type Suit } from './cards'
import { LEVEL_COUNT, LEVELS, levelAt, unlockedLevels } from './levels'
import {
  canDrop,
  COLUMNS,
  createGame,
  drawFromStock,
  finalScore,
  findMove,
  hasAnyMove,
  isRun,
  moveTo,
  movingCards,
  placedCards,
  redealsLeft,
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
    // Level 3 ist die klassische Variante — dort liegt kein Ass vorweg
    const game = createGame(42, 0, 3)
    expect(game.stock).toHaveLength(24)
    expect(game.stock.every((c) => !c.faceUp)).toBe(true)
    expect(game.waste).toHaveLength(0)
    expect(game.foundations.flat()).toHaveLength(0)
  })

  it('bringt in jedem Level jede der 52 Karten genau einmal ins Spiel', () => {
    for (const level of [1, 2, 3, 7, 12]) {
      const game = createGame(42, 0, level)
      const ids = [...game.tableau.flat(), ...game.stock, ...game.foundations.flat()].map(
        (c) => c.id,
      )
      expect(ids, `Level ${level}`).toHaveLength(52)
      expect(new Set(ids).size, `Level ${level}: Karte doppelt`).toBe(52)
    }
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

describe('Level', () => {
  it('hat zwölf lückenlos aufsteigend nummerierte Level', () => {
    expect(LEVELS).toHaveLength(LEVEL_COUNT)
    expect(LEVEL_COUNT).toBe(12)
    LEVELS.forEach((level, i) => expect(level.number).toBe(i + 1))
  })

  it('wird von Stufe zu Stufe nie leichter', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const vorher = LEVELS[i - 1]
      const jetzt = LEVELS[i]
      expect(jetzt.hints, `Level ${jetzt.number}: mehr Hinweise als davor`).toBeLessThanOrEqual(
        vorher.hints,
      )
      expect(jetzt.placedAces).toBeLessThanOrEqual(vorher.placedAces)
      expect(jetzt.draw).toBeGreaterThanOrEqual(vorher.draw)
    }
  })

  it('klemmt Level außerhalb des Bereichs auf gültige Werte', () => {
    expect(levelAt(0).number).toBe(1)
    expect(levelAt(-5).number).toBe(1)
    expect(levelAt(99).number).toBe(LEVEL_COUNT)
  })

  it('schaltet immer genau ein Level über dem höchsten gewonnenen frei', () => {
    expect(unlockedLevels(0)).toBe(1)
    expect(unlockedLevels(3)).toBe(4)
    expect(unlockedLevels(LEVEL_COUNT)).toBe(LEVEL_COUNT)
  })

  it('legt in den ersten beiden Leveln Asse vor, danach nicht mehr', () => {
    expect(createGame(9, 0, 1).foundations.flat()).toHaveLength(2)
    expect(createGame(9, 0, 2).foundations.flat()).toHaveLength(1)
    expect(createGame(9, 0, 3).foundations.flat()).toHaveLength(0)
  })

  it('nimmt vorgelegte Asse aus dem Blatt, statt sie zu verdoppeln', () => {
    const game = createGame(9, 0, 1)
    const vorgelegt = game.foundations.flat()
    const imSpiel = [...game.tableau.flat(), ...game.stock].map((c) => c.id)
    for (const ass of vorgelegt) {
      expect(ass.rank).toBe(1)
      expect(imSpiel).not.toContain(ass.id)
    }
    expect(game.stock).toHaveLength(24 - vorgelegt.length)
  })

  it('übernimmt die Hinweiszahl des Levels', () => {
    expect(createGame(9, 0, 1).hints).toBe(3)
    expect(createGame(9, 0, 8).hints).toBe(1)
    expect(createGame(9, 0, 11).hints).toBe(0)
  })

  it('gibt in Level 11 gar keinen Hinweis mehr aus', () => {
    const out = useHint(createGame(9, 0, 11))
    expect(out.hint).toBeNull()
    expect(out.state.hints).toBe(0)
  })

  it('deckt ab Level 7 drei Karten auf einmal auf', () => {
    const einer = drawFromStock(createGame(9, 0, 3)).state
    const dreier = drawFromStock(createGame(9, 0, 7)).state
    expect(einer.waste).toHaveLength(1)
    expect(dreier.waste).toHaveLength(3)
    expect(dreier.waste.every((c) => c.faceUp)).toBe(true)
    // Nur die zuletzt gezogene Karte ist spielbar
    expect(movingCards(dreier, { zone: 'waste' })).toHaveLength(1)
  })

  it('zieht am Ende des Stapels auch weniger als drei Karten', () => {
    const state = stateWith({
      level: 7,
      stock: [card('hearts', 1, false), card('spades', 2, false)],
    })
    const out = drawFromStock(state)
    expect(out.outcome).toBe('drawn')
    expect(out.state.waste).toHaveLength(2)
    expect(out.state.stock).toHaveLength(0)
  })

  it('begrenzt in höheren Leveln die Talon-Durchläufe', () => {
    // Level 12 erlaubt genau ein Umdrehen
    let state = stateWith({
      level: 12,
      stock: [card('hearts', 5, false), card('spades', 6, false)],
    })
    expect(redealsLeft(state)).toBe(1)

    state = drawFromStock(state).state // zieht beide Karten
    expect(state.stock).toHaveLength(0)

    const ersterDurchlauf = drawFromStock(state)
    expect(ersterDurchlauf.outcome).toBe('redeal')
    expect(redealsLeft(ersterDurchlauf.state)).toBe(0)

    let danach = drawFromStock(ersterDurchlauf.state).state // zieht wieder beide
    expect(danach.stock).toHaveLength(0)
    expect(drawFromStock(danach).outcome).toBe('blocked')
  })

  it('lässt in den unteren Leveln unbegrenzt umdrehen', () => {
    expect(redealsLeft(createGame(9, 0, 1))).toBeNull()
    expect(redealsLeft(createGame(9, 0, 12))).toBe(1)
  })
})

describe('Sackgasse', () => {
  /** Sieben Spalten, in denen sich keine Karte bewegen lässt. */
  const dead = {
    stock: [],
    waste: [],
    tableau: [
      [card('spades', KING)],
      [card('hearts', KING)],
      [card('diamonds', KING)],
      [card('clubs', KING)],
      [card('spades', 5)],
      [card('hearts', 5)],
      [card('diamonds', 5)],
    ],
  }

  it('erkennt eine Lage ohne jeden Zug', () => {
    expect(hasAnyMove(stateWith(dead))).toBe(false)
  })

  it('zählt eine freie Spalte als Zug', () => {
    const state = stateWith({ ...dead, tableau: [...dead.tableau.slice(0, 6), []] })
    expect(hasAnyMove(state)).toBe(true)
  })

  it('zählt eine Karte im Ziehstapel als Zug', () => {
    expect(hasAnyMove(stateWith({ ...dead, stock: [card('clubs', 9, false)] }))).toBe(true)
  })

  it('zählt den Rückweg vom Ablagestapel nicht mit', () => {
    // Das Karo-Ass könnte auf die schwarze 2 zurück — das ist kein Fortschritt
    const state = stateWith({
      ...dead,
      foundations: [[], [card('diamonds', 1)], [], []],
      tableau: [...dead.tableau.slice(0, 6), [card('spades', 2)]],
    })
    expect(hasAnyMove(state)).toBe(false)
  })

  it('meldet die Sackgasse, sobald der letzte Zug hineinführt', () => {
    const state = stateWith({
      ...dead,
      tableau: [...dead.tableau.slice(0, 6), [card('diamonds', 5), card('clubs', 1)]],
    })
    expect(state.stuck).toBe(false)

    const out = play(state, { zone: 'tableau', column: 6, index: 1 }, { zone: 'foundation', pile: 3 })
    expect(out.outcome).toBe('moved')
    expect(out.state.stuck).toBe(true)
    expect(out.state.won).toBe(false)
  })

  it('sperrt nach der Sackgasse jede weitere Eingabe', () => {
    const stuck = stateWith({ ...dead, stuck: true })
    expect(select(stuck, { zone: 'tableau', column: 0, index: 0 }).outcome).toBe('blocked')
    expect(drawFromStock(stuck).outcome).toBe('blocked')
    expect(findMove(stuck)).toBeNull()
  })

  it('steckt zu Beginn einer Partie nie fest', () => {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (let seed = 1; seed <= 10; seed++) {
        const game = createGame(seed, 0, level)
        expect(game.stuck, `Level ${level}, Seed ${seed}`).toBe(false)
        expect(hasAnyMove(game), `Level ${level}, Seed ${seed}`).toBe(true)
      }
    }
  })
})

describe('Wertung', () => {
  it('vergibt drei Sterne nur bei einem schnellen Sieg', () => {
    // Level 1 hat sechs Minuten als Ziel, das Doppelte gibt noch zwei Sterne
    expect(starsFor(5 * 60_000, true, 1)).toBe(3)
    expect(starsFor(10 * 60_000, true, 1)).toBe(2)
    expect(starsFor(20 * 60_000, true, 1)).toBe(1)
  })

  it('misst jedes Level an seiner eigenen Zielzeit', () => {
    // Vier Minuten reichen in Level 1 für drei Sterne, in Level 12 nicht mehr
    expect(starsFor(4 * 60_000, true, 1)).toBe(3)
    expect(starsFor(4 * 60_000, true, 12)).toBe(2)
  })

  it('vergibt beim Aufgeben keine Sterne', () => {
    expect(starsFor(60_000, false, 1)).toBe(0)
  })

  it('gibt Siegbonus und Zeitbonus nur bei Sieg', () => {
    const base = stateWith({ score: 600, level: 1 })
    const won: GameState = { ...base, won: true }

    expect(finalScore(base, 60_000)).toBe(600)
    expect(finalScore(won, 60_000)).toBe(600 + 400 + (900 - 60))
    // Nach 15 Minuten bleibt nur der Siegbonus
    expect(finalScore(won, 20 * 60_000)).toBe(600 + 400)
  })

  it('zahlt in höheren Leveln einen größeren Siegbonus', () => {
    const leicht: GameState = { ...stateWith({ score: 0, level: 1 }), won: true }
    const schwer: GameState = { ...stateWith({ score: 0, level: 12 }), won: true }
    expect(finalScore(schwer, 60_000) - finalScore(leicht, 60_000)).toBe(11 * 100)
  })
})
