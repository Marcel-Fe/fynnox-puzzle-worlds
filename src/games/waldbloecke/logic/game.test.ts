import { describe, expect, it } from 'vitest'
import {
  BOARD_SIZE,
  canPlace,
  createGame,
  hasAnyPlacement,
  indexOf,
  placeShape,
  starsFor,
  type GameState,
} from './game'
import { SHAPES, type Shape } from './shapes'

const shapeById = (id: string): Shape => SHAPES.find((s) => s.id === id)!

/** Baut einen Zustand mit vorgegebenem Feld und Vorrat, für gezielte Fälle. */
function stateWith(filled: [number, number][], tray: (Shape | null)[]): GameState {
  const board = new Array(BOARD_SIZE * BOARD_SIZE).fill(false)
  for (const [r, c] of filled) board[indexOf(r, c)] = true
  return {
    board,
    tray,
    score: 0,
    linesCleared: 0,
    combos: 0,
    bestCombo: 0,
    over: false,
    seed: 1,
    startedAt: 0,
  }
}

describe('Spielfeld', () => {
  it('startet leer mit drei Blöcken im Vorrat', () => {
    const game = createGame(42, 0)
    expect(game.board.filter(Boolean)).toHaveLength(0)
    expect(game.tray).toHaveLength(3)
    expect(game.tray.every((s) => s !== null)).toBe(true)
    expect(game.over).toBe(false)
  })

  it('erzeugt bei gleichem Seed dieselbe Partie', () => {
    const a = createGame(7, 0)
    const b = createGame(7, 0)
    expect(a.tray.map((s) => s?.id)).toEqual(b.tray.map((s) => s?.id))
  })

  it('lässt Blöcke nicht über den Rand ragen', () => {
    const game = createGame(1, 0)
    const h4 = shapeById('h4')
    expect(canPlace(game.board, h4, 0, 5)).toBe(false)
    expect(canPlace(game.board, h4, 0, 4)).toBe(true)
  })

  it('lässt Blöcke nicht auf besetzte Felder', () => {
    const state = stateWith([[0, 0]], [shapeById('dot'), null, null])
    expect(canPlace(state.board, shapeById('dot'), 0, 0)).toBe(false)
    expect(canPlace(state.board, shapeById('dot'), 0, 1)).toBe(true)
  })
})

describe('Reihen räumen', () => {
  it('räumt eine volle Reihe und zählt sie', () => {
    // Zeile 0 bis auf das letzte Feld voll
    const filled: [number, number][] = []
    for (let c = 0; c < BOARD_SIZE - 1; c++) filled.push([0, c])

    const state = stateWith(filled, [shapeById('dot'), null, null])
    const out = placeShape(state, 0, 0, BOARD_SIZE - 1)!

    expect(out.clearedLines).toBe(1)
    expect(out.state.linesCleared).toBe(1)
    expect(out.state.board.filter(Boolean)).toHaveLength(0)
  })

  it('räumt Reihe und Spalte gleichzeitig und zählt das als Kombo', () => {
    const filled: [number, number][] = []
    for (let c = 0; c < BOARD_SIZE - 1; c++) filled.push([0, c])
    for (let r = 1; r < BOARD_SIZE; r++) filled.push([r, BOARD_SIZE - 1])

    const state = stateWith(filled, [shapeById('dot'), null, null])
    const out = placeShape(state, 0, 0, BOARD_SIZE - 1)!

    expect(out.clearedLines).toBe(2)
    expect(out.state.combos).toBe(1)
    expect(out.state.bestCombo).toBe(2)
    expect(out.state.board.filter(Boolean)).toHaveLength(0)
  })

  it('räumt eine volle Spalte auch dann, wenn zugleich eine Reihe fällt', () => {
    // Regressionsfall: Würde die Reihe zuerst geleert, wäre die Spalte
    // nicht mehr voll und bliebe fälschlich stehen.
    const filled: [number, number][] = []
    for (let c = 0; c < BOARD_SIZE - 1; c++) filled.push([3, c])
    for (let r = 0; r < BOARD_SIZE; r++) if (r !== 3) filled.push([r, BOARD_SIZE - 1])

    const state = stateWith(filled, [shapeById('dot'), null, null])
    const out = placeShape(state, 0, 3, BOARD_SIZE - 1)!

    expect(out.clearedLines).toBe(2)
    expect(out.state.board.filter(Boolean)).toHaveLength(0)
  })

  it('gibt mehr Punkte für eine Kombo als für zwei einzelne Reihen', () => {
    const single: [number, number][] = []
    for (let c = 0; c < BOARD_SIZE - 1; c++) single.push([0, c])
    const one = placeShape(stateWith(single, [shapeById('dot'), null, null]), 0, 0, 7)!

    const combo: [number, number][] = [...single]
    for (let r = 1; r < BOARD_SIZE; r++) combo.push([r, BOARD_SIZE - 1])
    const two = placeShape(stateWith(combo, [shapeById('dot'), null, null]), 0, 0, 7)!

    expect(two.gainedScore).toBeGreaterThan(one.gainedScore * 2)
  })
})

describe('Vorrat und Spielende', () => {
  it('füllt den Vorrat erst nach, wenn alle drei Blöcke gesetzt sind', () => {
    let state = createGame(3, 0)
    const first = placeShape(state, 0, 0, 0)
    expect(first).not.toBeNull()
    state = first!.state
    expect(state.tray.filter((s) => s !== null)).toHaveLength(2)
  })

  it('endet, wenn kein Block mehr irgendwo passt', () => {
    // Schachbrettmuster: jedes freie Feld liegt einzeln, aber keine Zeile und
    // keine Spalte ist voll — dadurch räumt der Zug nichts weg und das Feld
    // bleibt für einen 2er-Block dicht.
    const filled: [number, number][] = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 0) filled.push([r, c])
      }
    }

    const state = stateWith(filled, [shapeById('dot'), shapeById('h2'), null])
    const out = placeShape(state, 0, 0, 1)!

    expect(out.clearedLines).toBe(0)
    expect(hasAnyPlacement(out.state.board, shapeById('h2'))).toBe(false)
    expect(out.state.over).toBe(true)
  })

  it('weist unerlaubte Züge ab, statt den Zustand zu verändern', () => {
    const state = stateWith([[0, 0]], [shapeById('dot'), null, null])
    expect(placeShape(state, 0, 0, 0)).toBeNull()
    expect(placeShape(state, 1, 0, 1)).toBeNull() // leerer Vorratsplatz
  })
})

describe('Sterne', () => {
  it('vergibt Sterne nach den Schwellen', () => {
    expect(starsFor(0)).toBe(0)
    expect(starsFor(999)).toBe(0)
    expect(starsFor(1000)).toBe(1)
    expect(starsFor(2500)).toBe(2)
    expect(starsFor(3680)).toBe(3) // Mockup-Wert: dort sind es drei Sterne
  })
})
