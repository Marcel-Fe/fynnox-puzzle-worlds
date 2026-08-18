/**
 * Warenkatalog des Shops (docs/01-gamedesign.md, Abschnitt „Shop").
 *
 * Nur Kristallpreise sind kaufbar. Die Euro-Preise stehen im Mockup und werden
 * darum gezeigt, sind aber ohne Funktion — es gibt keine Bezahlung (CLAUDE.md).
 *
 * Die sechs belegten Waren stammen unverändert aus dem Mockup. Die übrigen
 * füllen die vier Reiter und übernehmen deren Preislage.
 */
import { asset } from './assets'

export type ShopCategory = 'outfits' | 'helfer' | 'booster'

export interface ShopItem {
  id: string
  title: string
  description: string
  category: ShopCategory
  /** Preis in Kristallen; fehlt bei Waren mit Euro-Preis */
  crystals?: number
  /** Anzeigepreis ohne Funktion */
  euro?: string
  /** Steht zusätzlich unter „Empfohlen" */
  featured?: boolean
  icon: string
  /**
   * Warenbild aus den Konzeptbildern. Es gibt nur für die sechs Waren eines,
   * die auf einem Mockup abgebildet sind — der Rest behält sein Emoji, weil
   * hier keine Grafik erfunden wird (CLAUDE.md, Abschnitt Grafik).
   */
  image?: string
}

/**
 * Farbe hinter der Ware. Sie stammt aus der Kachel des jeweiligen Mockups:
 * Outfits stehen dort auf Gold, Helfer auf Rot, Booster auf Violett.
 */
export const SHOP_CATEGORY_ACCENT: Record<ShopCategory, string> = {
  outfits: 'var(--color-gold)',
  helfer: 'var(--color-game-kristallmix)',
  booster: 'var(--color-purple)',
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'outfit-pirat',
    title: 'Fynnox Piraten Outfit',
    description: 'Dreispitz, Augenklappe und ein Grinsen dazu.',
    category: 'outfits',
    crystals: 1200,
    featured: true,
    icon: '🏴‍☠️',
    image: asset('shop/pirat.jpg'),
  },
  {
    id: 'outfit-winter',
    title: 'Winterfell-Mantel',
    description: 'Hält warm bis hinauf zum Wintergipfel.',
    category: 'outfits',
    crystals: 900,
    icon: '🧥',
  },
  {
    id: 'outfit-forscher',
    title: 'Forscherweste',
    description: 'Viele Taschen für alles, was am Wegrand liegt.',
    category: 'outfits',
    crystals: 800,
    icon: '🎒',
  },
  {
    id: 'outfit-gold',
    title: 'Goldener Schal',
    description: 'Der Schal aus Fynnox Adventure, nur in Gold.',
    category: 'outfits',
    crystals: 1500,
    icon: '🧣',
  },
  {
    id: 'helfer-kristall',
    title: 'Kristall Haustier',
    description: 'Ein kleiner Kristall, der überallhin mitschwebt.',
    category: 'helfer',
    crystals: 800,
    featured: true,
    icon: '💠',
    image: asset('shop/kristallhaustier.jpg'),
  },
  {
    id: 'helfer-laterne',
    title: 'Lumos Laterne',
    description: 'Leuchtet auch in der tiefsten Höhle.',
    category: 'helfer',
    crystals: 600,
    icon: '🏮',
  },
  {
    id: 'helfer-kompass',
    title: 'Pips Kompass',
    description: 'Zeigt immer dorthin, wo es spannend wird.',
    category: 'helfer',
    crystals: 1000,
    icon: '🧭',
  },
  {
    id: 'helfer-eule',
    title: 'Miras Waldeule',
    description: 'Sie kennt jeden Baum im Sonnenwald.',
    category: 'helfer',
    crystals: 1200,
    icon: '🦉',
  },
  {
    id: 'booster-mega',
    title: 'Mega Booster Pack',
    description: 'Das große Bündel für lange Abende.',
    category: 'booster',
    crystals: 2500,
    featured: true,
    icon: '🎁',
    image: asset('shop/megabooster.jpg'),
  },
  {
    id: 'booster-sanduhr',
    title: 'Sanduhr',
    description: 'Für alle, die es in Tempelpaare knapp verpasst haben.',
    category: 'booster',
    crystals: 400,
    icon: '⌛',
  },
  {
    id: 'booster-hinweis',
    title: 'Hinweis-Bündel',
    description: 'Fünf Hinweise für die kniffligen Rätsel.',
    category: 'booster',
    crystals: 250,
    icon: '💡',
  },
  {
    id: 'booster-glueck',
    title: 'Glücksklee',
    description: 'Bringt Glück. Behauptet Pip.',
    category: 'booster',
    crystals: 700,
    icon: '🍀',
  },
  {
    id: 'euro-muenzen',
    title: 'Münzpaket 10.000',
    description: 'Aus dem Mockup — keine Bezahlung im Spiel.',
    category: 'booster',
    euro: '2,49 €',
    icon: '🪙',
    image: asset('shop/muenzpaket.jpg'),
  },
  {
    id: 'euro-kristalle',
    title: 'Kristallpaket 500',
    description: 'Aus dem Mockup — keine Bezahlung im Spiel.',
    category: 'booster',
    euro: '4,99 €',
    icon: '💎',
    image: asset('shop/kristallpaket.jpg'),
  },
  {
    id: 'euro-booster',
    title: 'Booster Pack',
    description: 'Aus dem Mockup — keine Bezahlung im Spiel.',
    category: 'booster',
    euro: '5,99 €',
    icon: '📦',
    image: asset('shop/boosterpack.jpg'),
  },
]

export const SHOP_TABS = [
  { key: 'empfohlen', label: 'Empfohlen' },
  { key: 'outfits', label: 'Outfits' },
  { key: 'helfer', label: 'Helfer' },
  { key: 'booster', label: 'Booster' },
] as const

export type ShopTab = (typeof SHOP_TABS)[number]['key']

export const SHOP_ITEMS_BY_ID = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i])) as Record<
  string,
  ShopItem
>

/**
 * Gekauftes wird gesammelt, wirkt aber noch nicht ins Spiel hinein — Outfits
 * und Helfer brauchen dafür Grafik, die es in den Konzeptbildern nicht gibt,
 * Booster eine Regel in jedem der acht Spiele. Beides gehört zu Phase 8.
 */
export const SHOP_NOTE =
  'Gekauftes landet in deiner Sammlung. Wie es im Spiel wirkt, kommt später dazu.'

/** Kopfbereich des Shop-Bildschirms (Bild: public/art/shop/hero.jpg). */
export const SHOP_HEADLINE = 'Fynnox’ Schatzkammer'
export const SHOP_TEASER = 'Outfits, Helfer und Booster — bezahlt wird mit Kristallen.'
export const SHOP_HERO = asset('shop/hero.jpg')
