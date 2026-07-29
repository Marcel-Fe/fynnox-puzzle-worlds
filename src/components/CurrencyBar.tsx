/**
 * Währungsleiste — auf jedem Bildschirm oben, immer in derselben Reihenfolge:
 * Energie, Münzen, Kristalle (docs/03-art-ui-guide.md).
 *
 * Die Werte sind Platzhalter aus den Mockups. Sie kommen in Phase 3 aus dem Spielstand.
 */
const PLACEHOLDER = { energy: 5, energyMax: 5, coins: 12580, crystals: 320 }

function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-elevated/80 px-3 py-1.5 text-sm font-semibold ring-1 ring-edge">
      <span aria-hidden>{icon}</span>
      <span className="tabular">{children}</span>
    </span>
  )
}

export function CurrencyBar() {
  const { energy, energyMax, coins, crystals } = PLACEHOLDER
  return (
    <div className="flex items-center gap-2">
      <Pill icon="⚡">
        {energy}/{energyMax}
      </Pill>
      <Pill icon="🪙">{coins.toLocaleString('de-DE')}</Pill>
      <Pill icon="💎">{crystals.toLocaleString('de-DE')}</Pill>
    </div>
  )
}
