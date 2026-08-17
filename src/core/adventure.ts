import { CHAPTERS, NODES_PER_CHAPTER, type Chapter } from '../content/adventure'
import { GAMES, type GameId } from '../content/games'
import type { AdventurePath, RoundResult, SaveData } from '../save/types'

/**
 * Abenteuerpfad (docs/01-gamedesign.md, Entwurf B).
 *
 * Rein: keine Uhr, kein Zufall, kein Speicherzugriff. Welches Spiel auf einem
 * Knoten liegt, wird gerechnet statt gewürfelt — dieselbe Stelle ergibt auf
 * jedem Gerät dasselbe Spiel.
 *
 * Ein Knoten ist geschafft, sobald eine Runde des vorgegebenen Spiels
 * mindestens einen Stern erreicht. Die Sterne der Runde werden unverändert
 * übernommen: Jedes Spiel hat seine Sternschwellen bereits selbst geeicht,
 * eine zweite Tabelle daneben würde nur auseinanderlaufen.
 */

export type Stars = 0 | 1 | 2 | 3

/** Truhe am Kapitelende (docs/01-gamedesign.md). */
export const CHEST_COINS = 500
export const CHEST_CRYSTALS = 25
export const CHEST_COINS_PER_STAR = 20

export function chapterCount(): number {
  return CHAPTERS.length
}

/** Das Kapitel zu einer Nummer; außerhalb der Liste kommt das letzte zurück. */
export function chapterAt(number: number): Chapter {
  const index = Math.min(Math.max(1, number), CHAPTERS.length) - 1
  return CHAPTERS[index]
}

/**
 * Welches Spiel auf einem Knoten liegt: reihum durch alle acht, je Kapitel um
 * drei versetzt, damit zwei Kapitel nicht dieselbe Reihenfolge haben.
 */
export function nodeGame(chapter: number, node: number): GameId {
  return GAMES[(node - 1 + (chapter - 1) * 3) % GAMES.length].id
}

export function nodeKey(chapter: number, node: number): string {
  return `${chapter}:${node}`
}

export function chestKey(chapter: number): string {
  return `chapter:${chapter}`
}

/** Sterne eines Knotens, oder `null`, wenn er noch nicht geschafft ist. */
export function starsAt(adventure: AdventurePath, chapter: number, node: number): Stars | null {
  return adventure.stars[nodeKey(chapter, node)] ?? null
}

export function chapterStars(adventure: AdventurePath, chapter: number): number {
  let sum = 0
  for (let node = 1; node <= NODES_PER_CHAPTER; node++) {
    sum += starsAt(adventure, chapter, node) ?? 0
  }
  return sum
}

/** Wie viele Knoten eines Kapitels geschafft sind (Mockup: „8/15"). */
export function chapterProgress(adventure: AdventurePath, chapter: number): number {
  let done = 0
  for (let node = 1; node <= NODES_PER_CHAPTER; node++) {
    if (starsAt(adventure, chapter, node) !== null) done++
  }
  return done
}

export function isChapterComplete(adventure: AdventurePath, chapter: number): boolean {
  return chapterProgress(adventure, chapter) === NODES_PER_CHAPTER
}

/** Truhe des Kapitels: Grundwert plus Zuschlag je gesammeltem Stern. */
export function chestReward(stars: number): { coins: number; crystals: number } {
  return { coins: CHEST_COINS + stars * CHEST_COINS_PER_STAR, crystals: CHEST_CRYSTALS }
}

export function isChestClaimed(adventure: AdventurePath, chapter: number): boolean {
  return adventure.claimedChests.includes(chestKey(chapter))
}

/** Alle geschafften Knoten über alle Kapitel — Grundlage für Erfolge. */
export function totalNodesDone(adventure: AdventurePath): number {
  return Object.keys(adventure.stars).length
}

export function totalStars(adventure: AdventurePath): number {
  return Object.values(adventure.stars).reduce<number>((sum, s) => sum + s, 0)
}

export interface NodeAdvance {
  chapter: number
  node: number
  stars: Stars
  /** Ob damit das Kapitel voll ist und die Truhe bereitliegt */
  chapterComplete: boolean
}

/**
 * Verrechnet eine Runde mit dem Pfad. Passt das Spiel nicht zum aktuellen
 * Knoten oder blieb die Runde ohne Stern, bleibt alles wie es war.
 *
 * Der Rückgabewert ist derselbe Spielstand, wenn sich nichts geändert hat —
 * daran erkennt der Store, ob er speichern muss.
 */
export function applyRoundToAdventure(
  save: SaveData,
  result: RoundResult,
): { save: SaveData; advance: NodeAdvance | null } {
  const { adventure } = save
  const chapter = adventure.chapter
  const node = adventure.nodeInChapter

  if (chapter > CHAPTERS.length) return { save, advance: null }
  if (node > NODES_PER_CHAPTER) return { save, advance: null }
  if (starsAt(adventure, chapter, node) !== null) return { save, advance: null }
  if (result.game !== nodeGame(chapter, node)) return { save, advance: null }

  const stars = Math.min(3, Math.max(0, Math.trunc(result.counters?.stars ?? 0))) as Stars
  if (stars < 1) return { save, advance: null }

  const next: AdventurePath = {
    ...adventure,
    stars: { ...adventure.stars, [nodeKey(chapter, node)]: stars },
    // Am letzten Knoten bleibt der Zeiger stehen, bis die Truhe geholt ist.
    nodeInChapter: node < NODES_PER_CHAPTER ? node + 1 : node,
  }

  return {
    save: { ...save, adventure: next },
    advance: {
      chapter,
      node,
      stars,
      chapterComplete: node === NODES_PER_CHAPTER,
    },
  }
}

/**
 * Holt die Truhe am Kapitelende ab und öffnet das nächste Kapitel.
 * Ist das Kapitel nicht voll oder die Truhe schon geholt, kommt der Spielstand
 * unverändert zurück.
 */
export function claimChest(save: SaveData, chapter: number): SaveData {
  const { adventure } = save
  if (!isChapterComplete(adventure, chapter)) return save
  if (isChestClaimed(adventure, chapter)) return save

  const reward = chestReward(chapterStars(adventure, chapter))
  const isLast = chapter >= CHAPTERS.length

  return {
    ...save,
    profile: {
      ...save.profile,
      coins: save.profile.coins + reward.coins,
      crystals: save.profile.crystals + reward.crystals,
    },
    stats: {
      ...save.stats,
      coinsEarnedTotal: save.stats.coinsEarnedTotal + reward.coins,
      crystalsEarnedTotal: save.stats.crystalsEarnedTotal + reward.crystals,
    },
    adventure: {
      ...adventure,
      claimedChests: [...adventure.claimedChests, chestKey(chapter)],
      chapter: isLast ? chapter : chapter + 1,
      nodeInChapter: isLast ? NODES_PER_CHAPTER : 1,
    },
  }
}
