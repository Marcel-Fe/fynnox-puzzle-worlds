import { Card } from '../components/Card'
import { Leaderboard } from '../components/Leaderboard'
import { FRIENDS_NOTE } from '../content/friends'
import { leaderboard, playerRank, trophies } from '../core/friends'
import { useGameStore } from '../store/gameStore'

/**
 * Rangliste (docs/01-gamedesign.md, „Ranglisten und Freunde").
 *
 * Die eigene Zeile kommt aus echten Werten des Spielstands, die Gegner sind die
 * zehn Begleitfiguren mit gesäten Werten. Beides rechnet mit derselben Formel,
 * sonst wäre die Liste nicht vergleichbar.
 */
export function Ranking() {
  const save = useGameStore((s) => s.save)
  if (!save) return null

  const entries = leaderboard(save)
  const rank = playerRank(save)
  const own = trophies(save.profile.level, save.stats.totalWins, save.stats.totalGames)
  const ahead = entries[rank - 2] ?? null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Card title="Deine Platzierung">
        <div className="flex items-center gap-4">
          <div>
            <p className="tabular text-4xl leading-none font-black text-gold">{rank}.</p>
            <p className="mt-1 text-xs tracking-wider text-ink-muted uppercase">
              von {entries.length}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="tabular text-lg font-black">
              🏆 {own.toLocaleString('de-DE')} Trophäen
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {ahead
                ? `Noch ${(ahead.trophies - own + 1).toLocaleString('de-DE')} Trophäen bis ${ahead.name}.`
                : 'Ganz oben — vor dir ist niemand mehr.'}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Rangliste">
        <Leaderboard entries={entries} />
      </Card>

      <Card>
        <p className="text-xs text-ink-muted">{FRIENDS_NOTE}</p>
      </Card>
    </div>
  )
}
