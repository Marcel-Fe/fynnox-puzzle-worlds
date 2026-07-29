import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card } from '../../../components/Card'
import { formatTime } from '../../../components/GameTile'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import {
  countPlaced,
  createGame,
  enterValue,
  MAX_MISTAKES,
  remainingCells,
  scoreFor,
  selectCell,
  starsFor,
  toggleNoteMode,
  undo,
  useHint,
  type GameState,
} from '../logic/game'
import { boxOf, CLUES, colOf, rowOf, SIZE, type Difficulty } from '../logic/grid'

const INFO = GAMES_BY_ID.sudoku
const STUFEN: Difficulty[] = ['leicht', 'mittel', 'schwer']

/**
 * Sudoku (docs/05-roadmap.md, Phase 6).
 *
 * Bedienung: erst ein Feld antippen, dann eine Zahl im Block darunter.
 * Kein Zahlenfeld direkt im Gitter — auf dem Handy wären neun Ziffern in
 * einer 30-px-Zelle nicht zu treffen.
 */
export function SudokuGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.sudoku ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('leicht')
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const settled = useRef(false)

  const finished = Boolean(game) && (game!.won || game!.lost)

  const start = useCallback(
    (stufe: Difficulty) => {
      if (!spendEnergy()) {
        setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
        return
      }
      const now = Date.now()
      clearRewards()
      settled.current = false
      setElapsed(0)
      setFlash(null)
      setDifficulty(stufe)
      setGame(createGame(now, stufe, now))
    },
    [clearRewards, spendEnergy],
  )

  // Sekundentakt für die Uhr
  useEffect(() => {
    if (!game || finished) return
    const id = setInterval(() => setElapsed(Date.now() - game.startedAt), 500)
    return () => clearInterval(id)
  }, [game, finished])

  // Rundenergebnis genau einmal verrechnen
  useEffect(() => {
    if (!game || !finished || settled.current) return
    settled.current = true
    const dauer = Date.now() - game.startedAt

    finishRound({
      game: 'sudoku',
      won: game.won,
      score: scoreFor(game, dauer),
      durationMs: dauer,
      counters: {
        mistakes: game.mistakes,
        stars: starsFor(game, dauer),
      },
    })
  }, [finishRound, finished, game])

  function onCell(index: number) {
    if (!game || finished) return
    setGame(selectCell(game, index))
    setFlash(null)
  }

  function onNumber(value: number) {
    if (!game || finished) return
    if (game.selected === null) {
      setFlash('Erst ein Feld antippen.')
      return
    }
    const out = enterValue(game, value)
    setGame(out.state)

    if (out.outcome === 'wrong') {
      const übrig = MAX_MISTAKES - out.state.mistakes
      setFlash(übrig > 0 ? `Falsch! Noch ${übrig} Fehler erlaubt.` : 'Zu viele Fehler!')
    } else if (out.outcome === 'blocked') {
      setFlash('Dieses Feld ist vorgegeben.')
    } else {
      setFlash(null)
    }
  }

  function onHint() {
    if (!game || finished) return
    const out = useHint(game)
    setGame(out.state)
    setFlash(out.index === null ? 'Kein Hinweis mehr übrig.' : 'Ein Feld gelöst.')
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

        <Card title="Schwierigkeit">
          <div className="flex flex-col gap-2">
            {STUFEN.map((stufe) => (
              <button
                key={stufe}
                type="button"
                onClick={() => start(stufe)}
                className="flex min-h-14 items-center justify-between rounded-xl border border-edge px-4 text-sm font-bold uppercase"
              >
                <span>{stufe}</span>
                <span className="tabular text-xs font-semibold text-ink-muted normal-case">
                  {CLUES[stufe]} Zahlen vorgegeben · 1 ⚡
                </span>
              </button>
            ))}
          </div>

          <dl className="mt-4 flex gap-4 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Bestzeit</dt>
              <dd className="tabular font-bold">
                {progress?.bestTimeMs ? formatTime(progress.bestTimeMs) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Gelöst</dt>
              <dd className="tabular font-bold">{progress?.gamesWon ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Energie</dt>
              <dd className="tabular font-bold">{energy}/5</dd>
            </div>
          </dl>
          {flash && <p className="mt-3 text-sm font-semibold text-gold">{flash}</p>}
        </Card>
      </div>
    )
  }

  const selected = game.selected
  const selectedValue = selected !== null ? game.cells[selected].value : 0

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Zeit</p>
            <p className="tabular text-xl font-black">{formatTime(elapsed)}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Stufe</p>
            <p className="text-sm font-bold capitalize">{difficulty}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Fehler</p>
            <p
              className="tabular text-lg font-bold"
              style={{ color: game.mistakes > 0 ? 'var(--color-game-kristallmix)' : undefined }}
            >
              {game.mistakes}/{MAX_MISTAKES}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Offen</p>
            <p className="tabular text-lg font-bold">{remainingCells(game)}</p>
          </div>
        </div>
        {flash && <p className="mt-1 text-sm font-bold text-gold">{flash}</p>}
      </Card>

      {/* Gitter */}
      <div className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/85" />
        <div
          className="relative grid p-1.5"
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        >
          {game.cells.map((cell, i) => {
            const istAusgewählt = selected === i
            // Zeile, Spalte und Block des gewählten Feldes hervorheben —
            // das ist die übliche Lesehilfe und erspart mühsames Abzählen.
            const inSicht =
              selected !== null &&
              (rowOf(i) === rowOf(selected) ||
                colOf(i) === colOf(selected) ||
                boxOf(i) === boxOf(selected))
            const gleicheZahl =
              selectedValue > 0 && cell.value === selectedValue && !istAusgewählt

            return (
              <button
                key={i}
                type="button"
                onClick={() => onCell(i)}
                aria-label={`Zeile ${rowOf(i) + 1}, Spalte ${colOf(i) + 1}${
                  cell.value ? `, ${cell.value}` : ', leer'
                }`}
                className="grid aspect-square place-items-center text-base font-bold"
                style={{
                  background: istAusgewählt
                    ? 'color-mix(in srgb, var(--color-game-sudoku) 45%, transparent)'
                    : gleicheZahl
                      ? 'color-mix(in srgb, var(--color-gold) 22%, transparent)'
                      : inSicht
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                  color: cell.wrong
                    ? 'var(--color-game-kristallmix)'
                    : cell.fixed
                      ? 'var(--color-ink)'
                      : 'var(--color-gold)',
                  // Dickere Linien an den Blockgrenzen, damit die 3×3-Felder
                  // erkennbar bleiben
                  borderRight: `${colOf(i) % 3 === 2 && colOf(i) !== 8 ? 2 : 1}px solid ${
                    colOf(i) % 3 === 2 ? 'var(--color-ink-muted)' : 'var(--color-edge)'
                  }`,
                  borderBottom: `${rowOf(i) % 3 === 2 && rowOf(i) !== 8 ? 2 : 1}px solid ${
                    rowOf(i) % 3 === 2 ? 'var(--color-ink-muted)' : 'var(--color-edge)'
                  }`,
                }}
              >
                {cell.value > 0 ? (
                  cell.value
                ) : cell.notes.length > 0 ? (
                  <span
                    className="grid size-full p-0.5 text-[7px] leading-none text-ink-muted"
                    style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span key={n} className="grid place-items-center">
                        {cell.notes.includes(n) ? n : ''}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* Zahlenblock */}
      <div className="grid grid-cols-9 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const fertig = countPlaced(game, n) === 9
          return (
            <button
              key={n}
              type="button"
              onClick={() => onNumber(n)}
              disabled={fertig}
              aria-label={`Zahl ${n}`}
              className="min-h-12 rounded-lg border border-edge text-lg font-black text-ink disabled:opacity-25"
              style={{
                background: game.noteMode ? 'rgba(255,255,255,0.05)' : undefined,
              }}
            >
              {n}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setGame(toggleNoteMode(game))}
          className="min-h-12 flex-1 rounded-xl border text-sm font-bold uppercase"
          style={
            game.noteMode
              ? { background: INFO.colorVar, borderColor: INFO.colorVar, color: '#fff' }
              : { borderColor: 'var(--color-edge)', color: 'var(--color-ink)' }
          }
        >
          ✏️ Notiz
        </button>
        <button
          type="button"
          onClick={() => onNumber(0)}
          className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase"
        >
          ⌫ Löschen
        </button>
        <button
          type="button"
          onClick={() => setGame(undo(game))}
          disabled={game.history.length === 0}
          className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase disabled:opacity-40"
        >
          ↶ Zurück
        </button>
        <button
          type="button"
          onClick={onHint}
          disabled={game.hints === 0}
          className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase disabled:opacity-40"
        >
          💡 {game.hints}
        </button>
      </div>

      {finished && (
        <RoundResultOverlay
          won={game.won}
          title={game.won ? 'Gelöst!' : 'Zu viele Fehler!'}
          stars={starsFor(game, elapsed)}
          facts={[
            { label: 'Zeit', value: formatTime(elapsed) },
            { label: 'Fehler', value: `${game.mistakes}/${MAX_MISTAKES}` },
            { label: 'Stufe', value: difficulty },
          ]}
          rewards={rewards}
          accent={INFO.colorVar}
          onAgain={() => start(difficulty)}
          onLeave={() => navigate('/')}
          againDisabled={energy < 1}
        />
      )}
    </div>
  )
}
