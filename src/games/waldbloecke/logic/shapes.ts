/**
 * Formenkatalog für Waldblöcke. Blöcke werden nicht gedreht (docs/01-gamedesign.md) —
 * gedrehte Varianten stehen deshalb als eigene Einträge im Katalog.
 *
 * Eine Form ist eine Liste besetzter Felder, jeweils [Zeile, Spalte], oben links bei [0,0].
 */
export type Cell = readonly [number, number]

export interface Shape {
  id: string
  cells: readonly Cell[]
  /** Anzahl Felder — bestimmt die Punkte beim Platzieren */
  size: number
  width: number
  height: number
}

function shape(id: string, cells: readonly Cell[]): Shape {
  return {
    id,
    cells,
    size: cells.length,
    width: Math.max(...cells.map((c) => c[1])) + 1,
    height: Math.max(...cells.map((c) => c[0])) + 1,
  }
}

export const SHAPES: readonly Shape[] = [
  shape('dot', [[0, 0]]),
  shape('h2', [
    [0, 0],
    [0, 1],
  ]),
  shape('v2', [
    [0, 0],
    [1, 0],
  ]),
  shape('h3', [
    [0, 0],
    [0, 1],
    [0, 2],
  ]),
  shape('v3', [
    [0, 0],
    [1, 0],
    [2, 0],
  ]),
  shape('h4', [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ]),
  shape('v4', [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]),
  shape('square2', [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]),
  shape('square3', [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ]),
  shape('lTopLeft', [
    [0, 0],
    [1, 0],
    [1, 1],
  ]),
  shape('lTopRight', [
    [0, 1],
    [1, 0],
    [1, 1],
  ]),
  shape('lBottomLeft', [
    [0, 0],
    [0, 1],
    [1, 0],
  ]),
  shape('lBottomRight', [
    [0, 0],
    [0, 1],
    [1, 1],
  ]),
  shape('lBig1', [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
  ]),
  shape('lBig2', [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [2, 0],
  ]),
  shape('tShape', [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ]),
  shape('sShape', [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ]),
  shape('zShape', [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ]),
]
