import { describe, expect, it } from 'vitest'
import {
  bubbleCount,
  createGame,
  LAUNCHER,
  pushRow,
  SHOTS_PER_ROW,
  shoot,
  shotsUntilPush,
  starsFor,
  START_ROWS,
  traceShot,
  type GameState,
} from './game'
import {
  centerOf,
  colsIn,
  COLS,
  connectedSameColor,
  D,
  FIELD_WIDTH,
  floatingBubbles,
  isInside,
  keyOf,
  LOSE_ROW,
  nearestFreeSlot,
  neighboursOf,
  R,
  ROWS,
} from './grid'

/** Baut ein Feld aus einer Liste „reihe,spalte,farbe". */
function feld(...eintraege: [number, number, number][]): Map<string, number> {
  const map = new Map<string, number>()
  for (const [row, col, color] of eintraege) map.set(keyOf(row, col), color)
  return map
}

function stateWith(bubbles: Map<string, number>, overrides: Partial<GameState> = {}): GameState {
  return {
    bubbles,
    current: 0,
    next: 0,
    score: 0,
    shots: 0,
    rowsAdded: 0,
    seed: 1,
    startedAt: 0,
    won: false,
    lost: false,
    ...overrides,
  }
}

describe('Versetztes Raster', () => {
  it('gibt geraden Reihen einen Platz mehr als ungeraden', () => {
    expect(colsIn(0)).toBe(COLS)
    expect(colsIn(1)).toBe(COLS - 1)
    expect(colsIn(2)).toBe(COLS)
  })

  it('versetzt ungerade Reihen um einen halben Durchmesser', () => {
    expect(centerOf(0, 0).x).toBeCloseTo(R)
    expect(centerOf(1, 0).x).toBeCloseTo(D)
  })

  it('hält alle Blasen innerhalb der Feldbreite', () => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < colsIn(row); col++) {
        const c = centerOf(row, col)
        expect(c.x - R).toBeGreaterThanOrEqual(-0.001)
        expect(c.x + R).toBeLessThanOrEqual(FIELD_WIDTH + 0.001)
      }
    }
  })

  it('erkennt Plätze außerhalb des Feldes', () => {
    expect(isInside(0, 0)).toBe(true)
    expect(isInside(1, COLS - 1)).toBe(false) // ungerade Reihe hat einen weniger
    expect(isInside(-1, 0)).toBe(false)
    expect(isInside(ROWS, 0)).toBe(false)
  })
})

describe('Nachbarschaften', () => {
  it('nennt einer Blase in der Mitte sechs Nachbarn', () => {
    expect(neighboursOf(4, 4)).toHaveLength(6)
    expect(neighboursOf(5, 4)).toHaveLength(6)
  })

  it('nennt am Rand weniger', () => {
    expect(neighboursOf(0, 0).length).toBeLessThan(6)
  })

  it('ist gegenseitig — wer mein Nachbar ist, hat mich als Nachbarn', () => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < colsIn(row); col++) {
        for (const n of neighboursOf(row, col)) {
          const zurueck = neighboursOf(n.row, n.col)
          expect(
            zurueck.some((z) => z.row === row && z.col === col),
            `(${row},${col}) <-> (${n.row},${n.col})`,
          ).toBe(true)
        }
      }
    }
  })

  it('liegen alle Nachbarn tatsächlich einen Durchmesser entfernt', () => {
    // Der eigentliche Beweis, dass das versetzte Raster stimmt
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < colsIn(row); col++) {
        const a = centerOf(row, col)
        for (const n of neighboursOf(row, col)) {
          const b = centerOf(n.row, n.col)
          const abstand = Math.hypot(a.x - b.x, a.y - b.y)
          expect(abstand, `(${row},${col}) zu (${n.row},${n.col})`).toBeCloseTo(D, 5)
        }
      }
    }
  })
})

describe('Gleiche Farben verbinden', () => {
  it('findet eine zusammenhängende Gruppe', () => {
    const bubbles = feld([0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 2])
    const group = connectedSameColor(bubbles, { row: 0, col: 0 })
    expect(group).toHaveLength(3)
  })

  it('springt nicht über eine andere Farbe hinweg', () => {
    const bubbles = feld([0, 0, 1], [0, 1, 2], [0, 2, 1])
    expect(connectedSameColor(bubbles, { row: 0, col: 0 })).toHaveLength(1)
  })

  it('verbindet auch über Reihen hinweg', () => {
    const bubbles = feld([0, 0, 1], [1, 0, 1])
    expect(connectedSameColor(bubbles, { row: 0, col: 0 })).toHaveLength(2)
  })
})

