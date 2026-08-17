import type { SaveData } from './types'

/**
 * Zusammenführen von lokalem und Cloud-Spielstand
 * (docs/04-datenmodell.md, „Zusammenführen zweier Stände").
 *
 * Rein: keine Uhr, kein Netz, kein Speicherzugriff — deshalb ohne Browser testbar.
 *
 * Die Regel in zwei Stufen:
 *
 * 1. **Mehr gespielte Runden gewinnt** (`stats.totalGames`).
 * 2. Bei Gleichstand gewinnt der **neuere `updatedAt`**.
 *
 * Warum nicht schlicht „neuer gewinnt"? Weil `updatedAt` von der Geräteuhr kommt.
 * Steht die Uhr eines Geräts falsch — auf dem Handy schnell passiert —, würde ein
 * Stand mit echtem Fortschritt von einem älteren überschrieben. Die Zahl gespielter
 * Runden kann dagegen nur wachsen und ist damit der verlässlichere Maßstab.
 *
 * Der Preis steht im Dokument: Wird auf dem zurückliegenden Gerät nur eine
 * Einstellung geändert und keine Runde gespielt, geht diese Änderung verloren.
 * Die andere Richtung — verschwindender Spielfortschritt — wäre teurer.
 */

export type MergeWinner = 'local' | 'remote'

export interface MergeResult {
  save: SaveData
  winner: MergeWinner
  /** Warum dieser Stand gewonnen hat — für die Anzeige in den Einstellungen */
  reason: 'nur-lokal' | 'nur-cloud' | 'mehr-runden' | 'neuer' | 'gleichstand'
}

export function mergeSaves(local: SaveData | null, remote: SaveData | null): MergeResult | null {
  if (!local && !remote) return null
  if (!remote) return { save: local!, winner: 'local', reason: 'nur-lokal' }
  if (!local) return { save: remote, winner: 'remote', reason: 'nur-cloud' }

  if (local.stats.totalGames !== remote.stats.totalGames) {
    const localWins = local.stats.totalGames > remote.stats.totalGames
    return {
      save: localWins ? local : remote,
      winner: localWins ? 'local' : 'remote',
      reason: 'mehr-runden',
    }
  }

  if (local.updatedAt !== remote.updatedAt) {
    const localWins = local.updatedAt > remote.updatedAt
    return {
      save: localWins ? local : remote,
      winner: localWins ? 'local' : 'remote',
      reason: 'neuer',
    }
  }

  // Gleich viele Runden, gleicher Zeitstempel: Es ist derselbe Stand. Der lokale
  // wird genommen, damit nichts unnötig neu gezeichnet wird.
  return { save: local, winner: 'local', reason: 'gleichstand' }
}
