import { asset } from './assets'

/**
 * Navigationspunkte. Reihenfolge und Beschriftung stammen aus den Mockups
 * (docs/referenzen/handy-app-10-bildschirme.png).
 */
export interface NavItem {
  to: string
  label: string
  icon: string
  /**
   * Bild fuer die Kachel auf dem Mehr-Bildschirm. Nur die Punkte hinter „Mehr"
   * brauchen eines — in der Tab-Leiste ist kein Platz dafuer.
   */
  image?: string
  /** Ein Satz, der sagt, was einen dort erwartet */
  teaser?: string
  /**
   * Am Handy hat die Tab-Leiste genau fünf Punkte — mehr sind nicht treffsicher
   * tippbar. Alles Übrige liegt hinter „Mehr" (docs/03-art-ui-guide.md).
   */
  inBottomBar: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Start', icon: '🏠', inBottomBar: true },
  { to: '/spiele', label: 'Spiele', icon: '🎮', inBottomBar: true },
  { to: '/missionen', label: 'Missionen', icon: '🎯', inBottomBar: true },
  { to: '/shop', label: 'Shop', icon: '🛒', inBottomBar: true },
  {
    to: '/abenteuer',
    label: 'Abenteuer',
    icon: '🗺️',
    inBottomBar: false,
    image: asset('bg/sonnenwald.jpg'),
    teaser: 'Neun Kapitel durch alle Welten',
  },
  {
    to: '/events',
    label: 'Events',
    icon: '🎪',
    inBottomBar: false,
    image: asset('bg/lavatal.jpg'),
    teaser: 'Jede Woche eine neue Aufgabe',
  },
  {
    to: '/freunde',
    label: 'Freunde',
    icon: '👥',
    inBottomBar: false,
    image: asset('chars/mira.jpg'),
    teaser: 'Fynnox’ Begleiter aus dem Wald',
  },
  {
    to: '/rangliste',
    label: 'Rangliste',
    icon: '🏆',
    inBottomBar: false,
    image: asset('bg/wintergipfel.jpg'),
    teaser: 'Wie weit oben stehst du?',
  },
  {
    to: '/profil',
    label: 'Profil',
    icon: '🦊',
    inBottomBar: false,
    image: asset('chars/fynnox-jubel.jpg'),
    teaser: 'Level, Statistik und Fynnox in 3D',
  },
  {
    to: '/erfolge',
    label: 'Erfolge',
    icon: '⭐',
    inBottomBar: false,
    image: asset('bg/kristallhoehle.jpg'),
    teaser: '23 Stück, alle erspielbar',
  },
  {
    to: '/einstellungen',
    label: 'Einstellungen',
    icon: '⚙️',
    inBottomBar: false,
    image: asset('bg/stadt.jpg'),
    teaser: 'Ton, Bewegung und Cloud',
  },
]

/** Der fünfte Tab am Handy: Sammelseite für alles, was nicht in die Leiste passt. */
export const MORE_ITEMS = NAV_ITEMS.filter((item) => !item.inBottomBar)
