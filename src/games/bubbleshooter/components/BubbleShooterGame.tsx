import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card } from '../../../components/Card'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import {
  bubbleCount,
  centerOf,
  createGame,
  D,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  LAUNCHER,
  R,
  shoot,
  shotsUntilPush,
  starsFor,
  traceShot,
  type GameState,
} from '../logic/game'

const INFO = GAMES_BY_ID.bubbleshooter

/** Farben der Blasen — dieselbe Palette wie bei Kristallmix, ohne die sechste. */
const BUBBLE_COLORS = [0, 1, 2, 3, 4]

/** Gesamthöhe der Zeichenfläche: Feld plus Platz für das Rohr. */
const VIEW_HEIGHT = FIELD_HEIGHT + D * 1.6

/** Knapp 78 Grad — flacher gezielt klebt die Blase nur an der Wand. */
const MAX_ANGLE = 1.35

/**
 * Bubble Shooter (docs/05-roadmap.md, Phase 6).
 *
 * Gezielt wird durch Ziehen über das Feld: Die Bahn erscheint als gepunktete
 * Linie und wird erst beim Loslassen abgeschossen. So sieht der Spieler vorher,
 * wohin es geht — auf dem Handy verdeckt sonst der Finger genau die Stelle,
 * auf die er zielt.
 */
