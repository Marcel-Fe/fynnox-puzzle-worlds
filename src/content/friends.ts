/**
 * Freunde und Rangliste — deutsche Texte und die Besetzung
 * (docs/01-gamedesign.md, „Ranglisten und Freunde").
 *
 * Es gibt keine echten Mitspieler: Der Cloud-Speicher kennt Spielstände, keine
 * Konten und keine Beziehungen. Die Gegner sind die zehn Begleitfiguren aus
 * docs/02-charakterbibel.md — und das steht auf beiden Bildschirmen sichtbar.
 */

export type FriendsTab = 'freunde' | 'anfragen' | 'bestenliste'

export const FRIEND_TABS: { key: FriendsTab; label: string }[] = [
  { key: 'freunde', label: 'Freunde' },
  { key: 'anfragen', label: 'Anfragen' },
  { key: 'bestenliste', label: 'Bestenliste' },
]

/**
 * Die neun Begleitfiguren, die als Freunde und Gegner auftreten.
 *
 * **Fynnox selbst fehlt bewusst**: Er ist der Begleiter des Spielers und steckt
 * schon im eigenen Avatar. Stünde er zusätzlich als Konkurrent in der Liste,
 * hieße bei einem frischen Profil zweimal jemand „Fynnox" — die Voreinstellung
 * des Profilnamens ist genau dieser Name (docs/02-charakterbibel.md).
 *
 * `level` steht nur dort, wo ein Mockup es belegt — alles andere wird gesät
 * berechnet (src/core/friends.ts).
 */
export interface Companion {
  name: string
  /** Rolle aus docs/02-charakterbibel.md */
  role: string
  /** Aus einem Mockup belegtes Level; sonst gesät */
  level?: number
}

export const COMPANIONS: Companion[] = [
  { name: 'Mira', role: 'Heilerin', level: 15 },
  { name: 'Lumo', role: 'Mentor', level: 14 },
  { name: 'Borin', role: 'Schmied', level: 13 },
  { name: 'Pip', role: 'Entdecker', level: 11 },
  { name: 'Elda', role: 'Dorfälteste' },
  { name: 'Juno', role: 'Musiker' },
  { name: 'Kori', role: 'Wächter' },
  { name: 'Finn', role: 'Fischer' },
  { name: 'Bree', role: 'Schneiderin' },
]

export const FRIENDS_NOTE =
  'Das sind Fynnox’ Begleiter aus dem Wald — Spielfiguren, keine echten Menschen. ' +
  'Ihre Werte stehen fest und wachsen nicht mit dir mit.'

export const REQUESTS_EMPTY = [
  'Hier landen Einladungen von echten Menschen.',
  'Fynnox Puzzle Worlds hat keine Konten und keine Mitspieler: Der Cloud-Speicher sichert deinen Spielstand, mehr nicht.',
  'Solange das so bleibt, bleibt dieser Bereich leer. Lieber leer als mit erfundenen Anfragen gefüllt.',
]

export const LEADERBOARD_NOTE =
  'Deine Trophäen: Level × 100 + gewonnene Runden × 25 + gespielte Runden × 5. ' +
  'Die Begleiter rechnen nach derselben Formel.'

export const ONLINE_LABEL = 'Online'
export const ALL_LABEL = 'Alle Freunde'
