/**
 * Anonyme Identität für den Cloud-Speicher
 * (docs/04-datenmodell.md, „Cloud-Speicher").
 *
 * Kein Konto, keine E-Mail, kein Passwort. Der Spielstand hängt an einer
 * `cloudId` — anfangs die zufällige ID dieses Geräts. Wer koppelt, übernimmt
 * die `cloudId` des anderen Geräts.
 *
 * Die `cloudId` steht bewusst **nicht** im Spielstand: Sonst wanderte sie beim
 * Abgleich mit und überschriebe sich selbst.
 *
 * Diese Datei liegt in `src/save/` — dem einzigen Ordner, der `localStorage`
 * anfassen darf (CLAUDE.md).
 */

const DEVICE_KEY = 'fynnox-puzzle-worlds:device'
const CLOUD_KEY = 'fynnox-puzzle-worlds:cloud'

/** Zufällige ID, auch dort, wo `crypto.randomUUID` fehlt (älteres Safari). */
function randomId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Letzte Rückfallebene. Sie wird genau einmal je Gerät benutzt und nie für
  // Spiellogik — die Seed-Pflicht aus CLAUDE.md gilt hier nicht.
  return `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* Privates Surfen: Dann bleibt es bei dieser Sitzung. */
  }
}

/** ID dieses Geräts. Wird beim ersten Aufruf angelegt und bleibt danach stehen. */
export function deviceId(): string {
  const existing = read(DEVICE_KEY)
  if (existing) return existing
  const fresh = randomId()
  write(DEVICE_KEY, fresh)
  return fresh
}

/** ID, unter der der Spielstand in der Cloud liegt. Ohne Kopplung die Geräte-ID. */
export function cloudId(): string {
  return read(CLOUD_KEY) ?? deviceId()
}

/** Ob dieses Gerät mit einem anderen gekoppelt ist. */
export function isPaired(): boolean {
  const linked = read(CLOUD_KEY)
  return linked !== null && linked !== deviceId()
}

/** Übernimmt die `cloudId` eines anderen Geräts (nach einem eingelösten Code). */
export function linkTo(id: string): void {
  write(CLOUD_KEY, id)
}

/** Löst die Kopplung: Das Gerät schreibt wieder unter seine eigene ID. */
export function unlink(): void {
  write(CLOUD_KEY, deviceId())
}
