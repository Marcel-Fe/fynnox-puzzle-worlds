import { GAMES } from '../content/games'
import { Card, ProgressBar } from '../components/Card'

/**
 * Startbildschirm. Alle Zahlen hier sind Platzhalter aus den Mockups —
 * ab Phase 3 kommen sie aus dem Spielstand (docs/05-roadmap.md).
 */
const PLACEHOLDER = { level: 12, xp: 2450, xpGoal: 3500 }

export function Dashboard() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Card>
        <p className="text-sm text-ink-muted">Willkommen zurück,</p>
        <h1 className="text-3xl font-black tracking-wide text-gold">FYNNOX!</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Wähle ein Spiel und starte dein Abenteuer!
        </p>
      </Card>

      <Card title="Dein Fortschritt">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-lg font-bold">Level {PLACEHOLDER.level}</span>
          <span className="tabular text-sm text-ink-muted">
            {PLACEHOLDER.xp.toLocaleString('de-DE')} /{' '}
            {PLACEHOLDER.xpGoal.toLocaleString('de-DE')} XP
          </span>
        </div>
        <ProgressBar value={PLACEHOLDER.xp} goal={PLACEHOLDER.xpGoal} />
      </Card>

      <Card title="Spiele Welten">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {GAMES.map((game) => (
            <article
              key={game.id}
              className="flex flex-col gap-2 rounded-xl border border-edge bg-deep/60 p-3"
              style={{ borderTopColor: game.colorVar, borderTopWidth: 3 }}
            >
              <h3 className="text-sm font-bold">{game.title}</h3>
              <p className="flex-1 text-xs text-ink-muted">{game.tagline}</p>
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
