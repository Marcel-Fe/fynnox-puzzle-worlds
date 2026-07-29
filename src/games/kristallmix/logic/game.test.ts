import { describe, expect, it } from 'vitest'
import {
  areNeighbours,
  collapse,
  COLORS,
  createBoard,
  findMatches,
  hasValidMove,
  indexOf,
  reshuffle,
  SIZE,
  wouldMatch,
  type Gem,
} from './board'
import { createGame, GOAL_AMOUNT, MOVES_PER_ROUND, starsFor, swap, type GameState } from './game'

/** Baut ein Feld aus einem Farbmuster. `.` steht für „egal, nimm eine freie Farbe". */
function boardFrom(rows: string[]): Gem[] {
  const board: Gem[] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const ch = rows[r]?.[c] ?? '.'
      // Ziffern sind Farben; Punkte bekommen eine Farbe, die nie zufaellig passt
      const color = ch === '.' ? 5 - ((r + c) % 2) : Number(ch)
      board.push({ color, power: 'none' })
    }
  }
  return board
}

function stateWith(board: Gem[], overrides: Partial<GameState> = {}): GameState {
  return {
    board,
    movesLeft: MOVES_PER_ROUND,
    score: 0,
    goalColor: 0,
    goalCollected: 0,
    explosions: 0,
    rainbowsMade: 0,
    seed: 1,
    startedAt: 0,
    won: false,
    lost: false,
    ...overrides,
  }
}

describe('Reihen finden', () => {
  it('findet eine waagerechte Dreierreihe', () => {
    const board = boardFrom(['111.....'])
    const matches = findMatches(board)
    expect(matches).toHaveLength(1)
    expect(matches[0].length).toBe(3)
    expect(matches[0].horizontal).toBe(true)
  })

  it('findet eine senkrechte Dreierreihe', () => {
    const board = boardFrom(['1.......', '1.......', '1.......'])
    const matches = findMatches(board)
    expect(matches).toHaveLength(1)
    expect(matches[0].horizontal).toBe(false)
  })

  it('findet keine Reihe bei nur zwei gleichen', () => {
    expect(findMatches(boardFrom(['11......']))).toHaveLength(0)
  })

  it('erkennt eine Viererreihe als eine Reihe der Länge 4', () => {
    const matches = findMatches(boardFrom(['1111....']))
    expect(matches).toHaveLength(1)
    expect(matches[0].length).toBe(4)
    expect(matches[0].corner).toBe(false)
  })

  it('fasst eine L-Form zu einem Treffer über Eck zusammen', () => {
    // Waagerecht drei plus senkrecht drei, gemeinsame Ecke oben links
    const board = boardFrom(['111.....', '1.......', '1.......'])
    const matches = findMatches(board)
    expect(matches).toHaveLength(1)
    expect(matches[0].corner).toBe(true)
    expect(matches[0].length).toBe(5)
  })

  it('hält zwei getrennte Reihen auseinander', () => {
    const board = boardFrom(['111.222.'])
    expect(findMatches(board)).toHaveLength(2)
  })
})

describe('Startfeld', () => {
  it('enthält nie schon fertige Reihen', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { board } = createBoard(seed)
      expect(findMatches(board), `Seed ${seed}`).toHaveLength(0)
    }
  })

  it('hat immer mindestens einen möglichen Zug', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(hasValidMove(createBoard(seed).board), `Seed ${seed}`).toBe(true)
    }
  })

  it('nutzt alle Farben', () => {
    const { board } = createBoard(3)
    expect(new Set(board.map((g) => g.color)).size).toBe(COLORS)
  })

  it('gibt bei gleichem Seed dasselbe Feld', () => {
    expect(createBoard(12).board).toEqual(createBoard(12).board)
  })
})

