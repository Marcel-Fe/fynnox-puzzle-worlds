/**
 * Navigationspunkte. Reihenfolge und Beschriftung stammen aus den Mockups
 * (docs/referenzen/handy-app-10-bildschirme.png).
 */
export interface NavItem {
  to: string
  label: string
  icon: string
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
  { to: '/abenteuer', label: 'Abenteuer', icon: '🗺️', inBottomBar: false },
  { to: '/events', label: 'Events', icon: '🎪', inBottomBar: false },
  { to: '/freunde', label: 'Freunde', icon: '👥', inBottomBar: false },
  { to: '/rangliste', label: 'Rangliste', icon: '🏆', inBottomBar: false },
  { to: '/profil', label: 'Profil', icon: '🦊', inBottomBar: false },
  { to: '/erfolge', label: 'Erfolge', icon: '⭐', inBottomBar: false },
  { to: '/einstellungen', label: 'Einstellungen', icon: '⚙️', inBottomBar: false },
]

/** Der fünfte Tab am Handy: Sammelseite für alles, was nicht in die Leiste passt. */
export const MORE_ITEMS = NAV_ITEMS.filter((item) => !item.inBottomBar)
