import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card } from '../../../components/Card'
import { formatTime } from '../../../components/GameTile'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import {
  createGame,
  finalScore,
  isFree,
  shuffle,
  starsFor,
  tapTile,
  TIME_LIMIT_MS,
  useHint,
  type GameState,
} from '../logic/game'
import { GRID_COLS, GRID_ROWS } from '../logic/layout'

const INFO = GAMES_BY_ID.tempelpaare

/** Maße einer Steinfläche in Prozent des Spielfelds. */
const TILE_W = 100 / GRID_COLS
const TILE_H = 100 / GRID_ROWS
/** Wie weit eine höhere Schicht versetzt gezeichnet wird — erzeugt die Stapeltiefe. */
const LAYER_OFFSET = 1.6

/**
 * Tempelpaare (docs/05-roadmap.md, Phase 6).
 *
 * Zweites Spiel mit Zeitdruck: Die Runde ist nach drei Minuten vorbei.
 * Die Logik kennt keine Uhr — hier läuft der Sekundentakt, der ihr das Ergebnis
 * mitteilt.
 */
export function TempelpaareGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.tempelpaare ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [hintPair, setHintPair] = useState<[number, number] | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const settled = useRef(false)

  const timeUp = elapsed >= TIME_LIMIT_MS
  const finished = Boolean(game) && (game!.won || timeUp)

  const start = useCallback(() => {
    if (!spendEnergy()) {
      setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
      return
    }
    const now = Date.now()
    clearRewards()
    settled.current = false
    setElapsed(0)
    setHintPair(null)
    setFlash(null)
    setGame(createGame(now, now))
  }, [clearRewards, spendEnergy])

  // Sekundentakt für die Uhr
  useEffect(() => {
    if (!game || finished) return
    const id = setInterval(() => setElapsed(Date.now() - game.startedAt), 250)
    return () => clearInterval(id)
  }, [game, finished])

  // Rundenergebnis genau einmal verrechnen — bei Sieg wie bei Zeitablauf
  useEffect(() => {
    if (!game || !finished || settled.current) return
    settled.current = true

    const durationMs = game.won ? elapsed : TIME_LIMIT_MS
    finishRound({
      game: 'tempelpaare',
      won: game.won,
      score: finalScore(game, durationMs),
      durationMs,
      counters: {
        pairs: game.matched,
        stars: starsFor(durationMs, game.won),
      },
    })
  }, [elapsed, finishRound, finished, game])

  function onTile(id: number) {
    if (!game || finished) return
    const out = tapTile(game, id)
    if (out.outcome === 'matched') {
      setFlash('Paar gefunden!')
      setHintPair(null)
    } else if (out.outcome === 'blocked') {
      setFlash('Dieser Stein ist noch verdeckt.')
    } else {
      setFlash(null)
    }
    setGame(out.state)
  }

  function onHint() {
    if (!game || finished) return
    const out = useHint(game)
    setGame(out.state)
    setHintPair(out.pair)
    setFlash(out.pair ? 'Diese beiden passen zusammen.' : 'Kein Hinweis mehr übrig.')
  }

  function onShuffle() {
    if (!game || finished) return
    if (game.shuffles === 0) {
      setFlash('Kein Mischen mehr übrig.')
      return
    }
    setGame(shuffle(game))
    setHintPair(null)
    setFlash('Neu gemischt.')
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
              <dt className="text-xs text-ink-muted">Bestzeit</dt>
              <dd className="tabular font-bold">
                {progress?.bestTimeMs ? formatTime(progress.bestTimeMs) : '—'}
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
            Räume alle 18 Paare in drei Minuten. Ein Stein lässt sich nehmen, wenn nichts auf
            ihm liegt und eine Seite frei ist.
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

  const remainingMs = Math.max(0, TIME_LIMIT_MS - elapsed)
  const visible = game.tiles.filter((t) => !t.removed)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Zeit</p>
            <p
              className="tabular text-2xl font-black"
              style={{ color: remainingMs < 30_000 ? 'var(--color-game-kristallmix)' : undefined }}
            >
              {formatTime(remainingMs)}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Paare</p>
            <p className="tabular text-lg font-bold">{game.matched} / 18</p>
          </div>
          <div className="text-2xl" aria-label={`${starsFor(elapsed, true)} von 3 Sternen`}>
            <span className="text-gold">{'★'.repeat(starsFor(elapsed, true))}</span>
            <span className="text-edge">{'★'.repeat(3 - starsFor(elapsed, true))}</span>
          </div>
        </div>
        {flash && <p className="mt-1 text-sm font-bold text-gold">{flash}</p>}
      </Card>

      <div className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/70" />

        {/* Steine liegen absolut, damit höhere Schichten versetzt darüber sitzen */}
        <div className="relative aspect-[6/5] w-full">
          {visible.map((tile) => {
            const free = isFree(game.tiles, tile)
            const selected = game.selected === tile.id
            const hinted = hintPair?.includes(tile.id) ?? false
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onTile(tile.id)}
                aria-label={`Stein ${tile.symbol}, Reihe ${tile.row + 1}, Spalte ${tile.col + 1}${free ? '' : ', verdeckt'}`}
                className="absolute grid place-items-center rounded-md border transition-transform active:scale-95"
                style={{
                  left: `${tile.col * TILE_W + tile.layer * LAYER_OFFSET}%`,
                  top: `${tile.row * TILE_H - tile.layer * LAYER_OFFSET * 1.2}%`,
                  width: `${TILE_W - 1.5}%`,
                  height: `${TILE_H - 3}%`,
                  // Höhere Schichten müssen über den unteren liegen
                  zIndex: tile.layer * 10 + tile.row,
                  background: free
                    ? 'linear-gradient(160deg, #f3e3c2, #d9c19a)'
                    : 'linear-gradient(160deg, #8e7a5c, #6d5c45)',
                  borderColor: selected
                    ? 'var(--color-gold)'
                    : hinted
                      ? 'var(--color-game-tempelpaare)'
                      : 'rgba(0,0,0,0.35)',
                  borderWidth: selected || hinted ? 3 : 1,
                  // Je höher die Schicht, desto kräftiger der Schlagschatten —
                  // sonst ist auf dem flachen Bild nicht zu sehen, was obenauf liegt.
                  boxShadow: `${2 + tile.layer * 2}px ${3 + tile.layer * 3}px ${4 + tile.layer * 3}px rgba(0,0,0,${0.45 + tile.layer * 0.12})${
                    free ? ', inset 0 1px 0 rgba(255,255,255,0.6)' : ''
                  }`,
                  opacity: free ? 1 : 0.75,
                  fontSize: 'clamp(14px, 4.5vw, 26px)',
                }}
              >
                <span aria-hidden>{tile.symbol}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onHint}
          disabled={game.hints === 0}
          className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase disabled:opacity-40"
        >
          💡 Hinweis ({game.hints})
        </button>
        <button
          type="button"
          onClick={onShuffle}
          disabled={game.shuffles === 0}
          className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase disabled:opacity-40"
        >
          🔀 Mischen ({game.shuffles})
        </button>
      </div>

      {finished && (
        <RoundResultOverlay
          won={game.won}
          title={game.won ? 'Tempel geräumt!' : 'Zeit abgelaufen!'}
          stars={starsFor(game.won ? elapsed : TIME_LIMIT_MS, game.won)}
          facts={[
            { label: 'Paare', value: `${game.matched} / 18` },
            { label: 'Zeit', value: formatTime(game.won ? elapsed : TIME_LIMIT_MS) },
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