describe('Nachrutschen', () => {
  it('lässt Kristalle über einer Lücke nach unten fallen', () => {
    const board = boardFrom([])
    const oben = board[indexOf(0, 0)]
    // Feld darunter raeumen
    const { board: next } = collapse(board, [indexOf(1, 0)], 1)
    expect(next[indexOf(1, 0)]).toEqual(oben)
  })

  it('füllt oben mit neuen Kristallen auf', () => {
    const board = boardFrom([])
    const { board: next } = collapse(board, [indexOf(0, 0), indexOf(1, 0)], 1)
    expect(next[indexOf(0, 0)]).not.toBeNull()
    expect(next.every((g) => g !== null)).toBe(true)
  })

  it('lässt unberührte Spalten in Ruhe', () => {
    const board = boardFrom([])
    const { board: next } = collapse(board, [indexOf(0, 0)], 1)
    for (let r = 0; r < SIZE; r++) {
      expect(next[indexOf(r, 3)]).toEqual(board[indexOf(r, 3)])
    }
  })
})

describe('Nachbarn und gültige Züge', () => {
  it('erkennt nur direkte Nachbarn', () => {
    expect(areNeighbours(indexOf(2, 2), indexOf(2, 3))).toBe(true)
    expect(areNeighbours(indexOf(2, 2), indexOf(3, 2))).toBe(true)
    expect(areNeighbours(indexOf(2, 2), indexOf(3, 3))).toBe(false)
    expect(areNeighbours(indexOf(2, 2), indexOf(2, 4))).toBe(false)
  })

  it('erkennt einen Tausch, der eine Reihe schließt', () => {
    // 1 1 2 1 -> Tausch der beiden mittleren ergibt 1 1 1 2
    const board = boardFrom(['1121....'])
    expect(wouldMatch(board, indexOf(0, 2), indexOf(0, 3))).toBe(true)
  })

  it('erkennt einen wirkungslosen Tausch', () => {
    const board = boardFrom(['1234....'])
    expect(wouldMatch(board, indexOf(0, 0), indexOf(0, 1))).toBe(false)
  })
})

describe('Züge', () => {
  it('weist Tausche zurück, die nichts bewirken', () => {
    const state = stateWith(boardFrom(['1234....']))
    const out = swap(state, indexOf(0, 0), indexOf(0, 1))
    expect(out.valid).toBe(false)
    expect(out.state.movesLeft).toBe(MOVES_PER_ROUND)
  })

  it('weist Tausche zurück, die nicht benachbart sind', () => {
    const state = stateWith(boardFrom(['1121....']))
    expect(swap(state, indexOf(0, 0), indexOf(3, 3)).valid).toBe(false)
  })

  it('zählt einen gültigen Zug ab und gibt Punkte', () => {
    const state = stateWith(boardFrom(['1121....']))
    const out = swap(state, indexOf(0, 2), indexOf(0, 3))

    expect(out.valid).toBe(true)
    expect(out.state.movesLeft).toBe(MOVES_PER_ROUND - 1)
    expect(out.state.score).toBeGreaterThan(0)
    expect(out.steps.length).toBeGreaterThan(0)
  })

  it('zählt gesammelte Kristalle der Zielfarbe', () => {
    const state = stateWith(boardFrom(['1121....']), { goalColor: 1 })
    const out = swap(state, indexOf(0, 2), indexOf(0, 3))
    expect(out.state.goalCollected).toBeGreaterThanOrEqual(3)
  })

  it('lässt das Feld nach dem Zug ohne offene Reihen zurück', () => {
    const state = stateWith(boardFrom(['1121....']))
    const out = swap(state, indexOf(0, 2), indexOf(0, 3))
    expect(findMatches(out.state.board)).toHaveLength(0)
  })

  it('lässt nach dem Zug immer einen Zug übrig', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const game = createGame(seed, 0)
      // Ersten gueltigen Zug suchen und spielen
      let played = false
      for (let i = 0; i < SIZE * SIZE && !played; i++) {
        for (const j of [i + 1, i + SIZE]) {
          if (j < SIZE * SIZE && areNeighbours(i, j) && wouldMatch(game.board, i, j)) {
            const out = swap(game, i, j)
            expect(hasValidMove(out.state.board), `Seed ${seed}`).toBe(true)
            played = true
            break
          }
        }
      }
      expect(played, `Seed ${seed}: kein gueltiger Zug gefunden`).toBe(true)
    }
  })
})

