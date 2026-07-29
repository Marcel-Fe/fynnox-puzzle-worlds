import { describe, expect, it } from 'vitest'
import {
  createGame,
  finalScore,
  findPair,
  freeTiles,
  isFree,
  shuffle,
  starsFor,
  tapTile,
  TIME_LIMIT_MS,
  useHint,
  type GameState,
  type Tile,
} from './game'
import { buildLayout } from './layout'

/** Spielt eine Partie durch, indem immer das erste gefundene Paar geklickt wird. */
function playThrough(state: GameState): { state: GameState; moves: number } {
  let current = state
  let moves = 0
  while (!current.won && moves < 100) {
    const pair = findPair(current.tiles)
    if (!pair) break
    current = tapTile(current, pair[0]).state
    current = tapTile(current, pair[1]).state
    moves++
  }
  return { state: current, moves }
}

describe('Feldaufbau', () => {
  it('legt 36 Steine in drei Schichten', () => {
    const positions = buildLayout()
    expect(positions).toHaveLength(36)
    expect(positions.filter((p) => p.layer === 0)).toHaveLength(24)
    expect(positions.filter((p) => p.layer === 1)).toHaveLength(8)
    expect(positions.filter((p) => p.layer === 2)).toHaveLength(4)
  })

  it('legt keine zwei Steine auf denselben Platz', () => {
    const keys = buildLayout().map((p) => `${p.layer},${p.row},${p.col}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('stützt jede höhere Schicht vollständig ab', () => {
    const positions = buildLayout()
    const below = new Set(positions.map((p) => `${p.layer},${p.row},${p.col}`))
    for (const p of positions) {
      if (p.layer > 0) {
        expect(below.has(`${p.layer - 1},${p.row},${p.col}`)).toBe(true)
      }
    }
  })
})

describe('Freiheitsregel', () => {
  const tile = (id: number, layer: number, row: number, col: number): Tile => ({
    id,
    layer,
    row,
    col,
    symbol: 'x',
    removed: false,
  })

  it('sperrt einen Stein, auf dem etwas liegt', () => {
    const tiles = [tile(0, 0, 1, 1), tile(1, 1, 1, 1)]
    expect(isFree(tiles, tiles[0])).toBe(false)
    expect(isFree(tiles, tiles[1])).toBe(true)
  })

  it('sperrt einen Stein, der links und rechts eingeklemmt ist', () => {
    const tiles = [tile(0, 0, 1, 0), tile(1, 0, 1, 1), tile(2, 0, 1, 2)]
    expect(isFree(tiles, tiles[1])).toBe(false)
    expect(isFree(tiles, tiles[0])).toBe(true)
    expect(isFree(tiles, tiles[2])).toBe(true)
  })

  it('gibt einen Stein frei, sobald eine Seite offen ist', () => {
    const tiles = [tile(0, 0, 1, 0), tile(1, 0, 1, 1)]
    expect(isFree(tiles, tiles[1])).toBe(true)
  })

  it('zählt abgeräumte Steine nicht als Hindernis', () => {
    const tiles = [
      { ...tile(0, 0, 1, 0), removed: true },
      tile(1, 0, 1, 1),
      { ...tile(2, 0, 1, 2), removed: true },
    ]
    expect(isFree(tiles, tiles[1])).toBe(true)
  })
})

describe('Rätselerzeugung', () => {
  it('verteilt jedes Symbol paarweise', () => {
    const game = createGame(42, 0)
    const counts = new Map<string, number>()
    for (const t of game.tiles) counts.set(t.symbol, (counts.get(t.symbol) ?? 0) + 1)
    for (const [symbol, count] of counts) {
      expect(count % 2, `Symbol ${symbol} kommt ${count}-mal vor`).toBe(0)
    }
  })

  it('gibt bei gleichem Seed dasselbe Rätsel', () => {
    const a = createGame(7, 0)
    const b = createGame(7, 0)
    expect(a.tiles.map((t) => t.symbol)).toEqual(b.tiles.map((t) => t.symbol))
  })

  it('ist lösbar — für viele verschiedene Startzahlen', () => {
    // Der eigentliche Zweck der rueckwaerts gebauten Erzeugung: Die mitgelieferte
    // Zugfolge raeumt den Tempel leer, und zwar Zug fuer Zug regelkonform.
    for (let seed = 1; seed <= 40; seed++) {
      let state = createGame(seed, 0)
      const plan = [...state.solution]

      for (const [a, b] of plan) {
        const tileA = state.tiles.find((t) => t.id === a)!
        const tileB = state.tiles.find((t) => t.id === b)!
        expect(tileA.symbol, `Seed ${seed}: geplantes Paar hat verschiedene Symbole`).toBe(
          tileB.symbol,
        )
        expect(isFree(state.tiles, tileA), `Seed ${seed}: Stein ${a} lag nicht frei`).toBe(true)
        expect(isFree(state.tiles, tileB), `Seed ${seed}: Stein ${b} lag nicht frei`).toBe(true)

        state = tapTile(tapTile(state, a).state, b).state
      }

      expect(state.won, `Seed ${seed}: Plan hat den Tempel nicht geleert`).toBe(true)
    }
  })

  it('bleibt auch lösbar, wenn einfach das nächstbeste Paar genommen wird', () => {
    // Kein Muss — aber ein gutes Zeichen dafuer, dass der Aufbau nicht
    // uebermaessig zu Sackgassen neigt.
    for (let seed = 1; seed <= 40; seed++) {
      expect(playThrough(createGame(seed, 0)).state.won, `Seed ${seed}`).toBe(true)
    }
  })

  it('erkennt, dass gleiche Symbole trotzdem unspielbar sein können', () => {
    // Vier Steine in einer Reihe: A A B B. Frei sind nur die aeusseren,
    // und die passen nicht zusammen — genau der Fall fuer den Mischknopf.
    const reihe: Tile[] = [
      { id: 0, layer: 0, row: 0, col: 0, symbol: 'A', removed: false },
      { id: 1, layer: 0, row: 0, col: 1, symbol: 'A', removed: false },
      { id: 2, layer: 0, row: 0, col: 2, symbol: 'B', removed: false },
      { id: 3, layer: 0, row: 0, col: 3, symbol: 'B', removed: false },
    ]
    expect(freeTiles(reihe).map((t) => t.id)).toEqual([0, 3])
    expect(findPair(reihe)).toBeNull()
  })

  it('beginnt mit mindestens einem spielbaren Paar', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(findPair(createGame(seed, 0).tiles)).not.toBeNull()
    }
  })

  it('gibt zu Beginn nur die Steine an den Rändern und obenauf frei', () => {
    const game = createGame(3, 0)
    const free = freeTiles(game.tiles)
    expect(free.length).toBeGreaterThan(0)
    expect(free.length).toBeLessThan(game.tiles.length)
  })
})

describe('Züge', () => {
  it('wählt beim ersten Antippen aus', () => {
    const game = createGame(11, 0)
    const first = freeTiles(game.tiles)[0]
    const out = tapTile(game, first.id)
    expect(out.outcome).toBe('selected')
    expect(out.state.selected).toBe(first.id)
  })

  it('hebt die Auswahl beim erneuten Antippen auf', () => {
    const game = createGame(11, 0)
    const first = freeTiles(game.tiles)[0]
    const selected = tapTile(game, first.id).state
    const out = tapTile(selected, first.id)
    expect(out.outcome).toBe('deselected')
    expect(out.state.selected).toBeNull()
  })

  it('räumt ein Paar ab und zählt Punkte', () => {
    const game = createGame(11, 0)
    const pair = findPair(game.tiles)!
    const out = tapTile(tapTile(game, pair[0]).state, pair[1])

    expect(out.outcome).toBe('matched')
    expect(out.state.matched).toBe(1)
    expect(out.state.score).toBeGreaterThan(0)
    expect(out.state.tiles.filter((t) => t.removed)).toHaveLength(2)
  })

  it('legt die Auswahl bei ungleichen Steinen auf den neuen um', () => {
    const game = createGame(11, 0)
    const free = freeTiles(game.tiles)
    const a = free[0]
    const b = free.find((t) => t.symbol !== a.symbol)
    if (!b) return // bei diesem Seed nicht prüfbar

    const out = tapTile(tapTile(game, a.id).state, b.id)
    expect(out.outcome).toBe('mismatch')
    expect(out.state.selected).toBe(b.id)
  })

  it('lässt verdeckte Steine nicht antippen', () => {
    const game = createGame(11, 0)
    const covered = game.tiles.find((t) => !isFree(game.tiles, t))!
    const out = tapTile(game, covered.id)
    expect(out.outcome).toBe('blocked')
    expect(out.state.selected).toBeNull()
  })

  it('meldet gewonnen, wenn der letzte Stein weg ist', () => {
    const { state } = playThrough(createGame(5, 0))
    expect(state.won).toBe(true)
    expect(state.tiles.every((t) => t.removed)).toBe(true)
  })
})

describe('Hilfen', () => {
  it('mischt neu und lässt das Rätsel lösbar', () => {
    for (let seed = 1; seed <= 15; seed++) {
      let game = createGame(seed, 0)
      // Erst ein paar Paare raeumen, damit gemischt wird, was uebrig ist
      for (let i = 0; i < 3; i++) {
        const pair = findPair(game.tiles)
        if (!pair) break
        game = tapTile(tapTile(game, pair[0]).state, pair[1]).state
      }

      const mixed = shuffle(game)
      expect(mixed.shuffles).toBe(game.shuffles - 1)
      expect(findPair(mixed.tiles), `Seed ${seed}: nach dem Mischen kein Zug`).not.toBeNull()

      // Der neue Plan muss den Rest wieder vollstaendig abraeumen
      let state = mixed
      for (const [a, b] of [...mixed.solution]) {
        const tileA = state.tiles.find((t) => t.id === a)!
        const tileB = state.tiles.find((t) => t.id === b)!
        expect(isFree(state.tiles, tileA), `Seed ${seed}: Stein ${a} nicht frei`).toBe(true)
        expect(isFree(state.tiles, tileB), `Seed ${seed}: Stein ${b} nicht frei`).toBe(true)
        state = tapTile(tapTile(state, a).state, b).state
      }
      expect(state.won, `Seed ${seed}: nach dem Mischen nicht mehr lösbar`).toBe(true)
    }
  })

  it('nennt als Hinweis ein Paar, das wirklich spielbar ist', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const game = createGame(seed, 0)
      const { state, pair } = useHint(game)

      expect(pair, `Seed ${seed}: kein Hinweis gefunden`).not.toBeNull()
      expect(state.hints).toBe(game.hints - 1)

      const [a, b] = pair!
      const tileA = game.tiles.find((t) => t.id === a)!
      const tileB = game.tiles.find((t) => t.id === b)!
      expect(tileA.symbol).toBe(tileB.symbol)
      expect(isFree(game.tiles, tileA)).toBe(true)
      expect(isFree(game.tiles, tileB)).toBe(true)
    }
  })

  it('verbraucht keinen Hinweis mehr, wenn keiner übrig ist', () => {
    let game = createGame(8, 0)
    for (let i = 0; i < 3; i++) game = useHint(game).state
    expect(game.hints).toBe(0)

    const out = useHint(game)
    expect(out.pair).toBeNull()
    expect(out.state.hints).toBe(0)
  })

  it('lässt die Symbole beim Mischen paarweise', () => {
    const mixed = shuffle(createGame(4, 0))
    const counts = new Map<string, number>()
    for (const t of mixed.tiles) counts.set(t.symbol, (counts.get(t.symbol) ?? 0) + 1)
    for (const count of counts.values()) expect(count % 2).toBe(0)
  })

  it('mischt nicht mehr, wenn keine Vorgänge übrig sind', () => {
    let game = createGame(4, 0)
    game = shuffle(game)
    game = shuffle(game)
    expect(game.shuffles).toBe(0)
    const symbolsBefore = game.tiles.map((t) => t.symbol)
    expect(shuffle(game).tiles.map((t) => t.symbol)).toEqual(symbolsBefore)
  })
})

describe('Wertung', () => {
  it('vergibt drei Sterne nur bei schnellem Sieg', () => {
    expect(starsFor(90_000, true)).toBe(3)
    expect(starsFor(140_000, true)).toBe(2)
    expect(starsFor(170_000, true)).toBe(1)
  })

  it('vergibt bei einer verlorenen Runde keine Sterne', () => {
    expect(starsFor(10_000, false)).toBe(0)
  })

  it('gibt Zeitbonus nur bei Sieg', () => {
    const game = createGame(2, 0)
    const won: GameState = { ...game, score: 1800, won: true }
    const lost: GameState = { ...game, score: 1800, won: false }

    expect(finalScore(won, 60_000)).toBeGreaterThan(1800)
    expect(finalScore(lost, 60_000)).toBe(1800)
    // Wer die Zeit ausschoepft, bekommt keinen Bonus mehr
    expect(finalScore(won, TIME_LIMIT_MS)).toBe(1800)
  })
})
