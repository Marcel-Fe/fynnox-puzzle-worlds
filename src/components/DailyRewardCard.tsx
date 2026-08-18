import { useEffect, useState } from 'react'
import { MOMENTS } from '../content/assets'
import { sfx } from '../core/audio'
import { DAILY_REWARDS, dailyRewardState } from '../core/dailyReward'
import { formatRemaining } from '../core/time'
import { useGameStore } from '../store/gameStore'
import { Card } from './Card'
import { CurrencyIcon } from './CurrencyIcon'

/**
 * Die Truhe vom Startbildschirm-Mockup: Leiter über sieben Tage, Countdown
 * bis zur nächsten Abholung, Knopf „Abholen" (docs/01-gamedesign.md).
 */
export function DailyRewardCard() {
  const save = useGameStore((s) => s.save)
  const claim = useGameStore((s) => s.claimDailyReward)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  if (!save) return null
  const state = dailyRewardState(save, now)

  return (
    <Card title="Tägliche Belohnung">
      <div className="flex items-center gap-3">
        {/* Die Truhe ohne Schild: Über der Karte steht bereits „Tägliche
            Belohnung" — das beschriftete Bild würde dasselbe Wort wiederholen. */}
        <img
          src={MOMENTS.truhe}
          alt=""
          className={[
            'h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-edge',
            state.available ? '' : 'opacity-50 grayscale',
          ].join(' ')}
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {state.available
              ? 'Komme jeden Tag zurück und erhalte tolle Belohnungen!'
              : 'Heute schon abgeholt. Bis morgen!'}
          </p>
          <p className="tabular mt-0.5 text-xs text-ink-muted">
            Tag {state.step} von {DAILY_REWARDS.length}
            {state.available
              ? ''
              : ` · nächste in ${formatRemaining(state.msUntilNext)}`}
          </p>
        </div>
      </div>

      <ol className="mt-3 flex gap-1.5">
        {DAILY_REWARDS.map((reward, i) => {
          const day = i + 1
          const isNext = day === state.step
          const done = day < state.step
          return (
            <li
              key={day}
              className={[
                'flex-1 rounded-lg border px-1 py-1.5 text-center',
                isNext
                  ? 'border-gold bg-gold/15'
                  : done
                    ? 'border-edge bg-deep/60 opacity-60'
                    : 'border-edge bg-deep/60',
              ].join(' ')}
            >
              <span className="block text-[9px] font-bold tracking-wider text-ink-muted uppercase">
                {day}
              </span>
              <span className="tabular block text-[11px] font-black">
                {reward.crystals > 0 ? (
                  <>
                    <CurrencyIcon kind="crystals" size={13} />
                    {reward.crystals}
                  </>
                ) : (
                  <>
                    <CurrencyIcon kind="coins" size={13} />
                    {reward.coins}
                  </>
                )}
              </span>
              {reward.crystals > 0 && reward.coins > 0 && (
                <span className="tabular block text-[9px] font-bold text-gold">
                  <CurrencyIcon kind="coins" size={11} />
                  {reward.coins}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        disabled={!state.available}
        onClick={() => {
          claim()
          sfx('reward')
        }}
        className="mt-3 min-h-11 w-full rounded-xl bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
      >
        {state.available ? (
          <>
            Abholen ·{' '}
            {state.reward.coins > 0 && (
              <>
                <CurrencyIcon kind="coins" size={16} />{' '}
                {state.reward.coins.toLocaleString('de-DE')}
              </>
            )}
            {state.reward.coins > 0 && state.reward.crystals > 0 && ' + '}
            {state.reward.crystals > 0 && (
              <>
                <CurrencyIcon kind="crystals" size={16} /> {state.reward.crystals}
              </>
            )}
          </>
        ) : (
          'Abgeholt'
        )}
      </button>
    </Card>
  )
}
