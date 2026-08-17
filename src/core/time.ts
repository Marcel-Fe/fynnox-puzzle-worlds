/**
 * Kalenderrechnung für alles Zeitabhängige (Missionen, Tagesbelohnung, Events).
 *
 * Rein: `now` wird übergeben, nicht aus der Uhr gelesen — genau wie in `energy.ts`.
 * Gerechnet wird in **Ortszeit**, nicht in UTC: Das Gamedesign legt Mitternacht
 * Ortszeit als Tageswechsel fest, und ein Spieler in Deutschland würde einen
 * UTC-Wechsel im Sommer um 2 Uhr nachts erleben.
 *
 * Tage werden über den Date-Konstruktor addiert statt über Millisekunden.
 * Ein Tag ist an den Umstellungswochenenden 23 bzw. 25 Stunden lang; mit
 * `+ 24 * 60 * 60 * 1000` läge der Tageswechsel danach um eine Stunde daneben.
 */

/** Fortlaufende Tagesnummer in Ortszeit. Tag 0 ist der 1.1.1970. */
export function dayIndex(now: number): number {
  const d = new Date(now)
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

/**
 * Fortlaufende Wochennummer, Woche beginnt Montag (DIN 1355).
 * Tag 0 war ein Donnerstag, deshalb der Versatz von 3.
 */
export function weekIndex(now: number): number {
  return Math.floor((dayIndex(now) + 3) / 7)
}

/** Zeitstempel des kommenden Mitternachtswechsels. */
export function endOfDay(now: number): number {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
}

/** Zeitstempel des kommenden Montags, 0 Uhr. */
export function endOfWeek(now: number): number {
  const d = new Date(now)
  const daysUntilMonday = 7 - ((dayIndex(now) + 3) % 7)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysUntilMonday).getTime()
}

/** Zeitstempel des Montags, mit dem die Woche von `now` begonnen hat. */
export function startOfWeek(now: number): number {
  const d = new Date(now)
  const daysSinceMonday = (dayIndex(now) + 3) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday).getTime()
}

/** Verschiebt einen Zeitpunkt um ganze Kalendertage — umstellungssicher. */
export function addDays(now: number, days: number): number {
  const d = new Date(now)
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + days,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  ).getTime()
}

/** Ob zwei Zeitpunkte auf denselben Kalendertag fallen. */
export function isSameDay(a: number, b: number): boolean {
  return dayIndex(a) === dayIndex(b)
}

/**
 * Restzeit als „2 T 6 h", „16 h 45 m" oder „12 m" — die Schreibweise der Mockups.
 * Sekunden erscheinen nur unter einer Minute, sonst flackert die Anzeige.
 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'abgelaufen'
  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} T ${hours % 24} h`
  if (hours > 0) return `${hours} h ${minutes % 60} m`
  if (minutes > 0) return `${minutes} m`
  return `${Math.ceil(ms / 1000)} s`
}
