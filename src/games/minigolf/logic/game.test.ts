import { describe, expect, it } from 'vitest'
import {
  COURSE_COUNT,
  COURSES,
  courseAt,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  HOLE_RADIUS,
  unlockedCourses,
  type Course,
} from './courses'
import {
  advance,
  createGame,
  finalScore,
  isHoleInOne,
  maxStrokes,
  MAX_SHOT_SPEED,
  shoot,
  starsFor,
  STROKE_ALLOWANCE,
  type GameState,
} from './game'
import {
  BALL_RADIUS,
  closestPointOnSegment,
  distance,
  insidePolygon,
  insideRect,
  length,
  normalize,
  polygonSegments,
  reflect,
  step,
  vec,
  type Ball,
  type Field,
} from './physics'

/** Rollt den Ball aus — mehr als 20 Sekunden braucht kein Schlag. */
function settle(state: GameState): GameState {
  let current = state
  for (let i = 0; i < 200 && current.moving; i++) {
    current = advance(current, 0.1).state
  }
  return current
}

function shootAndSettle(state: GameState, direction: { x: number; y: number }, power: number) {
  return settle(shoot(state, direction, power))
}

/** Nacktes Testfeld ohne Wind und Hindernisse. */
function plainField(patch: Partial<Field> = {}): Field {
  return {
    boundary: [vec(0, 0), vec(100, 0), vec(100, 100), vec(0, 100)],
    obstacles: [],
    friction: 0.25,
    wind: vec(0, 0),
    updrafts: [],
    restitution: 0.72,
    ...patch,
  }
}

function roll(ball: Ball, field: Field, seconds: number, dt = 1 / 240): Ball {
  let current = ball
  for (let i = 0; i < Math.round(seconds / dt); i++) current = step(current, field, dt)
  return current
}

describe('Vektoren', () => {
  it('spiegelt senkrecht auf eine Wand', () => {
    // Ball fliegt nach rechts, Wand steht senkrecht -> er kommt zurück
    const out = reflect(vec(10, 0), vec(-1, 0), 1)
    expect(out.x).toBeCloseTo(-10)
    expect(out.y).toBeCloseTo(0)
  })

  it('lässt den Anteil längs der Wand unberührt', () => {
    const out = reflect(vec(10, 5), vec(-1, 0), 1)
    expect(out.x).toBeCloseTo(-10)
    expect(out.y).toBeCloseTo(5)
  })

  it('dämpft nur den Anteil senkrecht zur Wand', () => {
    const out = reflect(vec(10, 5), vec(-1, 0), 0.5)
    expect(out.x).toBeCloseTo(-5)
    expect(out.y).toBeCloseTo(5)
  })

  it('findet den nächsten Punkt auf einer Strecke', () => {
    const a = vec(0, 0)
    const b = vec(10, 0)
    expect(closestPointOnSegment(vec(5, 4), a, b)).toEqual(vec(5, 0))
    // Außerhalb der Strecke wird auf den Endpunkt geklemmt
    expect(closestPointOnSegment(vec(-8, 3), a, b)).toEqual(vec(0, 0))
    expect(closestPointOnSegment(vec(30, 3), a, b)).toEqual(vec(10, 0))
  })

  it('erkennt Punkte innerhalb und außerhalb eines Linienzugs', () => {
    const box = [vec(0, 0), vec(10, 0), vec(10, 10), vec(0, 10)]
    expect(insidePolygon(vec(5, 5), box)).toBe(true)
    expect(insidePolygon(vec(15, 5), box)).toBe(false)
    expect(insidePolygon(vec(5, -1), box)).toBe(false)
  })

  it('zerlegt einen Linienzug in geschlossene Kanten', () => {
    const segments = polygonSegments([vec(0, 0), vec(10, 0), vec(10, 10)])
    expect(segments).toHaveLength(3)
    // Die letzte Kante führt zum Anfang zurück
    expect(segments[2]).toEqual([vec(10, 10), vec(0, 0)])
  })
})

