import { asset } from '../../../content/assets'
import { vec, type Circle, type Rect, type Vec } from './physics'

/**
 * Die sechs Bahnen (docs/01-gamedesign.md, Abschnitt 6). Reine Daten — die
 * Physik in `physics.ts` kennt keine einzelne Bahn.
 *
 * Spielfeld: 100 × 160 Einheiten im Hochformat. Der Ball startet unten, das
 * Loch liegt oben — wie auf den Mockups.
 */

export const FIELD_WIDTH = 100
export const FIELD_HEIGHT = 160
export const HOLE_RADIUS = 3.5

/** Grundwerte, von denen einzelne Bahnen abweichen. */
export const DEFAULT_FRICTION = 0.25
export const DEFAULT_RESTITUTION = 0.72

export interface Course {
  number: number
  name: string
  par: number
  /** Kulisse aus den Konzeptbildern */
  bg: string
  /** Fynnox' Spruch zur Bahn — wörtlich aus docs/referenzen/spiele-detail-und-bahnen.png */
  hint: string
  start: Vec
  hole: Vec
  /** Geschlossener Linienzug; jede Kante ist eine Bande */
  boundary: readonly Vec[]
  obstacles: readonly Circle[]
  /** Lava oder Wasser: zurück an die letzte Ruheposition, ein Strafschlag */
  hazards: readonly Rect[]
  /** Zonen mit eigener Beschleunigung */
  updrafts: readonly (Rect & { force: Vec })[]
  wind: Vec
  friction: number
}

export const COURSES: readonly Course[] = [
  {
    number: 1,
    name: 'Sonnenwald',
    par: 3,
    bg: asset('bg/sonnenwald.jpg'),
    hint: 'Achte auf die Hindernisse und den Wind!',
    // Knick nach rechts: unten ein Korridor, oben eine breite Fläche
    boundary: [vec(20, 150), vec(20, 20), vec(80, 20), vec(80, 60), vec(55, 60), vec(55, 150)],
    start: vec(37, 138),
    hole: vec(70, 40),
    obstacles: [{ center: vec(37, 95), radius: 7 }],
    hazards: [],
    updrafts: [],
    wind: vec(6, 0),
    friction: DEFAULT_FRICTION,
  },
  {
    number: 2,
    name: 'Piratenbucht',
    par: 4,
    bg: asset('bg/piratenbucht.jpg'),
    hint: 'Hier weht der Wind stark! Plane gut!',
    boundary: [
      vec(15, 150),
      vec(15, 95),
      vec(85, 95),
      vec(85, 20),
      vec(55, 20),
      vec(55, 65),
      vec(45, 65),
      vec(45, 150),
    ],
    start: vec(30, 138),
    hole: vec(70, 35),
    obstacles: [{ center: vec(68, 78), radius: 6 }],
    hazards: [],
    // Der Wind drückt nach links, das Ziel liegt rechts — genau das ist der Kniff
    wind: vec(-14, 0),
    updrafts: [],
    friction: DEFAULT_FRICTION,
  },
  {
    number: 3,
    name: 'Kristallhöhle',
    par: 3,
    bg: asset('bg/kristallhoehle.jpg'),
    hint: 'Die Kristalle verändern die Richtung!',
    boundary: [vec(35, 150), vec(35, 20), vec(65, 20), vec(65, 150)],
    start: vec(50, 140),
    hole: vec(50, 32),
    // Über 1 gibt der Kristall mehr Schwung zurück, als er annimmt
    obstacles: [
      { center: vec(41, 112), radius: 5, restitution: 1.05 },
      { center: vec(59, 84), radius: 5, restitution: 1.05 },
      { center: vec(43, 56), radius: 5, restitution: 1.05 },
    ],
    hazards: [],
    updrafts: [],
    wind: vec(0, 0),
    friction: DEFAULT_FRICTION,
  },
  {
    number: 4,
    name: 'Lavatal',
    par: 5,
    bg: asset('bg/lavatal.jpg'),
    hint: 'Vorsicht heiß! Nutze die Brücken!',
    boundary: [vec(15, 155), vec(15, 10), vec(85, 10), vec(85, 155)],
    start: vec(50, 145),
    hole: vec(50, 25),
    obstacles: [],
    // Die Lava lässt je eine schmale Brücke frei — erst rechts, dann links
    hazards: [
      { x: 15, y: 100, width: 45, height: 13 },
      { x: 40, y: 55, width: 45, height: 13 },
    ],
    updrafts: [],
    wind: vec(0, 0),
    friction: DEFAULT_FRICTION,
  },
  {
    number: 5,
    name: 'Wolkeninsel',
    par: 3,
    bg: asset('bg/wolkeninsel.jpg'),
    hint: 'Die Wolken tragen dich hoch hinaus!',
    boundary: [vec(25, 150), vec(25, 15), vec(75, 15), vec(75, 150)],
    start: vec(50, 140),
    hole: vec(50, 28),
    obstacles: [{ center: vec(50, 105), radius: 6 }],
    hazards: [],
    // Trägt einen zu schwachen Schlag doch noch nach oben
    updrafts: [{ x: 25, y: 55, width: 50, height: 35, force: vec(0, -90) }],
    wind: vec(0, 0),
    friction: DEFAULT_FRICTION,
  },
  {
    number: 6,
    name: 'Wintergipfel',
    par: 4,
    bg: asset('bg/wintergipfel.jpg'),
    hint: 'Rutschige Bahn! Harte, aber faire Herausforderung!',
    // Zickzack: unten quer, links hoch, in der Mitte quer, rechts hoch
    boundary: [
      vec(15, 150),
      vec(15, 50),
      vec(55, 50),
      vec(55, 15),
      vec(85, 15),
      vec(85, 80),
      vec(45, 80),
      vec(45, 120),
      vec(85, 120),
      vec(85, 150),
    ],
    start: vec(65, 138),
    hole: vec(70, 30),
    obstacles: [],
    hazards: [],
    updrafts: [],
    wind: vec(0, 0),
    // Eis: Die Geschwindigkeit sinkt je Sekunde nur auf 60 %, der Ball rollt weit
    friction: 0.6,
  },
]

export const COURSE_COUNT = COURSES.length

/** Klemmt auf den gültigen Bereich — ein Spielstand darf nie ins Leere zeigen. */
export function courseAt(number: number): Course {
  const index = Math.min(COURSES.length, Math.max(1, Math.floor(number))) - 1
  return COURSES[index]
}

/**
 * Welche Bahn als höchste gespielt werden darf. Freigeschaltet wird durch das
 * **Einlochen**, darum steht in `highestLevel` die höchste beendete Bahn.
 */
export function unlockedCourses(highestLevel: number): number {
  return Math.min(COURSE_COUNT, Math.max(1, highestLevel + 1))
}
