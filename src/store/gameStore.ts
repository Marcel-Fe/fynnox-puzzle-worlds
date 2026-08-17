import { create } from 'zustand'
import type { GameId } from '../content/games'
// Umbenannt, damit die Aufrufe in den gleichnamigen Store-Aktionen eindeutig bleiben.
import { syncAchievements } from '../core/achievements'
import { applyRoundToAdventure, claimChest as applyChestClaim } from '../core/adventure'
import { claimDailyReward as applyDailyClaim } from '../core/dailyReward'
import { refillEnergy } from '../core/energy'
import { refreshMissions } from '../core/missions'
import { applyRoundResult, type RoundRewards } from '../core/round'
import { buyItem as applyPurchase } from '../core/shop'
import { LocalSaveAdapter, stampSave, type SaveAdapter } from '../save/adapter'
import { CloudSaveAdapter } from '../save/cloudAdapter'
import { createNewSave } from '../save/defaults'
import { cloudConfigured } from '../save/supabase'
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
  /** Holt die tägliche Belohnung ab, falls eine bereitliegt. */
  claimDailyReward(): void
  /** Holt die Truhe am Ende eines vollständigen Kapitels ab. */
  claimChest(chapter: number): void
  /** Kauft eine Ware mit Kristallen. Tut nichts, wenn der Kauf nicht geht. */
  buyItem(id: string): void
  clearRewards(): void
  renameProfile(name: string): void
  updateSettings(patch: Partial<SaveData['settings']>): void
  resetSave(): Promise<void>
}

/**
 * Die eine Stelle, an der entschieden wird, wohin der Spielstand geht.
 *
 * Ohne Zugangsdaten in der `.env` bleibt es beim lokalen Speicher — die App
 * läuft dann exakt wie vorher, statt eine Cloud vorzutäuschen, die es nicht gibt
 * (docs/04-datenmodell.md, „Einrichtung").
 */
export const adapter: SaveAdapter = cloudConfigured()
  ? new CloudSaveAdapter()
  : new LocalSaveAdapter()

/**
 * Nach schreibenden Aktionen sichern — nicht bei jedem einzelnen Zug.
 *
 * Hier steht der Zeitstempel für den Cloud-Abgleich: an einer Stelle, damit die
 * lokale und die entfernte Kopie desselben Stands dieselbe Zahl tragen.
 */
function persist(save: SaveData) {
  void adapter.save(stampSave(save, Date.now()))
}

/**
 * Erfolge messen sich an Statistik, Fortschritt, Pfad, Serie und Besitz —
 * also an fast allem. Statt in jeder Aktion einzeln nachzurechnen, läuft der
 * Abgleich an dieser einen Stelle, kurz bevor gespeichert wird.
 *
 * Hier steht auch die Uhr: `syncAchievements` bleibt wie `round.ts` ohne.
 */
function withAchievements(save: SaveData): SaveData {
  return { ...save, achievements: syncAchievements(save, Date.now()) }
}

export const useGameStore = create<GameState>((set, get) => ({
  save: null,
  loaded: false,
  lastRewards: null,

  async init() {
    const now = Date.now()
    const loaded = await adapter.load()
    const base = loaded ?? createNewSave(now)
    base.profile = refillEnergy(base.profile, now)
    base.missions = refreshMissions(base.missions, now)
    // Der Abgleich holt auch Erfolge nach, die ein älterer Spielstand noch
    // nicht kannte — dafür braucht es keine eigene Migration.
    const save = withAchievements(base)
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

    const { save: applied, rewards } = applyRoundResult(save, result)

    // Der Abenteuerpfad hängt am selben Rundenergebnis, steht aber bewusst
    // neben applyRoundResult: Die Rundenauswertung soll nicht wissen, wo der
    // Spieler auf dem Pfad gerade steht.
    const { save: advanced } = applyRoundToAdventure(applied, result)

    const next = withAchievements(advanced)
    set({ save: next, lastRewards: rewards })
    persist(next)
    return rewards
  },

  claimMission(id) {
    const save = get().save
    if (!save) return

    const mission = save.missions.find((m) => m.id === id)
    if (!mission || mission.claimed || mission.progress < mission.goal) return

    const next = withAchievements({
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
    })
    set({ save: next })
    persist(next)
  },

  claimDailyReward() {
    const save = get().save
    if (!save) return

    const claimed = applyDailyClaim(save, Date.now())
    if (claimed === save) return // lag nichts bereit

    const next = withAchievements(claimed)
    set({ save: next })
    persist(next)
  },

  claimChest(chapter) {
    const save = get().save
    if (!save) return

    const claimed = applyChestClaim(save, chapter)
    if (claimed === save) return // Kapitel noch nicht voll oder Truhe schon geholt

    const next = withAchievements(claimed)
    set({ save: next })
    persist(next)
  },

  buyItem(id) {
    const save = get().save
    if (!save) return

    const bought = applyPurchase(save, id)
    if (bought === save) return // zu teuer, schon vorhanden oder nicht käuflich

    const next = withAchievements(bought)
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
