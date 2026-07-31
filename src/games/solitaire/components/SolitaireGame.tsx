import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card as Panel } from '../../../components/Card'
import { formatTime } from '../../../components/GameTile'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import {
  isRed,
  rankLabel,
  rankName,
  SUIT_NAME,
  SUIT_SYMBOL,
  SUITS,
  type Card,
} from '../logic/cards'
import {
  createGame,
  drawFromStock,
  finalScore,
  moveTo,
  placedCards,
  select,
  starsFor,
  undo,
  useHint,
  type GameState,
  type Hint,
  type Selection,
} from '../logic/game'

const INFO = GAMES_BY_ID.solitaire

/**
 * Wie weit eine Karte die darunterliegende überlappt, in Prozent der Kartenbreite.
 * Eine Karte ist 140 % ihrer Breite hoch; der Rest bleibt als sichtbarer Streifen
 * stehen. Prozentwerte bei `margin-top` rechnen gegen die **Breite** des Umfelds —
 * dadurch skaliert der Stapel ohne Messung mit der Bildschirmbreite.
 */
const OVERLAP_FACE_UP = '-94%'
const OVERLAP_FACE_DOWN = '-117%'

/**
 * Fynnox Solitaire — Klondike (docs/05-roadmap.md, Phase 6).
 *
 * Bedienung: Karte antippen, dann das Ziel antippen. Bewusst kein Ziehen —
 * auf Flächen, die sich nach jedem Zug neu zeichnen, brechen Zeigervorgänge ab
 * (siehe lessons.md).
 */
