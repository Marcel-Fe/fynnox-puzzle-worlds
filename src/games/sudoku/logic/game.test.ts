import { describe, expect, it } from 'vitest'
import {
  countPlaced,
  createGame,
  enterValue,
  MAX_MISTAKES,
  remainingCells,
  scoreFor,
  selectCell,
  starsFor,
  toggleNoteMode,
  undo,
  useHint,
  type GameState,
} from './game'
import {
  boxOf,
  CELLS,
  colOf,
  countSolutions,
  createPuzzle,
  createSolution,
  indexOf,
  isAllowed,
  isSolved,
  peersOf,
  rowOf,
  SIZE,
  type Difficulty,
} from './grid'

/**
 * Setzt eine Zahl in ein bestimmtes Feld.
 *
 * Die Auswahl wird direkt gesetzt, nicht über `selectCell` — das schaltet um
 * und würde beim zweiten Zugriff aufs selbe Feld die Auswahl aufheben.
 */
function setAt(state: GameState, index: number, value: number) {
  return enterValue({ ...state, selected: index }, value)
}

/** Löst das Spiel vollständig, indem überall die richtige Zahl gesetzt wird. */
function solveAll(state: GameState): GameState {
  let current = state
  for (let i = 0; i < CELLS; i++) {
    if (current.cells[i].fixed) continue
    current = setAt(current, i, current.solution[i]).state
  }
  return current
}

describe('Gitterregeln', () => {
  it('rechnet Zeile, Spalte und Block korrekt aus', () => {
    expect(rowOf(indexOf(4, 7))).toBe(4)
    expect(colOf(indexOf(4, 7))).toBe(7)
    expect(boxOf(indexOf(0, 0))).toBe(0)
    expect(boxOf(indexOf(4, 4))).toBe(4)
    expect(boxOf(indexOf(8, 8))).toBe(8)
    expect(boxOf(indexOf(0, 8))).toBe(2)
  })

  it('nennt für jedes Feld genau 20 verbundene Felder', () => {
    // 8 in der Zeile + 8 in der Spalte + 4 im Block, die nicht schon zaehlen
    expect(peersOf(indexOf(0, 0))).toHaveLength(20)
    expect(peersOf(indexOf(4, 4))).toHaveLength(20)
  })

  it('verbietet dieselbe Zahl in Zeile, Spalte und Block', () => {
    const grid = new Array(CELLS).fill(0)
    grid[indexOf(0, 0)] = 5

    expect(isAllowed(grid, indexOf(0, 5), 5)).toBe(false) // gleiche Zeile
    expect(isAllowed(grid, indexOf(5, 0), 5)).toBe(false) // gleiche Spalte
    expect(isAllowed(grid, indexOf(1, 1), 5)).toBe(false) // gleicher Block
    expect(isAllowed(grid, indexOf(4, 4), 5)).toBe(true) // unbeteiligt
  })
})

describe('Vollständiges Gitter', () => {
  it('erzeugt ein gültiges, vollständiges Gitter', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { grid } = createSolution(seed)
      expect(grid.filter((v) => v === 0), `Seed ${seed}`).toHaveLength(0)
      expect(isSolved(grid), `Seed ${seed}`).toBe(true)
    }
  })

  it('nutzt jede Zahl genau neunmal', () => {
    const { grid } = createSolution(4)
    for (let v = 1; v <= SIZE; v++) {
      expect(grid.filter((x) => x === v)).toHaveLength(9)
    }
  })

  it('gibt bei gleichem Seed dasselbe Gitter', () => {
    expect(createSolution(17).grid).toEqual(createSolution(17).grid)
  })
})

describe('Lösungszähler', () => {
  it('findet genau eine Lösung für ein vollständiges Gitter', () => {
    expect(countSolutions(createSolution(2).grid)).toBe(1)
  })

  it('findet keine Lösung für ein widersprüchliches Gitter', () => {
    const grid = new Array(CELLS).fill(0)
    grid[indexOf(0, 0)] = 1
    grid[indexOf(0, 1)] = 1
    expect(countSolutions(grid)).toBe(0)
  })

  it('erkennt mehrdeutige Rätsel', () => {
    // Ein fast leeres Gitter hat sehr viele Loesungen
    const grid = new Array(CELLS).fill(0)
    expect(countSolutions(grid)).toBe(2) // bricht beim Limit ab
  })
})

