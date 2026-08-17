import { COMPANIONS, type Companion } from '../content/friends'
import { GAMES, type GameId } from '../content/games'
import type { SaveData } from '../save/types'
import { dayIndex } from './time'

/**
 * Freunde und Rangliste (docs/01-gamedesign.md, „Ranglisten und Freunde").
 *
 * Rein: keine Uhr, kein Speicherzugriff, kein ungesäter Zufall. `now` kommt von
 * außen, genau wie in `time.ts` und `energy.ts`.
 *
 * Die Werte der Begleitfiguren sind **gesät**: Seed ist der Figurname. Dieselbe
 * Figur hat damit auf jedem Gerät, in jeder Sitzung und nach jedem Neuladen
 * dieselbe Zahl — ohne dass eine einzige davon gespeichert werden müsste.
 */

/**
 * Mulberry32, dieselbe Formel wie in `games/solitaire/logic/cards.ts`.
 * Bewusst kopiert statt geteilt: Die Spiellogik der acht Spiele wird für die
 * Meta-Bildschirme nicht angefasst, und acht Zeilen Zahlenmischer sind billiger
 * als eine Abhängigkeit quer durch den Baum.
 */
function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t }
}

/** Macht aus einem Text eine Zahl (FNV-1a). Gleicher Text, gleicher Seed. */
export function seedFromText(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Die eine Formel für alle — Spieler wie Figuren (docs/01-gamedesign.md). */
export function trophies(level: number, wins: number, games: number): number {
  return level * 100 + wins * 25 + games * 5
}

export interface LeaderboardEntry {
  name: string
  /** Rolle der Figur, beim Spieler leer */
  role: string
  level: number
  games: number
  wins: number
  trophies: number
  /** Bild aus PORTRAITS; beim Spieler null, dort steht der eigene Avatar */
  isPlayer: boolean
}

/**
 * Werte einer Begleitfigur. Alles aus dem Namen abgeleitet — bis auf die vier
 * Level, die ein Mockup belegt (Mira 15, Lumo 14, Borin 13, Pip 11).
 *
 * Der untere Rand liegt bei Level 2, damit die Liste von unten erreichbar
 * bleibt: Eine Rangliste, die niemand je einholt, ist eine Wand.
 */
export function companionEntry(companion: Companion): LeaderboardEntry {
  let s = seedFromText(companion.name)

  const levelRoll = nextRandom(s)
  s = levelRoll.seed
  const level = companion.level ?? 2 + Math.floor(levelRoll.value * 15)

  // Runden passend zum Level: rund 12 bis 22 Runden je Level, damit die Zahlen
  // zueinander passen und nicht ein Level-3-Igel 900 Runden gespielt hat.
  const gamesRoll = nextRandom(s)
  s = gamesRoll.seed
  const games = Math.round(level * (12 + gamesRoll.value * 10))

  // Siegquote zwischen 45 % und 75 %.
  const winRoll = nextRandom(s)
  const wins = Math.round(games * (0.45 + winRoll.value * 0.3))

  return {
    name: companion.name,
    role: companion.role,
    level,
    games,
    wins,
    trophies: trophies(level, wins, games),
    isPlayer: false,
  }
}

/** Die eigene Zeile — ausschließlich aus echten Werten des Spielstands. */
export function playerEntry(save: SaveData): LeaderboardEntry {
  const { level, name } = save.profile
  const { totalGames, totalWins } = save.stats
  return {
    name: name || 'Abenteurer',
    role: '',
    level,
    games: totalGames,
    wins: totalWins,
    trophies: trophies(level, totalWins, totalGames),
    isPlayer: true,
  }
}

/**
 * Rangliste: zehn Figuren plus der Spieler, nach Trophäen absteigend.
 * Bei Gleichstand entscheidet der Name, damit die Reihenfolge stabil bleibt.
 */
export function leaderboard(save: SaveData): LeaderboardEntry[] {
  const all = [...COMPANIONS.map(companionEntry), playerEntry(save)]
  return all.sort((a, b) => b.trophies - a.trophies || a.name.localeCompare(b.name, 'de'))
}

/** Platz des Spielers, 1-basiert. */
export function playerRank(save: SaveData): number {
  return leaderboard(save).findIndex((e) => e.isPlayer) + 1
}

export interface Presence {
  online: boolean
  /** Spiel, das gerade läuft — nur wenn online */
  playing: GameId | null
  /** Stunden seit dem letzten Mal — nur wenn nicht online */
  hoursAgo: number
}

/**
 * Wer gerade online ist. Seed ist Name **plus Tagesnummer**: Das Bild wechselt
 * täglich, steht innerhalb eines Tages still und ist auf jedem Gerät gleich.
 *
 * Ein Zufall je Aufruf würde die Liste bei jedem Neuzeichnen durchmischen.
 */
export function presenceOf(name: string, now: number): Presence {
  let s = seedFromText(`${name}:${dayIndex(now)}`)

  const onlineRoll = nextRandom(s)
  s = onlineRoll.seed
  const online = onlineRoll.value < 0.45

  const detail = nextRandom(s)
  if (online) {
    return {
      online: true,
      playing: GAMES[Math.floor(detail.value * GAMES.length)].id,
      hoursAgo: 0,
    }
  }
  return { online: false, playing: null, hoursAgo: 1 + Math.floor(detail.value * 22) }
}

export interface Friend extends LeaderboardEntry {
  presence: Presence
}

/**
 * Die Freundesliste: alle zehn Begleiter mit ihrem Zustand, Online zuerst und
 * innerhalb der Gruppen nach Trophäen sortiert.
 */
export function friendList(now: number): Friend[] {
  return COMPANIONS.map((c) => ({ ...companionEntry(c), presence: presenceOf(c.name, now) })).sort(
    (a, b) =>
      Number(b.presence.online) - Number(a.presence.online) ||
      b.trophies - a.trophies ||
      a.name.localeCompare(b.name, 'de'),
  )
}