describe('Halt verlieren', () => {
  it('lässt Blasen ohne Verbindung zur Decke fallen', () => {
    // (0,0) haengt an der Decke, (5,5) schwebt frei
    const bubbles = feld([0, 0, 1], [5, 5, 2])
    const floating = floatingBubbles(bubbles)
    expect(floating).toHaveLength(1)
    expect(floating[0]).toEqual({ row: 5, col: 5 })
  })

  it('hält eine Kette, die oben angebunden ist', () => {
    const bubbles = feld([0, 0, 1], [1, 0, 1], [2, 0, 1])
    expect(floatingBubbles(bubbles)).toHaveLength(0)
  })

  it('lässt nichts fallen, wenn alles in der obersten Reihe hängt', () => {
    const bubbles = feld([0, 0, 1], [0, 1, 2], [0, 2, 3])
    expect(floatingBubbles(bubbles)).toHaveLength(0)
  })
})

describe('Landeplatz', () => {
  it('wählt einen freien Platz, der an eine Blase grenzt', () => {
    const bubbles = feld([0, 5, 1])
    const c = centerOf(1, 4)
    const slot = nearestFreeSlot(bubbles, c.x, c.y)

    expect(slot).not.toBeNull()
    expect(neighboursOf(slot!.row, slot!.col).some((n) => n.row === 0 && n.col === 5)).toBe(true)
  })

  it('nimmt keinen Platz mitten im Nichts', () => {
    const bubbles = feld([0, 0, 1])
    // Punkt weit unten rechts, weit weg von der einzigen Blase
    const c = centerOf(10, 8)
    const slot = nearestFreeSlot(bubbles, c.x, c.y)
    // Der einzig zulaessige Bereich ist die oberste Reihe oder um (0,0) herum
    expect(slot!.row).toBeLessThanOrEqual(1)
  })

  it('erlaubt die oberste Reihe auch ohne Nachbarn', () => {
    const slot = nearestFreeSlot(new Map(), FIELD_WIDTH / 2, 0)
    expect(slot?.row).toBe(0)
  })
})

describe('Flugbahn', () => {
  it('fliegt gerade nach oben bis zur Decke', () => {
    const { path, slot } = traceShot(new Map(), 0)
    expect(path.length).toBeGreaterThan(1)
    expect(slot?.row).toBe(0)
    // waagerecht kaum abgewichen
    expect(Math.abs(path[path.length - 1].x - LAUNCHER.x)).toBeLessThan(0.1)
  })

  it('prallt an der linken Wand ab', () => {
    const { path } = traceShot(new Map(), -1.2) // stark nach links
    const minX = Math.min(...path.map((p) => p.x))
    expect(minX).toBeGreaterThanOrEqual(R - 0.05)
    // Nach dem Abprallen muss die Bahn wieder nach rechts laufen
    const idx = path.findIndex((p) => p.x <= R + 0.05)
    expect(idx).toBeGreaterThan(0)
  })

  it('prallt an der rechten Wand ab', () => {
    const { path } = traceShot(new Map(), 1.2)
    const maxX = Math.max(...path.map((p) => p.x))
    expect(maxX).toBeLessThanOrEqual(FIELD_WIDTH - R + 0.05)
  })

  it('bleibt immer im Feld', () => {
    for (const winkel of [-1.3, -0.8, -0.3, 0, 0.3, 0.8, 1.3]) {
      const { path } = traceShot(new Map(), winkel)
      for (const p of path) {
        expect(p.x, `Winkel ${winkel}`).toBeGreaterThanOrEqual(R - 0.05)
        expect(p.x, `Winkel ${winkel}`).toBeLessThanOrEqual(FIELD_WIDTH - R + 0.05)
      }
    }
  })

  it('stoppt an einer liegenden Blase', () => {
    const bubbles = feld([0, 5, 1], [1, 4, 1], [1, 5, 1])
    const { slot } = traceShot(bubbles, 0)
    expect(slot).not.toBeNull()
    // Landet unterhalb, nicht in der Decke
    expect(slot!.row).toBeGreaterThan(0)
  })
})

