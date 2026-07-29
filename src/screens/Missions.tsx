import { Card, ProgressBar } from '../components/Card'
import { useGameStore } from '../store/gameStore'

/**
 * Missionsbildschirm (docs/01-gamedesign.md). Die Reiter Wöchentlich und Event
 * kommen in Phase 7 dazu — bisher gibt es nur Tagesmissionen.
 */
export function Missions() {
  const missions = useGameStore((s) => s.save?.missions ?? [])
  const claimMission = useGameStore((s) => s.claimMission)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Card title="Tägliche Missionen">
        <ul className="flex flex-col gap-4">
          {missions.map((mission) => {
            const done = mission.progress >= mission.goal
            return (
              <li key={mission.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{mission.text}</span>
                  <span className="tabular shrink-0 text-sm font-bold text-gold">
                    🪙 {mission.rewardCoins}
                  </span>
                </div>
                <ProgressBar
                  value={mission.progress}
                  goal={mission.goal}
                  color={done ? 'var(--color-gold)' : 'var(--color-purple)'}
                />
                {done && (
                  <button
                    type="button"
                    disabled={mission.claimed}
                    onClick={() => claimMission(mission.id)}
                    className="mt-2 min-h-11 w-full rounded-lg bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
                  >
                    {mission.claimed ? 'Abgeholt' : 'Belohnung abholen'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