describe('Ballbewegung', () => {
  it('kommt durch Reibung zur Ruhe', () => {
    const out = roll({ position: vec(50, 50), velocity: vec(60, 0) }, plainField(), 5)
    expect(length(out.velocity)).toBeLessThan(1.5)
  })

  it('rollt auf rutschigem Untergrund weiter', () => {
    const start = { position: vec(10, 50), velocity: vec(60, 0) }
    const normal = roll(start, plainField(), 1.5)
    const eis = roll(start, plainField({ friction: 0.6 }), 1.5)
    expect(eis.position.x).toBeGreaterThan(normal.position.x)
  })

  it('prallt an der Bande ab statt hindurchzufliegen', () => {
    const out = roll({ position: vec(50, 50), velocity: vec(90, 0) }, plainField(), 2)
    expect(out.position.x).toBeLessThan(100)
    expect(out.position.x).toBeGreaterThan(0)
  })

  it('bleibt auch bei höchstem Tempo im Feld', () => {
    // Der eigentliche Zweck der festen kleinen Schrittweite
    const field = plainField({ friction: 0.99 })
    for (const richtung of [vec(1, 0), vec(-1, 0), vec(0, 1), vec(0, -1), vec(1, 1), vec(-1, 1)]) {
      const velocity = { x: richtung.x * MAX_SHOT_SPEED, y: richtung.y * MAX_SHOT_SPEED }
      const out = roll({ position: vec(50, 50), velocity }, field, 6)
      expect(out.position.x, `Richtung ${richtung.x}/${richtung.y}`).toBeGreaterThanOrEqual(-0.01)
      expect(out.position.x).toBeLessThanOrEqual(100.01)
      expect(out.position.y).toBeGreaterThanOrEqual(-0.01)
      expect(out.position.y).toBeLessThanOrEqual(100.01)
    }
  })

  it('verliert bei jedem Abpraller Tempo', () => {
    const field = plainField({ friction: 1 }) // Reibung aus, nur der Abprallverlust zählt
    const vorher = 80
    const out = roll({ position: vec(90, 50), velocity: vec(vorher, 0) }, field, 0.5)
    expect(length(out.velocity)).toBeLessThan(vorher)
    expect(length(out.velocity)).toBeGreaterThan(vorher * 0.5)
  })

  it('wird vom Wind zur Seite getragen', () => {
    const start = { position: vec(50, 90), velocity: vec(0, -60) }
    const ohne = roll(start, plainField(), 1)
    const mit = roll(start, plainField({ wind: vec(20, 0) }), 1)
    expect(mit.position.x).toBeGreaterThan(ohne.position.x + 2)
  })

  it('wird in einer Aufwindzone nach oben beschleunigt', () => {
    const field = plainField({
      updrafts: [{ x: 0, y: 0, width: 100, height: 100, force: vec(0, -120) }],
    })
    const out = roll({ position: vec(50, 90), velocity: vec(0, -20) }, field, 0.5)
    expect(out.position.y).toBeLessThan(70)
  })

  it('prallt an einem runden Hindernis ab', () => {
    const field = plainField({ obstacles: [{ center: vec(50, 50), radius: 8 }] })
    const out = roll({ position: vec(20, 50), velocity: vec(70, 0) }, field, 1)
    // Er kommt von links, muss also links vom Hindernis bleiben
    expect(out.position.x).toBeLessThan(50)
    expect(distance(out.position, vec(50, 50))).toBeGreaterThanOrEqual(8 + BALL_RADIUS - 0.01)
  })

  it('gibt einem Kristall mehr Schwung mit, als er annimmt', () => {
    const field = plainField({
      friction: 1,
      obstacles: [{ center: vec(50, 50), radius: 8, restitution: 1.05 }],
    })
    const out = roll({ position: vec(20, 50), velocity: vec(40, 0) }, field, 0.5)
    expect(length(out.velocity)).toBeGreaterThan(40)
  })
})

