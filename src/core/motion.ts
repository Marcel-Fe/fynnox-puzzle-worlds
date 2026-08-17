/**
 * Ob sich auf dem Bildschirm etwas bewegen darf
 * (docs/01-gamedesign.md, „Bewegung").
 *
 * Rein: beide Angaben kommen von außen, damit die Regel ohne Browser prüfbar ist.
 */

/**
 * Zwei Quellen, ein Ergebnis:
 *
 * - `powerSaving` ist der Schalter aus den Einstellungen
 * - `prefersReduced` ist die Systemeinstellung „Bewegung reduzieren"
 *
 * Die Systemeinstellung wird mitgelesen, nicht überschrieben: Wer sie gesetzt
 * hat, hat das aus einem Grund getan — häufig wegen Schwindel oder Migräne.
 * Ein Spiel darf sich darüber nicht hinwegsetzen, auch nicht mit einem
 * eigenen Schalter, der „aus" steht.
 */
export function motionAllowed(powerSaving: boolean, prefersReduced: boolean): boolean {
  return !powerSaving && !prefersReduced
}

/**
 * Zwischenwert einer Zählanimation, weich auslaufend (ease-out quad).
 *
 * `progress` läuft von 0 bis 1. Das Ergebnis ist immer eine ganze Zahl und
 * erreicht bei 1 genau den Zielwert — ein Zähler, der bei 998 von 1.000
 * stehen bleibt, wäre schlimmer als gar keine Animation.
 */
export function countUpValue(target: number, progress: number): number {
  if (progress >= 1) return target
  if (progress <= 0) return 0
  const eased = 1 - (1 - progress) * (1 - progress)
  return Math.round(target * eased)
}
