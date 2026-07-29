import { useGameStore } from '../store/gameStore'

/**
 * Währungsleiste — auf jedem Bildschirm oben, immer in derselben Reihenfolge:
 * Münzen, Kristalle, Energie (docs/03-art-ui-guide.md).
 */
function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-elevated/80 px-3 py-1.5 text-sm font-semibold ring-1 ring-edge">
      <span aria-hidden>{icon}</span>
      <span className="tabular">{children}</span>
    </span>
  )
}

export function CurrencyBar() {
  const profile = useGameStore((s) => s.save?.profile)
  if (!profile) return null

  return (
    <div className="flex items-center gap-2">
      <Pill icon="🪙">{profile.coins.toLocaleString('de-DE')}</Pill>
      <Pill icon="💎">{profile.crystals.toLocaleString('de-DE')}</Pill>
      <Pill icon="⚡">
        {profile.energy}/{profile.energyMax}
      </Pill>
    </div>
  )
}
