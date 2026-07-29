import type { GameId } from '../content/games'
import type { Mission, MissionTrack, RoundResult, SaveData } from '../save/types'
import {
  coinsForRound,
  levelUpCoins,
  levelUpCrystals,
  xpForNextLevel,
  xpForRound,
} from './progression'

export interface RoundRewards {
  xp: number
  coins: number
  crystals: number
  levelsGained: number
  newHighScore: boolean
  completedMissions: string[]
}

export interface ApplyResult {
  save: SaveData
  rewards: RoundRewards
}

/**
 * Verrechnet ein Rundenergebnis mit dem Spielstand (docs/04-datenmodell.md).
 *
 * Rein: gleicher Spielstand + gleiches Ergebnis ergibt immer dasselbe Resultat.
 * Kein Zugriff auf Uhr, Zufall oder Speicher — dadurch ohne Browser testbar.
 * Der Eingabe-Spielstand wird nicht verändert.
 */
export function applyRoundResult(save: SaveData, result: RoundResult): ApplyResult {
  const next: SaveData = structuredClone(save)
  const { game, won, score, durationMs } = result

  // 1. Fortschritt des Spiels
  const progress = next.progress[game]
  progress.gamesPlayed += 1
  if (won) progress.gamesWon += 1
  progress.totalPlaytimeMs += durationMs
  const newHighScore = score > progress.highScore
  if (newHighScore) progress.highScore = score
  if (result.level !== undefined && result.level > progress.highestLevel) {
    progress.highestLevel = result.level
  }
  // Bestzeit nur bei gewonnenen Runden — bei Tempelpaare oder Solitaire wäre
  // sonst jedes schnelle Aufgeben die neue Bestzeit.
  const newBestTime = won && (progress.bestTimeMs === undefined || durationMs < progress.bestTimeMs)
  if (newBestTime) progress.bestTimeMs = durationMs
  const stars = result.counters?.stars
  if (stars !== undefined && stars > (progress.starsCollected ?? 0)) {
    progress.starsCollected = stars
  }

  // 2. Gesamtstatistik
  next.stats.totalGames += 1
  if (won) next.stats.totalWins += 1
  next.stats.totalPlaytimeMs += durationMs
  if (progress.highestLevel > next.stats.bestLevel) {
    next.stats.bestLevel = progress.highestLevel
  }

  // 3. XP und Levelaufstiege
  const earnedXp = xpForRound(score, won)
  let levelUpCoinsTotal = 0
  let levelUpCrystalsTotal = 0
  let levelsGained = 0

  next.profile.xp += earnedXp
  while (next.profile.xp >= xpForNextLevel(next.profile.level)) {
    next.profile.xp -= xpForNextLevel(next.profile.level)
    next.profile.level += 1
    levelsGained += 1
    levelUpCoinsTotal += levelUpCoins(next.profile.level)
    levelUpCrystalsTotal += levelUpCrystals(next.profile.level)
  }

  // 4. Währungen
  const earnedCoins = coinsForRound(score, won) + levelUpCoinsTotal
  next.profile.coins += earnedCoins
  next.profile.crystals += levelUpCrystalsTotal
  next.stats.coinsEarnedTotal += earnedCoins
  next.stats.crystalsEarnedTotal += levelUpCrystalsTotal

  // 5. Missionen
  const completedMissions: string[] = []
  for (const mission of next.missions) {
    if (mission.claimed || mission.progress >= mission.goal) continue
    const before = mission.progress
    mission.progress = Math.min(
      mission.goal,
      mission.progress + missionDelta(mission, result, earnedCoins),
    )
    if (before < mission.goal && mission.progress >= mission.goal) {
      completedMissions.push(mission.id)
    }
  }

  // 6. Erfolge
  for (const achievement of next.achievements) {
    if (achievement.unlockedAt !== null) continue
    if (achievement.id === 'adventurer') achievement.progress = next.stats.totalGames
    if (achievement.id === 'collector') achievement.progress = next.stats.coinsEarnedTotal
    if (achievement.id === 'master') achievement.progress = next.profile.level
    // Freischaltung braucht einen Zeitstempel; das erledigt der Store, der die Uhr kennt.
  }

  // 7. Lieblingsspiel und zuletzt Gespieltes
  next.profile.favoriteGame = mostPlayedGame(next)
  next.recentGames = [game, ...next.recentGames.filter((g) => g !== game)].slice(0, 4)

  return {
    save: next,
    rewards: {
      xp: earnedXp,
      coins: earnedCoins,
      crystals: levelUpCrystalsTotal,
      levelsGained,
      newHighScore,
      completedMissions,
    },
  }
}

/** Um wie viel eine einzelne Mission durch dieses Ergebnis vorankommt. */
function missionDelta(mission: Mission, result: RoundResult, earnedCoins: number): number {
  const track: MissionTrack = mission.track
  switch (track.type) {
    case 'playRounds':
      return !track.game || track.game === result.game ? 1 : 0
    case 'winRounds':
      return result.won && (!track.game || track.game === result.game) ? 1 : 0
    case 'collectCoins':
      return earnedCoins
    case 'collectCrystals':
      return 0 // Kristalle gibt es nicht pro Runde, nur aus Missionen und Aufstiegen
    case 'reachScore':
      return track.game === result.game ? Math.max(0, result.score - mission.progress) : 0
    case 'custom':
      if (track.game && track.game !== result.game) return 0
      return result.counters?.[track.key] ?? 0
  }
}

function mostPlayedGame(save: SaveData): GameId | null {
  let best: GameId | null = null
  let bestCount = 0
  for (const [id, progress] of Object.entries(save.progress) as [GameId, { gamesPlayed: number }][]) {
    if (progress.gamesPlayed > bestCount) {
      best = id
      bestCount = progress.gamesPlayed
    }
  }
  return best
}