describe('Power-Ups', () => {
  it('legt bei vier in einer Reihe einen Streifenkristall an', () => {
    // 1 1 1 2 1 -> Tausch der letzten beiden ergibt vier in Reihe
    const state = stateWith(boardFrom(['11121...']))
    const out = swap(state, indexOf(0, 3), indexOf(0, 4))
    const powers = out.state.board.filter((g) => g?.power !== 'none')
    expect(powers.length).toBeGreaterThanOrEqual(1)
  })

  it('legt bei fünf in einer Reihe einen Regenbogenstein an', () => {
    const state = stateWith(boardFrom(['111121..']))
    const out = swap(state, indexOf(0, 4), indexOf(0, 5))
    expect(out.state.rainbowsMade).toBeGreaterThanOrEqual(1)
  })

  it('räumt mit einem Streifenkristall die ganze Zeile', () => {
    const board = boardFrom(['1121....'])
    board[indexOf(0, 0)] = { color: 1, power: 'stripeH' }
    const state = stateWith(board)
    const out = swap(state, indexOf(0, 2), indexOf(0, 3))
    // Der Streifen reisst die Zeile mit -> deutlich mehr als drei Felder
    expect(out.steps[0].cleared.length).toBeGreaterThan(3)
    expect(out.state.explosions).toBeGreaterThan(0)
  })

  it('räumt mit einem Regenbogenstein alle Kristalle einer Farbe', () => {
    const board = boardFrom([])
    // Feld gleichmaessig faerben, damit die Wirkung messbar ist
    for (let i = 0; i < board.length; i++) board[i] = { color: i % 2, power: 'none' }
    board[indexOf(4, 4)] = { color: 3, power: 'rainbow' }
    board[indexOf(4, 5)] = { color: 1, power: 'none' }

    const state = stateWith(board)
    const out = swap(state, indexOf(4, 4), indexOf(4, 5))

    expect(out.valid).toBe(true)
    expect(out.steps[0].cleared.length).toBeGreaterThan(20)
  })
})

describe('Rundenende', () => {
  it('gewinnt, sobald das Sammelziel erreicht ist', () => {
    const state = stateWith(boardFrom(['1121....']), {
      goalColor: 1,
      goalCollected: GOAL_AMOUNT - 1,
    })
    const out = swap(state, indexOf(0, 2), indexOf(0, 3))
    expect(out.state.won).toBe(true)
  })

  it('verliert, wenn die Züge aufgebraucht sind', () => {
    const state = stateWith(boardFrom(['1121....']), { movesLeft: 1, goalColor: 4 })
    const out = swap(state, indexOf(0, 2), indexOf(0, 3))
    expect(out.state.movesLeft).toBe(0)
    expect(out.state.lost).toBe(true)
  })

  it('spielt nach dem Rundenende nicht weiter', () => {
    const state = stateWith(boardFrom(['1121....']), { won: true })
    expect(swap(state, indexOf(0, 2), indexOf(0, 3)).valid).toBe(false)
  })

  it('vergibt Sterne nach übrigen Zügen', () => {
    const base = stateWith(boardFrom([]), { won: true })
    expect(starsFor({ ...base, movesLeft: 12 })).toBe(3)
    expect(starsFor({ ...base, movesLeft: 7 })).toBe(2)
    expect(starsFor({ ...base, movesLeft: 1 })).toBe(1)
    expect(starsFor({ ...base, won: false, movesLeft: 12 })).toBe(0)
  })
})

describe('Neu mischen', () => {
  it('erzeugt ein Feld mit Zug und ohne fertige Reihen', () => {
    // Feld ohne moeglichen Zug: Streifenmuster
    const board: Gem[] = []
    for (let i = 0; i < SIZE * SIZE; i++) {
      board.push({ color: (Math.floor(i / SIZE) + (i % SIZE)) % COLORS, power: 'none' })
    }
    const { board: mixed } = reshuffle(board, 5)
    expect(findMatches(mixed)).toHaveLength(0)
    expect(hasValidMove(mixed)).toBe(true)
  })

  it('behält die Anzahl der Kristalle bei', () => {
    const { board } = createBoard(8)
    const { board: mixed } = reshuffle(board, 5)
    expect(mixed).toHaveLength(board.length)
  })
})
