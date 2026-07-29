import { PORTRAITS } from '../content/assets'

/**
 * Rundes Charakterporträt. Die Bilder stammen aus der Charakterleiste der
 * Konzeptbilder (docs/referenzen/gameplay-regeln-und-missionen.png).
 */
export function Avatar({
  name = 'Fynnox',
  size = 48,
  ring,
}: {
  name?: string
  size?: number
  /** Farbiger Rand, z. B. die Farbe des Spiels */
  ring?: string
}) {
  const src = PORTRAITS[name] ?? PORTRAITS.Fynnox
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-elevated object-cover"
      style={{
        width: size,
        height: size,
        boxShadow: ring ? `0 0 0 2px ${ring}` : '0 0 0 2px var(--color-edge)',
      }}
    />
  )
}

/**
 * Sprechblase mit Porträt — auf jedem Spielbildschirm erklärt die Begleitfigur
 * die Regel (docs/02-charakterbibel.md).
 */
export function SpeechBubble({
  name,
  children,
  ring,
}: {
  name: string
  children: React.ReactNode
  ring?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={name} size={52} ring={ring} />
      <p className="relative flex-1 rounded-xl rounded-tl-none bg-[#f5ead2] p-3 text-sm font-medium text-[#2b1d10] shadow-lg">
        {children}
      </p>
    </div>
  )
}