describe('Rätselerzeugung', () => {
  const stufen: Difficulty[] = ['leicht', 'mittel', 'schwer']

  it('erzeugt für jede Stufe ein eindeutig lösbares Rätsel', () => {
    for (const difficulty of stufen) {
      for (let seed = 1; seed <= 5; seed++) {
        const { puzzle } = createPuzzle(seed, difficulty)
        expect(countSolutions(puzzle), `${difficulty}, Seed ${seed}`).toBe(1)
      }
    }
  })

  it('behält die Vorgaben aus der Lösung bei', () => {
    const { puzzle, solution } = createPuzzle(3, 'mittel')
    for (let i = 0; i < CELLS; i++) {
      if (puzzle[i] !== 0) expect(puzzle[i]).toBe(solution[i])
    }
  })

  it('lässt schwerere Stufen mit weniger Zahlen beginnen', () => {
    const leicht = createPuzzle(6, 'leicht').puzzle.filter((v) => v !== 0).length
    const schwer = createPuzzle(6, 'schwer').puzzle.filter((v) => v !== 0).length
    expect(schwer).toBeLessThan(leicht)
  })

  it('gibt bei gleichem Seed dasselbe Rätsel', () => {
    expect(createPuzzle(9, 'mittel').puzzle).toEqual(createPuzzle(9, 'mittel').puzzle)
  })
})

describe('Auswahl', () => {
  it('wählt ein Feld aus und beim erneuten Antippen wieder ab', () => {
    const game = createGame(1, 'leicht', 0)
    const gewaehlt = selectCell(game, 5)
    expect(gewaehlt.selected).toBe(5)
    expect(selectCell(gewaehlt, 5).selected).toBeNull()
    expect(selectCell(gewaehlt, 7).selected).toBe(7)
  })
})

describe('Eintragen', () => {
  it('trägt eine richtige Zahl ein', () => {
    const game = createGame(1, 'leicht', 0)
    const leer = game.cells.findIndex((c) => !c.fixed)
    const out = setAt(game, leer, game.solution[leer])

    expect(out.outcome).toBe('set')
    expect(out.state.cells[leer].value).toBe(game.solution[leer])
    expect(out.state.cells[leer].wrong).toBe(false)
    expect(out.state.mistakes).toBe(0)
  })

  it('lässt eine falsche Zahl sichtbar stehen und zählt einen Fehler', () => {
    const game = createGame(1, 'leicht', 0)
    const leer = game.cells.findIndex((c) => !c.fixed)
    const falsch = (game.solution[leer] % 9) + 1
    const out = setAt(game, leer, falsch)

    expect(out.outcome).toBe('wrong')
    expect(out.state.cells[leer].value).toBe(falsch)
    expect(out.state.cells[leer].wrong).toBe(true)
    expect(out.state.mistakes).toBe(1)
  })

  it('lässt vorgegebene Zahlen nicht ändern', () => {
    const game = createGame(1, 'leicht', 0)
    const fest = game.cells.findIndex((c) => c.fixed)
    const out = setAt(game, fest, 5)

    expect(out.outcome).toBe('blocked')
    expect(out.state.cells[fest].value).toBe(game.cells[fest].value)
  })

  it('leert ein Feld mit der Null', () => {
    const game = createGame(1, 'leicht', 0)
    const leer = game.cells.findIndex((c) => !c.fixed)
    const gesetzt = setAt(game, leer, game.solution[leer]).state
    const out = setAt(gesetzt, leer, 0)

    expect(out.outcome).toBe('cleared')
    expect(out.state.cells[leer].value).toBe(0)
  })

  it('verliert nach drei Fehlern', () => {
    let game = createGame(1, 'leicht', 0)
    const leere = game.cells.map((c, i) => (c.fixed ? -1 : i)).filter((i) => i >= 0)

    for (let n = 0; n < MAX_MISTAKES; n++) {
      const index = leere[n]
      game = setAt(game, index, (game.solution[index] % 9) + 1).state
    }

    expect(game.mistakes).toBe(MAX_MISTAKES)
    expect(game.lost).toBe(true)
  })

  it('spielt nach dem Verlieren nicht weiter', () => {
    const game: GameState = { ...createGame(1, 'leicht', 0), lost: true }
    expect(setAt(game, 0, 5).outcome).toBe('blocked')
  })
})

describe('Notizen', () => {
  it('setzt und entfernt Notizen im Notizmodus', () => {
    const game = toggleNoteMode(createGame(1, 'leicht', 0))
    const leer = game.cells.findIndex((c) => !c.fixed)

    const mit = setAt(game, leer, 4)
    expect(mit.outcome).toBe('note')
    expect(mit.state.cells[leer].notes).toContain(4)
    expect(mit.state.cells[leer].value).toBe(0)

    const ohne = enterValue(mit.state, 4)
    expect(ohne.state.cells[leer].notes).not.toContain(4)
  })

  it('streicht die Notiz bei verbundenen Feldern, wenn die Zahl gesetzt wird', () => {
    let game = createGame(1, 'leicht', 0)
    const ziel = game.cells.findIndex((c) => !c.fixed)
    const wert = game.solution[ziel]

    // Bei einem verbundenen leeren Feld dieselbe Zahl notieren
    const nachbar = peersOf(ziel).find((i) => !game.cells[i].fixed)!
    game = toggleNoteMode(game)
    game = setAt(game, nachbar, wert).state
    game = toggleNoteMode(game)
    expect(game.cells[nachbar].notes).toContain(wert)

    game = setAt(game, ziel, wert).state
    expect(game.cells[nachbar].notes).not.toContain(wert)
  })
})

