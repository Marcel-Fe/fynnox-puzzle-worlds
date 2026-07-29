import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/Card'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import {
  BOARD_SIZE,
  canPlace,
  createGame,
  indexOf,
  placeShape,
  starsFor,
  type GameState,
} from '../logic/game'
import type { Shape } from '../logic/shapes'

const INFO = GAMES_BY_ID.waldbloecke

/**
 * Waldblöcke — erstes vollständiges Spiel und Vorlage für alle weiteren
 * (docs/05-roadmap.md, Phase 4).
 *
 * Bedienung: erst einen Vorratsblock antippen, dann ein Feld antippen.
 * Bewusst kein Ziehen — auf dem Handy verdeckt der Finger sonst genau die Stelle,
 * auf die gezielt wird.
 */
export function WaldbloeckeGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.waldbloecke ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)

  const start = useCallback(() => {
    if (!spendEnergy()) {
      setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
      return
    }
    const now = Date.now()
    clearRewards()
    setGame(createGame(now, now))
    setSelected(0)
    setFlash(null)
    setSettled(false)
  }, [clearRewards, spendEnergy])

  /** Rundenergebnis genau einmal verrechnen, wenn das Feld dicht ist. */
  const settle = useCallback(
    (state: GameState) => {
      if (settled) return
      setSettled(true)
      finishRound({
        game: 'waldbloecke',
        won: false, // Waldblöcke ist ein Endlosspiel — es endet, es wird nicht gewonnen
        score: state.score,
        durationMs: Date.now() - state.startedAt,
        counters: {
          rowsCleared: state.linesCleared,
          combos: state.combos,
          stars: starsFor(state.score),
        },
      })
    },
    [finishRound, settled],
  )

  const handleCell = useCallback(
    (row: number, col: number) => {
      if (!game || game.over || selected === null) return
      const outcome = placeShape(game, selected, row, col)
      if (!outcome) return

      setGame(outcome.state)
      if (outcome.clearedLines > 1) setFlash(`Kombo x${outcome.clearedLines}!`)
      else if (outcome.clearedLines === 1) setFlash(`+${outcome.gainedScore}`)
      else setFlash(null)

      const nextIndex = outcome.state.tray.findIndex((s) => s !== null)
      setSelected(nextIndex === -1 ? null : nextIndex)

      if (outcome.state.over) settle(outcome.state)
    },
    [game, selected, settle],
  )

  const activeShape: Shape | null = game && selected !== null ? (game.tray[selected] ?? null) : null

  const preview = useMemo(() => {
    if (!game || !activeShape) return null
    return (row: number, col: number) => canPlace(game.board, activeShape, row, col)
  }, [game, activeShape])

  if (!game) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card>
          <h1 className="text-xl font-black" style={{ color: INFO.colorVar }}>
            {INFO.title}
          </h1>
          <p className="mt-2 rounded-xl bg-elevated/60 p-3 text-sm">
            <strong>{INFO.companion}:</strong> „{INFO.hint}"
          </p>
          <dl className="mt-3 flex gap-4 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Bestpunkte</dt>
              <dd className="tabular font-bold">
                {(progress?.highScore ?? 0).toLocaleString('de-DE')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Runden</dt>
              <dd className="tabular font-bold">{progress?.gamesPlayed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Energie</dt>
              <dd className="tabular font-bold">{energy}/5</dd>
            </div>
          </dl>
          {flash && <p className="mt-3 text-sm font-semibold text-gold">{flash}</p>}
          <button
            type="button"
            onClick={start}
            className="mt-4 min-h-12 w-full rounded-xl text-sm font-black text-deep uppercase"
            style={{ background: INFO.colorVar }}
          >
            Spielen (1 ⚡)
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Punkte</p>
            <p className="tabular text-2xl font-black">{game.score.toLocaleString('de-DE')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest text-ink-muted uppercase">Reihen</p>
            <p className="tabular text-lg font-bold">{game.linesCleared}</p>
          </div>
          <div className="text-2xl" aria-label={`${starsFor(game.score)} von 3 Sternen`}>
            {'★'.repeat(starsFor(game.score))}
            <span className="text-edge">{'★'.repeat(3 - starsFor(game.score))}</span>
          </div>
        </div>
        {flash && <p className="mt-1 text-sm font-black text-gold">{flash}</p>}
      </Card>

      <div
        className="grid gap-1 rounded-2xl border border-edge bg-card/80 p-2"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
          const row = Math.floor(i / BOARD_SIZE)
          const col = i % BOARD_SIZE
          const filled = game.board[indexOf(row, col)]
          const fits = preview?.(row, col) ?? false
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleCell(row, col)}
              aria-label={`Feld Zeile ${row + 1}, Spalte ${col + 1}`}
              className="aspect-square rounded-[4px] transition-colors"
              style={{
                background: filled ? INFO.colorVar : 'var(--color-deep)',
                // Nur ein leiser Hinweis, wo der gewählte Block passt. Kräftiger
                // eingefärbt sähe das Feld aus, als läge dort bereits ein Block.
                boxShadow: !filled && fits ? 'inset 0 0 0 1px var(--color-edge)' : undefined,
              }}
            />
          )
        })}
      </div>

      <Card title="Dein Vorrat">
        <div className="flex items-start justify-around gap-2">
          {game.tray.map((shape, i) => (
            <button
              key={i}
              type="button"
              disabled={!shape}
              onClick={() => setSelected(i)}
              className={[
                'min-h-16 min-w-16 rounded-xl border p-2 transition',
                selected === i ? 'border-gold bg-elevated' : 'border-edge',
                shape ? '' : 'opacity-20',
              ].join(' ')}
              aria-label={shape ? `Block ${i + 1} wählen` : 'Bereits gesetzt'}
            >
              {shape && (
                <span
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${shape.width}, 10px)` }}
                >
                  {Array.from({ length: shape.width * shape.height }, (_, k) => {
                    const r = Math.floor(k / shape.width)
                    const c = k % shape.width
                    const on = shape.cells.some(([sr, sc]) => sr === r && sc === c)
                    return (
                      <span
                        key={k}
                        className="size-2.5 rounded-[2px]"
                        style={{ background: on ? INFO.colorVar : 'transparent' }}
                      />
                    )
                  })}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Block antippen, dann ein freies Feld antippen. Volle Reihen und Spalten verschwinden.
        </p>
      </Card>

      {game.over && (
        <RoundResultOverlay
          won={false}
          title="Feld voll!"
          stars={starsFor(game.score)}
          facts={[
            { label: 'Punkte', value: game.score.toLocaleString('de-DE') },
            { label: 'Reihen', value: String(game.linesCleared) },
            { label: 'Kombos', value: String(game.combos) },
          ]}
          rewards={rewards}
          accent={INFO.colorVar}
          onAgain={start}
          onLeave={() => navigate('/')}
          againDisabled={energy < 1}
        />
      )}
    </div>
  )
}
