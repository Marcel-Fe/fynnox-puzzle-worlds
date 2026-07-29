import { asset } from './assets'

/**
 * Die acht Spiele. IDs sind unveränderlich (siehe CLAUDE.md).
 * Regeln und Kurztexte stammen aus docs/01-gamedesign.md, Farben aus docs/03-art-ui-guide.md.
 */
export type GameId =
  | 'blockfall'
  | 'waldbloecke'
  | 'tempelpaare'
  | 'kristallmix'
  | 'solitaire'
  | 'minigolf'
  | 'sudoku'
  | 'bubbleshooter'

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
  /** Vorschaubild der Kachel, aus den Konzeptbildern geschnitten */
  image: string
  /** Kulisse hinter dem Spielfeld */
  bg: string
  /**
   * Schriftfarbe auf der Spielfarbe. Waldblöcke ist so hell, dass weiß darauf
   * nur 2,2:1 erreicht — dort muss dunkel geschrieben werden.
   */
  textOnColor: 'light' | 'dark'
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
    image: asset('games/blockfall.jpg'),
    bg: asset('bg/kristallhoehle.jpg'),
    textOnColor: 'light',
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
    image: asset('games/waldbloecke.jpg'),
    bg: asset('bg/sonnenwald.jpg'),
    textOnColor: 'dark',
    available: true,
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
    image: asset('games/tempelpaare.jpg'),
    bg: asset('bg/tempel.jpg'),
    textOnColor: 'light',
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
    image: asset('games/kristallmix.jpg'),
    bg: asset('bg/kristallhoehle.jpg'),
    textOnColor: 'light',
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
    image: asset('games/solitaire.jpg'),
    bg: asset('bg/sonnenwald.jpg'),
    textOnColor: 'light',
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
    image: asset('games/minigolf.jpg'),
    bg: asset('bg/sonnenwald.jpg'),
    textOnColor: 'light',
    available: false,
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    tagline: 'Denke scharf. Fülle das Gitter.',
    hint: 'Zahlen wollen Geduld. Nimm dir Zeit, junger Freund.',
    companion: 'Elda',
    category: 'puzzle',
    bestLabel: 'Bestzeit',
    colorVar: 'var(--color-game-sudoku)',
    image: asset('games/sudoku.jpg'),
    bg: asset('bg/wintergipfel.jpg'),
    textOnColor: 'light',
    available: false,
  },
  {
    id: 'bubbleshooter',
    title: 'Bubble Shooter',
    tagline: 'Ziele. Triff. Lass es platzen.',
    hint: 'Drei gleiche Farben und schon platzt es — wie ein guter Rhythmus!',
    companion: 'Juno',
    category: 'puzzle',
    bestLabel: 'Bestes Level',
    colorVar: 'var(--color-game-bubbleshooter)',
    image: asset('games/bubbleshooter.jpg'),
    bg: asset('bg/kristallhoehle.jpg'),
    textOnColor: 'light',
    available: false,
  },
]

export const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameId,
  GameInfo
>
