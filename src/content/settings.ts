import type { Settings } from '../save/types'

/**
 * Beschriftungen des Einstellungsbildschirms (docs/01-gamedesign.md).
 *
 * Drei Gruppen wie im Handy-Mockup. `effective` sagt ehrlich, ob der Schalter
 * heute schon etwas bewirkt — Ton und Musik gibt es erst in Phase 8, und ein
 * Schalter, der nichts tut, ohne es zu sagen, ist eine Lüge in der Oberfläche.
 */
export interface SettingRow {
  key: keyof Omit<Settings, 'language'>
  label: string
  hint: string
  effective: boolean
}

export const GENERAL_SETTINGS: SettingRow[] = [
  {
    key: 'music',
    label: 'Musik',
    hint: 'Hintergrundmusik in Dauerschleife. Wird beim ersten Einschalten geladen — dafür braucht es einmal Netz.',
    effective: true,
  },
  {
    key: 'sound',
    label: 'Soundeffekte',
    hint: 'Klänge beim Gewinnen, Abholen, Öffnen und Kaufen.',
    effective: true,
  },
  {
    key: 'vibration',
    label: 'Vibration',
    hint: 'Kurzes Rütteln als Rückmeldung. Nicht jedes Gerät kann das.',
    effective: true,
  },
  {
    key: 'powerSaving',
    label: 'Energiesparmodus',
    hint: 'Weniger Bewegung auf dem Bildschirm. Greift, sobald animiert wird.',
    effective: false,
  },
]

export const GAME_SETTINGS: SettingRow[] = [
  {
    key: 'notifications',
    label: 'Benachrichtigungen',
    hint: 'Erinnerung an die tägliche Belohnung. Braucht noch die Erlaubnis des Geräts.',
    effective: false,
  },
]

export const ABOUT_TEXT = [
  'Fynnox Puzzle Worlds ist ein Familienprojekt rund um den Fuchs Fynnox.',
  'Acht Spiele teilen sich ein Profil: XP, Münzen, Kristalle, Missionen und einen Abenteuerpfad über neun Welten.',
  'Es gibt keine Werbung, keine Bezahlung und keine Konten. Die Preise im Shop kosten ausschließlich erspielte Kristalle.',
]

export const PRIVACY_TEXT = [
  'Dein Spielstand liegt allein auf diesem Gerät, im Speicher deines Browsers.',
  'Es werden keine Daten an einen Server gesendet, weil es keinen gibt. Niemand außer dir sieht deinen Fortschritt.',
  'Löschst du die Websitedaten oder tippst unten auf „Spielstand zurücksetzen", ist der Stand endgültig weg.',
]

export const HELP_TEXT = [
  'Eine Runde kostet eine Energie. Energie füllt sich alle zehn Minuten um eine Einheit auf, auch wenn die App geschlossen ist.',
  'Münzen und XP gibt es für jede Runde, Kristalle nur aus Levelaufstiegen, Missionen, Events und den Truhen im Abenteuerpfad.',
  'Missionen wechseln um Mitternacht, Wochenmissionen am Montag. Nicht abgeholte Belohnungen verfallen dabei.',
]
