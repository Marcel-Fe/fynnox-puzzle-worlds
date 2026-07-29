/**
 * Die sechs Spiele. IDs sind unveränderlich (siehe CLAUDE.md).
 * Regeln und Kurztexte stammen aus docs/01-gamedesign.md, Farben aus docs/03-art-ui-guide.md.
 */
export type GameId =
  | 'blockfall'
  | 'waldbloecke'
  | 'tempelpaare'
  | 'kristallmix'
  | 'solitaire'
  | 'minigolf'

export interface GameInfo {
  id: GameId
  title: string
  /** Drei Wörter, wie auf den Spielkacheln der Mockups */
  tagline: string
  /** Was Fynnox zum Spiel sagt */
  hint: string
  /** Tailwind-Token aus src/index.css */
  colorVar: string
  available: boolean
}

export const GAMES: GameInfo[] = [
  {
    id: 'blockfall',
    title: 'Blockfall',
    tagline: 'Klassisch. Schnell. Endloser Spaß.',
    hint: 'Räume Reihen ab und verhindere, dass die Blöcke den Himmel erreichen!',
    colorVar: 'var(--color-game-blockfall)',
    available: false,
  },
  {
    id: 'waldbloecke',
    title: 'Waldblöcke',
    tagline: 'Plane klug. Fülle das Raster.',
    hint: 'Fülle das Raster mit Blöcken und sammle Sterne!',
    colorVar: 'var(--color-game-waldbloecke)',
    available: false,
  },
  {
    id: 'tempelpaare',
    title: 'Tempelpaare',
    tagline: 'Finde die Paare. Räume den Tempel.',
    hint: 'Finde alle passenden Paare und räume den Tempel!',
    colorVar: 'var(--color-game-tempelpaare)',
    available: false,
  },
  {
    id: 'kristallmix',
    title: 'Kristallmix',
    tagline: 'Kombiniere. Sammle. Gewinne!',
    hint: 'Kombiniere Kristalle und erzeuge mächtige Explosionen!',
    colorVar: 'var(--color-game-kristallmix)',
    available: false,
  },
  {
    id: 'solitaire',
    title: 'Fynnox Solitaire',
    tagline: 'Klassisch. Entspannt. Zeitlos.',
    hint: 'Sortiere alle Karten auf die Stapel und gewinne das Spiel!',
    colorVar: 'var(--color-game-solitaire)',
    available: false,
  },
  {
    id: 'minigolf',
    title: 'Fynnox Minigolf',
    tagline: 'Ziele. Schlage. Meistere den Kurs.',
    hint: 'Ziele, schlage und loch ein! Hole in One für extra Sterne!',
    colorVar: 'var(--color-game-minigolf)',
    available: false,
  },
]
