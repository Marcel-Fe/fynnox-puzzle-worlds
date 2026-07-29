import { Link } from 'react-router-dom'
import type { GameInfo } from '../content/games'
import type { GameProgress } from '../save/types'

/**
 * Spielkachel — eine einzige Stelle, damit Dashboard und Spieleliste nicht
 * auseinanderlaufen (docs/03-art-ui-guide.md).
 *
 * Das Bild stammt aus den Konzeptbildern; darüber liegt ein Verlauf nach unten,
 * damit die Schrift auf jedem Motiv lesbar bleibt.
 */
export function GameTile({ game, progress }: { game: GameInfo; progress: GameProgress }) {
  const bestValue =
    game.bestLabel === 'Bestzeit'
      ? progress.bestTimeMs
        ? formatTime(progress.bestTimeMs)
        : '—'
      : progress.highScore > 0
        ? progress.highScore.toLocaleString('de-DE')
        : '—'

  const bestLabel = game.bestLabel === 'Bestzeit' ? 'Bestzeit' : 'Bestpunkte'

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-2xl border border-edge shadow-lg shadow-black/40"
      style={{ borderTopColor: game.colorVar, borderTopWidth: 3 }}
    >
      <img
        src={game.image}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/80 to-deep/10" />

      <div className="relative mt-24 flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-black drop-shadow-lg" style={{ color: game.colorVar }}>
          {game.title}
        </h3>
        <p className="flex-1 text-xs text-ink-muted">{game.tagline}</p>
        <p className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
          {bestLabel}: <span className="tabular">{bestValue}</span>
        </p>
        {game.available ? (
          <Link
            to={`/spiel/${game.id}`}
            className={[
              'mt-1 grid min-h-11 place-items-center rounded-lg text-sm font-black uppercase shadow-md',
              game.textOnColor === 'dark' ? 'text-deep' : 'text-white',
            ].join(' ')}
            style={{ background: game.colorVar }}
          >
            Spielen
          </Link>
        ) : (
          <span className="mt-1 grid min-h-11 place-items-center rounded-lg border border-edge bg-deep/70 text-sm font-bold text-ink-muted uppercase">
            Bald
          </span>
        )}
      </div>
    </article>
  )
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