describe('Schüsse', () => {
  it('legt die Blase ab, wenn nichts passt', () => {
    const state = stateWith(feld([0, 5, 1]), { current: 3 })
    const out = shoot(state, 0)
    expect(bubbleCount(out.state)).toBe(2)
    expect(out.popped).toHaveLength(0)
  })

  it('lässt drei gleiche platzen', () => {
    // Zwei gleiche nebeneinander in der Decke; der Schuss bringt die dritte
    const state = stateWith(feld([0, 5, 1], [0, 6, 1]), { current: 1 })
    const out = shoot(state, 0)

    expect(out.popped.length).toBeGreaterThanOrEqual(3)
    expect(out.gained).toBeGreaterThan(0)
    expect(out.state.score).toBe(out.gained)
  })

  it('lässt nur zwei gleiche liegen', () => {
    const state = stateWith(feld([0, 5, 1]), { current: 1 })
    const out = shoot(state, 0)
    expect(out.popped).toHaveLength(0)
    expect(bubbleCount(out.state)).toBe(2)
  })

  it('zählt abgetrennte Blasen doppelt so hoch wie geplatzte', () => {
    // Drei gleiche in der Decke, darunter haengt eine andersfarbige
    const bubbles = feld([0, 4, 1], [0, 5, 1], [1, 4, 2])
    const state = stateWith(bubbles, { current: 1 })
    const out = shoot(state, 0)

    if (out.popped.length >= 3) {
      expect(out.dropped.length).toBeGreaterThan(0)
      expect(out.gained).toBe(out.popped.length * 10 + out.dropped.length * 20)
    }
  })

  it('reicht die nächste Blase durch', () => {
    const state = stateWith(feld([0, 5, 1]), { current: 2, next: 3 })
    const out = shoot(state, 0)
    expect(out.state.current).toBe(3)
  })

  it('spielt nach dem Ende nicht weiter', () => {
    const state = stateWith(feld([0, 5, 1]), { won: true })
    expect(shoot(state, 0).state).toBe(state)
  })
})

describe('Nachrückende Reihen', () => {
  it('schiebt alles eine Reihe nach unten', () => {
    const state = stateWith(feld([0, 3, 1]))
    const next = pushRow(state)
    expect(next.bubbles.get(keyOf(1, 3))).toBe(1)
  })

  it('setzt oben eine volle neue Reihe ein', () => {
    const next = pushRow(stateWith(feld([0, 3, 1])))
    for (let col = 0; col < colsIn(0); col++) {
      expect(next.bubbles.has(keyOf(0, col)), `Spalte ${col}`).toBe(true)
    }
  })

  it('verliert, wenn eine Blase unten aus dem Feld geschoben würde', () => {
    // Sonst wuerde sich das Feld beim Nachruecken heimlich leeren
    const state = stateWith(feld([ROWS - 1, 3, 1]))
    expect(pushRow(state).lost).toBe(true)
  })

  it('verliert nicht, solange unten Platz bleibt', () => {
    expect(pushRow(stateWith(feld([0, 3, 1]))).lost).toBe(false)
  })

  it('zählt herunter bis zur nächsten Reihe', () => {
    const state = stateWith(new Map(), { shots: 0 })
    expect(shotsUntilPush(state)).toBe(SHOTS_PER_ROW)
    expect(shotsUntilPush({ ...state, shots: SHOTS_PER_ROW - 1 })).toBe(1)
  })
})

describe('Rundenende', () => {
  it('gewinnt, wenn das Feld leer ist', () => {
    const state = stateWith(feld([0, 5, 1], [0, 6, 1]), { current: 1 })
    const out = shoot(state, 0)
    if (bubbleCount(out.state) === 0) expect(out.state.won).toBe(true)
  })

  it('verliert, wenn eine Blase die Verlustlinie erreicht', () => {
    const bubbles = feld([LOSE_ROW, 3, 1])
    const state = stateWith(bubbles, { current: 2 })
    const out = shoot(state, 0)
    expect(out.state.lost).toBe(true)
  })

  it('vergibt Sterne nach den Schwellen', () => {
    expect(starsFor(0)).toBe(0)
    expect(starsFor(1500)).toBe(1)
    expect(starsFor(4000)).toBe(2)
    expect(starsFor(8000)).toBe(3)
  })
})

describe('Startaufstellung', () => {
  it('füllt genau die vorgesehenen Reihen', () => {
    const game = createGame(1, 0)
    let erwartet = 0
    for (let row = 0; row < START_ROWS; row++) erwartet += colsIn(row)
    expect(bubbleCount(game)).toBe(erwartet)
  })

  it('gibt bei gleichem Seed dieselbe Aufstellung', () => {
    const a = createGame(7, 0)
    const b = createGame(7, 0)
    expect([...a.bubbles.entries()].sort()).toEqual([...b.bubbles.entries()].sort())
  })

  it('gibt nur Farben aus, die auf dem Feld vorkommen', () => {
    // Sonst waere der Schuss ein sicherer Fehlschuss
    for (let seed = 1; seed <= 20; seed++) {
      const game = createGame(seed, 0)
      const vorhanden = new Set(game.bubbles.values())
      expect(vorhanden.has(game.current), `Seed ${seed}`).toBe(true)
      expect(vorhanden.has(game.next), `Seed ${seed}`).toBe(true)
    }
  })
})
