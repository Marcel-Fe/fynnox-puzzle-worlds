import type { RoundRewards } from '../core/round'

/**
 * Ergebnisbildschirm nach einer Runde — Vorlage für alle Spiele
 * (docs/01-gamedesign.md, „Gewonnen-Bildschirm").
 *
 * Bewusst kein eigener Bildschirm, sondern eine Schicht über dem Spielfeld:
 * Der Spieler soll sehen, wie die Runde ausgegangen ist.
 */
export function RoundResultOverlay({
  won,
  title,
  stars,
  facts,
  rewards,
  accent,
  onAgain,
  onLeave,
  againDisabled,
  againLabel = 'Nochmal (1 ⚡)',
}: {
  won: boolean
  title: string
  stars: 0 | 1 | 2 | 3
  /** Spielabhängige Werte, z. B. Punkte und geräumte Reihen */
  facts: { label: string; value: string }[]
  rewards: RoundRewards | null
  accent: string
  onAgain(): void
  onLeave(): void
  againDisabled?: boolean
  /** Abweichende Beschriftung, z. B. „Level 4" nach einem Sieg mit Freischaltung */
  againLabel?: string
}) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-deep/90 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Rundenergebnis"
    >
      <div className="w-full max-w-sm rounded-2xl border border-edge bg-card p-5 text-center shadow-2xl">
        <h2 className="text-3xl font-black tracking-wide text-gold">{title}</h2>

        <p className="mt-2 text-4xl" aria-label={`${stars} von 3 Sternen`}>
          <span className="text-gold">{'★'.repeat(stars)}</span>
          <span className="text-edge">{'★'.repeat(3 - stars)}</span>
        </p>

        <dl className="mt-4 flex justify-center gap-6 text-sm">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs tracking-wider text-ink-muted uppercase">{fact.label}</dt>
              <dd className="tabular text-lg font-black">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {rewards && (
          <div className="mt-4 rounded-xl bg-deep/70 p-3">
            <p className="text-xs tracking-wider text-ink-muted uppercase">Erhalten</p>
            <p className="tabular mt-1 text-sm font-bold">
              ⭐ {rewards.xp} XP · 🪙 {rewards.coins.toLocaleString('de-DE')}
              {rewards.crystals > 0 && ` · 💎 ${rewards.crystals}`}
            </p>
            {rewards.levelsGained > 0 && (
              <p className="mt-1 text-sm font-black text-gold">
                Level up! {rewards.levelsGained > 1 && `+${rewards.levelsGained} Level`}
              </p>
            )}
            {rewards.newHighScore && !won && (
              <p className="mt-1 text-sm font-bold text-gold">Neuer Bestwert!</p>
            )}
            {rewards.completedMissions.length > 0 && (
              <p className="mt-1 text-sm font-bold text-gold">
                {rewards.completedMissions.length} Mission
                {rewards.completedMissions.length > 1 ? 'en' : ''} geschafft — Belohnung
                wartet!
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onAgain}
            disabled={againDisabled}
            className="min-h-12 flex-1 rounded-xl text-sm font-black text-deep uppercase disabled:opacity-40"
            style={{ background: accent }}
          >
            {againLabel}
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  )
}
