import { describe, expect, it } from 'vitest'
import { FYNNOX_FACES, fynnoxLine, moodFor } from './reactions'

describe('Fynnox reagiert auf die Runde', () => {
  it('jubelt beim Sieg und wird bei der Niederlage still', () => {
    expect(moodFor(true)).toBe('jubel')
    expect(moodFor(false)).toBe('still')
  })

  it('hat für beide Stimmungen ein eigenes Porträt', () => {
    expect(FYNNOX_FACES.jubel).toContain('fynnox-jubel')
    expect(FYNNOX_FACES.still).toContain('fynnox-still')
    expect(FYNNOX_FACES.jubel).not.toBe(FYNNOX_FACES.still)
  })

  it('liefert zu jedem Ergebnis eine Zeile', () => {
    for (const mood of ['jubel', 'still'] as const) {
      for (let seed = -20; seed <= 20; seed++) {
        expect(fynnoxLine(mood, seed), `${mood} bei ${seed}`).toBeTruthy()
      }
    }
  })

  it('bleibt bei gleichem Ergebnis bei derselben Zeile', () => {
    // Sonst wechselte der Satz bei jedem Neuzeichnen des Bildschirms
    expect(fynnoxLine('jubel', 7)).toBe(fynnoxLine('jubel', 7))
    expect(fynnoxLine('still', 3)).toBe(fynnoxLine('still', 3))
  })

  it('nutzt über die Ergebnisse hinweg alle Zeilen', () => {
    for (const mood of ['jubel', 'still'] as const) {
      const gesehen = new Set(Array.from({ length: 12 }, (_, i) => fynnoxLine(mood, i)))
      expect(gesehen.size, `${mood} nutzt nur ${gesehen.size} Zeilen`).toBeGreaterThan(1)
    }
  })

  it('macht dem Spieler nie einen Vorwurf', () => {
    // Die Charakterbibel verlangt ermutigend statt bedauernd
    const verboten = /verloren|schlecht|leider|schade|falsch|versagt/i
    for (let seed = 0; seed < 12; seed++) {
      expect(fynnoxLine('still', seed)).not.toMatch(verboten)
    }
  })

  it('spricht den Spieler in der Wir-Form oder per Du an', () => {
    // Sprechstil aus der Charakterbibel: „immer in der Wir-Form, wenn es ums
    // Spielen geht", und der Spieler wird geduzt.
    const wirOderDu = /\bwir\b|\bdu\b|\bdich\b|\bdir\b|\bAbenteurer\b/i
    for (const mood of ['jubel', 'still'] as const) {
      for (let seed = 0; seed < 6; seed++) {
        expect(fynnoxLine(mood, seed), `${mood}/${seed}`).toMatch(wirOderDu)
      }
    }
  })
})