export function SolitaireGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.solitaire ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [hint, setHint] = useState<Hint | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [givenUp, setGivenUp] = useState(false)
  const settled = useRef(false)

  const finished = Boolean(game) && (game!.won || givenUp)

  const start = useCallback(() => {
    if (!spendEnergy()) {
      setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
      return
    }
    const now = Date.now()
    clearRewards()
    settled.current = false
    setElapsed(0)
    setHint(null)
    setFlash(null)
    setGivenUp(false)
    setGame(createGame(now, now))
  }, [clearRewards, spendEnergy])

  // Sekundentakt für die Uhr — die Logik selbst kennt keine Zeit
  useEffect(() => {
    if (!game || finished) return
    const id = setInterval(() => setElapsed(Date.now() - game.startedAt), 500)
    return () => clearInterval(id)
  }, [game, finished])

  // Rundenergebnis genau einmal verrechnen
  useEffect(() => {
    if (!game || !finished || settled.current) return
    settled.current = true
    const durationMs = Date.now() - game.startedAt

    finishRound({
      game: 'solitaire',
      won: game.won,
      score: finalScore(game, durationMs),
      durationMs,
      counters: {
        moves: game.moves,
        undos: game.undos,
        stars: starsFor(durationMs, game.won),
      },
    })
  }, [finishRound, finished, game])

  /**
   * Ein Ziel wurde angetippt. Liegt etwas in der Hand, wird zuerst versucht
   * abzulegen — erst wenn das nicht geht, wird die Karte dort aufgenommen.
   */
  function onSpot(target: { zone: 'tableau'; column: number } | { zone: 'foundation'; pile: number }, pickUp?: Selection) {
    if (!game || finished) return
    setHint(null)

    if (game.selected) {
      const moved = moveTo(game, target)
      if (moved.outcome === 'moved') {
        setGame(moved.state)
        setFlash(moved.state.won ? 'Alle Karten abgelegt!' : null)
        return
      }
    }

    if (!pickUp) {
      setGame({ ...game, selected: null })
      setFlash('Dort passt diese Karte nicht.')
      return
    }

    const picked = select(game, pickUp)
    setGame(picked.state)
    setFlash(picked.outcome === 'blocked' ? 'Diese Karte lässt sich nicht bewegen.' : null)
  }

  function onStock() {
    if (!game || finished) return
    setHint(null)
    const out = drawFromStock(game)
    setGame(out.state)
    setFlash(out.outcome === 'redeal' ? 'Talon umgedreht.' : null)
  }

  function onWaste() {
    if (!game || finished) return
    setHint(null)
    const picked = select(game, { zone: 'waste' })
    setGame(picked.state)
  }

  function onUndo() {
    if (!game || finished) return
    setHint(null)
    if (game.history.length === 0) {
      setFlash('Es gibt nichts zurückzunehmen.')
      return
    }
    setGame(undo(game))
    setFlash('Zug zurückgenommen.')
  }

  function onHint() {
    if (!game || finished) return
    const out = useHint(game)
    setGame(out.state)
    setHint(out.hint)
    if (!out.hint) {
      setFlash(game.hints === 0 ? 'Kein Hinweis mehr übrig.' : 'Hier geht leider nichts mehr.')
    } else {
      setFlash(out.hint.kind === 'draw' ? 'Zieh eine Karte.' : 'Dieser Zug bringt dich weiter.')
    }
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

        <Panel>
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
            Sortiere alle 52 Karten auf die vier Ablagestapel — je Farbe von Ass bis König.
            In den Spalten wird absteigend und mit wechselnder Farbe gelegt, auf eine leere
            Spalte darf nur ein König. Erst die Karte antippen, dann das Ziel.
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
        </Panel>
      </div>
    )
  }

  const selected = game.selected
  const wasteTop = game.waste[game.waste.length - 1]

  /** Gehört diese Spaltenkarte zur aufgenommenen Folge? */
  const isPicked = (column: number, index: number) =>
    selected?.zone === 'tableau' && selected.column === column && index >= selected.index

  const hintFrom = hint?.kind === 'move' ? hint.from : null
  const hintTo = hint?.kind === 'move' ? hint.to : null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Zeit</p>
            <p className="tabular text-xl font-black">{formatTime(elapsed)}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Punkte</p>
            <p className="tabular text-lg font-bold">{game.score}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Züge</p>
            <p className="tabular text-lg font-bold">{game.moves}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Abgelegt</p>
            <p className="tabular text-lg font-bold">{placedCards(game)}/52</p>
          </div>
        </div>
        {flash && <p className="mt-1 text-sm font-bold text-gold">{flash}</p>}
      </Panel>

      <div className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/85" />

        <div className="relative p-1.5">
          {/* Kopfreihe: Ziehstapel, Talon, vier Ablagestapel */}
          <div className="grid grid-cols-7 gap-1">
            <button
              type="button"
              onClick={onStock}
              aria-label={
                game.stock.length > 0
                  ? `Ziehstapel, ${game.stock.length} Karten`
                  : 'Talon umdrehen'
              }
              className="w-full"
            >
              {game.stock.length > 0 ? (
                <CardBack hinted={hint?.kind === 'draw'} />
              ) : (
                <EmptySlot label="↻" hinted={hint?.kind === 'draw'} />
              )}
            </button>

            <button
              type="button"
              onClick={onWaste}
              aria-label={
                wasteTop
                  ? `Talon, ${rankName(wasteTop.rank)} ${SUIT_NAME[wasteTop.suit]}`
                  : 'Talon, leer'
              }
              className="w-full"
            >
              {wasteTop ? (
                <CardFace
                  card={wasteTop}
                  picked={selected?.zone === 'waste'}
                  hinted={hintFrom?.zone === 'waste'}
                />
              ) : (
                <EmptySlot />
              )}
            </button>

            <div aria-hidden />

            {SUITS.map((suit, pile) => {
              const top = game.foundations[pile][game.foundations[pile].length - 1]
              return (
                <button
                  key={suit}
                  type="button"
                  onClick={() =>
                    onSpot(
                      { zone: 'foundation', pile },
                      top ? { zone: 'foundation', pile } : undefined,
                    )
                  }
                  aria-label={`Ablagestapel ${SUIT_NAME[suit]}${
                    top ? `, oben ${rankName(top.rank)}` : ', leer'
                  }`}
                  className="w-full"
                >
                  {top ? (
                    <CardFace
                      card={top}
                      picked={selected?.zone === 'foundation' && selected.pile === pile}
                      hinted={hintTo?.zone === 'foundation' && hintTo.pile === pile}
                    />
                  ) : (
                    <EmptySlot
                      label={SUIT_SYMBOL[suit]}
                      red={isRed(suit)}
                      hinted={hintTo?.zone === 'foundation' && hintTo.pile === pile}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Sieben Spalten */}
          <div className="mt-3 grid grid-cols-7 items-start gap-1 pb-1.5">
            {game.tableau.map((column, c) =>
              column.length === 0 ? (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSpot({ zone: 'tableau', column: c })}
                  aria-label={`Spalte ${c + 1}, leer`}
                  className="w-full"
                >
                  <EmptySlot hinted={hintTo?.zone === 'tableau' && hintTo.column === c} />
                </button>
              ) : (
                <div key={c} className="flex flex-col">
                  {column.map((card, i) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() =>
                        onSpot(
                          { zone: 'tableau', column: c },
                          { zone: 'tableau', column: c, index: i },
                        )
                      }
                      aria-label={
                        card.faceUp
                          ? `${rankName(card.rank)} ${SUIT_NAME[card.suit]}, Spalte ${c + 1}`
                          : `Verdeckte Karte, Spalte ${c + 1}`
                      }
                      className="w-full"
                      style={{
                        marginTop:
                          i === 0
                            ? 0
                            : column[i - 1].faceUp
                              ? OVERLAP_FACE_UP
                              : OVERLAP_FACE_DOWN,
                        // Obere Karten müssen über den unteren liegen
                        zIndex: i,
                      }}
                    >
                      {card.faceUp ? (
                        <CardFace
                          card={card}
                          picked={isPicked(c, i)}
                          hinted={
                            (hintFrom?.zone === 'tableau' &&
                              hintFrom.column === c &&
                              i >= hintFrom.index) ||
                            (hintTo?.zone === 'tableau' &&
                              hintTo.column === c &&
                              i === column.length - 1)
                          }
                        />
                      ) : (
                        <CardBack />
                      )}
                    </button>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
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
          💡 Hinweis ({game.hints})
        </button>
        <button
          type="button"
          onClick={() => setGivenUp(true)}
          className="min-h-12 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase"
        >
          🏳 Aufgeben
        </button>
      </div>

      {finished && (
        <RoundResultOverlay
          won={game.won}
          title={game.won ? 'Gewonnen!' : 'Runde beendet'}
          stars={starsFor(elapsed, game.won)}
          facts={[
            { label: 'Zeit', value: formatTime(elapsed) },
            { label: 'Abgelegt', value: `${placedCards(game)}/52` },
            { label: 'Züge', value: String(game.moves) },
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

/** Gemeinsame Maße: Spielkarten sind 5 : 7. */
const SLOT = 'aspect-[5/7] w-full rounded-[6px]'

function CardFace({ card, picked, hinted }: { card: Card; picked?: boolean; hinted?: boolean }) {
  const red = isRed(card.suit)
  return (
    <span
      className={`${SLOT} relative block border bg-[#fbf6e9] shadow-md shadow-black/40`}
      style={{
        borderColor: picked ? 'var(--color-gold)' : hinted ? INFO.colorVar : 'rgba(0,0,0,0.35)',
        borderWidth: picked || hinted ? 2 : 1,
        color: red ? '#c62828' : '#1c1c1c',
        // Aufgenommene Karten treten hervor, damit die ganze Folge sichtbar ist
        transform: picked ? 'translateY(-3px)' : undefined,
      }}
    >
      {/* Wert und Farbe liegen oben links — bei überlappten Karten ist nur
          dieser Streifen sichtbar */}
      <span className="absolute top-[2px] left-[3px] text-[11px] leading-none font-black">
        {rankLabel(card.rank)}
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="absolute inset-0 grid place-items-center pt-2 text-[17px] leading-none">
        {SUIT_SYMBOL[card.suit]}
      </span>
    </span>
  )
}

function CardBack({ hinted }: { hinted?: boolean }) {
  return (
    <span
      className={`${SLOT} block border shadow-md shadow-black/40`}
      style={{
        borderColor: hinted ? 'var(--color-gold)' : 'rgba(0,0,0,0.4)',
        borderWidth: hinted ? 2 : 1,
        background: `repeating-linear-gradient(45deg, ${INFO.colorVar}, ${INFO.colorVar} 3px, rgba(255,255,255,0.18) 3px, rgba(255,255,255,0.18) 6px)`,
      }}
    />
  )
}

function EmptySlot({
  label,
  red,
  hinted,
}: {
  label?: string
  red?: boolean
  hinted?: boolean
}) {
  return (
    <span
      className={`${SLOT} grid place-items-center border border-dashed text-[15px] leading-none`}
      style={{
        borderColor: hinted ? 'var(--color-gold)' : 'rgba(255,255,255,0.28)',
        borderWidth: hinted ? 2 : 1,
        color: red ? 'rgba(255,140,140,0.55)' : 'rgba(255,255,255,0.4)',
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      {label}
    </span>
  )
}
