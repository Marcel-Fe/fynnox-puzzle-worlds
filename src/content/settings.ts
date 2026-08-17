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
  'Dein Spielstand liegt auf diesem Gerät, im Speicher deines Browsers.',
  'Schaltest du die Cloud-Speicherung ein, liegt zusätzlich eine Kopie auf einem Server — nur der Spielstand selbst, ohne Name, E-Mail oder Konto. Er hängt an einer zufälligen Nummer, die dieses Gerät für sich erzeugt hat.',
  'Es gibt keine Werbung, keine Verfolgung und keine Weitergabe an Dritte. Niemand außer dir sieht deinen Fortschritt.',
  'Löschst du die Websitedaten oder tippst unten auf „Spielstand zurücksetzen", ist der Stand auf diesem Gerät endgültig weg.',
]

/** Texte der Cloud-Karte (docs/04-datenmodell.md, „Cloud-Speicher"). */
export const CLOUD_TEXT = {
  title: 'Cloud-Speicherung',
  offHint:
    'Der Spielstand liegt nur auf diesem Gerät. Für den Abgleich mit einem zweiten Gerät fehlen die Zugangsdaten des Servers — siehe .env.example im Projekt.',
  offValue: 'Nicht eingerichtet',
  loading: 'Wird abgeglichen …',
  connected: 'Verbunden',
  failed: 'Kein Zugriff',
  soloHint:
    'Dein Spielstand wird gesichert. Um ihn auf einem zweiten Gerät weiterzuspielen, lass dir hier einen Code geben und gib ihn dort ein.',
  pairedHint:
    'Dieses Gerät teilt sich den Spielstand mit einem anderen. Gespielt wird immer auf dem Stand mit den meisten Runden.',
  showCode: 'Code für ein zweites Gerät',
  enterCode: 'Code von einem anderen Gerät eingeben',
  codeHint: 'Gib diesen Code innerhalb von 15 Minuten auf dem anderen Gerät ein.',
  codePlaceholder: 'z. B. K7QM2P',
  submit: 'Koppeln',
  unlink: 'Kopplung lösen',
  linked: 'Gekoppelt. Der Spielstand wird jetzt abgeglichen.',
  badCode: 'Dieser Code ist falsch oder abgelaufen.',
  noAccount:
    'Es gibt kein Konto und kein Passwort. Verlierst du dieses Gerät ohne gekoppeltes zweites, ist der Spielstand weg.',
} as const

export const HELP_TEXT = [
  'Eine Runde kostet eine Energie. Energie füllt sich alle zehn Minuten um eine Einheit auf, auch wenn die App geschlossen ist.',
  'Münzen und XP gibt es für jede Runde, Kristalle nur aus Levelaufstiegen, Missionen, Events und den Truhen im Abenteuerpfad.',
  'Missionen wechseln um Mitternacht, Wochenmissionen am Montag. Nicht abgeholte Belohnungen verfallen dabei.',
]
