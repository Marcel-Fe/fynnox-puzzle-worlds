import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card, ProgressBar } from '../../../components/Card'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import { areNeighbours } from '../logic/board'
import {
  createGame,
  GOAL_AMOUNT,
  indexOf,
  SIZE,
  starsFor,
  swap,
  type GameState,
  type Gem,
} from '../logic/game'

const INFO = GAMES_BY_ID.kristallmix

const COLOR_NAMES = ['rote', 'blaue', 'gelbe', 'grüne', 'lila', 'orange']

/**
 * Kristallmix (docs/05-roadmap.md, Phase 6).
 *
 * Bedienung durch Antippen zweier benachbarter Kristalle. Kein Ziehen —
 * beim Wischen über ein kleines Raster trifft man auf dem Handy regelmäßig
 * das falsche Feld.
 */
export function KristallmixGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.kristallmix ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const settled = useRef(false)

  const start = useCallback(() => {
    if (!spendEnergy()) {
      setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
      return
    }
    const now = Date.now()
    clearRewards()
    settled.current = false
    setSelected(null)
    setFlash(null)
    setGame(createGame(now, now))
  }, [clearRewards, spendEnergy])

  const settle = useCallback(
    (state: GameState) => {
      if (settled.current) return
      settled.current = true
      finishRound({
        game: 'kristallmix',
        won: state.won,
        score: state.score,
        durationMs: Date.now() - state.startedAt,
        counters: {
          crystalsCollected: state.goalCollected,
          combos: state.explosions,
          rainbows: state.rainbowsMade,
          stars: starsFor(state),
        },
      })
    },
    [finishRound],
  )

  function onCell(index: number) {
    if (!game || game.won || game.lost) return

    if (selected === null) {
      setSelected(index)
      setFlash(null)
      return
    }
    if (selected === index) {
      setSelected(null)
      return
    }
    if (!areNeighbours(selected, index)) {
      // Auswahl aufs neue Feld umlegen statt nur abzuweisen
      setSelected(index)
      return
    }

    const out = swap(game, selected, index)
    setSelected(null)

    if (!out.valid) {
      setFlash('Das ergibt keine Reihe.')
      return
    }

    const beste = out.steps.reduce((max, s) => Math.max(max, s.chain), 0)
    setFlash(beste >= 3 ? `Kette x${beste}! Stark!` : beste === 2 ? 'Doppelt! Sweet!' : null)
    setGame(out.state)

    if (out.state.won || out.state.lost) settle(out.state)
  }

  if (!game) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <section className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
          <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/85 to-deep/40" />
          <div className="relative p-4">
            <h1 className="text-2xl font-black drop-shadow-lg" style={{ color: INFO.colorVar }}>
              {INFO.title}
            </h1>
            <p className="mb-3 text-sm text-ink-muted">{INFO.tagline}</p>
            <SpeechBubble name={INFO.companion} ring={INFO.colorVar}>
              {INFO.hint}
            </SpeechBubble>
          </div>
        </section>

        <Card>
          <dl className="flex gap-4 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Bestpunkte</dt>
              <dd className="tabular font-bold">
                {(progress?.highScore ?? 0).toLocaleString('de-DE')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Gewonnen</dt>
              <dd className="tabular font-bold">{progress?.gamesWon ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Energie</dt>
              <dd className="tabular font-bold">{energy}/5</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-muted">
            Tausche zwei benachbarte Kristalle. Drei gleiche in einer Reihe verschwinden,
            ab vier entsteht ein Power-Up. Sammle {GOAL_AMOUNT} Kristalle der gesuchten
            Farbe in 25 Zügen.
          </p>
          {flash && <p className="mt-3 text-sm font-semibold text-gold">{flash}</p>}
          <button
            type="button"
            onClick={start}
            className="mt-4 min-h-12 w-full rounded-xl text-sm font-black text-white uppercase shadow-lg"
            style={{ background: INFO.colorVar }}
          >
            Spielen (1 ⚡)
          </button>
        </Card>
      </div>
    )
  }

  const finished = game.won || game.lost

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Punkte</p>
            <p className="tabular text-2xl font-black">{game.score.toLocaleString('de-DE')}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Züge</p>
            <p
              className="tabular text-lg font-bold"
              style={{ color: game.movesLeft <= 5 ? 'var(--color-game-kristallmix)' : undefined }}
            >
              {game.movesLeft}
            </p>
          </div>
          <div className="min-w-24 flex-1">
            <p className="text-xs tracking-widest text-ink-muted uppercase">
              Ziel: {COLOR_NAMES[game.goalColor]}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <GemShape gem={{ color: game.goalColor, power: 'none' }} size={18} />
              <div className="flex-1">
                <ProgressBar
                  value={Math.min(game.goalCollected, GOAL_AMOUNT)}
                  goal={GOAL_AMOUNT}
                  color={`var(--color-gem-${game.goalColor})`}
                />
              </div>
            </div>
          </div>
        </div>
        {flash && <p className="mt-1 text-sm font-black text-gold">{flash}</p>}
      </Card>

      <div className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/75" />
        <div
          className="relative grid gap-1 p-2"
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        >
          {game.board.map((gem, i) => {
            const isSelected = selected === i
            const neighbour = selected !== null && areNeighbours(selected, i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => onCell(i)}
                aria-label={`${COLOR_NAMES[gem?.color ?? 0]} Kristall, Zeile ${
                  Math.floor(i / SIZE) + 1
                }, Spalte ${(i % SIZE) + 1}`}
                className="grid aspect-square place-items-center rounded-lg transition-transform active:scale-90"
                style={{
                  background: isSelected
                    ? 'rgba(255,255,255,0.18)'
                    : neighbour
                      ? 'rgba(255,255,255,0.07)'
                      : 'transparent',
                  outline: isSelected ? '2px solid var(--color-gold)' : undefined,
                }}
              >
                {gem && <GemShape gem={gem} />}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-center text-xs text-ink-muted">
        Kristall antippen, dann einen Nachbarn antippen.
      </p>

      {finished && (
        <RoundResultOverlay
          won={game.won}
          title={game.won ? 'Geschafft!' : 'Züge aufgebraucht!'}
          stars={starsFor(game)}
          facts={[
            { label: 'Punkte', value: game.score.toLocaleString('de-DE') },
            { label: 'Gesammelt', value: `${Math.min(game.goalCollected, GOAL_AMOUNT)}/${GOAL_AMOUNT}` },
            { label: 'Züge übrig', value: String(game.movesLeft) },
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

/**
 * Ein Kristall als Raute mit Glanzkante. Power-Ups sind an einem Zeichen in
 * der Mitte zu erkennen — ohne Kennzeichnung wäre nicht zu sehen, welcher
 * Kristall etwas Besonderes kann.
 */
function GemShape({ gem, size }: { gem: Gem; size?: number }) {
  const color = `var(--color-gem-${gem.color})`
  const rainbow = gem.power === 'rainbow'

  return (
    <span
      className="grid place-items-center"
      style={{
        width: size ?? '82%',
        height: size ?? '82%',
        borderRadius: '28%',
        transform: 'rotate(45deg)',
        background: rainbow
          ? 'conic-gradient(#e8443a,#f0c020,#4caf50,#2f8fe0,#a855c7,#e8443a)'
          : `linear-gradient(150deg, color-mix(in srgb, ${color} 60%, white), ${color})`,
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.5)`,
      }}
    >
      {gem.power !== 'none' && !rainbow && (
        <span
          aria-hidden
          style={{
            transform: 'rotate(-45deg)',
            fontSize: '9px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          }}
        >
          {gem.power === 'bomb' ? '✳' : gem.power === 'stripeH' ? '↔' : '↕'}
        </span>
      )}
    </span>
  )
}
