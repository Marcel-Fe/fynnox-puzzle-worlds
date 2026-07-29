import { ENERGY_REFILL_MS } from '../save/defaults'
import type { Profile } from '../save/types'

/**
 * Energie regeneriert auch, während die App geschlossen ist. Deshalb wird sie
 * nicht mitgezählt, sondern beim Öffnen aus dem Zeitstempel berechnet
 * (docs/01-gamedesign.md).
 *
 * Rein: `now` wird übergeben, nicht aus der Uhr gelesen.
 */
export function refillEnergy(profile: Profile, now: number): Profile {
  if (profile.energy >= profile.energyMax) {
    // Bei vollem Stand läuft die Uhr nicht weiter — sonst gäbe es beim ersten
    // Verbrauch sofort mehrere Einheiten geschenkt.
    return { ...profile, energyRefilledAt: now }
  }

  const elapsed = now - profile.energyRefilledAt
  if (elapsed < ENERGY_REFILL_MS) return profile

  const gained = Math.floor(elapsed / ENERGY_REFILL_MS)
  const energy = Math.min(profile.energyMax, profile.energy + gained)
  const consumed = energy - profile.energy

  return {
    ...profile,
    energy,
    energyRefilledAt: profile.energyRefilledAt + consumed * ENERGY_REFILL_MS,
  }
}

/** Millisekunden bis zur nächsten Energieeinheit; 0 bei vollem Stand. */
export function msUntilNextEnergy(profile: Profile, now: number): number {
  if (profile.energy >= profile.energyMax) return 0
  const elapsed = now - profile.energyRefilledAt
  return Math.max(0, ENERGY_REFILL_MS - (elapsed % ENERGY_REFILL_MS))
}
