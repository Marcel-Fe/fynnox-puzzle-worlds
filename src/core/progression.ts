/**
 * Balancing-Formeln aus docs/01-gamedesign.md.
 * Sie wurden aus den Werten der Mockups abgeleitet — nicht ändern, ohne das
 * Dokument mitzuändern.
 */

/** Probe: Level 12 → 3.500, genau der Wert auf dem Mockup. */
export function xpForNextLevel(level: number): number {
  return 500 + level * 250
}

/** Probe: Level 12 → 2.000 Münzen, genau der Wert auf dem Mockup. */
export function levelUpCoins(level: number): number {
  return 200 + level * 150
}

/** Probe: Level 12 → 50 Kristalle, genau der Wert auf dem Mockup. */
export function levelUpCrystals(level: number): number {
  return 10 + Math.floor(level / 3) * 10
}

export function xpForRound(score: number, won: boolean): number {
  const base = 20 + Math.floor(score / 100)
  return won ? Math.floor(base * 1.5) : base
}

export function coinsForRound(score: number, won: boolean): number {
  const base = 10 + Math.floor(score / 500)
  return won ? base + 20 : base
}
