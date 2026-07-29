/** Navigationspunkte. Reihenfolge und Beschriftung stammen aus den Mockups. */
export interface NavItem {
  to: string
  label: string
  icon: string
  /** In der Tab-Leiste am Handy ist nur Platz für fünf Punkte. */
  inBottomBar: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Start', icon: '🏠', inBottomBar: true },
  { to: '/spiele', label: 'Spiele', icon: '🎮', inBottomBar: true },
  { to: '/abenteuer', label: 'Abenteuer', icon: '🗺️', inBottomBar: true },
  { to: '/missionen', label: 'Missionen', icon: '🎯', inBottomBar: true },
  { to: '/shop', label: 'Shop', icon: '🛒', inBottomBar: true },
  { to: '/freunde', label: 'Freunde', icon: '👥', inBottomBar: false },
  { to: '/rangliste', label: 'Rangliste', icon: '🏆', inBottomBar: false },
  { to: '/erfolge', label: 'Erfolge', icon: '⭐', inBottomBar: false },
  { to: '/einstellungen', label: 'Einstellungen', icon: '⚙️', inBottomBar: false },
]
