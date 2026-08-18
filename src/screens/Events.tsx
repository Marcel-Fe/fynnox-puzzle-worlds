import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, ProgressBar } from '../components/Card'
import { CurrencyIcon } from '../components/CurrencyIcon'
import { DAILY_BONUS_EVENT } from '../content/events'
import { dailyRewardState } from '../core/dailyReward'
import { eventSchedule, type ScheduledEvent } from '../core/events'
import { formatRemaining } from '../core/time'
import type { Mission } from '../save/types'
import { useGameStore } from '../store/gameStore'

/**
 * Eventbildschirm mit den drei Gruppen aus dem Mockup: laufendes Hauptevent,
 * aktive Events, kommende Events (docs/01-gamedesign.md).
 *
 * Welches Event wann läuft, rechnet `core/events.ts` aus der Wochennummer —
 * ohne Zufall, auf jedem Gerät gleich.
 */
export function Events() {
  const save = useGameStore((s) => s.save)
  const claimMission = useGameStore((s) => s.claimMission)
  const refreshTimed = useGameStore((s) => s.refreshTimed)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    refreshTimed()
    const timer = setInterval(() => {
      setNow(Date.now())
      refreshTimed()
    }, 30_000)
    return () => clearInterval(timer)
  }, [refreshTimed])

  if (!save) return null

  const schedule = eventSchedule(now)
  const main = schedule[0]
  const active = schedule.filter((e) => e.role === 'side')
  const upcoming = schedule.filter((e) => e.role === 'upcoming')
  const eventMission = save.missions.find((m) => m.kind === 'event') ?? null
  const daily = dailyRewardState(save, now)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <MainEvent event={main} mission={eventMission} now={now} onClaim={claimMission} />

      <Card title="Aktive Events">
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-3 rounded-xl border border-edge bg-deep/50 p-3">
            <span className="text-2xl" aria-hidden>
              🎁
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{DAILY_BONUS_EVENT.title}</p>
              <p className="text-xs text-ink-muted">{DAILY_BONUS_EVENT.text}</p>
            </div>
            {daily.available ? (
              <Link
                to="/"
                className="flex min-h-11 shrink-0 items-center rounded-lg bg-gold px-3 text-xs font-black text-deep uppercase"
              >
                Bereit!
              </Link>
            ) : (
              <span className="tabular shrink-0 text-xs font-bold text-ink-muted">
                {formatRemaining(daily.msUntilNext)}
              </span>
            )}
          </li>

          {active.map((event) => (
            <EventRow key={event.info.id} event={event} now={now} />
          ))}
          {active.length === 0 && (
            <li className="text-sm text-ink-muted">
              Gerade läuft nur das Hauptevent. Das nächste startet am Donnerstag.
            </li>
          )}
        </ul>
      </Card>

      <Card title="Kommende Events">
        <ul className="flex flex-col gap-2">
          {upcoming.map((event) => (
            <EventRow key={event.info.id} event={event} now={now} upcoming />
          ))}
        </ul>
      </Card>
    </div>
  )
}

function MainEvent({
  event,
  mission,
  now,
  onClaim,
}: {
  event: ScheduledEvent
  mission: Mission | null
  now: number
  onClaim(id: string): void
}) {
  const done = mission !== null && mission.progress >= mission.goal

  return (
    <section className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
      <img src={event.info.image} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/85 to-deep/40" />
      <div className="relative p-4">
        <p className="text-xs font-bold tracking-widest text-gold uppercase">Hauptevent</p>
        <h1 className="text-2xl font-black tracking-wide text-gold drop-shadow-[0_2px_0_rgba(0,0,0,0.7)]">
          {event.info.title}
        </h1>
        <p className="mt-0.5 text-sm text-ink">{event.info.text}</p>
        <p className="tabular mt-1 text-xs font-bold text-ink-muted">
          Endet in {formatRemaining(event.endsAt - now)}
        </p>

        {mission && (
          <div className="mt-3 rounded-xl bg-deep/70 p-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{mission.text}</span>
              <span className="tabular shrink-0 text-sm font-bold text-gold">
                <CurrencyIcon kind="coins" size={16} /> {mission.rewardCoins.toLocaleString('de-DE')}
                {mission.rewardCrystals ? (
                  <>
                    {' · '}
                    <CurrencyIcon kind="crystals" size={16} /> {mission.rewardCrystals}
                  </>
                ) : null}
              </span>
            </div>
            <ProgressBar
              value={Math.min(mission.progress, mission.goal)}
              goal={mission.goal}
              color={done ? 'var(--color-gold)' : 'var(--color-purple)'}
            />
            {done && (
              <button
                type="button"
                disabled={mission.claimed}
                onClick={() => onClaim(mission.id)}
                className="mt-2 min-h-11 w-full rounded-lg bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
              >
                {mission.claimed ? 'Abgeholt' : 'Belohnung abholen'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function EventRow({
  event,
  now,
  upcoming = false,
}: {
  event: ScheduledEvent
  now: number
  upcoming?: boolean
}) {
  return (
    <li className="flex items-center gap-3 overflow-hidden rounded-xl border border-edge bg-deep/50 p-3">
      <img
        src={event.info.image}
        alt=""
        className="size-12 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{event.info.title}</p>
        <p className="truncate text-xs text-ink-muted">{event.info.text}</p>
      </div>
      <span className="tabular shrink-0 text-xs font-bold text-ink-muted">
        {upcoming
          ? `in ${formatRemaining(event.startsAt - now)}`
          : `endet in ${formatRemaining(event.endsAt - now)}`}
      </span>
    </li>
  )
}
