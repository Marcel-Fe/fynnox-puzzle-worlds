/**
 * Feldaufbau für Tempelpaare (docs/01-gamedesign.md).
 *
 * Die Steine liegen in einem ganzzahligen Raster aus drei Schichten — bewusst
 * ohne den halben Versatz des klassischen Mahjong. Auf einem Handybildschirm
 * wären versetzte Steine zu klein zum Treffen, und die Freiheitsregel bliebe
 * kaum nachvollziehbar.
 */
export interface Position {
  layer: number
  row: number
  col: number
}

export const GRID_COLS = 6
export const GRID_ROWS = 4

/**
 * Pyramide aus 36 Steinen = 18 Paare:
 *   Schicht 0: 6 × 4 = 24
 *   Schicht 1: 4 × 2 = 8  (mittig)
 *   Schicht 2: 2 × 2 = 4  (mittig)
 * Jede höhere Schicht liegt vollständig auf der darunter.
 */
export function buildLayout(): Position[] {
  const positions: Position[] = []

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      positions.push({ layer: 0, row, col })
    }
  }
  for (let row = 1; row <= 2; row++) {
    for (let col = 1; col <= 4; col++) {
      positions.push({ layer: 1, row, col })
    }
  }
  for (let row = 1; row <= 2; row++) {
    for (let col = 2; col <= 3; col++) {
      positions.push({ layer: 2, row, col })
    }
  }

  return positions
}

/** Symbole passend zur Waldwelt statt chinesischer Zeichen. */
export const SYMBOLS = [
  '🍄',
  '🌰',
  '🍃',
  '🌸',
  '🔥',
  '❄️',
  '⭐',
  '💧',
  '🌙',
  '🍯',
  '🪶',
  '🐚',
  '🌿',
  '🪵',
  '🔮',
  '🕯️',
  '🗝️',
  '🪺',
] as const
