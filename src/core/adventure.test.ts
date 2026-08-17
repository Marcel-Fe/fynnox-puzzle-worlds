import { describe, expect, it } from 'vitest'
import { CHAPTERS, NODES_PER_CHAPTER } from '../content/adventure'
import { GAMES } from '../content/games'
import { createNewSave } from '../save/defaults'
import type { RoundResult, SaveData } from '../save/types'
import {
  applyRoundToAdventure,
  chapterProgress,
  chapterStars,
  chestReward,
  claimChest,
  isChapterComplete,
  isChestClaimed,
  nodeGame,
  starsAt,
  totalNodesDone,
  totalStars,
} from './adventure'

const NOW = new Date(2026, 7, 17, 10, 0, 0).getTime()

function round(save: SaveData, stars: number): RoundResult {
  const { chapter, nodeInChapter } = save.adventure
  return {
    game: nodeGame(chapter, nodeInChapter),
    won: stars > 0,
    score: 1000,
    durationMs: 60_000,
    counters: { stars },
  }
}

/** Spielt ein ganzes Kapitel mit der gegebenen Sternzahl je Knoten durch. */
function playChapter(save: SaveData, stars: number): SaveData {
  let current = save
  for (let i = 0; i < NODES_PER_CHAPTER; i++) {
    current = applyRoundToAdventure(current, round(current, stars)).save
  }
  return current
}

describe('Kapitel und Knoten', () => {
  it('es gibt für jedes Kapitel eine Kulisse', () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.image).toMatch(/art\/bg\/.+\.jpg$/)
      expect(chapter.world.length).toBeGreaterThan(0)
    }
  })

  it('verteilt die Knoten reihum auf alle acht Spiele', () => {
    for (const chapter of CHAPTERS) {
      const games = new Set<string>()
      for (let node = 1; node <= NODES_PER_CHAPTER; node++) {
        games.add(nodeGame(chapter.number, node))
      }
      expect(games.size).toBe(GAMES.length)
    }
  })

  it('zwei Kapitel beginnen nicht mit demselben Spiel', () => {
    const firsts = CHAPTERS.map((c) => nodeGame(c.number, 1))
    expect(new Set(firsts).size).toBe(CHAPTERS.length)
  })

  it('ist ohne Zufall — dieselbe Stelle ergibt dasselbe Spiel', () => {
    expect(nodeGame(3, 7)).toBe(nodeGame(3, 7))
  })
})

describe('applyRoundToAdventure', () => {
  it('schafft den Knoten, wenn das richtige Spiel mindestens einen Stern bringt', () => {
    const save = createNewSave(NOW)
    const { save: next, advance } = applyRoundToAdventure(save, round(save, 2))

    expect(advance).toEqual({ chapter: 1, node: 1, stars: 2, chapterComplete: false })
    expect(starsAt(next.adventure, 1, 1)).toBe(2)
    expect(next.adventure.nodeInChapter).toBe(2)
  })

  it('zählt eine Runde ohne Stern nicht', () => {
    const save = createNewSave(NOW)
    const { save: next, advance } = applyRoundToAdventure(save, round(save, 0))
    expect(advance).toBeNull()
    expect(next).toBe(save)
  })

  it('zählt ein anderes Spiel nicht', () => {
    const save = createNewSave(NOW)
    const wrong = GAMES.find((g) => g.id !== nodeGame(1, 1))!.id
    const { save: next, advance } = applyRoundToAdventure(save, {
      ...round(save, 3),
      game: wrong,
    })
    expect(advance).toBeNull()
    expect(next).toBe(save)
  })

  it('verändert den übergebenen Spielstand nicht', () => {
    const save = createNewSave(NOW)
    const before = JSON.stringify(save)
    applyRoundToAdventure(save, round(save, 3))
    expect(JSON.stringify(save)).toBe(before)
  })

  it('bleibt am letzten Knoten stehen, bis die Truhe geholt ist', () => {
    const save = playChapter(createNewSave(NOW), 1)
    expect(chapterProgress(save.adventure, 1)).toBe(NODES_PER_CHAPTER)
    expect(save.adventure.nodeInChapter).toBe(NODES_PER_CHAPTER)
    expect(save.adventure.chapter).toBe(1)

    // Weitere Runden ändern nichts mehr.
    const after = applyRoundToAdventure(save, round(save, 3))
    expect(after.advance).toBeNull()
    expect(after.save).toBe(save)
  })

  it('meldet beim fünfzehnten Knoten, dass das Kapitel voll ist', () => {
    let save = createNewSave(NOW)
    let last = null
    for (let i = 0; i < NODES_PER_CHAPTER; i++) {
      const step = applyRoundToAdventure(save, round(save, 1))
      save = step.save
      last = step.advance
    }
    expect(last?.chapterComplete).toBe(true)
  })
})

describe('Truhe', () => {
  it('lässt sich erst öffnen, wenn das Kapitel voll ist', () => {
    const save = createNewSave(NOW)
    expect(claimChest(save, 1)).toBe(save)
  })

  it('zahlt Grundwert plus Zuschlag je Stern und öffnet das nächste Kapitel', () => {
    const played = playChapter(createNewSave(NOW), 3)
    const stars = chapterStars(played.adventure, 1)
    expect(stars).toBe(45)

    const next = claimChest(played, 1)
    expect(next.profile.coins).toBe(played.profile.coins + chestReward(45).coins)
    expect(next.profile.crystals).toBe(played.profile.crystals + 25)
    expect(next.adventure.chapter).toBe(2)
    expect(next.adventure.nodeInChapter).toBe(1)
    expect(isChestClaimed(next.adventure, 1)).toBe(true)
  })

  it('lässt sich nicht zweimal öffnen', () => {
    const once = claimChest(playChapter(createNewSave(NOW), 1), 1)
    expect(claimChest(once, 1)).toBe(once)
  })

  it('mehr Sterne bringen mehr Münzen', () => {
    expect(chestReward(45).coins).toBeGreaterThan(chestReward(15).coins)
    expect(chestReward(15).coins).toBe(500 + 15 * 20)
  })

  it('führt über alle Kapitel bis ans Ende des Pfads', () => {
    let save = createNewSave(NOW)
    for (const chapter of CHAPTERS) {
      save = playChapter(save, 2)
      expect(isChapterComplete(save.adventure, chapter.number)).toBe(true)
      save = claimChest(save, chapter.number)
    }
    expect(totalNodesDone(save.adventure)).toBe(CHAPTERS.length * NODES_PER_CHAPTER)
    expect(totalStars(save.adventure)).toBe(CHAPTERS.length * NODES_PER_CHAPTER * 2)
    // Nach dem letzten Kapitel läuft der Zeiger nicht ins Leere.
    expect(save.adventure.chapter).toBe(CHAPTERS.length)
    expect(save.adventure.claimedChests).toHaveLength(CHAPTERS.length)
  })
})
