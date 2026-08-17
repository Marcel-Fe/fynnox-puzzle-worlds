/**
 * Ballphysik für Fynnox Minigolf (docs/01-gamedesign.md, Abschnitt 6).
 *
 * Frei von React, ohne Uhr und ohne Zufall — die verstrichene Zeit wird von
 * außen hereingegeben. Bewusst ohne Engine: Es braucht Kreis-gegen-Strecke,
 * Reflexion und Reibung, sonst nichts.
 */

export interface Vec {
  x: number
  y: number
}

export const vec = (x: number, y: number): Vec => ({ x, y })
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec, f: number): Vec => ({ x: a.x * f, y: a.y * f })
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y
export const length = (a: Vec): number => Math.hypot(a.x, a.y)
export const distance = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y)

export function normalize(a: Vec): Vec {
  const len = length(a)
  return len === 0 ? vec(0, 0) : scale(a, 1 / len)
}

/** Spiegelt `v` an einer Fläche mit der Normalen `n` und dämpft dabei. */
export function reflect(v: Vec, n: Vec, restitution: number): Vec {
  const unit = normalize(n)
  const along = dot(v, unit)
  // v - 2(v·n)n ist die reine Spiegelung; der Verlust wirkt nur auf den Anteil
  // senkrecht zur Wand, sonst würde ein Streifschuss unnatürlich abgebremst.
  const bounced = sub(v, scale(unit, along * (1 + restitution)))
  return bounced
}

/** Der Punkt auf der Strecke a–b, der `p` am nächsten liegt. */
export function closestPointOnSegment(p: Vec, a: Vec, b: Vec): Vec {
  const ab = sub(b, a)
  const lengthSq = dot(ab, ab)
  if (lengthSq === 0) return a
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / lengthSq))
  return add(a, scale(ab, t))
}

export interface Circle {
  center: Vec
  radius: number
  /** Abweichender Abprallwert, z. B. die Kristalle in Bahn 3 */
  restitution?: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function insideRect(p: Vec, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

/**
 * Liegt der Punkt innerhalb des Linienzugs? Strahlverfahren: Ein Strahl nach
 * rechts schneidet eine geschlossene Kontur genau dann ungerade oft, wenn der
 * Punkt innen liegt.
 */
export function insidePolygon(p: Vec, polygon: readonly Vec[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses = a.y > p.y !== b.y > p.y
    if (crosses && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Die Bande als einzelne Strecken — jede Kante des Linienzugs. */
export function polygonSegments(polygon: readonly Vec[]): [Vec, Vec][] {
  return polygon.map((point, i) => [point, polygon[(i + 1) % polygon.length]] as [Vec, Vec])
}

export interface Ball {
  position: Vec
  velocity: Vec
}

export interface Field {
  /** Geschlossener Linienzug; alle Kanten sind Banden */
  boundary: readonly Vec[]
  obstacles: readonly Circle[]
  /** Anteil der Geschwindigkeit, der nach einer Sekunde übrig ist */
  friction: number
  /** Dauerhafte Beschleunigung, z. B. Wind */
  wind: Vec
  /** Zonen mit eigener Beschleunigung, z. B. der Aufwind auf der Wolkeninsel */
  updrafts: readonly (Rect & { force: Vec })[]
  restitution: number
}

export const BALL_RADIUS = 2
/** Unter dieser Geschwindigkeit gilt der Ball als liegend */
export const REST_SPEED = 1.5
/**
 * Ab dieser Geschwindigkeit greift der Wind voll an; darunter anteilig.
 *
 * Ohne diese Abschwächung findet sich der Wind mit der Reibung bei einer festen
 * Geschwindigkeit — bei Windstärke 6 sind das rund 4,3 Einheiten/s und damit
 * über der Ruhegrenze. Der Ball käme nie zum Stehen, sondern kröche bis an die
 * Bande in Windrichtung und bliebe dort kleben. Mit dem Anteil gewinnt die
 * Reibung immer, sobald der Ball langsam wird: Ein schneller Ball wird vom Wind
 * abgetrieben, ein auslaufender bleibt liegen.
 */
export const WIND_FULL_SPEED = 25

/**
 * Ein Rechenschritt. `dt` ist bewusst klein und fest (siehe `STEP_SECONDS`):
 * Bei großen Schritten legt ein schneller Ball in einem Sprung mehr zurück, als
 * die Bande dick ist, und fliegt hindurch.
 */
export function step(ball: Ball, field: Field, dt: number): Ball {
  let velocity = ball.velocity

  const speed = length(velocity)
  if (speed >= REST_SPEED) {
    // Anteilig, siehe WIND_FULL_SPEED: sonst hält der Wind den Ball ewig in Fahrt.
    const windShare = Math.min(1, speed / WIND_FULL_SPEED)
    velocity = add(velocity, scale(field.wind, dt * windShare))

    // Der Aufwind wirkt voll — er endet ohnehin an der Zonengrenze und kann den
    // Ball darum nicht endlos treiben. Genau darauf beruht die Wolkeninsel.
    for (const zone of field.updrafts) {
      if (insideRect(ball.position, zone)) velocity = add(velocity, scale(zone.force, dt))
    }
  }

  // Reibung als Zerfall statt als fester Abzug — sonst hinge die Bremswirkung
  // an der Schrittweite statt an der Zeit.
  velocity = scale(velocity, Math.pow(field.friction, dt))

  let position = add(ball.position, scale(velocity, dt))

  for (const obstacle of field.obstacles) {
    const gap = distance(position, obstacle.center) - (obstacle.radius + BALL_RADIUS)
    if (gap >= 0) continue
    const normal = normalize(sub(position, obstacle.center))
    // Erst herausschieben, dann spiegeln: Bleibt der Ball im Hindernis stecken,
    // dreht sich die Geschwindigkeit im nächsten Schritt gleich wieder um.
    position = add(obstacle.center, scale(normal, obstacle.radius + BALL_RADIUS))
    velocity = reflect(velocity, normal, obstacle.restitution ?? field.restitution)
  }

  for (const [a, b] of polygonSegments(field.boundary)) {
    const nearest = closestPointOnSegment(position, a, b)
    const away = sub(position, nearest)
    const gap = length(away)
    if (gap >= BALL_RADIUS) continue

    // Am Eckpunkt zweier Kanten fällt `away` auf null; dann zeigt die Normale
    // der Kante die Richtung an.
    const normal =
      gap === 0 ? normalize(vec(-(b.y - a.y), b.x - a.x)) : normalize(away)
    position = add(nearest, scale(normal, BALL_RADIUS))
    velocity = reflect(velocity, normal, field.restitution)
  }

  return { position, velocity }
}

export function atRest(ball: Ball): boolean {
  return length(ball.velocity) < REST_SPEED
}
