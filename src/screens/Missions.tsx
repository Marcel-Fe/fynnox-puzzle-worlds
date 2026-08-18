import { useEffect, useState } from 'react'
import { Card, ProgressBar } from '../components/Card'
import { Tabs } from '../components/Tabs'
import { asset } from '../content/assets'
import { MISSION_TABS, MISSIONS_HEADLINE, MISSIONS_TEASER } from '../content/missions'
import { sfx } from '../core/audio'
import { formatRemaining } from '../core/time'
import type { Mission, MissionKind } from '../save/types'
import { useGameStore } from '../store/gameStore'

/**
 * Missionsbildschirm mit den drei Reitern Täglich · Wöchentlich · Event
 * (docs/01-gamedesign.md).
 *
 * Die Restzeit läuft sichtbar herunter. Sie kommt aus `expiresAt` der Mission,
 * nicht aus einem eigenen Zähler — sonst liefe sie nach einem Neuladen falsch.
 */
export function Missions() {
  const missions = useGameStore((s) => s.save?.missions ?? [])
  const claimMission = useGameStore((s) => s.claimMission)
  const refreshTimed = useGameStore((s) => s.refreshTimed)
  const [tab, setTab] = useState<MissionKind>('daily')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    refreshTimed()
    // Jede halbe Minute reicht: Die Anzeige ist auf Minuten genau, und ein
    // Sekundentakt würde den ganzen Bildschirm 60-mal pro Minute neu zeichnen.
    const timer = setInterval(() => {
      setNow(Date.now())
      refreshTimed()
    }, 30_000)
    return () => clearInterval(timer)
  }, [refreshTimed])

  const shown = missions.filter((m) => m.kind === tab)
  const expiresAt = shown.length > 0 ? Math.min(...shown.map((m) => m.expiresAt)) : 0

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {/* Kopfbereich nach dem Muster von Shop und Mehr-Bildschirm. Das Motiv
          ist die Aufgabentafel aus der Nachlieferung vom 18.08.2026. */}
      <section className="relative flex min-h-24 flex-col justify-end overflow-hidden rounded-2xl border border-edge shadow-lg shadow-black/30">
        <img
          src={asset('bg/missionen.jpg')}
          alt=""
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/70 to-deep/10" />
        <div className="relative p-3">
          <h1 className="text-xl font-black text-gold drop-shadow-[0_2px_0_rgba(0,0,0,0.7)]">
            {MISSIONS_HEADLINE}
          </h1>
          <p className="mt-0.5 text-xs text-ink-muted">{MISSIONS_TEASER}</p>
        </div>
      </section>

      <Tabs<MissionKind>
        tabs={MISSION_TABS.map((t) => ({
          key: t.kind,
          label: t.label,
          badge: missions.filter((m) => m.kind === t.kind && !m.claimed && m.progress >= m.goal)
            .length,
        }))}
        active={tab}
        onChange={setTab}
      />

      <Card title={MISSION_TABS.find((t) => t.kind === tab)?.label ?? ''}>
        {expiresAt > 0 && (
          <p className="mb-3 text-xs font-bold text-ink-muted">
            Erneuert sich in{' '}
            <span className="tabular text-gold">{formatRemaining(expiresAt - now)}</span>
          </p>
        )}
        <ul className="flex flex-col gap-4">
          {shown.map((mission) => (
            <MissionRow key={mission.id} mission={mission} onClaim={claimMission} />
          ))}
          {shown.length === 0 && (
            <li className="text-sm text-ink-muted">
              Gerade läuft hier nichts. Schau später wieder vorbei.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}

function MissionRow({
  mission,
  onClaim,
}: {
  mission: Mission
  onClaim(id: string): void
}) {
  const done = mission.progress >= mission.goal

  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{mission.text}</span>
        <span className="tabular shrink-0 text-sm font-bold text-gold">
          🪙 {mission.rewardCoins.toLocaleString('de-DE')}
          {mission.rewardCrystals ? ` · 💎 ${mission.rewardCrystals}` : ''}
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
          onClick={() => {
            onClaim(mission.id)
            sfx('reward')
          }}
          className="mt-2 min-h-11 w-full rounded-lg bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
        >
          {mission.claimed ? 'Abgeholt' : 'Belohnung abholen'}
        </button>
      )}
    </li>
  )
}
