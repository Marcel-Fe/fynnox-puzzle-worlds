import { asset } from './assets'

/**
 * Kapitel des Abenteuerpfads (docs/01-gamedesign.md, Entwurf B).
 *
 * Ein Kapitel je Welt, 15 Knoten je Kapitel. Es gibt nur Kapitel, für die eine
 * Kulisse in `public/art/bg/` existiert — Candy, Steampunk und Weltraum fehlen,
 * weil dazu kein Bildmaterial vorliegt. Erfunden wird hier keins
 * (CLAUDE.md, Abschnitt Grafik).
 *
 * Keine zwei Kapitel tragen dieselbe Farbe, damit sich Fortschrittsbalken und
 * Knoten zweier Kapitel nie gleich anfühlen.
 */
export interface Chapter {
  number: number
  /** Deutscher Anzeigename (docs/01-gamedesign.md, Namensdisziplin) */
  world: string
  /** Was Fynnox über diesen Abschnitt der Reise sagt */
  intro: string
  image: string
  accent: string
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    world: 'Sonnenwald',
    intro: 'Hier hat alles angefangen. Halt die Augen offen — der Wald steckt voller Freunde!',
    image: asset('bg/sonnenwald.jpg'),
    accent: 'var(--color-game-waldbloecke)',
  },
  {
    number: 2,
    world: 'Kristallhöhlen',
    intro: 'Achte auf das Leuchten. Wo Kristalle wachsen, ist der Weg selten gerade.',
    image: asset('bg/kristallhoehle.jpg'),
    accent: 'var(--color-game-kristallmix)',
  },
  {
    number: 3,
    world: 'Lavawelt',
    intro: 'Warm hier! Bleib auf dem Pfad, dann passiert uns nichts.',
    image: asset('bg/lavatal.jpg'),
    accent: 'var(--color-game-tempelpaare)',
  },
  {
    number: 4,
    world: 'Pirateninsel',
    intro: 'Riechst du das Salz? Irgendwo hier soll ein Schatz vergraben sein.',
    image: asset('bg/piratenbucht.jpg'),
    accent: 'var(--color-game-minigolf)',
  },
  {
    number: 5,
    world: 'Schneewelt',
    intro: 'Zieh dich warm an. Der Aufstieg ist steil, aber die Aussicht lohnt sich.',
    image: asset('bg/wintergipfel.jpg'),
    accent: 'var(--color-game-blockfall)',
  },
  {
    number: 6,
    world: 'Wolkeninsel',
    intro: 'Weiter oben waren wir noch nie. Von hier sieht man alle Welten auf einmal.',
    image: asset('bg/wolkeninsel.jpg'),
    accent: 'var(--color-game-solitaire)',
  },
  {
    number: 7,
    world: 'Tempelruinen',
    intro: 'Ganz leise jetzt. Diese Steine sind älter als alle Geschichten, die ich kenne.',
    image: asset('bg/tempel.jpg'),
    accent: 'var(--color-game-bubbleshooter)',
  },
  {
    number: 8,
    world: 'Unterwasserwelt',
    intro: 'Einmal tief einatmen — unter uns liegt ein ganzes Riff voller Geschichten.',
    image: asset('bg/unterwasser.jpg'),
    accent: 'var(--color-game-sudoku)',
  },
  {
    number: 9,
    world: 'Fynnox City',
    intro: 'Hier war ich lange nicht mehr. Komm mit an die Promenade — die Stadt schläft nie.',
    image: asset('bg/stadt.jpg'),
    // Neunte Farbe: Die acht Spielfarben sind vergeben, Gold gehoert dem
    // hervorgehobenen Knoten. Bleibt das Violett der Kopfzeile.
    accent: 'var(--color-purple)',
  },
]

/** Aus dem Mockup: „Kapitel 4 · Kristallhöhle" mit Fortschrittsbalken 8/15. */
export const NODES_PER_CHAPTER = 15

/** Fynnox' Satz unter dem Pfad (docs/02-charakterbibel.md, Mockup). */
export const ADVENTURE_LINE =
  'Je weiter wir reisen, desto mehr Freunde und Schätze warten auf uns!'

export const ADVENTURE_DONE_LINE =
  'Alle Kapitel geschafft! Neue Welten kommen dazu, sobald ich sie gezeichnet habe.'