export function BubbleShooterGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.bubbleshooter ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const [game, setGame] = useState<GameState | null>(null)
  const [angle, setAngle] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const feldRef = useRef<HTMLDivElement>(null)
  /** Winkel und Zielzustand auch ausserhalb des Renderzyklus lesbar */
  const angleRef = useRef(0)
  const aimingRef = useRef(false)
  const settled = useRef(false)

  const start = useCallback(() => {
    if (!spendEnergy()) {
      setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
      return
    }
    const now = Date.now()
    clearRewards()
    settled.current = false
    setAngle(0)
    aimingRef.current = false
    setFlash(null)
    setGame(createGame(now, now))
  }, [clearRewards, spendEnergy])

  const settle = useCallback(
    (state: GameState) => {
      if (settled.current) return
      settled.current = true
      finishRound({
        game: 'bubbleshooter',
        won: state.won,
        score: state.score,
        durationMs: Date.now() - state.startedAt,
        counters: { stars: starsFor(state.score) },
      })
    },
    [finishRound],
  )

  /** Rechnet einen Zeigerpunkt in den Schusswinkel um. */
  function winkelAus(event: React.PointerEvent): number {
    const box = feldRef.current?.getBoundingClientRect()
    if (!box) return angle

    // Bildschirmpunkt in Rastereinheiten
    const x = ((event.clientX - box.left) / box.width) * FIELD_WIDTH
    const y = ((event.clientY - box.top) / box.height) * VIEW_HEIGHT

    const dx = x - LAUNCHER.x
    const dy = LAUNCHER.y - y
    // Nach unten zielen ergibt keinen Sinn — dort steht das Rohr selbst.
    const roh = Math.atan2(dx, Math.max(dy, 0.001))
    return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, roh))
  }

  /** Führt den Schuss aus und wertet ihn aus. */
  const feuern = useCallback(
    (finalerWinkel: number) => {
      setGame((current) => {
        if (!current || current.won || current.lost) return current
        const out = shoot(current, finalerWinkel)

        if (out.dropped.length > 0) {
          setFlash(`${out.popped.length} geplatzt, ${out.dropped.length} abgestürzt!`)
        } else if (out.popped.length > 0) {
          setFlash(`${out.popped.length} geplatzt!`)
        } else {
          setFlash(null)
        }

        if (out.state.won || out.state.lost) settle(out.state)
        return out.state
      })
    },
    [settle],
  )

  function onPointerDown(event: React.PointerEvent) {
    if (!game || game.won || game.lost) return
    aimingRef.current = true
    setAngle(winkelAus(event))
  }

  /*
   * Bewegen und Loslassen werden am Fenster behandelt, nicht am Feld.
   *
   * Zwei Gründe:
   * 1. Nach jedem Schuss baut React das Feld neu auf. Chromium schickt dem
   *    ursprünglichen Element dann `pointercancel` statt `pointerup` — der
   *    zweite und jeder weitere Schuss ging dadurch verloren.
   * 2. Die Listener hängen dauerhaft am Fenster, nicht nur während des Zielens.
   *    Würden sie erst beim Zielbeginn registriert, entstünde zwischen dem
   *    Antippen und dem fertigen Neuaufbau ein Zeitfenster, in dem ein
   *    schnelles Loslassen ins Leere läuft. Ob gerade gezielt wird, steht in
   *    einer Referenz — die ist sofort aktuell, anders als der Zustandswert.
   */
  useEffect(() => {
    function winkelAusEvent(event: PointerEvent): number {
      const box = feldRef.current?.getBoundingClientRect()
      if (!box) return angleRef.current

      const x = ((event.clientX - box.left) / box.width) * FIELD_WIDTH
      const y = ((event.clientY - box.top) / box.height) * VIEW_HEIGHT
      const dx = x - LAUNCHER.x
      const dy = LAUNCHER.y - y
      const roh = Math.atan2(dx, Math.max(dy, 0.001))
      return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, roh))
    }

    function onMove(event: PointerEvent) {
      if (!aimingRef.current) return
      const w = winkelAusEvent(event)
      angleRef.current = w
      setAngle(w)
    }

    function onUp(event: PointerEvent) {
      if (!aimingRef.current) return
      aimingRef.current = false
      const w = winkelAusEvent(event)
      angleRef.current = w
      setAngle(w)
      feuern(w)
    }

    function onCancel() {
      aimingRef.current = false
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [feuern])

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
              <dt className="text-xs text-ink-muted">Runden</dt>
              <dd className="tabular font-bold">{progress?.gamesPlayed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Energie</dt>
              <dd className="tabular font-bold">{energy}/5</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-muted">
            Ziehe über das Feld, um zu zielen — die Linie zeigt die Bahn samt Abprallern.
            Beim Loslassen fliegt die Blase. Drei gleiche Farben platzen; was dadurch den
            Halt verliert, fällt herunter und zählt doppelt.
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
  const bahn = finished ? null : traceShot(game.bubbles, angle)
  const groesse = (D / FIELD_WIDTH) * 100

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Punkte</p>
            <p className="tabular text-2xl font-black">{game.score.toLocaleString('de-DE')}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Blasen</p>
            <p className="tabular text-lg font-bold">{bubbleCount(game)}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Nächste Reihe</p>
            <p
              className="tabular text-lg font-bold"
              style={{ color: shotsUntilPush(game) <= 2 ? 'var(--color-game-kristallmix)' : undefined }}
            >
              in {shotsUntilPush(game)}
            </p>
          </div>
          <div className="text-2xl" aria-label={`${starsFor(game.score)} von 3 Sternen`}>
            <span className="text-gold">{'★'.repeat(starsFor(game.score))}</span>
            <span className="text-edge">{'★'.repeat(3 - starsFor(game.score))}</span>
          </div>
        </div>
        {flash && <p className="mt-1 text-sm font-black text-gold">{flash}</p>}
      </Card>

      <div
        ref={feldRef}
        onPointerDown={onPointerDown}
        className="relative touch-none overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40"
        style={{ aspectRatio: `${FIELD_WIDTH} / ${VIEW_HEIGHT}` }}
        role="application"
        aria-label="Spielfeld — ziehen zum Zielen, loslassen zum Schießen"
      >
        <img src={INFO.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-deep/75" />

        {/* Verlustlinie */}
        <div
          className="absolute inset-x-0 border-t-2 border-dashed border-game-kristallmix/60"
          style={{ top: `${((FIELD_HEIGHT - D * 0.6) / VIEW_HEIGHT) * 100}%` }}
        />

        {/* Zielhilfe */}
        {bahn && bahn.path.length > 1 && (
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            viewBox={`0 0 ${FIELD_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={bahn.path.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={0.08}
              strokeDasharray="0.25 0.25"
              strokeLinecap="round"
            />
            {bahn.slot && (
              <circle
                cx={centerOf(bahn.slot.row, bahn.slot.col).x}
                cy={centerOf(bahn.slot.row, bahn.slot.col).y}
                r={R * 0.9}
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={0.06}
              />
            )}
          </svg>
        )}

        {/* Liegende Blasen */}
        {[...game.bubbles.entries()].map(([key, color]) => {
          const [row, col] = key.split(',').map(Number)
          const c = centerOf(row, col)
          return (
            <Bubble
              key={key}
              color={color}
              size={groesse}
              left={((c.x - R) / FIELD_WIDTH) * 100}
              top={((c.y - R) / VIEW_HEIGHT) * 100}
            />
          )
        })}

        {/* Blase im Rohr */}
        <Bubble
          color={game.current}
          size={groesse}
          left={((LAUNCHER.x - R) / FIELD_WIDTH) * 100}
          top={((LAUNCHER.y - R) / VIEW_HEIGHT) * 100}
          glow
        />
      </div>

      <div className="flex items-center justify-center gap-3 text-sm text-ink-muted">
        <span>Nächste:</span>
        <span
          className="inline-block size-6 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--color-gem-${game.next}) 55%, white), var(--color-gem-${game.next}))`,
          }}
          aria-label={`Nächste Blase, Farbe ${game.next + 1}`}
        />
        <span>· Ziehen zum Zielen</span>
      </div>

      {finished && (
        <RoundResultOverlay
          won={game.won}
          title={game.won ? 'Feld geräumt!' : 'Die Blasen sind unten!'}
          stars={starsFor(game.score)}
          facts={[
            { label: 'Punkte', value: game.score.toLocaleString('de-DE') },
            { label: 'Schüsse', value: String(game.shots) },
            { label: 'Übrig', value: String(bubbleCount(game)) },
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

/** Eine einzelne Blase mit Glanzpunkt. */
function Bubble({
  color,
  size,
  left,
  top,
  glow,
}: {
  color: number
  size: number
  left: number
  top: number
  glow?: boolean
}) {
  const farbe = `var(--color-gem-${BUBBLE_COLORS[color] ?? 0})`
  return (
    <span
      className="absolute rounded-full"
      style={{
        width: `${size}%`,
        aspectRatio: '1',
        left: `${left}%`,
        top: `${top}%`,
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${farbe} 45%, white), ${farbe} 70%)`,
        boxShadow: glow
          ? `0 0 0 2px rgba(255,255,255,0.85), 0 2px 8px rgba(0,0,0,0.6)`
          : 'inset 0 -2px 4px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.5)',
      }}
    />
  )
}
