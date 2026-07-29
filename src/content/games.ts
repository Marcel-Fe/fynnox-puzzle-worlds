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

/** Kategorien der Filterleiste in der Spieleauswahl (docs/01-gamedesign.md). */
export type GameCategory = 'puzzle' | 'karten' | 'sport'

export interface GameInfo {
  id: GameId
  title: string
  /** Drei Wörter, wie auf den Spielkacheln der Mockups */
  tagline: string
  /** Was die Begleitfigur zum Spiel sagt */
  hint: string
  /** Figur, die dieses Spiel erklärt (docs/02-charakterbibel.md) */
  companion: string
  category: GameCategory
  /** Welcher Bestwert auf der Kachel steht */
  bestLabel: 'Bestes Level' | 'Bestzeit'
  /** Tailwind-Token aus src/index.css */
  colorVar: string
  available: boolean
}

export const GAMES: GameInfo[] = [
  {
    id: 'blockfall',
    title: 'Blockfall',
    tagline: 'Klassisch. Schnell. Endloser Spaß.',
    hint: 'Oh nein! Die Kisten stapeln sich bis in den Himmel! Hilf mir, Reihen zu entfernen!',
    companion: 'Fynnox',
    category: 'puzzle',
    bestLabel: 'Bestes Level',
    colorVar: 'var(--color-game-blockfall)',
    available: false,
  },
  {
    id: 'waldbloecke',
    title: 'Waldblöcke',
    tagline: 'Plane klug. Fülle das Raster.',
    hint: 'Die Tiere brauchen Platz! Fülle das Spielfeld möglichst geschickt.',
    companion: 'Mira',
    category: 'puzzle',
    bestLabel: 'Bestes Level',
    colorVar: 'var(--color-game-waldbloecke)',
    available: false,
  },
  {
    id: 'tempelpaare',
    title: 'Tempelpaare',
    tagline: 'Finde die Paare. Räume den Tempel.',
    hint: 'Diese uralten Tempel bergen viele Geheimnisse. Finde alle passenden Steine.',
    companion: 'Finn',
    category: 'puzzle',
    bestLabel: 'Bestzeit',
    colorVar: 'var(--color-game-tempelpaare)',
    available: false,
  },
  {
    id: 'kristallmix',
    title: 'Kristallmix',
    tagline: 'Kombiniere. Sammle. Gewinne!',
    hint: 'Wow! Diese Kristalle versorgen unser Dorf mit Energie!',
    companion: 'Lumo',
    category: 'puzzle',
    bestLabel: 'Bestes Level',
    colorVar: 'var(--color-game-kristallmix)',
    available: false,
  },
  {
    id: 'solitaire',
    title: 'Fynnox Solitaire',
    tagline: 'Klassisch. Entspannt. Zeitlos.',
    hint: 'Zeit für eine kleine Pause. Lass uns gemeinsam Karten sortieren.',
    companion: 'Fynnox',
    category: 'karten',
    bestLabel: 'Bestzeit',
    colorVar: 'var(--color-game-solitaire)',
    available: false,
  },
  {
    id: 'minigolf',
    title: 'Fynnox Minigolf',
    tagline: 'Ziele. Schlage. Meistere den Kurs.',
    hint: 'Das schaffen wir mit einem perfekten Schlag!',
    companion: 'Pip',
    category: 'sport',
    bestLabel: 'Bestes Level',
    colorVar: 'var(--color-game-minigolf)',
    available: false,
  },
]
