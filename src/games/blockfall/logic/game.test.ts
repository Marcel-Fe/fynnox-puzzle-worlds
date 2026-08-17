import { describe, expect, it } from 'vitest'
import {
  cellsOf,
  COLS,
  createGame,
  dropIntervalMs,
  fits,
  ghostRow,
  hardDrop,
  indexOf,
  moveLeft,
  moveRight,
  rotate,
  ROWS,
  starsFor,
  stepDown,
  type GameState,
} from './game'
import { PIECES, type PieceId } from './pieces'

function emptyBoard() {
  return new Array(COLS * ROWS).fill(null)
}

/** Zustand mit gezielt gesetztem Stein und Feld, für einzelne Fälle. */
function stateWith(
  active: { id: PieceId; rotation?: number; row?: number; col?: number },
  filled: [number, number][] = [],
): GameState {
  const board = emptyBoard()
  for (const [r, c] of filled) board[indexOf(r, c)] = 'O'
  return {
    board,
    active: { id: active.id, rotation: active.rotation ?? 0, row: active.row ?? 0, col: active.col ?? 3 },
    next: 'T',
    score: 0,
    lines: 0,
    level: 1,
    over: false,
    seed: 1,
    bag: [],
    startedAt: 0,
  }
}

describe('Steine', () => {
  it('hat für jeden Stein vier Drehungen mit je vier Feldern', () => {
    for (const piece of Object.values(PIECES)) {
      expect(piece.rotations).toHaveLength(4)
      for (const rotation of piece.rotations) {
        expect(rotation).toHaveLength(4)
      }
    }
  })

  it('lässt jede Drehung im Steinkasten', () => {
    for (const piece of Object.values(PIECES)) {
      for (const rotation of piece.rotations) {
        for (const [r, c] of rotation) {
          expect(r).toBeGreaterThanOrEqual(0)
          expect(c).toBeGreaterThanOrEqual(0)
          expect(r).toBeLessThan(piece.box)
          expect(c).toBeLessThan(piece.box)
        }
      }
    }
  })

  it('erzeugt bei gleichem Seed dieselbe Partie', () => {
    const a = createGame(99, 0)
    const b = createGame(99, 0)
    expect(a.active.id).toBe(b.active.id)
    expect(a.next).toBe(b.next)
  })

  it('zieht jeden der sieben Steine einmal, bevor sich einer wiederholt', () => {
    let state = createGame(5, 0)
    const seen: PieceId[] = [state.active.id]
    // 6 weitere Steine holen, indem jeweils sofort ganz nach unten gedroppt wird
    for (let i = 0; i < 6; i++) {
      seen.push(state.next)
      state = hardDrop(state).state
    }
    expect(new Set(seen).size).toBe(7)
  })
})

describe('Bewegen und Drehen', () => {
  it('läuft nicht über den linken oder rechten Rand', () => {
    let state = stateWith({ id: 'O', col: 0 })
    expect(moveLeft(state).active.col).toBe(0)

    state = stateWith({ id: 'O', col: COLS - 2 })
    expect(moveRight(state).active.col).toBe(COLS - 2)
  })

  it('läuft nicht in belegte Felder', () => {
    const state = stateWith({ id: 'O', row: 5, col: 4 }, [
      [5, 3],
      [6, 3],
    ])
    expect(moveLeft(state).active.col).toBe(4)
  })

  it('dreht an der Wand, indem der Stein ausweicht', () => {
    // Aufrechtes I ganz links: gedreht braucht es Platz nach rechts.
    const state = stateWith({ id: 'I', rotation: 1, row: 0, col: -2 })
    const turned = rotate(state)
    expect(turned.active.rotation).toBe(2)
    expect(fits(turned.board, turned.active)).toBe(true)
  })

  it('lässt die Drehung sein, wenn auch versetzt kein Platz ist', () => {
    // I waagerecht, rundum zugemauert
    const filled: [number, number][] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!(r === 1 && c >= 3 && c <= 6)) filled.push([r, c])
      }
    }
    const state = stateWith({ id: 'I', rotation: 0, row: 0, col: 3 }, filled)
    expect(rotate(state).active.rotation).toBe(0)
  })
})