describe('Bahnen', () => {
  it('hat sechs lückenlos nummerierte Bahnen', () => {
    expect(COURSES).toHaveLength(6)
    expect(COURSE_COUNT).toBe(6)
    COURSES.forEach((course, i) => expect(course.number).toBe(i + 1))
  })

  it('trägt die Par-Werte aus den Mockups', () => {
    expect(COURSES.map((c) => c.par)).toEqual([3, 4, 3, 5, 3, 4])
  })

  it('legt Start und Loch innerhalb der Bande an', () => {
    for (const course of COURSES) {
      expect(insidePolygon(course.start, course.boundary), `${course.name}: Start`).toBe(true)
      expect(insidePolygon(course.hole, course.boundary), `${course.name}: Loch`).toBe(true)
    }
  })

  it('hält Start und Loch weit genug von der Bande weg', () => {
    for (const course of COURSES) {
      for (const [punkt, was] of [
        [course.start, 'Start'],
        [course.hole, 'Loch'],
      ] as const) {
        const abstand = Math.min(
          ...polygonSegments(course.boundary).map((s) =>
            distance(punkt, closestPointOnSegment(punkt, s[0], s[1])),
          ),
        )
        expect(abstand, `${course.name}: ${was} klebt an der Bande`).toBeGreaterThan(
          BALL_RADIUS + 1,
        )
      }
    }
  })

  it('setzt den Ball nie in ein Hindernis oder eine Gefahrenfläche', () => {
    for (const course of COURSES) {
      for (const obstacle of course.obstacles) {
        expect(
          distance(course.start, obstacle.center),
          `${course.name}: Start liegt im Hindernis`,
        ).toBeGreaterThan(obstacle.radius + BALL_RADIUS)
        expect(distance(course.hole, obstacle.center)).toBeGreaterThan(
          obstacle.radius + HOLE_RADIUS,
        )
      }
      for (const hazard of course.hazards) {
        expect(insideRect(course.start, hazard), `${course.name}: Start in der Gefahr`).toBe(false)
        expect(insideRect(course.hole, hazard), `${course.name}: Loch in der Gefahr`).toBe(false)
      }
    }
  })

  it('bleibt mit allen Punkten im Spielfeld', () => {
    for (const course of COURSES) {
      for (const punkt of course.boundary) {
        expect(punkt.x, course.name).toBeGreaterThanOrEqual(0)
        expect(punkt.x, course.name).toBeLessThanOrEqual(FIELD_WIDTH)
        expect(punkt.y, course.name).toBeGreaterThanOrEqual(0)
        expect(punkt.y, course.name).toBeLessThanOrEqual(FIELD_HEIGHT)
      }
    }
  })

  it('lässt jede Gefahrenfläche eine Brücke frei', () => {
    const lavatal = courseAt(4)
    for (const hazard of lavatal.hazards) {
      const deckt = hazard.x <= 15 && hazard.x + hazard.width >= 85
      expect(deckt, 'Die Lava sperrt die ganze Breite').toBe(false)
    }
  })

  it('klemmt Bahnen außerhalb des Bereichs', () => {
    expect(courseAt(0).number).toBe(1)
    expect(courseAt(99).number).toBe(COURSE_COUNT)
  })

  it('schaltet immer genau eine Bahn über der höchsten beendeten frei', () => {
    expect(unlockedCourses(0)).toBe(1)
    expect(unlockedCourses(3)).toBe(4)
    expect(unlockedCourses(COURSE_COUNT)).toBe(COURSE_COUNT)
  })
})

describe('Schläge', () => {
  it('zählt jeden Schlag und setzt den Ball in Bewegung', () => {
    const nach = shoot(createGame(1, 0), vec(0, -1), 0.5)
    expect(nach.strokes).toBe(1)
    expect(nach.moving).toBe(true)
    expect(length(nach.ball.velocity)).toBeCloseTo(MAX_SHOT_SPEED * 0.5)
  })

  it('nimmt keinen Schlag an, solange der Ball rollt', () => {
    const rollend = shoot(createGame(1, 0), vec(0, -1), 0.6)
    expect(shoot(rollend, vec(0, -1), 0.6).strokes).toBe(1)
  })

  it('ignoriert Kraft null und Richtung null', () => {
    const spiel = createGame(1, 0)
    expect(shoot(spiel, vec(0, -1), 0).strokes).toBe(0)
    expect(shoot(spiel, vec(0, 0), 0.5).strokes).toBe(0)
  })

  it('klemmt die Kraft auf höchstens eins', () => {
    const nach = shoot(createGame(1, 0), vec(0, -1), 5)
    expect(length(nach.ball.velocity)).toBeCloseTo(MAX_SHOT_SPEED)
  })

  it('bringt den Ball auf jeder Bahn zur Ruhe — und zwar innerhalb der Bande', () => {
    for (const course of COURSES) {
      for (const richtung of [vec(0, -1), vec(1, -1), vec(-1, -1), vec(1, 0), vec(0, 1)]) {
        const nach = shootAndSettle(createGame(course.number, 0), richtung, 1)
        expect(nach.moving, `${course.name}: Ball rollt ewig`).toBe(false)
        expect(
          insidePolygon(nach.ball.position, course.boundary) || nach.holed,
          `${course.name}: Ball liegt außerhalb`,
        ).toBe(true)
      }
    }
  })
})

