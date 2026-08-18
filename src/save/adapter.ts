import { GAMES } from '../content/games'
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
  if (save.version < 4) save = toV4(save)

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

/**
 * 3 → 4: Minigolf fiel aus dem Umfang.
 *
 * Ein alter Stand trägt es an drei Stellen mit sich: als Fortschrittseintrag,
 * in der Liste zuletzt gespielter Spiele und womöglich als Lieblingsspiel.
 * Bliebe es stehen, zeigte das Dashboard eine Kachel für ein Spiel, das es
 * nicht mehr gibt.
 *
 * Bewusst allgemein formuliert statt auf `minigolf` fest verdrahtet: Die
 * Migration wirft alles weg, was `GAMES` heute nicht mehr kennt. Damit trägt
 * sie auch die nächste Umfangsänderung.
 *
 * Erfolge und Missionen brauchen nichts: `syncAchievements` baut die Liste bei
 * jedem Laden aus den Definitionen neu auf, und Missionen laufen ab und werden
 * ersetzt. Nur laufende Missionen auf ein entferntes Spiel wären bis zu ihrem
 * Ablauf unerfüllbar — die werden darum hier gestrichen.
 */
function toV4(data: SaveData): SaveData {
  const known = new Set<string>(GAMES.map((g) => g.id))

  const progress = Object.fromEntries(
    Object.entries(data.progress ?? {}).filter(([id]) => known.has(id)),
  ) as SaveData['progress']

  const missions = (data.missions ?? []).filter(
    (m) => !('game' in m.track) || !m.track.game || known.has(m.track.game),
  )

  return {
    ...data,
    progress,
    missions,
    recentGames: (data.recentGames ?? []).filter((id) => known.has(id)),
    profile: {
      ...data.profile,
      favoriteGame:
        data.profile?.favoriteGame && known.has(data.profile.favoriteGame)
          ? data.profile.favoriteGame
          : null,
    },
  }
}
