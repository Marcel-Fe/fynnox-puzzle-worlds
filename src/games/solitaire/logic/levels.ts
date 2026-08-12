/**
 * Die zwölf Level von Fynnox Solitaire (docs/01-gamedesign.md, Abschnitt 5).
 *
 * Vier Dreiergruppen über vier Schwierigkeitsachsen. Das Blatt selbst wird nie
 * manipuliert — schwerer wird nur, wie man an die Karten herankommt.
 */

export interface Level {
  number: number
  title: string
  /** Wie viele Karten ein Tipp auf den Ziehstapel aufdeckt */
  draw: number
  /** Wie oft der Talon umgedreht werden darf. `null` heißt unbegrenzt. */
  redeals: number | null
  hints: number
  /**
   * Wie viele Asse zu Beginn schon auf den Ablagestapeln liegen. Nimmt den
   * ersten beiden Leveln die Anlaufhürde, ohne die Regeln zu verbiegen.
   */
  placedAces: number
  /** Zeit für drei Sterne; bis zum Doppelten gibt es zwei */
  targetMs: number
}

const MIN = 60_000

export const LEVELS: readonly Level[] = [
  { number: 1, title: 'Erste Runde', draw: 1, redeals: null, hints: 3, placedAces: 2, targetMs: 6 * MIN },
  { number: 2, title: 'Aufwärmen', draw: 1, redeals: null, hints: 3, placedAces: 1, targetMs: 6 * MIN },
  { number: 3, title: 'Klassisch', draw: 1, redeals: null, hints: 3, placedAces: 0, targetMs: 5 * MIN },
  { number: 4, title: 'Weniger Hilfe', draw: 1, redeals: null, hints: 2, placedAces: 0, targetMs: 5 * MIN },
  { number: 5, title: 'Dreimal durch', draw: 1, redeals: 3, hints: 2, placedAces: 0, targetMs: 5 * MIN },
  { number: 6, title: 'Zweimal durch', draw: 1, redeals: 2, hints: 2, placedAces: 0, targetMs: 4.5 * MIN },
  { number: 7, title: 'Dreierzug', draw: 3, redeals: null, hints: 2, placedAces: 0, targetMs: 5 * MIN },
  { number: 8, title: 'Sparsam', draw: 3, redeals: null, hints: 1, placedAces: 0, targetMs: 4.5 * MIN },
  { number: 9, title: 'Enger Talon', draw: 3, redeals: 3, hints: 1, placedAces: 0, targetMs: 4.5 * MIN },
  { number: 10, title: 'Knapp', draw: 3, redeals: 2, hints: 1, placedAces: 0, targetMs: 4 * MIN },
  { number: 11, title: 'Ohne Hilfe', draw: 3, redeals: 2, hints: 0, placedAces: 0, targetMs: 4 * MIN },
  { number: 12, title: 'Meisterrunde', draw: 3, redeals: 1, hints: 0, placedAces: 0, targetMs: 3.5 * MIN },
]

export const LEVEL_COUNT = LEVELS.length

/** Klemmt auf den gültigen Bereich — ein Spielstand darf nie ins Leere zeigen. */
export function levelAt(number: number): Level {
  const index = Math.min(LEVELS.length, Math.max(1, Math.floor(number))) - 1
  return LEVELS[index]
}

/**
 * Welches Level als höchstes gespielt werden darf. Freigeschaltet wird durch
 * einen **Sieg**, darum steht in `highestLevel` das höchste gewonnene Level.
 */
export function unlockedLevels(highestLevel: number): number {
  return Math.min(LEVEL_COUNT, Math.max(1, highestLevel + 1))
}

/** Regeln eines Levels als Spielertext, für den Auswahlbildschirm. */
export function levelRules(level: Level): string {
  const parts = [
    level.draw === 1 ? 'eine Karte ziehen' : 'drei Karten ziehen',
    level.redeals === null
      ? 'Talon beliebig oft umdrehen'
      : level.redeals === 1
        ? 'Talon einmal umdrehen'
        : `Talon ${level.redeals}-mal umdrehen`,
    level.hints === 0
      ? 'kein Hinweis'
      : level.hints === 1
        ? 'ein Hinweis'
        : `${level.hints} Hinweise`,
  ]
  if (level.placedAces > 0) {
    parts.push(level.placedAces === 1 ? 'ein Ass liegt schon' : `${level.placedAces} Asse liegen schon`)
  }
  return parts.join(' · ')
}
