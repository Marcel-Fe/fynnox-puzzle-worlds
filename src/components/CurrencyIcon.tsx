import { CURRENCY_ICONS, type CurrencyKind } from '../content/assets'

const LABELS: Record<CurrencyKind, string> = {
  coins: 'Münzen',
  crystals: 'Kristalle',
  energy: 'Energie',
}

/**
 * Münze, Kristall oder Energie als geschnittenes Symbol statt als System-Emoji.
 *
 * Steht meist mitten im Text („Kaufen · 💎 1.200"), deshalb `inline-block` und
 * ein leichter Versatz nach unten — sonst sitzt das Bild auf der Grundlinie und
 * die Zeile wirkt gekippt.
 *
 * Ohne `label` ist das Symbol für Vorlesegeräte unsichtbar; das ist richtig,
 * wo die Zahl daneben schon sagt, worum es geht.
 */
export function CurrencyIcon({
  kind,
  size = 18,
  label = false,
}: {
  kind: CurrencyKind
  size?: number
  label?: boolean
}) {
  return (
    <img
      src={CURRENCY_ICONS[kind]}
      alt={label ? LABELS[kind] : ''}
      width={size}
      height={size}
      aria-hidden={label ? undefined : true}
      className="inline-block shrink-0 translate-y-[-1px] align-middle"
      style={{ width: size, height: size }}
    />
  )
}
