import { Link } from 'react-router-dom'
import { GAMES } from '../content/games'
import { Card, ProgressBar } from '../components/Card'

/**
 * Startbildschirm nach dem Handy-Design
 * (docs/referenzen/handy-app-10-bildschirme.png).
 *
 * Alle Zahlen sind Platzhalter aus den Mockups — ab Phase 3 kommen sie aus
 * dem Spielstand (docs/05-roadmap.md).
 */
const PLACEHOLDER = {
  name: 'Fynnox',
  level: 12,
  xp: 2450,
  xpGoal: 3500,
  dailyMissions: { done: 3, total: 6 },
  event: { title: 'Sommer Cup', endsIn: '16h 45m' },
  adventure: { chapter: 4, title: 'Kristallhöhle', node: 8, nodes: 15 },
}

function QuickTile({
  to,
  label,
  value,
  accent,
}: {
  to: string
  label: string
  value: string
  accent: string
}) {
  return (
    <Link
      to={to}
      className="flex min-h-20 flex-1 flex-col justify-center gap-0.5 rounded-xl border border-edge bg-deep/60 px-3 py-2"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <span className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
        {label}
      </span>
      <span className="tabular text-sm font-bold">{value}</span>
    </Link>
  )
}

export function Dashboard() {
  const { name, level, xp, xpGoal, dailyMissions, event, adventure } = PLACEHOLDER

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-elevated text-2xl">
            🦊
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{name}</p>
            <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
              Level {level}
            </p>
            <div className="mt-1.5">
              <ProgressBar value={xp} goal={xpGoal} />
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
        <QuickTile
          to="/missionen"
          label="Tägliche Missionen"
          value={`${dailyMissions.done}/${dailyMissions.total}`}
          accent="var(--color-gold)"
        />
        <QuickTile
          to="/events"
          label={event.title}
          value={event.endsIn}
          accent="var(--color-purple)"
        />
        <QuickTile
          to="/abenteuer"
          label="Abenteuerpfad"
          value={`Kapitel ${adventure.chapter}`}
          accent="var(--color-game-kristallmix)"
        />
      </div>

      <Card title="Wähle dein Spiel">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {GAMES.map((game) => (
            <article
              key={game.id}
              className="flex flex-col gap-2 rounded-xl border border-edge bg-deep/60 p-3"
              style={{ borderTopColor: game.colorVar, borderTopWidth: 3 }}
            >
              <h3 className="text-sm font-bold">{game.title}</h3>
              <p className="flex-1 text-xs text-ink-muted">{game.tagline}</p>
              <p className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
                {game.bestLabel}: —
              </p>
              <button
                type="button"
                disabled={!game.available}
                className="min-h-11 rounded-lg text-sm font-bold text-white uppercase disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: game.colorVar }}
              >
                {game.available ? 'Spielen' : 'Bald'}
              </button>
            </article>
          ))}
        </div>
      </Card>
    </div>
  )
}
