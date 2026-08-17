import { useEffect, useState } from 'react'
import { DAILY_REWARDS, dailyRewardState } from '../core/dailyReward'
import { formatRemaining } from '../core/time'
import { useGameStore } from '../store/gameStore'
import { Card } from './Card'

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
        <span className="text-4xl" aria-hidden>
          {state.available ? '🎁' : '📦'}
        </span>
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
                {reward.crystals > 0 ? `💎${reward.crystals}` : `🪙${reward.coins}`}
              </span>
              {reward.crystals > 0 && reward.coins > 0 && (
                <span className="tabular block text-[9px] font-bold text-gold">
                  🪙{reward.coins}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        disabled={!state.available}
        onClick={claim}
        className="mt-3 min-h-11 w-full rounded-xl bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
      >
        {state.available
          ? `Abholen · ${state.reward.coins > 0 ? `🪙 ${state.reward.coins.toLocaleString('de-DE')}` : ''}${
              state.reward.coins > 0 && state.reward.crystals > 0 ? ' + ' : ''
            }${state.reward.crystals > 0 ? `💎 ${state.reward.crystals}` : ''}`
          : 'Abgeholt'}
      </button>
    </Card>
  )
}