describe('Einlochen', () => {
  /** Setzt den Ball direkt vors Loch und schiebt ihn hinein. */
  function nearHole(courseNumber: number, offset: { x: number; y: number }): GameState {
    const course = courseAt(courseNumber)
    const spiel = createGame(courseNumber, 0)
    return {
      ...spiel,
      ball: { position: vec(course.hole.x + offset.x, course.hole.y + offset.y), velocity: vec(0, 0) },
      lastRest: vec(course.hole.x + offset.x, course.hole.y + offset.y),
    }
  }

  it('nimmt einen langsam heranrollenden Ball auf', () => {
    const nach = shootAndSettle(nearHole(3, { x: 0, y: 14 }), vec(0, -1), 0.2)
    expect(nach.holed).toBe(true)
    expect(nach.strokes).toBe(1)
  })

  it('lässt einen zu schnellen Ball über das Loch springen', () => {
    const nach = shootAndSettle(nearHole(3, { x: 0, y: 40 }), vec(0, -1), 1)
    expect(nach.holed).toBe(false)
  })

  it('erkennt das Loch auch zwischen zwei Rechenschritten', () => {
    // Bei knapp erlaubtem Tempo legt der Ball je Schritt mehr zurück als der
    // Lochradius — geprüft wird darum die Strecke, nicht nur der Endpunkt.
    const course = courseAt(3)
    const spiel: GameState = {
      ...createGame(3, 0),
      ball: { position: vec(course.hole.x, course.hole.y + 25), velocity: vec(0, 0) },
    }
    const nach = shootAndSettle(spiel, vec(0, -1), 0.33)
    expect(nach.holed).toBe(true)
  })

  it('meldet ein Hole in One nur beim ersten Schlag', () => {
    const eins = shootAndSettle(nearHole(3, { x: 0, y: 14 }), vec(0, -1), 0.2)
    expect(isHoleInOne(eins)).toBe(true)

    const zwei = shootAndSettle({ ...eins, holed: false, moving: false, strokes: 1 }, vec(0, -1), 0.2)
    expect(isHoleInOne(zwei)).toBe(false)
  })
})

describe('Gefahrenflächen', () => {
  it('setzt den Ball zurück und kostet einen Strafschlag', () => {
    const spiel = createGame(4, 0) // Lavatal
    const nach = shootAndSettle(spiel, vec(0, -1), 0.85)

    expect(nach.penalties).toBe(1)
    // Ein Schlag plus ein Strafschlag
    expect(nach.strokes).toBe(2)
    expect(nach.ball.position).toEqual(spiel.ball.position)
  })

  it('lässt die Brücke passieren', () => {
    // Rechts an der ersten Lava vorbei: dort ist die Brücke
    const nach = shootAndSettle(createGame(4, 0), vec(0.28, -1), 0.75)
    expect(nach.penalties).toBe(0)
    expect(nach.ball.position.y).toBeLessThan(100)
  })
})