describe('Rückgängig', () => {
  it('nimmt den letzten Zug zurück', () => {
    const game = createGame(1, 'leicht', 0)
    const leer = game.cells.findIndex((c) => !c.fixed)
    const gesetzt = setAt(game, leer, game.solution[leer]).state

    expect(gesetzt.cells[leer].value).not.toBe(0)
    expect(undo(gesetzt).cells[leer].value).toBe(0)
  })

  it('tut nichts, wenn es nichts zurückzunehmen gibt', () => {
    const game = createGame(1, 'leicht', 0)
    expect(undo(game).cells).toEqual(game.cells)
  })

  it('nimmt gezählte Fehler nicht zurück', () => {
    const game = createGame(1, 'leicht', 0)
    const leer = game.cells.findIndex((c) => !c.fixed)
    const falsch = setAt(game, leer, (game.solution[leer] % 9) + 1).state
    expect(undo(falsch).mistakes).toBe(1)
  })
})

describe('Hinweise', () => {
  it('trägt die richtige Zahl ein und verbraucht einen Hinweis', () => {
    const game = createGame(1, 'leicht', 0)
    const out = useHint(game)

    expect(out.index).not.toBeNull()
    expect(out.state.hints).toBe(game.hints - 1)
    expect(out.state.cells[out.index!].value).toBe(game.solution[out.index!])
    expect(out.state.cells[out.index!].fixed).toBe(true)
  })

  it('füllt bevorzugt das ausgewählte Feld', () => {
    const game = createGame(1, 'leicht', 0)
    const leere = game.cells.map((c, i) => (c.fixed ? -1 : i)).filter((i) => i >= 0)
    const ziel = leere[leere.length - 1]

    const out = useHint(selectCell(game, ziel))
    expect(out.index).toBe(ziel)
  })

  it('gibt keinen Hinweis mehr, wenn keiner übrig ist', () => {
    let game = createGame(1, 'leicht', 0)
    for (let i = 0; i < 3; i++) game = useHint(game).state
    expect(game.hints).toBe(0)

    const out = useHint(game)
    expect(out.index).toBeNull()
    expect(out.state.hints).toBe(0)
  })
})

describe('Rundenende', () => {
  it('gewinnt, wenn das Gitter vollständig richtig ist', () => {
    const game = solveAll(createGame(2, 'leicht', 0))
    expect(game.won).toBe(true)
    expect(remainingCells(game)).toBe(0)
  })

  it('zählt gesetzte Zahlen für den Zahlenblock', () => {
    const game = solveAll(createGame(2, 'leicht', 0))
    for (let v = 1; v <= 9; v++) expect(countPlaced(game, v)).toBe(9)
  })

  it('vergibt drei Sterne nur bei fehlerfreier und schneller Lösung', () => {
    const gewonnen = solveAll(createGame(2, 'leicht', 0))
    expect(starsFor(gewonnen, 5 * 60_000)).toBe(3)
    expect(starsFor(gewonnen, 15 * 60_000)).toBe(2)
    expect(starsFor(gewonnen, 25 * 60_000)).toBe(1)
    expect(starsFor({ ...gewonnen, mistakes: 1 }, 5 * 60_000)).toBe(2)
    expect(starsFor({ ...gewonnen, won: false }, 5 * 60_000)).toBe(0)
  })

  it('gibt für schwerere Stufen mehr Punkte', () => {
    const leicht = solveAll(createGame(2, 'leicht', 0))
    const schwer = { ...leicht, difficulty: 'schwer' as const }
    expect(scoreFor(schwer, 60_000)).toBeGreaterThan(scoreFor(leicht, 60_000))
  })

  it('zieht für Fehler Punkte ab und gibt für Tempo welche dazu', () => {
    const game = solveAll(createGame(2, 'leicht', 0))
    expect(scoreFor({ ...game, mistakes: 2 }, 60_000)).toBeLessThan(scoreFor(game, 60_000))
    expect(scoreFor(game, 30_000)).toBeGreaterThan(scoreFor(game, 300_000))
    expect(scoreFor({ ...game, won: false }, 60_000)).toBe(0)
  })
})
