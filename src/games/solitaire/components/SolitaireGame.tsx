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
  configOf,
  createGame,
  drawFromStock,
  finalScore,
  moveTo,
  placedCards,
  redealsLeft,
  select,
  starsFor,
  undo,
  useHint,
  type GameState,
  type Hint,
  type Selection,
} from '../logic/game'
import { LEVEL_COUNT, LEVELS, levelAt, levelRules, unlockedLevels } from '../logic/levels'

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

  const highestLevel = progress?.highestLevel ?? 0
  const unlocked = unlockedLevels(highestLevel)

  const [game, setGame] = useState<GameState | null>(null)
  // Vorausgewählt ist das neueste freigeschaltete Level — dorthin will der
  // Spieler nach einem Sieg als Nächstes.
  const [chosen, setChosen] = useState(unlocked)
  const [elapsed, setElapsed] = useState(0)
  const [hint, setHint] = useState<Hint | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [givenUp, setGivenUp] = useState(false)
  const settled = useRef(false)

  const finished = Boolean(game) && (game!.won || game!.stuck || givenUp)
  const chosenLevel = levelAt(chosen)

  const start = useCallback(
    (level: number) => {
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
      setChosen(level)
      setGame(createGame(now, now, level))
    },
    [clearRewards, spendEnergy],
  )

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
      // Nur ein Sieg schaltet frei. Würde hier immer das gespielte Level
      // stehen, käme man durch bloßes Aufgeben bis Level 12.
      level: game.won ? game.level : undefined,
      counters: {
        moves: game.moves,
        undos: game.undos,
        stars: starsFor(durationMs, game.won, game.level),
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
    if (out.outcome === 'redeal') {
      const left = redealsLeft(out.state)
      setFlash(left === null ? 'Talon umgedreht.' : `Talon umgedreht — noch ${left}-mal möglich.`)
    } else if (out.outcome === 'blocked') {
      setFlash('Der Talon lässt sich nicht mehr umdrehen.')
    } else {
      setFlash(null)
    }
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

        <Panel title={`Level ${chosenLevel.number} von ${LEVEL_COUNT}`}>
          <div className="grid grid-cols-6 gap-1.5">
            {LEVELS.map((level) => {
              const locked = level.number > unlocked
              const done = level.number <= highestLevel
              const active = level.number === chosenLevel.number
              return (
                <button
                  key={level.number}
                  type="button"
                  onClick={() => setChosen(level.number)}
                  disabled={locked}
                  aria-label={`Level ${level.number}${locked ? ', gesperrt' : done ? ', geschafft' : ''}`}
                  className="grid min-h-12 place-items-center rounded-xl border text-sm font-black disabled:opacity-30"
                  style={{
                    borderColor: active ? INFO.colorVar : 'var(--color-edge)',
                    borderWidth: active ? 2 : 1,
                    background: active
                      ? `color-mix(in srgb, ${INFO.colorVar} 30%, transparent)`
                      : undefined,
                    color: done ? 'var(--color-gold)' : 'var(--color-ink)',
                  }}
                >
                  <span>{locked ? '🔒' : level.number}</span>
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-sm font-bold" style={{ color: INFO.colorVar }}>
            {chosenLevel.title}
          </p>
          <p className="text-xs text-ink-muted">{levelRules(chosenLevel)}</p>
          <p className="text-xs text-ink-muted">
            Drei Sterne unter {formatTime(chosenLevel.targetMs)}
          </p>

          <dl className="mt-3 flex gap-4 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Geschafft</dt>
              <dd className="tabular font-bold">
                {highestLevel}/{LEVEL_COUNT}
              </dd>
            </div>
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
            onClick={() => start(chosenLevel.number)}
            className="mt-4 min-h-12 w-full rounded-xl text-sm font-black text-white uppercase shadow-lg"
            style={{ background: INFO.colorVar }}
          >
            Level {chosenLevel.number} spielen (1 ⚡)
          </button>
        </Panel>
      </div>
    )
  }

  const selected = game.selected
  const config = configOf(game)
  const redeals = redealsLeft(game)
  /**
   * Beim Dreierzug liegen die zuletzt gezogenen Karten aufgefächert — sonst
   * wäre nicht zu sehen, was noch darunter liegt. Spielbar ist nur die letzte.
   */
  const wasteFan = game.waste.slice(Math.max(0, game.waste.length - config.draw))
  const wasteTop = wasteFan[wasteFan.length - 1]

  /** Gehört diese Spaltenkarte zur aufgenommenen Folge? */
  const isPicked = (column: number, index: number) =>
    selected?.zone === 'tableau' && selected.column === column && index >= selected.index

  const hintFrom = hint?.kind === 'move' ? hint.from : null
  const hintTo = hint?.kind === 'move' ? hint.to : null
  // Nach einem Sieg führt der Knopf weiter statt zurück — außer im letzten Level
  const nextLevel = game.won && game.level < LEVEL_COUNT ? game.level + 1 : game.level

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Panel>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-sm font-black" style={{ color: INFO.colorVar }}>
            Level {game.level} — {config.title}
          </p>
          {redeals !== null && (
            <p className="text-xs font-semibold text-ink-muted">
              Talon: noch {redeals}×
            </p>
          )}
        </div>
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

      {/*
       * Am Handy bis an den Bildschirmrand: Die sieben Spalten teilen sich die
       * Breite, jeder gesparte Randpixel macht die Karten spürbar größer.
       * Ab `sm` bleibt der Rahmen wie bei den anderen Spielen.
       */}
      <div className="relative -mx-4 overflow-hidden border-y border-edge shadow-xl shadow-black/40 sm:mx-0 sm:rounded-2xl sm:border">
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/85" />

        <div className="relative p-1">
          {/* Kopfreihe: Ziehstapel, Talon, vier Ablagestapel */}
          <div className="grid grid-cols-7 gap-[3px]">
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
              className="relative w-full"
            >
              {wasteTop ? (
                wasteFan.map((card, i) => {
                  const top = i === wasteFan.length - 1
                  return (
                    <span
                      key={card.id}
                      // Die erste Karte steht im Fluss und gibt dem Feld seine
                      // Höhe, die weiteren liegen versetzt darüber.
                      className={i === 0 ? 'block' : 'absolute top-0 w-full'}
                      style={i === 0 ? undefined : { left: `${i * 34}%`, zIndex: i }}
                    >
                      <CardFace
                        card={card}
                        picked={top && selected?.zone === 'waste'}
                        hinted={top && hintFrom?.zone === 'waste'}
                      />
                    </span>
                  )
                })
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
          <div className="mt-2.5 grid grid-cols-7 items-start gap-[3px] pb-1">
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
          title={game.won ? 'Gewonnen!' : game.stuck ? 'Keine Züge mehr!' : 'Runde beendet'}
          stars={starsFor(elapsed, game.won, game.level)}
          facts={[
            { label: 'Level', value: String(game.level) },
            { label: 'Zeit', value: formatTime(elapsed) },
            { label: 'Abgelegt', value: `${placedCards(game)}/52` },
          ]}
          rewards={rewards}
          accent={INFO.colorVar}
          onAgain={() => start(nextLevel)}
          onLeave={() => navigate('/')}
          againDisabled={energy < 1}
          againLabel={
            nextLevel === game.level
              ? 'Nochmal (1 ⚡)'
              : `Level ${nextLevel} (1 ⚡)`
          }
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
      <span className="absolute top-[2px] left-[4px] text-[13px] leading-none font-black">
        {rankLabel(card.rank)}
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="absolute inset-0 grid place-items-center pt-3 text-[22px] leading-none">
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
