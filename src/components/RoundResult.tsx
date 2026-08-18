import { useEffect } from 'react'
import { MOMENTS } from '../content/assets'
import { FYNNOX_FACES, fynnoxLine, moodFor } from '../content/reactions'
import { sfx } from '../core/audio'
import type { RoundRewards } from '../core/round'
import { useCountUp } from './motion'

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
  const mood = moodFor(won)

  // Das Overlay wird erst beim Rundenende eingehängt — der Klang gehört also
  // an das Einhängen, nicht an einen Knopf. Eine Stelle für alle acht Spiele.
  useEffect(() => {
    sfx(won ? 'win' : 'lose')
  }, [won])

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-deep/90 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Rundenergebnis"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-edge bg-card text-center shadow-2xl">
        {/* Die Einblendung aus dem Gamedesign trägt das Urteil („SIEG!" bzw.
            „FEHLER!") schon im Bild. Die Überschrift darunter wiederholt es
            deshalb nicht, sondern nennt das Spielspezifische — „Tempel
            geräumt!", „Zeit abgelaufen!". */}
        <img
          src={won ? MOMENTS.sieg : MOMENTS.fehler}
          alt={won ? 'Sieg!' : 'Fehler!'}
          // Oben ausgerichtet, nicht mittig: Das Schild mit dem Wort sitzt am
          // oberen Bildrand und wäre sonst angeschnitten.
          className="h-40 w-full object-cover object-top"
        />

        <div className="p-5 pt-3">
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
              <RewardLine rewards={rewards} />
              {rewards.levelsGained > 0 && (
                <>
                  {/* Auch hier steht das Wort im Bild — daneben nur noch die
                      Anzahl, wenn es mehr als ein Level auf einmal war. */}
                  <img
                    src={MOMENTS.levelup}
                    alt="Level up!"
                    className="mx-auto mt-2 h-20 rounded-lg object-cover"
                  />
                  {rewards.levelsGained > 1 && (
                    <p className="tabular mt-1 text-sm font-black text-gold">
                      +{rewards.levelsGained} Level
                    </p>
                  )}
                </>
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

          {/* Fynnox meldet sich zu Wort (docs/02-charakterbibel.md). Die Zeile
              hängt am Ergebnis, damit sie beim Neuzeichnen stehen bleibt. */}
          <div className="mt-4 flex items-center gap-3 text-left">
            <img
              src={FYNNOX_FACES[mood]}
              alt="Fynnox"
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full bg-elevated object-cover"
              style={{ boxShadow: `0 0 0 2px ${won ? 'var(--color-gold)' : 'var(--color-edge)'}` }}
            />
            <p className="flex-1 rounded-xl rounded-tl-none bg-[#f5ead2] p-2.5 text-sm font-medium text-[#2b1d10] shadow-lg">
              {fynnoxLine(mood, stars * 7 + facts.length)}
            </p>
          </div>

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
    </div>
  )
}

/**
 * Die erspielte Belohnung läuft hoch, statt einfach dazustehen — der Moment,
 * in dem die Runde sich auszahlt (docs/01-gamedesign.md, „Bewegung").
 *
 * Eigene Komponente, weil Hooks nicht hinter einer Bedingung stehen dürfen:
 * `rewards` kann null sein, und `useCountUp` liefe dann mal mit, mal nicht.
 */
function RewardLine({ rewards }: { rewards: RoundRewards }) {
  const xp = useCountUp(rewards.xp)
  const coins = useCountUp(rewards.coins)
  const crystals = useCountUp(rewards.crystals)

  return (
    <p className="tabular mt-1 text-sm font-bold">
      ⭐ {xp} XP · 🪙 {coins.toLocaleString('de-DE')}
      {rewards.crystals > 0 && ` · 💎 ${crystals}`}
    </p>
  )
}
