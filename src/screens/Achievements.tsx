import { Card, ProgressBar } from '../components/Card'
import { badgeFor, unlockedCount, type Badge } from '../core/achievements'
import type { Achievement } from '../save/types'
import { useGameStore } from '../store/gameStore'

/**
 * Erfolgsbildschirm (docs/01-gamedesign.md). Bis Phase 7 zeigte die Route
 * `/erfolge` das Profil — bei 24 Erfolgen bekommen sie eine eigene Seite.
 *
 * Sortiert: erst was greifbar nah ist, dann der Rest, Freigeschaltetes zuletzt.
 * Eine Liste in Katalogreihenfolge würde den nächsten Erfolg verstecken.
 */
export function Achievements() {
  const achievements = useGameStore((s) => s.save?.achievements ?? [])
  if (achievements.length === 0) return null

  const unlocked = unlockedCount(achievements)
  const sorted = [...achievements].sort(byNearestFirst)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Card title={`Erfolge ${unlocked} / ${achievements.length}`}>
        <ProgressBar value={unlocked} goal={achievements.length} color="var(--color-gold)" />
        <ul className="mt-4 flex flex-col gap-4">
          {sorted.map((a) => (
            <AchievementRow key={a.id} achievement={a} />
          ))}
        </ul>
      </Card>
    </div>
  )
}

/** Kurz vor dem Ziel zuerst, Erledigtes ans Ende. */
function byNearestFirst(a: Achievement, b: Achievement): number {
  const doneA = a.unlockedAt !== null ? 1 : 0
  const doneB = b.unlockedAt !== null ? 1 : 0
  if (doneA !== doneB) return doneA - doneB
  return b.progress / b.goal - a.progress / a.goal
}

const BADGE_ICON: Record<Badge, string> = {
  bronze: '🥉',
  silber: '🥈',
  gold: '🥇',
}

function AchievementRow({ achievement: a }: { achievement: Achievement }) {
  const done = a.unlockedAt !== null
  const badge = badgeFor(a.goal)

  return (
    <li className={done ? '' : 'opacity-90'}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">
          <span aria-label={`Abzeichen ${badge}`}>{done ? '✅' : BADGE_ICON[badge]}</span>{' '}
          {a.title}
        </span>
        <span className="shrink-0 text-xs text-ink-muted">{a.description}</span>
      </div>
      <ProgressBar
        value={Math.min(a.progress, a.goal)}
        goal={a.goal}
        color={done ? 'var(--color-gold)' : 'var(--color-purple)'}
      />
    </li>
  )
}
