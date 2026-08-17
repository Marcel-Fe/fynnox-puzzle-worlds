import { SHOP_ITEMS_BY_ID, type ShopItem } from '../content/shop'
import type { SaveData } from '../save/types'

/**
 * Kauf im Shop (docs/01-gamedesign.md, Abschnitt „Shop").
 *
 * Rein: keine Uhr, kein Zufall, kein Speicherzugriff.
 * Bezahlt wird ausschließlich mit Kristallen — Euro-Preise sind Anzeige.
 */

export type BuyRefusal = 'unknown' | 'not-for-sale' | 'owned' | 'too-expensive'

export function owns(save: SaveData, id: string): boolean {
  return save.ownedItems.includes(id)
}

/** Warum ein Kauf nicht geht — oder `null`, wenn er geht. */
export function refusalFor(save: SaveData, id: string): BuyRefusal | null {
  const item: ShopItem | undefined = SHOP_ITEMS_BY_ID[id]
  if (!item) return 'unknown'
  if (item.crystals === undefined) return 'not-for-sale'
  if (owns(save, id)) return 'owned'
  if (save.profile.crystals < item.crystals) return 'too-expensive'
  return null
}

export function canBuy(save: SaveData, id: string): boolean {
  return refusalFor(save, id) === null
}

/**
 * Kauft eine Ware. Geht der Kauf nicht, kommt der Spielstand unverändert
 * zurück — die Prüfung gehört hierher, nicht in die Oberfläche.
 */
export function buyItem(save: SaveData, id: string): SaveData {
  if (!canBuy(save, id)) return save
  const item = SHOP_ITEMS_BY_ID[id]

  return {
    ...save,
    profile: { ...save.profile, crystals: save.profile.crystals - item.crystals! },
    ownedItems: [...save.ownedItems, id],
  }
}
