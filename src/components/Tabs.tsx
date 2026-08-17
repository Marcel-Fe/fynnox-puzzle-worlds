/**
 * Reiterleiste (docs/03-art-ui-guide.md). Wird von Missionen und Shop genutzt —
 * eine einzige Stelle, damit beide nicht auseinanderlaufen.
 *
 * Die Reiter sind Knöpfe mit mindestens 44 px Höhe und markieren den aktiven
 * Zustand über Farbe *und* `aria-selected`, nicht nur über Hover.
 */
export interface TabItem<T extends string> {
  key: T
  label: string
  /** Zahl in einem Kreis, z. B. abholbereite Belohnungen */
  badge?: number
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly TabItem<T>[]
  active: T
  onChange(key: T): void
}) {
  return (
    <div role="tablist" className="flex gap-1.5 overflow-x-auto rounded-xl bg-card/60 p-1.5">
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={[
              'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold whitespace-nowrap transition',
              selected
                ? 'bg-gradient-to-r from-gold to-gold-deep text-deep'
                : 'text-ink-muted',
            ].join(' ')}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={[
                  'tabular grid size-5 place-items-center rounded-full text-[11px] font-black',
                  selected ? 'bg-deep text-gold' : 'bg-gold text-deep',
                ].join(' ')}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
