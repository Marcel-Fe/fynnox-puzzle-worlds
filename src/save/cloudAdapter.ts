import { LocalSaveAdapter, type SaveAdapter } from './adapter'
import { cloudId } from './cloudIdentity'
import { mergeSaves } from './merge'
import { loadRemote, storeRemote } from './supabase'
import type { SaveData } from './types'

/**
 * Cloud-Speicher über Supabase (docs/04-datenmodell.md, „Cloud-Speicher").
 *
 * Legt sich **über** den lokalen Adapter, statt ihn zu ersetzen. Der lokale
 * Speicher bleibt damit die Wahrheit für den laufenden Betrieb: Er ist sofort
 * da, funktioniert ohne Netz und geht nicht verloren, wenn der Server schweigt.
 * Die Cloud ist die zweite Kopie, die den Wechsel zwischen Handy und Desktop
 * möglich macht.
 *
 * Die Schnittstelle ist unverändert `SaveAdapter` — deshalb ändert sich im
 * ganzen Projekt genau eine Zeile: die Wahl des Adapters im Store.
 */

/**
 * Nicht bei jeder Aktion ins Netz. Nach einer Runde folgen oft mehrere
 * Speichervorgänge kurz hintereinander (Runde, Mission, Erfolg) — die sollen
 * einen einzigen Aufruf ergeben.
 */
const PUSH_DELAY_MS = 2500

export type CloudState =
  | { kind: 'aus' }
  | { kind: 'laedt' }
  | { kind: 'verbunden'; lastSyncAt: number }
  | { kind: 'fehler'; message: string }

export class CloudSaveAdapter implements SaveAdapter {
  private local = new LocalSaveAdapter()
  private timer: ReturnType<typeof setTimeout> | null = null
  private pending: SaveData | null = null
  private state: CloudState = { kind: 'laedt' }
  private listeners = new Set<(state: CloudState) => void>()

  /**
   * Holt beide Stände und führt sie zusammen. Der zusammengeführte Stand wird
   * sofort auf **beiden** Seiten abgelegt, damit sie danach übereinstimmen.
   *
   * Schlägt die Cloud fehl — kein Netz, Server unten —, gewinnt der lokale
   * Stand kommentarlos. Ein Spiel, das nicht startet, weil ein Server schweigt,
   * wäre die schlechtere Antwort.
   */
  async load(): Promise<SaveData | null> {
    const local = await this.local.load()

    let remote: SaveData | null = null
    try {
      remote = await loadRemote(cloudId())
    } catch (error) {
      this.setState({ kind: 'fehler', message: describe(error) })
      return local
    }

    const merged = mergeSaves(local, remote)
    this.setState({ kind: 'verbunden', lastSyncAt: Date.now() })
    if (!merged) return null

    // Nur zurückschreiben, wo der andere zurücklag — sonst zwei Schreibvorgänge
    // bei jedem Start, obwohl sich nichts geändert hat.
    if (merged.reason === 'nur-lokal' || merged.winner === 'local') {
      this.schedulePush(merged.save)
    }
    if (merged.winner === 'remote') {
      await this.local.save(merged.save)
    }
    return merged.save
  }

  /** Lokal sofort, in die Cloud entprellt. */
  async save(data: SaveData): Promise<void> {
    await this.local.save(data)
    this.schedulePush(data)
  }

  async clear(): Promise<void> {
    await this.local.clear()
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.pending = null
  }

  /** Schreibt Ausstehendes sofort — für `visibilitychange` beim Verlassen. */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    const data = this.pending
    this.pending = null
    if (!data) return
    try {
      await storeRemote(cloudId(), data)
      this.setState({ kind: 'verbunden', lastSyncAt: Date.now() })
    } catch (error) {
      // Der Stand liegt lokal — beim nächsten Speichern wird es erneut versucht.
      this.pending = data
      this.setState({ kind: 'fehler', message: describe(error) })
    }
  }

  getState(): CloudState {
    return this.state
  }

  subscribe(listener: (state: CloudState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private schedulePush(data: SaveData): void {
    this.pending = data
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, PUSH_DELAY_MS)
  }

  private setState(state: CloudState): void {
    this.state = state
    this.listeners.forEach((l) => l(state))
  }
}

function describe(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Der Server hat nicht rechtzeitig geantwortet.'
  }
  if (error instanceof TypeError) return 'Keine Verbindung zum Server.'
  return error instanceof Error ? error.message : 'Unbekannter Fehler.'
}
