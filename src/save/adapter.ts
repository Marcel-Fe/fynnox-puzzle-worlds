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

/**
 * Setzt den Zeitstempel, der beim Cloud-Abgleich den Gleichstand entscheidet.
 *
 * Bewusst **eine** Stelle statt in jedem Adapter: Stempelte der lokale Adapter
 * eigenständig und der Cloud-Adapter noch einmal, unterschieden sich beide
 * Kopien desselben Spielstands um ein paar Millisekunden — und der Abgleich
 * hielte sie für zwei verschiedene Stände.
 */
export function stampSave(data: SaveData, now: number): SaveData {
  return { ...data, updatedAt: now }
}

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
 * Wendet alle Migrationen der Reihe nach an. Ein unbekannter oder fehlender
 * Versionsstand gilt als unbrauchbar.
 *
 * Ein Stand aus der Zukunft wird abgelehnt statt geraten: Er kann Felder
 * enthalten, die diese Fassung nicht kennt, und würde beim nächsten Speichern
 * stillschweigend beschnitten.
 *
 * Exportiert, damit sie ohne Browser prüfbar ist: „Alte Spielstände dürfen
 * nicht kaputtgehen" (CLAUDE.md) ist eine Zusage, die einen Test verdient.
 */
export function migrate(data: SaveData): SaveData | null {
  if (typeof data?.version !== 'number') return null
  if (data.version > SAVE_VERSION) return null

  let save = data
  if (save.version < 2) save = toV2(save)
  if (save.version < 3) save = toV3(save)

  return { ...save, version: SAVE_VERSION }
}

/** 1 → 2: Der Shop kam dazu, gekaufte Waren stehen seither in `ownedItems`. */
function toV2(data: SaveData): SaveData {
  return { ...data, ownedItems: data.ownedItems ?? [] }
}

/**
 * 2 → 3: Der Cloud-Abgleich kam dazu und braucht einen Zeitstempel.
 *
 * Alte Stände bekommen `0`, nicht die aktuelle Uhrzeit: Ein Stand ohne
 * Zeitstempel soll im Zweifel nicht gegen einen mit gewinnen. Die erste
 * Abgleichsregel (mehr gespielte Runden) greift ohnehin zuerst.
 */
function toV3(data: SaveData): SaveData {
  return { ...data, updatedAt: data.updatedAt ?? 0 }
}
