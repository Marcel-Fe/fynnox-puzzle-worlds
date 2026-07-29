import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card } from '../../../components/Card'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import {
  cellsOf,
  COLS,
  createGame,
  dropIntervalMs,
  ghostRow,
  hardDrop,
  indexOf,
  moveLeft,
  moveRight,
  rotate,
  ROWS,
  starsFor,
  stepDown,
  type GameState,
} from '../logic/game'
import { PIECES, type PieceId } from '../logic/pieces'

const INFO = GAMES_BY_ID.blockfall

/**
 * Blockfall — das erste Spiel mit Zeittakt (docs/05-roadmap.md, Phase 6).
 *
 * Die Logik in logic/ ist frei von React und kennt keine Uhr. Hier läuft der
 * Takt, der ihr sagt, wann ein Schritt fällig ist.
 *
 * Bedienung über Knöpfe statt Wischgesten: Auf dem Handy muss ein Stein oft
 * mehrmals schnell hintereinander bewegt werden, und dafür sind Knöpfe
 * treffsicherer als Wischen.
 */
export function BlockfallGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.blockfall ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [paused, setPaused] = useState(false)
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
    setPaused(false)
    setFlash(null)
    setGame(createGame(now, now))
  }, [clearRewards, spendEnergy])

  /** Rundenergebnis genau einmal verrechnen. */
  const settle = useCallback(
    (state: GameState) => {
      if (settled.current) return
      settled.current = true
      finishRound({
        game: 'blockfall',
        won: false, // Blockfall ist ein Endlosspiel — es endet, es wird nicht gewonnen
        score: state.score,
        durationMs: Date.now() - state.startedAt,
        level: state.level,
        counters: {
          rowsCleared: state.lines,
          stars: starsFor(state.score),
        },
      })
    },
    [finishRound],
  )

  /** Ein Schritt nach unten, ausgelöst vom Takt oder vom Knopf. */
  const advance = useCallback(() => {
    setGame((current) => {
      if (!current || current.over) return current
      const out = stepDown(current)
      if (out.clearedLines > 0) {
        setFlash(out.clearedLines === 4 ? 'Vierfach!' : `${out.clearedLines} Reihen!`)
      }
      if (out.state.over) settle(out.state)
      return out.state
    })
  }, [settle])

  // Zeittakt. Das Intervall hängt am Level, deshalb wird es bei jedem
  // Levelwechsel neu gesetzt.
  const level = game?.level ?? 1
  const running = Boolean(game) && !game?.over && !paused
  useEffect(() => {
    if (!running) return
    const id = setInterval(advance, dropIntervalMs(level))
    return () => clearInterval(id)
  }, [advance, level, running])

  // Tastatur für den Desktop. Auf dem Handy wird über die Knöpfe gespielt.
  useEffect(() => {
    if (!running) return
    function onKey(event: KeyboardEvent) {
      const actions: Record<string, () => void> = {
        ArrowLeft: () => setGame((g) => (g ? moveLeft(g) : g)),
        ArrowRight: () => setGame((g) => (g ? moveRight(g) : g)),
        ArrowUp: () => setGame((g) => (g ? rotate(g) : g)),
        ArrowDown: advance,
        ' ': drop,
      }
      const action = actions[event.key]
      if (action) {
        event.preventDefault()
        action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance, running])

  function drop() {
    setGame((current) => {
      if (!current || current.over) return current
      const out = hardDrop(current)
      if (out.clearedLines > 0) {
        setFlash(out.clearedLines === 4 ? 'Vierfach!' : `${out.clearedLines} Reihen!`)
      }
      if (out.state.over) settle(out.state)
      return out.state
    })
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
              <dt className="text-xs text-ink-muted">Bestes Level</dt>
              <dd className="tabular font-bold">{progress?.highestLevel ?? 0}</dd>
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
            className="mt-4 min-h-12 w-full rounded-xl text-sm font-black text-white uppercase shadow-lg"
            style={{ background: INFO.colorVar }}
          >
            Spielen (1 ⚡)
          </button>
        </Card>
      </div>
    )
  }

  const activeCells = new Map<number, PieceId>()
  for (const [r, c] of cellsOf(game.active)) {
    if (r >= 0) activeCells.set(indexOf(r, c), game.active.id)
  }

  const ghost = new Set<number>()
  if (!game.over) {
    const gr = ghostRow(game)
    for (const [r, c] of cellsOf({ ...game.active, row: gr })) {
      const key = indexOf(r, c)
      if (r >= 0 && !activeCells.has(key)) ghost.add(key)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Punkte</p>
            <p className="tabular text-2xl font-black">{game.score.toLocaleString('de-DE')}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Level</p>
            <p className="tabular text-lg font-bold">{game.level}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Reihen</p>
            <p className="tabular text-lg font-bold">{game.lines}</p>
          </div>
          <NextPreview id={game.next} />
        </div>
        {flash && <p className="mt-1 text-sm font-black text-gold">{flash}</p>}
      </Card>

      {/* Höhe begrenzt, damit Punktestand, Feld und Bedienknöpfe zusammen auf
          einen Handybildschirm passen. Ohne das scrollt die Punkteanzeige weg —
          bei 20 Reihen wird das Feld sonst höher als der Bildschirm. */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40"
        style={{
          aspectRatio: `${COLS} / ${ROWS}`,
          maxHeight: '54vh',
          maxWidth: 'calc(54vh / 2)',
        }}
      >
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/80" />
        <div
          className="relative grid size-full gap-px p-1.5"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const settled = game.board[i]
            const moving = activeCells.get(i)
            const id = moving ?? settled
            const isGhost = !id && ghost.has(i)
            return (
              <span
                key={i}
                className="rounded-[3px]"
                style={
                  id
                    ? {
                        background: `linear-gradient(160deg, color-mix(in srgb, var(${PIECES[id].colorVar}) 75%, white), var(${PIECES[id].colorVar}))`,
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.35)',
                      }
                    : {
                        background: isGhost ? 'rgba(255,255,255,0.13)' : 'rgba(2,12,23,0.45)',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                      }
                }
              />
            )
          })}
        </div>
      </div>

      {/* Bedienfeld: alle Flächen mindestens 44 px hoch (CLAUDE.md, Touch zuerst) */}
      <div className="grid grid-cols-4 gap-2">
        <ControlButton label="◀" title="Nach links" onPress={() => setGame((g) => (g ? moveLeft(g) : g))} />
        <ControlButton label="↻" title="Drehen" onPress={() => setGame((g) => (g ? rotate(g) : g))} />
        <ControlButton label="▶" title="Nach rechts" onPress={() => setGame((g) => (g ? moveRight(g) : g))} />
        <ControlButton label="▼" title="Fallen lassen" onPress={drop} accent={INFO.colorVar} />
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="min-h-11 rounded-xl border border-edge text-sm font-bold text-ink-muted uppercase"
      >
        {paused ? 'Weiterspielen' : 'Pause'}
      </button>

      {game.over && (
        <RoundResultOverlay
          won={false}
          title="Feld voll!"
          stars={starsFor(game.score)}
          facts={[
            { label: 'Punkte', value: game.score.toLocaleString('de-DE') },
            { label: 'Level', value: String(game.level) },
            { label: 'Reihen', value: String(game.lines) },
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

function ControlButton({
  label,
  title,
  onPress,
  accent,
}: {
  label: string
  title: string
  onPress: () => void
  accent?: string
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={title}
      className="min-h-14 rounded-xl border border-edge text-xl font-black text-ink active:brightness-125"
      style={accent ? { background: accent, borderColor: accent, color: '#fff' } : undefined}
    >
      {label}
    </button>
  )
}

/** Vorschau auf den nächsten Stein. */
function NextPreview({ id }: { id: PieceId }) {
  const piece = PIECES[id]
  const cells = piece.rotations[0]
  return (
    <div>
      <p className="text-xs tracking-widest text-ink-muted uppercase">Nächster</p>
      <span
        className="mt-1 grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${piece.box}, 8px)` }}
        aria-label={`Nächster Stein: ${id}`}
      >
        {Array.from({ length: piece.box * piece.box }, (_, k) => {
          const r = Math.floor(k / piece.box)
          const c = k % piece.box
          const on = cells.some(([cr, cc]) => cr === r && cc === c)
          return (
            <span
              key={k}
              className="size-2 rounded-[2px]"
              style={{ background: on ? `var(${piece.colorVar})` : 'transparent' }}
            />
          )
        })}
      </span>
    </div>
  )
}
