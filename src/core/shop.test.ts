import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SHOP_ITEMS } from '../content/shop'
import { LocalSaveAdapter } from '../save/adapter'
import { createNewSave, SAVE_VERSION } from '../save/defaults'
import type { SaveData } from '../save/types'
import { EVENT_CATALOG } from '../content/events'
import { eventSchedule, mainEvent } from './events'
import { buyItem, canBuy, owns, refusalFor } from './shop'
import { addDays } from './time'

const NOW = new Date(2026, 7, 17, 10, 0, 0).getTime()

function rich(): SaveData {
  const save = createNewSave(NOW)
  return { ...save, profile: { ...save.profile, crystals: 10_000 } }
}

describe('Warenkatalog', () => {
  it('vergibt eindeutige IDs', () => {
    const ids = SHOP_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('jede Ware hat entweder einen Kristall- oder einen Euro-Preis', () => {
    for (const item of SHOP_ITEMS) {
      expect((item.crystals === undefined) !== (item.euro === undefined)).toBe(true)
    }
  })

  it('füllt jeden der drei Warenreiter', () => {
    for (const category of ['outfits', 'helfer', 'booster'] as const) {
      expect(SHOP_ITEMS.filter((i) => i.category === category).length).toBeGreaterThan(1)
    }
  })

  it('enthält die sechs belegten Waren des Mockups zu den dokumentierten Preisen', () => {
    const byTitle = Object.fromEntries(SHOP_ITEMS.map((i) => [i.title, i]))
    expect(byTitle['Fynnox Piraten Outfit'].crystals).toBe(1200)
    expect(byTitle['Kristall Haustier'].crystals).toBe(800)
    expect(byTitle['Mega Booster Pack'].crystals).toBe(2500)
    expect(byTitle['Münzpaket 10.000'].euro).toBe('2,49 €')
    expect(byTitle['Kristallpaket 500'].euro).toBe('4,99 €')
    expect(byTitle['Booster Pack'].euro).toBe('5,99 €')
  })
})

describe('Kaufen', () => {
  it('zieht Kristalle ab und legt die Ware in den Spielstand', () => {
    const save = rich()
    const next = buyItem(save, 'outfit-pirat')
    expect(next.profile.crystals).toBe(save.profile.crystals - 1200)
    expect(owns(next, 'outfit-pirat')).toBe(true)
  })

  it('verändert den übergebenen Spielstand nicht', () => {
    const save = rich()
    const before = JSON.stringify(save)
    buyItem(save, 'outfit-pirat')
    expect(JSON.stringify(save)).toBe(before)
  })

  it('lehnt einen zweiten Kauf derselben Ware ab', () => {
    const once = buyItem(rich(), 'outfit-pirat')
    expect(refusalFor(once, 'outfit-pirat')).toBe('owned')
    expect(buyItem(once, 'outfit-pirat')).toBe(once)
  })

  it('lehnt ab, wenn die Kristalle nicht reichen', () => {
    const save = createNewSave(NOW) // 50 Kristalle
    expect(refusalFor(save, 'outfit-pirat')).toBe('too-expensive')
    expect(buyItem(save, 'outfit-pirat')).toBe(save)
  })

  it('verkauft nichts mit Euro-Preis', () => {
    const save = rich()
    expect(refusalFor(save, 'euro-muenzen')).toBe('not-for-sale')
    expect(buyItem(save, 'euro-muenzen')).toBe(save)
  })

  it('lehnt unbekannte IDs ab', () => {
    expect(canBuy(rich(), 'gibt-es-nicht')).toBe(false)
  })
})

describe('Spielstand-Migration', () => {
  /**
   * Die Tests laufen ohne Browser, deshalb ein Speicher im Arbeitsspeicher.
   * Eine Bibliothek wie jsdom wäre für drei Methoden zu viel Abhängigkeit.
   */
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('ergänzt einem Stand der Version 1 die leere Warenliste', async () => {
    // Ein Stand der Version 1 kannte `ownedItems` noch nicht.
    const { ownedItems: _weg, ...withoutItems } = createNewSave(NOW)
    const old = { ...withoutItems, version: 1 }
    localStorage.setItem('fynnox-puzzle-worlds:save', JSON.stringify(old))

    const loaded = await new LocalSaveAdapter().load()
    expect(loaded?.version).toBe(SAVE_VERSION)
    expect(loaded?.ownedItems).toEqual([])
    // Alles andere bleibt erhalten.
    expect(loaded?.profile.coins).toBe(old.profile.coins)
    expect(loaded?.missions).toHaveLength(old.missions.length)
    localStorage.clear()
  })

  it('lehnt einen Stand aus der Zukunft ab', async () => {
    const future = { ...createNewSave(NOW), version: SAVE_VERSION + 1 }
    localStorage.setItem('fynnox-puzzle-worlds:save', JSON.stringify(future))
    expect(await new LocalSaveAdapter().load()).toBeNull()
    localStorage.clear()
  })
})

describe('Eventplan', () => {
  it('dreht die vier Events wöchentlich durch', () => {
    const seen = new Set<string>()
    for (let week = 0; week < 4; week++) {
      seen.add(mainEvent(addDays(NOW, week * 7)).info.id)
    }
    expect(seen.size).toBe(EVENT_CATALOG.length)
  })

  it('ist ohne Zufall — dieselbe Woche ergibt dasselbe Hauptevent', () => {
    expect(mainEvent(NOW).info.id).toBe(mainEvent(NOW + 60_000).info.id)
  })

  it('zeigt vier Einträge und wiederholt keinen', () => {
    const schedule = eventSchedule(NOW)
    expect(schedule).toHaveLength(4)
    expect(new Set(schedule.map((e) => e.info.id)).size).toBe(4)
  })

  it('das Nebenevent ist vor Donnerstag kommend und danach aktiv', () => {
    const monday = new Date(2026, 7, 17, 10).getTime() // 17.08.2026 ist ein Montag
    expect(new Date(monday).getDay()).toBe(1)
    expect(eventSchedule(monday)[1].role).toBe('upcoming')
    expect(eventSchedule(addDays(monday, 3))[1].role).toBe('side')
  })

  it('jedes Event trägt eine erfüllbare Mission', () => {
    for (const event of EVENT_CATALOG) {
      expect(event.mission.goal).toBeGreaterThan(0)
      expect(event.mission.rewardCoins).toBeGreaterThan(0)
      expect(event.mission.rewardCrystals).toBeGreaterThan(0)
    }
  })
})
