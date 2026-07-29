import { SAVE_VERSION } from './defaults'
import type { SaveData } from './types'

/**
 * Speicher-Schnittstelle (docs/04-datenmodell.md).
 *
 * Alle Methoden sind async — auch die localStorage-Fassung, die sofort zurückkehrt.
 * Grund: Beim späteren Wechsel auf Supabase ändert sich dadurch keine einzige
 * Aufrufstelle im Projekt.
 */
export interface SaveAdapter {
  load(): Promise<SaveData | null>
  save(data: SaveData): Promise<void>
  clear(): Promise<void>
}

/**
 * Der Schlüssel trägt den Projektnamen, weil alle Fynnox-Apps unter derselben
 * Domain marcel-fe.github.io liegen und sich sonst gegenseitig überschreiben würden.
 */
const KEY = 'fynnox-puzzle-worlds:save'
const BACKUP_KEY = 'fynnox-puzzle-worlds:save-backup'

export class LocalSaveAdapter implements SaveAdapter {
  async load(): Promise<SaveData | null> {
    let raw: string | null
    try {
      raw = localStorage.getItem(KEY)
    } catch {
      // Privates Surfen oder gesperrter Speicher: ohne Spielstand weitermachen.
      return null
    }
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as SaveData
      return migrate(parsed)
    } catch {
      // Defekten Stand sichern statt still zu verwerfen — er ist sonst unwiederbringlich.
      try {
        localStorage.setItem(BACKUP_KEY, raw)
        localStorage.removeItem(KEY)
      } catch {
        /* Sicherung fehlgeschlagen — dann eben ohne */
      }
      return null
    }
  }

  async save(data: SaveData): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* Speicher voll oder gesperrt: das Spiel läuft weiter, nur ohne Sicherung */
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nichts zu tun */
    }
  }
}

/**
 * Wendet alle Migrationen der Reihe nach an. Noch gibt es nur Version 1;
 * ein unbekannter oder fehlender Versionsstand gilt als unbrauchbar.
 */
function migrate(data: SaveData): SaveData | null {
  if (typeof data?.version !== 'number') return null
  if (data.version > SAVE_VERSION) return null
  return data
}
