import type { SaveData } from './types'

/**
 * Zugriff auf Supabase — vier Aufrufe, mehr braucht dieses Projekt nicht
 * (docs/04-datenmodell.md, „Cloud-Speicher").
 *
 * Bewusst **ohne** `@supabase/supabase-js`: Die Bibliothek bringt Auth,
 * Realtime, Storage und einen Abfragebauer mit — gut 100 KB für Dinge, die hier
 * niemand benutzt. Die vier Aufrufe sind gewöhnliche POSTs auf `/rest/v1/rpc/`.
 *
 * Angesprochen werden ausschließlich Datenbankfunktionen, nie Tabellen direkt.
 * Grund: Der `anon key` steht im ausgelieferten JavaScript und ist öffentlich.
 * Läge auf `saves` eine gewöhnliche Lesefreigabe, käme jeder an alle Spielstände.
 * Das SQL dazu liegt in `supabase/schema.sql`.
 */

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Ob die Zugangsdaten überhaupt vorliegen. Fehlt eines von beidem, bleibt es beim
 * lokalen Speicher — es gibt keinen Zwischenzustand, in dem die App eine Cloud
 * vortäuscht, die es nicht gibt.
 */
export function cloudConfigured(): boolean {
  return Boolean(URL && KEY)
}

/**
 * Ein Netzaufruf soll den Start nicht aufhalten. Ohne Netz antwortet `fetch`
 * zwar meist sofort mit einem Fehler, in schlechtem Empfang aber gar nicht —
 * dann bräche der Ladebildschirm nie ab.
 */
const TIMEOUT_MS = 4000

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!URL || !KEY) throw new Error('Cloud ist nicht eingerichtet')

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: abort.signal,
    })
    if (!response.ok) {
      throw new Error(`${fn}: ${response.status} ${await response.text()}`)
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

/** Spielstand dieser einen ID lesen. `null`, wenn es dort noch keinen gibt. */
export function loadRemote(id: string): Promise<SaveData | null> {
  return rpc<SaveData | null>('save_load', { p_cloud_id: id })
}

/** Spielstand dieser einen ID schreiben. */
export function storeRemote(id: string, data: SaveData): Promise<void> {
  return rpc<void>('save_store', { p_cloud_id: id, p_data: data })
}

/** Erzeugt einen sechsstelligen Kopplungscode, 15 Minuten gültig. */
export function createPairingCode(id: string): Promise<string> {
  return rpc<string>('pair_create', { p_cloud_id: id })
}

/**
 * Löst einen Kopplungscode ein und liefert die zugehörige `cloud_id`.
 * `null`, wenn der Code falsch oder abgelaufen ist.
 */
export function redeemPairingCode(code: string): Promise<string | null> {
  return rpc<string | null>('pair_redeem', { p_code: code.trim().toUpperCase() })
}
