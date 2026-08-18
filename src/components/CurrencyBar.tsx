import type { CurrencyKind } from '../content/assets'
import { useGameStore } from '../store/gameStore'
import { CurrencyIcon } from './CurrencyIcon'

/**
 * Währungsleiste — auf jedem Bildschirm oben, immer in derselben Reihenfolge:
 * Münzen, Kristalle, Energie (docs/03-art-ui-guide.md).
 */
function Pill({ kind, children }: { kind: CurrencyKind; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-elevated/80 px-3 py-1.5 text-sm font-semibold ring-1 ring-edge">
      <CurrencyIcon kind={kind} size={20} label />
      <span className="tabular">{children}</span>
    </span>
  )
}

export function CurrencyBar() {
  const profile = useGameStore((s) => s.save?.profile)
  if (!profile) return null

  return (
    <div className="flex items-center gap-2">
      <Pill kind="coins">{profile.coins.toLocaleString('de-DE')}</Pill>
      <Pill kind="crystals">{profile.crystals.toLocaleString('de-DE')}</Pill>
      <Pill kind="energy">
        {profile.energy}/{profile.energyMax}
      </Pill>
    </div>
  )
}
