/** Standard-Karte: abgerundet, dunkel, dünner Rand (docs/03-art-ui-guide.md). */
export function Card({
  title,
  children,
  className = '',
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-edge bg-card/80 p-4 shadow-lg shadow-black/30 ${className}`}
    >
      {title && (
        <h2 className="mb-3 text-xs font-bold tracking-widest text-ink-muted uppercase">{title}</h2>
      )}
      {children}
    </section>
  )
}

/**
 * Fortschritt wird immer als Balken UND als Zahl gezeigt (docs/03-art-ui-guide.md).
 * `showValue={false}`, wenn die Zahl direkt darüber schon steht — sonst doppelt.
 */
export function ProgressBar({
  value,
  goal,
  color = 'var(--color-purple)',
  showValue = true,
}: {
  value: number
  goal: number
  color?: string
  showValue?: boolean
}) {
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-deep">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
      {showValue && (
        <span className="tabular text-xs font-semibold text-ink-muted">
          {value.toLocaleString('de-DE')} / {goal.toLocaleString('de-DE')}
        </span>
      )}
    </div>
  )
}
