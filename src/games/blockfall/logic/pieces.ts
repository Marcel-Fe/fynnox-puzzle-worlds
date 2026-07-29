/**
 * Die sieben Steine für Blockfall (docs/01-gamedesign.md).
 *
 * Jede Drehung ist als fertige Feldliste hinterlegt statt zur Laufzeit gedreht
 * zu werden. Das ist ausführlicher, aber die Steine sitzen dadurch immer genau
 * dort, wo sie sollen — beim Rechnen mit Drehmatrizen verrutscht besonders das
 * I-Stück gern um ein Feld.
 *
 * Koordinaten sind [Zeile, Spalte] innerhalb des Steinkastens, oben links [0,0].
 */
export type Cell = readonly [number, number]

export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export interface Piece {
  id: PieceId
  /** Vier Drehungen, im Uhrzeigersinn */
  rotations: readonly (readonly Cell[])[]
  /** Kantenlänge des Steinkastens — für die Vorschau */
  box: number
  colorVar: string
}

export const PIECES: Record<PieceId, Piece> = {
  I: {
    id: 'I',
    box: 4,
    colorVar: '--color-piece-i',
    rotations: [
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ],
    ],
  },
  O: {
    id: 'O',
    box: 2,
    colorVar: '--color-piece-o',
    rotations: [
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    ],
  },
  T: {
    id: 'T',
    box: 3,
    colorVar: '--color-piece-t',
    rotations: [
      [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [1, 2],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
    ],
  },
  S: {
    id: 'S',
    box: 3,
    colorVar: '--color-piece-s',
    rotations: [
      [
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 1],
        [1, 2],
        [2, 2],
      ],
      [
        [1, 1],
        [1, 2],
        [2, 0],
        [2, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
    ],
  },
  Z: {
    id: 'Z',
    box: 3,
    colorVar: '--color-piece-z',
    rotations: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [1, 2],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 1],
        [2, 0],
      ],
    ],
  },
  J: {
    id: 'J',
    box: 3,
    colorVar: '--color-piece-j',
    rotations: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [0, 2],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 0],
        [2, 1],
      ],
    ],
  },
  L: {
    id: 'L',
    box: 3,
    colorVar: '--color-piece-l',
    rotations: [
      [
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 0],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    ],
  },
}

export const PIECE_IDS: readonly PieceId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
