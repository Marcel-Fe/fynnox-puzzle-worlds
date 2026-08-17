import { create } from 'zustand'
import type { GameId } from '../content/games'
import { refillEnergy } from '../core/energy'
import { refreshMissions } from '../core/missions'
import { applyRoundResult, type RoundRewards } from '../core/round'
import { LocalSaveAdapter, type SaveAdapter } from '../save/adapter'
import { createNewSave } from '../save/defaults'
import type { RoundResult, SaveData } from '../save/types'

/**
 * Einziger Zugang zum Spielstand. Komponenten lesen nur hier, nie aus dem Adapter
 * und niemals direkt aus localStorage (docs/04-datenmodell.md).
 */
interface GameState {
  save: SaveData | null
  loaded: boolean
  /** Belohnungen der letzten Runde, für den Ergebnisbildschirm */
  lastRewards: RoundRewards | null

  init(): Promise<void>
  /**
   * Bringt alles Zeitabhängige auf den Stand der Uhr: Energie und Missionen.
   * Wird beim Start und beim Öffnen zeitabhängiger Bildschirme aufgerufen —
   * eine App, die über Mitternacht offen bleibt, zeigt sonst Missionen von gestern.
   */
  refreshTimed(): void
  /** Zieht eine Energieeinheit ab. Gibt false zurück, wenn keine da ist. */
  spendEnergy(): boolean
  finishRound(result: RoundResult): RoundRewards | null
  claimMission(id: string): void
  clearRewards(): void
  renameProfile(name: string): void
  updateSettings(patch: Partial<SaveData['settings']>): void
  resetSave(): Promise<void>
}

const adapter: SaveAdapter = new LocalSaveAdapter()

/** Nach schreibenden Aktionen sichern — nicht bei jedem einzelnen Zug. */
function persist(save: SaveData) {
  void adapter.save(save)
}

export const useGameStore = create<GameState>((set, get) => ({
  save: null,
  loaded: false,
  lastRewards: null,

  async init() {
    const now = Date.now()
    const loaded = await adapter.load()
    const save = loaded ?? createNewSave(now)
    save.profile = refillEnergy(save.profile, now)
    save.missions = refreshMissions(save.missions, now)
    set({ save, loaded: true })
    persist(save)
  },

  refreshTimed() {
    const save = get().save
    if (!save) return

    const now = Date.now()
    const profile = refillEnergy(save.profile, now)
    const missions = refreshMissions(save.missions, now)
    // Nur schreiben, wenn sich wirklich etwas geändert hat — sonst löst jeder
    // Aufruf ein Neuzeichnen aller Bildschirme aus.
    if (profile === save.profile && missions.length === save.missions.length) {
      const same = missions.every((m, i) => m.id === save.missions[i].id)
      if (same) return
    }

    const next: SaveData = { ...save, profile, missions }
    set({ save: next })
    persist(next)
  },

  spendEnergy() {
    const save = get().save
    if (!save) return false

    const profile = refillEnergy(save.profile, Date.now())
    if (profile.energy <= 0) {
      set({ save: { ...save, profile } })
      return false
    }

    const next: SaveData = {
      ...save,
      profile: { ...profile, energy: profile.energy - 1 },
    }
    set({ save: next })
    persist(next)
    return true
  },

  finishRound(result) {
    const save = get().save
    if (!save) return null

    const { save: next, rewards } = applyRoundResult(save, result)

    // Erfolge freischalten: applyRoundResult bleibt bewusst ohne Uhr,
    // also wird der Zeitstempel hier gesetzt.
    const now = Date.now()
    for (const achievement of next.achievements) {
      if (achievement.unlockedAt === null && achievement.progress >= achievement.goal) {
        achievement.unlockedAt = now
      }
    }

    set({ save: next, lastRewards: rewards })
    persist(next)
    return rewards
  },

  claimMission(id) {
    const save = get().save
    if (!save) return

    const mission = save.missions.find((m) => m.id === id)
    if (!mission || mission.claimed || mission.progress < mission.goal) return

    const next: SaveData = {
      ...save,
      missions: save.missions.map((m) => (m.id === id ? { ...m, claimed: true } : m)),
      profile: {
        ...save.profile,
        coins: save.profile.coins + mission.rewardCoins,
        crystals: save.profile.crystals + (mission.rewardCrystals ?? 0),
      },
      stats: {
        ...save.stats,
        coinsEarnedTotal: save.stats.coinsEarnedTotal + mission.rewardCoins,
        crystalsEarnedTotal: save.stats.crystalsEarnedTotal + (mission.rewardCrystals ?? 0),
      },
    }
    set({ save: next })
    persist(next)
  },

  clearRewards() {
    set({ lastRewards: null })
  },

  renameProfile(name) {
    const save = get().save
    if (!save) return
    // Leere Namen und Übermaß abfangen — der Name steht in Kopfzeilen und Ranglisten.
    const clean = name.trim().slice(0, 20)
    if (!clean) return

    const next: SaveData = { ...save, profile: { ...save.profile, name: clean } }
    set({ save: next })
    persist(next)
  },

  updateSettings(patch) {
    const save = get().save
    if (!save) return
    const next: SaveData = { ...save, settings: { ...save.settings, ...patch } }
    set({ save: next })
    persist(next)
  },

  async resetSave() {
    await adapter.clear()
    const save = createNewSave(Date.now())
    set({ save, lastRewards: null })
    persist(save)
  },
}))

/** Bequemer Zugriff auf den Fortschritt eines einzelnen Spiels. */
export function useGameProgress(game: GameId) {
  return useGameStore((s) => s.save?.progress[game] ?? null)
}
