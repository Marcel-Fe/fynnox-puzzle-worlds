import { Link } from 'react-router-dom'
import { GAMES, GAMES_BY_ID } from '../content/games'
import { Card, ProgressBar } from '../components/Card'
import { GameTile } from '../components/GameTile'
import { xpForNextLevel } from '../core/progression'
import { useGameStore } from '../store/gameStore'

/**
 * Startbildschirm nach dem Handy-Design
 * (docs/referenzen/handy-app-10-bildschirme.png).
 *
 * Alle Werte kommen aus dem Spielstand.
 */
export function Dashboard() {
  const save = useGameStore((s) => s.save)
  if (!save) return null

  const { profile, missions, adventure } = save
  const openMissions = missions.filter((m) => m.progress >= m.goal && !m.claimed).length
  const doneMissions = missions.filter((m) => m.progress >= m.goal).length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-elevated text-2xl">
            🦊
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{profile.name}</p>
            <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
              Level {profile.level}
            </p>
            <div className="mt-1.5">
              <ProgressBar value={profile.xp} goal={xpForNextLevel(profile.level)} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm text-ink-muted">Willkommen zurück,</p>
        <h1 className="text-3xl font-black tracking-wide text-gold">Abenteurer!</h1>
        <p className="mt-1 text-sm text-ink-muted">Wähle ein Spiel und lass uns Spaß haben!</p>
      </Card>

      <div className="flex gap-3">
        <Link
          to="/missionen"
          className="flex min-h-20 flex-1 flex-col justify-center gap-0.5 rounded-xl border border-edge bg-deep/60 px-3 py-2"
          style={{ borderLeftColor: 'var(--color-gold)', borderLeftWidth: 3 }}
        >
          <span className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
            Tägliche Missionen
          </span>
          <span className="tabular text-sm font-bold">
            {doneMissions}/{missions.length}
          </span>
          {openMissions > 0 && (
            <span className="text-[10px] font-bold text-gold">
              {openMissions} abholbereit
            </span>
          )}
        </Link>
        <Link
          to="/abenteuer"
          className="flex min-h-20 flex-1 flex-col justify-center gap-0.5 rounded-xl border border-edge bg-deep/60 px-3 py-2"
          style={{ borderLeftColor: 'var(--color-purple)', borderLeftWidth: 3 }}
        >
          <span className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
            Abenteuerpfad
          </span>
          <span className="tabular text-sm font-bold">Kapitel {adventure.chapter}</span>
        </Link>
        <Link
          to="/profil"
          className="flex min-h-20 flex-1 flex-col justify-center gap-0.5 rounded-xl border border-edge bg-deep/60 px-3 py-2"
          style={{ borderLeftColor: 'var(--color-game-kristallmix)', borderLeftWidth: 3 }}
        >
          <span className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
            Gespielt
          </span>
          <span className="tabular text-sm font-bold">{save.stats.totalGames}</span>
        </Link>
      </div>

      {save.recentGames.length > 0 && (
        <Card title="Weiterspielen">
          <div className="flex flex-wrap gap-2">
            {save.recentGames.map((id) => {
              const game = GAMES_BY_ID[id]
              return (
                <Link
                  key={id}
                  to={game.available ? `/spiel/${id}` : '/spiele'}
                  className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-bold"
                  style={{
                    background: `color-mix(in srgb, ${game.colorVar} 25%, transparent)`,
                    color: game.colorVar,
                  }}
                >
                  {game.title}
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <Card title="Wähle dein Spiel">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GAMES.map((game) => (
            <GameTile key={game.id} game={game} progress={save.progress[game.id]} />
          ))}
        </div>
      </Card>
    </div>
  )
}
