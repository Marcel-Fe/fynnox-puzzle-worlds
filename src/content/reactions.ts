import { asset } from './assets'

/**
 * Was Fynnox nach einer Runde sagt (docs/02-charakterbibel.md, „Reaktion nach
 * einer Runde"). Gilt in allen sieben Spielen gleich.
 *
 * Fynnox kommentiert nie die Regeln eines einzelnen Spiels — das bleibt Sache
 * der jeweiligen Begleitfigur — sondern nur, wie die Runde ausgegangen ist.
 */

export type Mood = 'jubel' | 'still'

export const FYNNOX_FACES: Record<Mood, string> = {
  jubel: asset('chars/fynnox-jubel.jpg'),
  /*
   * Kein trauriges Gesicht: In keinem Konzeptbild gibt es einen enttäuschten
   * Fynnox. Das hier ist dieselbe Figur in der Dämmerungsszene — gedämpftes
   * Licht statt gespielter Trauer. Die Enttäuschung trägt der Text.
   */
  still: asset('chars/fynnox-still.jpg'),
}

const LINES: Record<Mood, readonly string[]> = {
  jubel: [
    'Das war stark! Ich wusste, dass wir das schaffen.',
    'Geschafft! Auf dich ist Verlass, Abenteurer.',
    'Sauber gespielt! Mit dir macht das richtig Spaß.',
  ],
  still: [
    'Knapp daneben. Beim nächsten Mal holen wir uns das.',
    'Kopf hoch! Auch ich brauche manchmal mehrere Anläufe — das schaffen wir.',
    'Das war eine harte Runde. Einmal durchatmen, dann nehmen wir sie uns nochmal vor.',
  ],
}

/**
 * Wählt die Zeile aus dem Rundenergebnis statt per Zufall. Zwei Gründe:
 * Bei jedem Neuzeichnen des Bildschirms würde sonst ein anderer Satz stehen,
 * und ungesäter Zufall ist im Projekt ohnehin nicht erlaubt.
 */
export function fynnoxLine(mood: Mood, seed: number): string {
  const lines = LINES[mood]
  const index = Math.abs(Math.trunc(seed)) % lines.length
  return lines[index]
}

export function moodFor(won: boolean): Mood {
  return won ? 'jubel' : 'still'
}
