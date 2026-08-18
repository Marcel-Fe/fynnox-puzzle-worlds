import type { MissionTrack } from '../save/types'

/**
 * Missionsvorlagen (docs/01-gamedesign.md, Abschnitt „Missionen").
 *
 * Eine Vorlage darf nur an einen Zähler andocken, den auch wirklich ein Spiel
 * meldet — sonst entstünde eine unerfüllbare Mission. Gemeldet werden:
 * `stars` (alle sieben), `rowsCleared` (Waldblöcke, Blockfall), `combos`
 * (Waldblöcke, Kristallmix), `pairs` (Tempelpaare), `crystalsCollected` und
 * `rainbows` (Kristallmix), `moves`/`undos` (Solitaire), `mistakes` (Sudoku).
 *
 * `winRounds` ohne Spielangabe zählt nur bei den fünf gewinnbaren Spielen:
 * Waldblöcke und Blockfall sind Endlosspiele und melden nie einen Sieg.
 */
export interface MissionTemplate {
  id: string
  text: string
  goal: number
  rewardCoins: number
  rewardCrystals?: number
  track: MissionTrack
}

export const DAILY_POOL: MissionTemplate[] = [
  {
    id: 'daily-play-any',
    text: 'Spiele 5 Runden',
    goal: 5,
    rewardCoins: 120,
    track: { type: 'playRounds' },
  },
  {
    id: 'daily-play-waldbloecke',
    text: 'Spiele 3 Runden Waldblöcke',
    goal: 3,
    rewardCoins: 100,
    track: { type: 'playRounds', game: 'waldbloecke' },
  },
  {
    id: 'daily-play-blockfall',
    text: 'Spiele 3 Runden Blockfall',
    goal: 3,
    rewardCoins: 100,
    track: { type: 'playRounds', game: 'blockfall' },
  },
  {
    id: 'daily-rows',
    text: 'Räume 10 Reihen',
    goal: 10,
    rewardCoins: 150,
    track: { type: 'custom', key: 'rowsCleared' },
  },
  {
    id: 'daily-combos',
    text: 'Erziele 5 Kombos',
    goal: 5,
    rewardCoins: 200,
    track: { type: 'custom', key: 'combos' },
  },
  {
    id: 'daily-stars',
    text: 'Sammle 5 Sterne',
    goal: 5,
    rewardCoins: 180,
    track: { type: 'custom', key: 'stars' },
  },
  {
    id: 'daily-coins',
    text: 'Sammle 300 Münzen',
    goal: 300,
    rewardCoins: 150,
    track: { type: 'collectCoins' },
  },
  {
    id: 'daily-win-any',
    text: 'Gewinne 2 Runden',
    goal: 2,
    rewardCoins: 200,
    track: { type: 'winRounds' },
  },
]

export const WEEKLY_POOL: MissionTemplate[] = [
  {
    id: 'weekly-play',
    text: 'Spiele 25 Runden',
    goal: 25,
    rewardCoins: 400,
    rewardCrystals: 10,
    track: { type: 'playRounds' },
  },
  {
    id: 'weekly-win',
    text: 'Gewinne 10 Runden',
    goal: 10,
    rewardCoins: 450,
    rewardCrystals: 10,
    track: { type: 'winRounds' },
  },
  {
    id: 'weekly-coins',
    text: 'Sammle 2.000 Münzen',
    goal: 2000,
    rewardCoins: 500,
    rewardCrystals: 10,
    track: { type: 'collectCoins' },
  },
  {
    id: 'weekly-stars',
    text: 'Sammle 30 Sterne',
    goal: 30,
    rewardCoins: 600,
    rewardCrystals: 15,
    track: { type: 'custom', key: 'stars' },
  },
  {
    id: 'weekly-pairs',
    text: 'Finde 100 Paare in Tempelpaare',
    goal: 100,
    rewardCoins: 400,
    rewardCrystals: 10,
    track: { type: 'custom', key: 'pairs', game: 'tempelpaare' },
  },
]

/** Überschriften der drei Reiter (docs/01-gamedesign.md). */
export const MISSION_TABS = [
  { kind: 'daily', label: 'Täglich' },
  { kind: 'weekly', label: 'Wöchentlich' },
  { kind: 'event', label: 'Event' },
] as const

/** Kopfbereich des Missionsbildschirms (Bild: public/art/bg/missionen.jpg). */
export const MISSIONS_HEADLINE = 'Fynnox’ Aufgabentafel'
export const MISSIONS_TEASER = 'Täglich, wöchentlich und im Event — jede Aufgabe zahlt sich aus.'
