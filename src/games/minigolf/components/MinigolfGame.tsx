import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeechBubble } from '../../../components/Avatar'
import { Card } from '../../../components/Card'
import { RoundResultOverlay } from '../../../components/RoundResult'
import { GAMES_BY_ID } from '../../../content/games'
import { useGameStore } from '../../../store/gameStore'
import { COURSE_COUNT, COURSES, courseAt, unlockedCourses } from '../logic/courses'
import {
  advance,
  courseOf,
  createGame,
  finalScore,
  isHoleInOne,
  maxStrokes,
  shoot,
  starsFor,
  type GameState,
} from '../logic/game'
import { sub, type Vec } from '../logic/physics'
import { CourseView } from './CourseView'

const INFO = GAMES_BY_ID.minigolf

/**
 * Fynnox Minigolf (docs/05-roadmap.md, Phase 6).
 *
 * Bedienung in drei Schritten, wie im Mockup: Feld antippen zum Zielen, Kraft
 * über die Skala, dann „Schlagen". Bewusst kein Ziehen — die Bedienelemente
 * zeichnen sich dadurch nie unter dem Finger neu (siehe lessons.md).
 */
export function MinigolfGame() {
  const navigate = useNavigate()
  const spendEnergy = useGameStore((s) => s.spendEnergy)
  const finishRound = useGameStore((s) => s.finishRound)
  const clearRewards = useGameStore((s) => s.clearRewards)
  const rewards = useGameStore((s) => s.lastRewards)
  const progress = useGameStore((s) => s.save?.progress.minigolf ?? null)
  const energy = useGameStore((s) => s.save?.profile.energy ?? 0)

  const highestLevel = progress?.highestLevel ?? 0
  const unlocked = unlockedCourses(highestLevel)

  const [game, setGame] = useState<GameState | null>(null)
  const [chosen, setChosen] = useState(unlocked)
  const [aim, setAim] = useState<Vec | null>(null)
  const [power, setPower] = useState(55)
  const [flash, setFlash] = useState<string | null>(null)
  const settled = useRef(false)
  const lastPenalties = useRef(0)

  const chosenCourse = courseAt(chosen)
  const finished = Boolean(game) && (game!.holed || game!.lost)

  const start = useCallback(
    (courseNumber: number) => {
      if (!spendEnergy()) {
        setFlash('Keine Energie mehr! Sie füllt sich alle 10 Minuten wieder auf.')
        return
      }
      clearRewards()
      settled.current = false
      lastPenalties.current = 0
      setAim(null)
      setPower(55)
      setFlash(null)
      setChosen(courseNumber)
      setGame(createGame(courseNumber, Date.now()))
    },
    [clearRewards, spendEnergy],
  )

  // Bildtakt, solange der Ball rollt. Die Logik selbst kennt keine Uhr —
  // sie bekommt die verstrichene Zeit hier hereingereicht.
  useEffect(() => {
    if (!game?.moving) return
    let frame = 0
    let previous = performance.now()

    const tick = (now: number) => {
      // Deckel gegen Riesensprünge, wenn der Bildschirm zwischendurch schlief
      const seconds = Math.min(0.05, (now - previous) / 1000)
      previous = now
      setGame((current) => (current ? advance(current, seconds).state : current))
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [game?.moving])

  // Rückmeldung, sobald der Ball liegt
  useEffect(() => {
    if (!game || game.moving) return
    if (game.penalties > lastPenalties.current) {
      lastPenalties.current = game.penalties
      setFlash('Autsch! Zurück auf Los und ein Strafschlag.')
      return
    }
    if (game.holed) {
      setFlash(isHoleInOne(game) ? 'Hole in One!' : 'Eingelocht!')
    } else if (game.lost) {
      setFlash('Zu viele Schläge für diese Bahn.')
    }
  }, [game])

  // Rundenergebnis genau einmal verrechnen
  useEffect(() => {
    if (!game || !finished || settled.current) return
    settled.current = true
    const durationMs = Date.now() - game.startedAt

    finishRound({
      game: 'minigolf',
      won: game.holed,
      score: finalScore(game),
      durationMs,
      // Nur ein eingelochter Ball schaltet die nächste Bahn frei
      level: game.holed ? game.course : undefined,
      counters: {
        strokes: game.strokes,
        holeInOne: isHoleInOne(game) ? 1 : 0,
        stars: starsFor(game),
      },
    })
  }, [finishRound, finished, game])

  /**
   * Tippen aufs Feld setzt die Zielrichtung.
   *
   * Die Umrechnung von Bildschirm- in Weltkoordinaten macht `CourseView`
   * selbst — nur dort steht die Projektion, und nur so bleiben Sicht und
   * Zielpunkt zwangsläufig deckungsgleich.
   */
  function onAim(point: Vec) {
    if (!game || finished || game.moving) return
    setAim(point)
    setFlash(null)
  }

  function onShoot() {
    if (!game || finished || game.moving) return
    const target = aim ?? courseOf(game).hole
    const direction = sub(target, game.ball.position)
    if (direction.x === 0 && direction.y === 0) {
      setFlash('Tippe erst aufs Feld, um zu zielen.')
      return
    }
    setFlash(null)
    setGame(shoot(game, direction, power / 100))
  }

  if (!game) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <section className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
          <img src={chosenCourse.bg} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/85 to-deep/40" />
          <div className="relative p-4">
            <h1 className="text-2xl font-black drop-shadow-lg" style={{ color: INFO.colorVar }}>
              {INFO.title}
            </h1>
            <p className="mb-3 text-sm text-ink-muted">{INFO.tagline}</p>
            <SpeechBubble name={INFO.companion} ring={INFO.colorVar}>
              {chosenCourse.hint}
            </SpeechBubble>
          </div>
        </section>

        <Card title={`Bahn ${chosenCourse.number} von ${COURSE_COUNT}`}>
          <div className="grid grid-cols-3 gap-2">
            {COURSES.map((course) => {
              const locked = course.number > unlocked
              const done = course.number <= highestLevel
              const active = course.number === chosenCourse.number
              return (
                <button
                  key={course.number}
                  type="button"
                  onClick={() => setChosen(course.number)}
                  disabled={locked}
                  aria-label={`Bahn ${course.number}, ${course.name}${
                    locked ? ', gesperrt' : done ? ', geschafft' : ''
                  }`}
                  className="flex min-h-16 flex-col items-center justify-center rounded-xl border px-1 disabled:opacity-30"
                  style={{
                    borderColor: active ? INFO.colorVar : 'var(--color-edge)',
                    borderWidth: active ? 2 : 1,
                    background: active
                      ? `color-mix(in srgb, ${INFO.colorVar} 30%, transparent)`
                      : undefined,
                  }}
                >
                  <span
                    className="text-sm font-black"
                    style={{ color: done ? 'var(--color-gold)' : 'var(--color-ink)' }}
                  >
                    {locked ? '🔒' : course.number}
                  </span>
                  <span className="text-[10px] leading-tight text-ink-muted">{course.name}</span>
                  <span className="text-[10px] font-bold text-ink-muted">Par {course.par}</span>
                </button>
              )
            })}
          </div>

          <dl className="mt-4 flex gap-4 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Geschafft</dt>
              <dd className="tabular font-bold">
                {highestLevel}/{COURSE_COUNT}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Bestpunkte</dt>
              <dd className="tabular font-bold">{progress?.highScore ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Energie</dt>
              <dd className="tabular font-bold">{energy}/5</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-ink-muted">
            Tippe aufs Feld, um zu zielen, wähle die Kraft und schlage. Höchstens{' '}
            {maxStrokes(chosenCourse)} Schläge — bei Par oder besser gibt es drei Sterne.
          </p>
          {flash && <p className="mt-3 text-sm font-semibold text-gold">{flash}</p>}
          <button
            type="button"
            onClick={() => start(chosenCourse.number)}
            className="mt-4 min-h-12 w-full rounded-xl text-sm font-black text-white uppercase shadow-lg"
            style={{ background: INFO.colorVar }}
          >
            Bahn {chosenCourse.number} spielen (1 ⚡)
          </button>
        </Card>
      </div>
    )
  }

  const course = courseOf(game)
  const stars = starsFor(game)
  const target = aim ?? course.hole

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Bahn</p>
            <p className="text-sm font-black">
              {course.number} · {course.name}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Par</p>
            <p className="tabular text-lg font-bold">{course.par}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-ink-muted uppercase">Schläge</p>
            <p className="tabular text-lg font-bold">
              {game.strokes}/{maxStrokes(course)}
            </p>
          </div>
          <p className="text-lg" aria-label={`${stars} von 3 Sternen`}>
            <span className="text-gold">{'★'.repeat(stars)}</span>
            <span className="text-edge">{'★'.repeat(3 - stars)}</span>
          </p>
        </div>
        {flash && <p className="mt-1 text-sm font-bold text-gold">{flash}</p>}
      </Card>

      {/*
        Die Kulisse steht scharf dahinter — sie ist aus den Konzeptbildern
        geschnitten und soll die Welt zeigen. Die Bahn hebt sich von ihr durch
        ihre eigene Höhe und ihren Schlagschatten ab, nicht durch Unschärfe.
      */}
      <div className="relative -mx-4 overflow-hidden border-y border-edge shadow-xl shadow-black/40 sm:mx-0 sm:rounded-2xl sm:border">
        <img src={course.bg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-deep/25 via-deep/40 to-deep/60" />

        <CourseView
          course={course}
          ball={game.ball.position}
          aimTarget={!game.moving && !finished ? target : null}
          moving={game.moving}
          onAim={onAim}
        />
      </div>

      {/* Kraftskala — im Mockup ein Halbkreis, hier liegend: auf 390 px Breite
          ist eine waagerechte Skala mit 44 px Höhe treffsicherer als ein Bogen. */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor="kraft" className="text-xs tracking-widest text-ink-muted uppercase">
            Kraft
          </label>
          <span className="tabular text-sm font-bold">{power} %</span>
        </div>
        <input
          id="kraft"
          type="range"
          min={5}
          max={100}
          step={5}
          value={power}
          disabled={game.moving || finished}
          onChange={(e) => setPower(Number(e.target.value))}
          className="h-11 w-full cursor-pointer appearance-none rounded-full disabled:opacity-40"
          style={{
            background: 'linear-gradient(90deg,#16a34a 0%,#eab308 55%,#dc2626 100%)',
          }}
        />
      </div>

      <button
        type="button"
        onClick={onShoot}
        disabled={game.moving || finished}
        className="min-h-14 w-full rounded-xl text-base font-black text-white uppercase shadow-lg disabled:opacity-40"
        style={{ background: INFO.colorVar }}
      >
        🎯 Schlagen
      </button>

      {finished && (
        <RoundResultOverlay
          won={game.holed}
          title={isHoleInOne(game) ? 'Hole in One!' : game.holed ? 'Eingelocht!' : 'Bahn verloren'}
          stars={stars}
          facts={[
            { label: 'Bahn', value: `${course.number}` },
            { label: 'Schläge', value: `${game.strokes}` },
            { label: 'Par', value: `${course.par}` },
          ]}
          rewards={rewards}
          accent={INFO.colorVar}
          onAgain={() => start(nextCourse(game, highestLevel))}
          onLeave={() => navigate('/')}
          againDisabled={energy < 1}
          againLabel={
            nextCourse(game, highestLevel) === game.course
              ? 'Nochmal (1 ⚡)'
              : `Bahn ${nextCourse(game, highestLevel)} (1 ⚡)`
          }
        />
      )}
    </div>
  )
}

/** Nach einem eingelochten Ball führt der Knopf weiter statt zurück. */
function nextCourse(game: GameState, highestLevel: number): number {
  const weiter = game.holed && game.course < COURSE_COUNT
  return weiter && game.course > highestLevel - 1 ? game.course + 1 : game.course
}
