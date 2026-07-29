import { useState } from 'react'
import { Card } from '../components/Card'
import { GameTile } from '../components/GameTile'
import { GAMES, type GameCategory } from '../content/games'
import { useGameStore } from '../store/gameStore'

/**
 * Spieleauswahl mit Filterleiste (docs/01-gamedesign.md).
 */
const FILTERS: { key: GameCategory | 'alle'; label: string }[] = [
  { key: 'alle', label: 'Alle Spiele' },
  { key: 'puzzle', label: 'Puzzle' },
  { key: 'karten', label: 'Karten' },
  { key: 'sport', label: 'Sport' },
]

export function Games() {
  const progress = useGameStore((s) => s.save?.progress)
  const [filter, setFilter] = useState<GameCategory | 'alle'>('alle')
  if (!progress) return null

  const visible = filter === 'alle' ? GAMES : GAMES.filter((g) => g.category === filter)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Card>
        <h1 className="text-xl font-black text-gold">Wähle dein Spiel</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={[
                'min-h-11 rounded-full px-4 text-sm font-semibold transition',
                filter === f.key
                  ? 'bg-gold text-deep'
                  : 'border border-edge text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {visible.map((game) => (
          <GameTile key={game.id} game={game} progress={progress[game.id]} />
        ))}
      </div>

      <Card>
        <p className="text-sm text-ink-muted">
          <strong className="text-ink">Mehr Spiele</strong> — weitere Spiele kommen dazu.
          Der aktuelle Stand steht in{' '}
          <code className="rounded bg-deep px-1.5 py-0.5 text-xs">docs/05-roadmap.md</code>.
        </p>
      </Card>
    </div>
  )
}