describe('Schlaggrenze', () => {
  it('erlaubt Par plus fünf Schläge', () => {
    expect(maxStrokes(courseAt(1))).toBe(3 + STROKE_ALLOWANCE)
    expect(maxStrokes(courseAt(4))).toBe(5 + STROKE_ALLOWANCE)
  })

  it('verliert die Bahn, wenn die Grenze gerissen ist', () => {
    let spiel = createGame(1, 0)
    for (let i = 0; i < maxStrokes(courseAt(1)) + 2 && !spiel.lost && !spiel.holed; i++) {
      // Winzige Schläge in eine Ecke — so wird das Loch nie getroffen
      spiel = shootAndSettle(spiel, vec(-1, 1), 0.05)
    }
    expect(spiel.lost).toBe(true)
    expect(spiel.holed).toBe(false)
    expect(spiel.strokes).toBe(maxStrokes(courseAt(1)))
  })

  it('nimmt nach dem Verlust keinen Schlag mehr an', () => {
    const verloren: GameState = { ...createGame(1, 0), lost: true }
    expect(shoot(verloren, vec(0, -1), 1).strokes).toBe(0)
  })
})

describe('Wertung', () => {
  function holed(courseNumber: number, strokes: number): GameState {
    return { ...createGame(courseNumber, 0), strokes, holed: true }
  }

  it('gibt drei Sterne für Par oder besser', () => {
    expect(starsFor(holed(1, 1))).toBe(3)
    expect(starsFor(holed(1, 3))).toBe(3)
  })

  it('gibt zwei Sterne für einen Schlag über Par und einen darüber hinaus', () => {
    expect(starsFor(holed(1, 4))).toBe(2)
    expect(starsFor(holed(1, 5))).toBe(1)
    expect(starsFor(holed(1, 8))).toBe(1)
  })

  it('gibt keine Sterne, wenn die Bahn nicht beendet wurde', () => {
    expect(starsFor({ ...createGame(1, 0), lost: true })).toBe(0)
  })

  it('belohnt wenige Schläge, ein Hole in One und die höhere Bahn', () => {
    expect(finalScore(holed(1, 3))).toBeGreaterThan(finalScore(holed(1, 6)))
    expect(finalScore(holed(1, 1))).toBeGreaterThan(finalScore(holed(1, 2)) + 500)
    expect(finalScore(holed(6, 4))).toBeGreaterThan(finalScore(holed(1, 4)))
  })

  it('gibt null Punkte, wenn nicht eingelocht wurde', () => {
    expect(finalScore({ ...createGame(1, 0), lost: true, strokes: 8 })).toBe(0)
  })
})

describe('Bahnen sind spielbar', () => {
  /**
   * Sucht auf jeder Bahn eine Schlagfolge, die einlocht. Kein Beweis, dass sie
   * leicht ist — aber der Nachweis, dass sie überhaupt zu schaffen ist.
   */
  function trySolve(course: Course): { holed: boolean; strokes: number } {
    // Bewusst grob abgetastet: Eine feinere Suche kostet Minuten Rechenzeit und
    // beantwortet dieselbe Frage — geht es überhaupt?
    const winkel = Array.from({ length: 24 }, (_, i) => (i * Math.PI * 2) / 24)
    const kraefte = [0.3, 0.55, 0.8, 1]

    // Gierige Suche: je Schlag die Kombination nehmen, die dem Loch am nächsten kommt
    let spiel = createGame(course.number, 0)
    while (!spiel.holed && !spiel.lost) {
      let bester: GameState | null = null
      let besterAbstand = Infinity

      for (const winkelWert of winkel) {
        const richtung = vec(Math.cos(winkelWert), Math.sin(winkelWert))
        for (const kraft of kraefte) {
          const nach = shootAndSettle(spiel, richtung, kraft)
          if (nach.holed) return { holed: true, strokes: nach.strokes }
          const abstand = distance(nach.ball.position, course.hole)
          if (abstand < besterAbstand) {
            besterAbstand = abstand
            bester = nach
          }
        }
      }

      if (!bester) break
      spiel = bester
    }
    return { holed: spiel.holed, strokes: spiel.strokes }
  }

  for (const course of COURSES) {
    it(`Bahn ${course.number} — ${course.name} lässt sich einlochen`, () => {
      const ergebnis = trySolve(course)
      expect(ergebnis.holed, `${course.name}: kein Weg ins Loch gefunden`).toBe(true)
      expect(
        ergebnis.strokes,
        `${course.name}: braucht ${ergebnis.strokes} Schläge, erlaubt sind ${maxStrokes(course)}`,
      ).toBeLessThanOrEqual(maxStrokes(course))
    })
  }
})