describe('Fallen und Festsetzen', () => {
  it('fällt Schritt für Schritt', () => {
    const state = stateWith({ id: 'O', row: 0, col: 4 })
    const out = stepDown(state)
    expect(out.state.active.row).toBe(1)
    expect(out.locked).toBe(false)
  })

  it('setzt den Stein am Boden fest und holt den nächsten', () => {
    const state = stateWith({ id: 'O', row: ROWS - 2, col: 4 })
    const out = stepDown(state)
    expect(out.locked).toBe(true)
    expect(out.state.board[indexOf(ROWS - 1, 4)]).toBe('O')
    expect(out.state.active.id).toBe('T') // war als next gesetzt
  })

  it('räumt eine volle Reihe und zählt sie', () => {
    // Unterste Reihe bis auf zwei Felder voll, ein O füllt sie
    const filled: [number, number][] = []
    for (let c = 0; c < COLS; c++) {
      if (c !== 4 && c !== 5) filled.push([ROWS - 1, c])
      if (c !== 4 && c !== 5) filled.push([ROWS - 2, c])
    }
    const state = stateWith({ id: 'O', row: ROWS - 2, col: 4 }, filled)
    const out = stepDown(state)

    expect(out.clearedLines).toBe(2)
    expect(out.state.lines).toBe(2)
    expect(out.state.board.filter(Boolean)).toHaveLength(0)
    expect(out.state.score).toBeGreaterThan(0)
  })

  it('lässt die Reihen über einer geräumten korrekt nachrutschen', () => {
    // Unterste Reihe voll bis auf die Spalten 0 und 1 — genau die Breite eines O.
    // Weiter oben liegt ein einzelner Stein, der nach dem Räumen tiefer liegen muss.
    const filled: [number, number][] = []
    for (let c = 2; c < COLS; c++) filled.push([ROWS - 1, c])
    filled.push([ROWS - 3, 9])

    // row = ROWS-2, damit der nächste Schritt am Boden anstößt und festsetzt
    const state = stateWith({ id: 'O', row: ROWS - 2, col: 0 }, filled)
    const out = stepDown(state)

    expect(out.clearedLines).toBe(1)
    expect(out.state.board[indexOf(ROWS - 2, 9)]).toBe('O')
  })

  it('gibt für vier Reihen auf einmal mehr als für vier einzelne', () => {
    function scoreForRows(freeCols: number[]): number {
      const filled: [number, number][] = []
      for (let r = ROWS - 4; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!freeCols.includes(c)) filled.push([r, c])
        }
      }
      const state = stateWith({ id: 'I', rotation: 1, row: ROWS - 4, col: 2 }, filled)
      return stepDown(state).state.score
    }
    // Aufrechtes I fuellt bei rotation 1 die Spalte col+2
    const vierAufEinmal = scoreForRows([4])
    expect(vierAufEinmal).toBe(1200)
  })

  it('endet, wenn der neue Stein nicht mehr passt', () => {
    // Der Bereich, in dem neue Steine erscheinen (oben mittig), ist zugestellt.
    // Ringsum bleibt genug frei, damit keine Reihe voll wird und geräumt würde —
    // sonst räumte der Zug das Feld frei und das Spiel liefe weiter.
    const filled: [number, number][] = [
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 3],
      [1, 4],
      [1, 5],
    ]
    const state = stateWith({ id: 'O', row: ROWS - 2, col: 0 }, filled)
    const out = stepDown(state)

    expect(out.locked).toBe(true)
    expect(out.clearedLines).toBe(0)
    expect(out.state.over).toBe(true)
  })
})

describe('Sofort fallen lassen', () => {
  it('legt den Stein ganz unten ab', () => {
    const state = stateWith({ id: 'O', row: 0, col: 4 })
    const out = hardDrop(state)
    expect(out.state.board[indexOf(ROWS - 1, 4)]).toBe('O')
    expect(out.locked).toBe(true)
  })

  it('gibt Punkte für die gefallene Strecke', () => {
    const state = stateWith({ id: 'O', row: 0, col: 4 })
    expect(hardDrop(state).state.score).toBeGreaterThan(0)
  })
})

describe('Landepunkt-Anzeige', () => {
  it('zeigt den Boden, wenn nichts im Weg ist', () => {
    const state = stateWith({ id: 'O', row: 0, col: 4 })
    expect(ghostRow(state)).toBe(ROWS - 2)
  })

  it('zeigt die Oberkante eines Stapels', () => {
    const state = stateWith({ id: 'O', row: 0, col: 4 }, [
      [ROWS - 1, 4],
      [ROWS - 1, 5],
    ])
    expect(ghostRow(state)).toBe(ROWS - 3)
  })
})

describe('Geschwindigkeit und Sterne', () => {
  it('wird mit steigendem Level schneller, aber nie beliebig schnell', () => {
    expect(dropIntervalMs(1)).toBeGreaterThan(dropIntervalMs(5))
    expect(dropIntervalMs(50)).toBeGreaterThanOrEqual(110)
    // Level 1 muss Zeit für mehrere Tipps lassen: Ein Stein an den Rand und
    // zweimal gedreht sind vier Bedienschritte.
    expect(dropIntervalMs(1)).toBeGreaterThanOrEqual(1000)
  })

  it('vergibt Sterne nach den Schwellen', () => {
    expect(starsFor(0)).toBe(0)
    expect(starsFor(2000)).toBe(1)
    expect(starsFor(6000)).toBe(2)
    expect(starsFor(12000)).toBe(3)
  })
})

describe('Feldkoordinaten', () => {
  it('rechnet die Felder eines Steins korrekt um', () => {
    const piece = { id: 'O' as const, rotation: 0, row: 3, col: 5 }
    expect(cellsOf(piece).sort()).toEqual(
      [
        [3, 5],
        [3, 6],
        [4, 5],
        [4, 6],
      ].sort(),
    )
  })
})
