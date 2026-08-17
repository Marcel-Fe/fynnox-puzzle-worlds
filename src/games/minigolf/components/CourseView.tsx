import { HOLE_RADIUS, type Course } from '../logic/courses'
import { BALL_RADIUS, type Vec } from '../logic/physics'

/**
 * Darstellung einer Minigolf-Bahn in 2,5D
 * (docs/01-gamedesign.md, Abschnitt 6, „Ansicht").
 *
 * **Reine Darstellung.** Physik, Bahnendaten und Bedienung liegen woanders.
 * Gerechnet wird weiter in der flachen Welt aus `courses.ts` (100 × 160
 * Einheiten); hier wird sie nur projiziert.
 *
 * ## Die Projektion
 *
 * Die Bahn liegt nicht mehr flach vor dem Spieler, sondern ist nach hinten
 * gekippt. Das ist eine schiefe Parallelprojektion — die einfachste Bauart, die
 * echte Tiefe erzeugt:
 *
 * ```
 * Bildschirm-X = Welt-X
 * Bildschirm-Y = Welt-Y × TILT − Höhe
 * ```
 *
 * Tiefe wird also gestaucht, Höhe geht direkt nach oben. Beides ist umkehrbar,
 * darum kann das Zielen weiterhin punktgenau zurückgerechnet werden
 * (`screenToWorld`) — ohne die Physik anzufassen.
 *
 * Keine Fluchtpunktperspektive: Bei ihr hinge die Ballgröße von der Tiefe ab,
 * und ein Schlag ans obere Feldende sähe schwächer aus als derselbe Schlag
 * unten. Die Parallelprojektion hält Längen über das ganze Feld gleich.
 *
 * ## Woraus der Körper entsteht
 *
 * Jede Kante des `boundary`-Polygons wird zu einer senkrechten Wandfläche vom
 * Boden bis zur Bandenhöhe, dazu eine Platte darunter, die der Bahn Dicke gibt.
 * Gezeichnet wird von hinten nach vorn (Malerreihenfolge), damit die vordere
 * Bande den Rasen dahinter verdeckt — genau das erzeugt den räumlichen Eindruck.
 *
 * Die Helligkeit jeder Wand kommt aus ihrer Ausrichtung zum Licht, das wie
 * überall in der App von oben links fällt.
 */

/** Stauchung der Tiefe. 1 wäre die alte flache Draufsicht. */
const TILT = 0.72
/**
 * Höhe der Bande über dem Rasen, in Welteinheiten.
 *
 * Bewusst niedrig: Eine echte Minigolfbande ist gut zehn Zentimeter hoch bei
 * sechs Metern Bahn. Zu hoch gezeichnet sieht die Bahn aus wie ein Kasten,
 * und die hintere Innenwand frisst das halbe Spielfeld.
 */
const WALL_H = 5
/** Dicke der Bande in der Draufsicht — sie steht als Wall um den Rasen. */
const WALL_T = 5.5
/** Dicke der Platte, auf der die Bahn liegt. */
const BASE_H = 12
/** Wie hoch die Fahnenstange über dem Loch steht. */
const FLAG_H = 34
/** Luft ringsum, damit nichts an der Kante klebt. */
const PAD = 7
/**
 * Breite zu Höhe des Rahmens.
 *
 * Nötig, weil die Bahnen sehr verschiedene Formen haben: Bahn 3 ist ein
 * schmaler Schlauch, Bahn 4 fast quadratisch. Ohne festes Verhältnis würde die
 * eine Bahn hoch und dünn erscheinen und die andere breit — und der Rahmen im
 * Bildschirm spränge bei jedem Wechsel in der Höhe.
 */
const ASPECT = 0.8

/** Licht von oben links — dieselbe Richtung wie in der übrigen Oberfläche. */
const LIGHT = { x: -0.55, y: -0.84 }

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Rahmen um genau diese Bahn statt um das ganze 100 × 160-Feld.
 *
 * Die Bahnen nutzen nur einen Ausschnitt davon — Bahn 1 etwa liegt zwischen
 * x = 20 und x = 80. Über das volle Feld gezeichnet bliebe links und rechts
 * die Hälfte des Bildschirms leer, und die Bahn wirkte wie ein Spielzeug in
 * einer zu großen Kiste.
 */
export function viewBoxFor(course: Course): ViewBox {
  const xs = course.boundary.map((p) => p.x)
  const ys = course.boundary.map((p) => p.y)

  // WALL_T, weil der Wall nach außen über das Polygon hinausragt.
  const left = Math.min(...xs) - WALL_T - PAD
  const right = Math.max(...xs) + WALL_T + PAD
  // Oben begrenzt entweder die Bandenkrone oder die Fahnenspitze.
  const top =
    Math.min(projectY(Math.min(...ys) - WALL_T, WALL_H), projectY(course.hole.y, FLAG_H)) - PAD
  const bottom = projectY(Math.max(...ys) + WALL_T, -BASE_H) + PAD

  let width = right - left
  let height = bottom - top
  if (width / height < ASPECT) width = height * ASPECT
  else height = width / ASPECT

  return {
    // Auf die gewachsene Fläche zentrieren, damit die Bahn mittig steht.
    x: (left + right) / 2 - width / 2,
    y: (top + bottom) / 2 - height / 2,
    width,
    height,
  }
}

// ---------------------------------------------------------------- Projektion

function projectY(y: number, height = 0): number {
  return y * TILT - height
}

function point(v: Vec, height = 0): string {
  return `${v.x},${projectY(v.y, height)}`
}

/**
 * Rechnet einen Punkt der Zeichenfläche in Weltkoordinaten zurück.
 *
 * Gegenstück zur Projektion und der Grund, warum das Zielen unverändert
 * funktioniert: Ein Tippen landet exakt dort, wo die Physik es erwartet.
 */
export function screenToWorld(
  offsetX: number,
  offsetY: number,
  box: { width: number; height: number },
  view: ViewBox,
): Vec {
  const sx = view.x + (offsetX / box.width) * view.width
  const sy = view.y + (offsetY / box.height) * view.height
  return { x: sx, y: sy / TILT }
}

// ------------------------------------------------------------------ Geometrie

interface Edge {
  a: Vec
  b: Vec
  /** Nach außen zeigende Normale in der Weltebene */
  normal: Vec
  /** Tiefe der Kantenmitte — bestimmt die Zeichenreihenfolge */
  depth: number
}

/**
 * Zerlegt das Bahnpolygon in Kanten mit Außennormale.
 *
 * Die Umlaufrichtung wird gemessen statt angenommen: `courses.ts` legt sie
 * nirgends fest, und bei falscher Annahme zeigten alle Wände nach innen —
 * die Bahn sähe aus wie ein Loch statt wie eine Schüssel.
 */
function edgesOf(boundary: readonly Vec[]): Edge[] {
  let area = 0
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i]
    const b = boundary[(i + 1) % boundary.length]
    area += a.x * b.y - b.x * a.y
  }
  /*
   * `> 0` und nicht `< 0`: Die Flächenformel misst die Umlaufrichtung in einem
   * Koordinatensystem, dessen Y-Achse nach oben zeigt. Hier zeigt sie nach
   * unten, also dreht sich das Vorzeichen um.
   *
   * Beim falschen Vorzeichen zeigen alle Normalen nach innen — dann hält die
   * Zeichnung die obere Bande für die vordere und legt ihre Außenwand als
   * Balken quer über das Feld.
   */
  const clockwise = area > 0

  return boundary.map((a, i) => {
    const b = boundary[(i + 1) % boundary.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    // Senkrechte auf der Kante; das Vorzeichen dreht sich mit der Umlaufrichtung.
    const nx = clockwise ? dy / len : -dy / len
    const ny = clockwise ? -dx / len : dx / len
    return { a, b, normal: { x: nx, y: ny }, depth: (a.y + b.y) / 2 }
  })
}

/**
 * Helligkeit einer senkrechten Fläche, 0 = im Schatten, 1 = voll beleuchtet.
 *
 * Der Sockelwert von 0,3 ist Streulicht: Eine vom Licht abgewandte Wand ist
 * im Freien nie schwarz, sie bekommt Himmel und Umgebung ab. Ohne ihn wurde
 * die vordere Bande zu einem fast schwarzen Balken.
 */
function lightOn(normal: Vec): number {
  const facing = normal.x * LIGHT.x + normal.y * LIGHT.y
  return 0.3 + 0.7 * Math.max(0, facing * 0.5 + 0.5) ** 1.6
}

/**
 * Verschiebt ein Polygon um `distance` nach außen.
 *
 * Jede Ecke wandert entlang der Winkelhalbierenden ihrer beiden Kanten, und
 * zwar so weit, dass beide versetzten Kanten sich dort treffen — sonst klaffte
 * die Bande an jeder Ecke auf. Der Deckel bei 0,35 fängt sehr spitze Winkel ab,
 * an denen die Rechnung ins Unendliche liefe.
 */
function offsetOutward(boundary: readonly Vec[], distance: number, edges: Edge[]): Vec[] {
  const n = boundary.length
  return boundary.map((p, i) => {
    const before = edges[(i - 1 + n) % n].normal
    const after = edges[i].normal
    let bx = before.x + after.x
    let by = before.y + after.y
    const len = Math.hypot(bx, by)
    if (len < 1e-6) return p
    bx /= len
    by /= len
    const cos = Math.max(0.35, bx * before.x + by * before.y)
    return { x: p.x + (bx * distance) / cos, y: p.y + (by * distance) / cos }
  })
}

/** Mischt zwei Farben; `t` = 0 gibt die erste, 1 die zweite. */
function mix(dark: [number, number, number], light: [number, number, number], t: number): string {
  const c = dark.map((d, i) => Math.round(d + (light[i] - d) * t))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

const WOOD_DARK: [number, number, number] = [92, 62, 30]
const WOOD_LIGHT: [number, number, number] = [242, 216, 170]
const STONE_DARK: [number, number, number] = [38, 30, 24]
const STONE_LIGHT: [number, number, number] = [120, 99, 78]

// ------------------------------------------------------------------ Bausteine

export function CourseView({
  course,
  ball,
  aimTarget,
  moving,
  onAim,
}: {
  course: Course
  ball: Vec
  aimTarget: Vec | null
  moving: boolean
  onAim(point: Vec): void
}) {
  const edges = edgesOf(course.boundary)
  const outer = offsetOutward(course.boundary, WALL_T, edges)

  // Jede Kante wird zu einem Bandenstück. Die Stücke, deren Außenseite nach
  // unten zeigt, stehen vor dem Rasen und verdecken ihn — genau daraus
  // entsteht der räumliche Eindruck. Alle übrigen liegen dahinter.
  const pieces = edges.map((edge, i) => ({
    edge,
    outerA: outer[i],
    outerB: outer[(i + 1) % outer.length],
  }))
  // Nach hinten zeigende Banden liegen im Bild über dem Rasen und kommen
  // davor. Alles Übrige — vorn und seitlich — überdeckt ihn und kommt danach.
  const back = pieces
    .filter((p) => p.edge.normal.y < -0.01)
    .sort((a, b) => a.edge.depth - b.edge.depth)
  const front = pieces
    .filter((p) => p.edge.normal.y >= -0.01)
    .sort((a, b) => a.edge.depth - b.edge.depth)

  const green = course.boundary.map((p) => point(p)).join(' ')
  const clipId = `golf-green-${course.number}`
  const view = viewBoxFor(course)

  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      className="relative block w-full touch-none"
      onPointerDown={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        onAim(screenToWorld(event.clientX - box.left, event.clientY - box.top, box, view))
      }}
      role="application"
      aria-label={`Spielfeld ${course.name}. Tippe, um zu zielen.`}
    >
      <Defs clipId={clipId} green={green} view={view} />

      {/* Schatten, den die ganze Bahn auf den Untergrund wirft */}
      <polygon
        points={outer.map((p) => point(p, -BASE_H)).join(' ')}
        fill="#000"
        opacity={0.55}
        transform="translate(4 6)"
        filter="url(#golf-soft)"
      />

      {/* Bandenstücke hinten: hier blickt man in die Bahn hinein */}
      {back.map((piece, i) => (
        <WallPiece key={`back-${i}`} piece={piece} />
      ))}

      {/* Der Rasen — Kunstrasen, wie ihn eine echte Minigolfbahn hat */}
      <polygon points={green} fill="url(#golf-green)" />
      <g clipPath={`url(#${clipId})`}>
        {/* Filzstruktur aus feinem Rauschen. Der Seed steht fest, damit die
            Fläche bei jedem Aufruf identisch aussieht (CLAUDE.md: kein Zufall
            ohne Seed) — und damit der Browser sie einmal rechnen kann. */}
        <rect
          x={view.x}
          y={view.y}
          width={view.width}
          height={view.height}
          filter="url(#golf-turf)"
        />
        {/* Halmstruktur: kurze Striche in Fallrichtung des Mähers */}
        <rect
          x={view.x}
          y={view.y}
          width={view.width}
          height={view.height}
          fill="url(#golf-blades)"
        />
        {/* Mähbahnen — hell und dunkel im Wechsel, wie frisch gewalzt */}
        <rect
          x={view.x}
          y={view.y}
          width={view.width}
          height={view.height}
          fill="url(#golf-stripes)"
        />
        {/* Die Bande wirft Schatten auf den Rasen */}
        <polygon
          points={green}
          fill="none"
          stroke="#022c14"
          strokeWidth={9}
          opacity={0.5}
          filter="url(#golf-soft)"
        />
      </g>

      <Hazards course={course} clipId={clipId} />
      <Updrafts course={course} clipId={clipId} />
      <Hole hole={course.hole} />

      {course.obstacles.map((o, i) =>
        o.restitution ? (
          <Crystal key={i} center={o.center} radius={o.radius} />
        ) : (
          <Boulder key={i} center={o.center} radius={o.radius} />
        ),
      )}

      {aimTarget && <AimLine from={ball} to={aimTarget} />}
      <Ball at={ball} moving={moving} />

      {/* Bandenstücke vorn: sie verdecken den Rasen dahinter — daher der Raum */}
      {front.map((piece, i) => (
        <WallPiece key={`front-${i}`} piece={piece} />
      ))}

      {/* Die Fahne steht immer innerhalb der Bahn und damit vor jeder Wand */}
      <Flag hole={course.hole} />
    </svg>
  )
}

interface WallPieceData {
  edge: Edge
  outerA: Vec
  outerB: Vec
}

/**
 * Ein Stück Bande: Außenwand, Krone und Innenwand.
 *
 * Das ist der Unterschied zwischen einem gezeichneten Rahmen und einem Wall,
 * um den herum man sehen kann. Alle drei Flächen bekommen ihre Helligkeit aus
 * derselben Lichtrichtung — die Krone am meisten, weil sie nach oben zeigt.
 */
function WallPiece({ piece }: { piece: WallPieceData }) {
  const { edge, outerA, outerB } = piece
  const light = lightOn(edge.normal)

  /*
   * Nur zeichnen, was man von hier aus sehen kann.
   *
   * Von einer nach hinten zeigenden Bande sieht man die Innenseite, von einer
   * nach vorn zeigenden die Außenseite — nie beides. Werden trotzdem beide
   * gezeichnet, legt sich die abgewandte Fläche als brauner Balken quer über
   * das Spielfeld.
   *
   * Seitliche Banden zeigen weder vor noch zurück: Ihre Wandflächen sind in
   * dieser Projektion exakt kantig zum Betrachter und damit unendlich schmal.
   * Von ihnen bleibt allein die Krone übrig, und genau die genügt.
   */
  const facesViewer = edge.normal.y > 0.01
  const facesAway = edge.normal.y < -0.01

  return (
    <g>
      {facesViewer && (
        <polygon
          points={[
            point(outerA, WALL_H),
            point(outerB, WALL_H),
            point(outerB, -BASE_H),
            point(outerA, -BASE_H),
          ].join(' ')}
          fill={mix(STONE_DARK, STONE_LIGHT, light)}
        />
      )}

      {/* Die Krone ist immer sichtbar und immer die hellste Fläche */}
      <polygon
        points={[
          point(edge.a, WALL_H),
          point(edge.b, WALL_H),
          point(outerB, WALL_H),
          point(outerA, WALL_H),
        ].join(' ')}
        fill={mix(WOOD_DARK, WOOD_LIGHT, 0.5 + 0.5 * light)}
      />

      {facesAway && (
        <polygon
          points={[
            point(edge.a),
            point(edge.b),
            point(edge.b, WALL_H),
            point(edge.a, WALL_H),
          ].join(' ')}
          fill={mix(WOOD_DARK, WOOD_LIGHT, light * 0.45)}
        />
      )}
    </g>
  )
}

function Defs({ clipId, green }: { clipId: string; green: string; view: ViewBox }) {
  return (
    <defs>
      <clipPath id={clipId}>
        <polygon points={green} />
      </clipPath>

      <linearGradient id="golf-green" x1="0" y1="0" x2="0.55" y2="1">
        <stop offset="0%" stopColor="#3aa85a" />
        <stop offset="50%" stopColor="#158b3f" />
        <stop offset="100%" stopColor="#0a642c" />
      </linearGradient>

      {/*
        Kunstrasen-Filz. `feTurbulence` erzeugt ein feines, unregelmäßiges
        Muster — dieselbe Technik, mit der Grafikprogramme Stoff und Filz
        andeuten. Ohne sie wäre die Fläche ein glatter Farbverlauf, und genau
        das ließ die Bahn nach Papier aussehen statt nach Rasen.

        `seed` ist festgesetzt: Das Muster muss auf jedem Gerät gleich sein.
      */}
      <filter id="golf-turf" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55 1.1" numOctaves={4} seed={11} />
        {/* Das Rauschen wird zu dunkelgrünen Flecken: Die drei Farbzeilen setzen
            den Ton, die vierte macht aus der Rauschhelligkeit die Deckkraft. */}
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.02
                  0 0 0 0 0.19
                  0 0 0 0 0.08
                  0 0 0 1.1 -0.15"
        />
      </filter>

      {/* Einzelne Halme, leicht geneigt — die Nahstruktur des Kunstrasens */}
      <pattern id="golf-blades" width="2.2" height="2.6" patternUnits="userSpaceOnUse">
        <path d="M0.5 2.6 L0.95 0.3" stroke="#4fd07a" strokeWidth={0.28} opacity={0.4} fill="none" />
        <path d="M1.7 2.6 L1.35 0.5" stroke="#04431d" strokeWidth={0.28} opacity={0.45} fill="none" />
      </pattern>

      {/* Mähbahnen quer zur Bahn: In der Kippung liest sich das als Fläche;
          längs gestreift sähe es aus wie liniertes Papier. */}
      <pattern id="golf-stripes" width="9" height="11" patternUnits="userSpaceOnUse">
        <rect width="9" height="5.5" fill="#ffffff" opacity={0.05} />
        <rect y="5.5" width="9" height="5.5" fill="#00250f" opacity={0.09} />
      </pattern>

      <linearGradient id="golf-crown" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stopColor="#fbecd0" />
        <stop offset="55%" stopColor="#e3cba0" />
        <stop offset="100%" stopColor="#b8905c" />
      </linearGradient>

      <radialGradient id="golf-ball" cx="0.33" cy="0.28" r="0.8">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="52%" stopColor="#edf1f5" />
        <stop offset="100%" stopColor="#9aa5b1" />
      </radialGradient>

      <radialGradient id="golf-hole" cx="0.5" cy="0.35" r="0.65">
        <stop offset="0%" stopColor="#000000" />
        <stop offset="70%" stopColor="#080603" />
        <stop offset="100%" stopColor="#2b1f12" />
      </radialGradient>

      <radialGradient id="golf-rock" cx="0.32" cy="0.26" r="0.85">
        <stop offset="0%" stopColor="#b5b0aa" />
        <stop offset="58%" stopColor="#726c66" />
        <stop offset="100%" stopColor="#423d38" />
      </radialGradient>

      <radialGradient id="golf-crystal" cx="0.34" cy="0.26" r="0.82">
        <stop offset="0%" stopColor="#f5d0fe" />
        <stop offset="52%" stopColor="#c026d3" />
        <stop offset="100%" stopColor="#6b1a72" />
      </radialGradient>

      <linearGradient id="golf-lava" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6b2410" />
        <stop offset="24%" stopColor="#ea580c" />
        <stop offset="50%" stopColor="#fde047" />
        <stop offset="76%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#6b2410" />
      </linearGradient>

      <linearGradient id="golf-updraft" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity={0} />
        <stop offset="100%" stopColor="#e0f2fe" stopOpacity={0.5} />
      </linearGradient>

      <linearGradient id="golf-flag" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#f05252" />
        <stop offset="100%" stopColor="#8f1616" />
      </linearGradient>

      <linearGradient id="golf-pole" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#d4d0cb" />
        <stop offset="100%" stopColor="#6e6862" />
      </linearGradient>

      <filter id="golf-soft" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>

      <filter id="golf-glow" x="-45%" y="-45%" width="190%" height="190%">
        <feGaussianBlur stdDeviation="2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

/** Lava: glühender Strom, an den Rändern erkaltet. Liegt flach auf dem Boden. */
function Hazards({ course, clipId }: { course: Course; clipId: string }) {
  if (course.hazards.length === 0) return null
  return (
    <g clipPath={`url(#${clipId})`}>
      {course.hazards.map((h, i) => {
        const top = projectY(h.y)
        const height = h.height * TILT
        return (
          <g key={i}>
            <rect
              x={h.x}
              y={top}
              width={h.width}
              height={height}
              fill="url(#golf-lava)"
              filter="url(#golf-glow)"
            />
            <rect
              x={h.x}
              y={top + height * 0.44}
              width={h.width}
              height={height * 0.12}
              fill="#fffbeb"
              opacity={0.8}
            />
            <rect x={h.x} y={top} width={h.width} height={1} fill="#1c1917" opacity={0.7} />
            <rect
              x={h.x}
              y={top + height - 1}
              width={h.width}
              height={1}
              fill="#1c1917"
              opacity={0.7}
            />
          </g>
        )
      })}
    </g>
  )
}

/** Aufwindzone samt Pfeilen in Wirkrichtung. */
function Updrafts({ course, clipId }: { course: Course; clipId: string }) {
  if (course.updrafts.length === 0) return null
  return (
    <g clipPath={`url(#${clipId})`}>
      {course.updrafts.map((z, i) => {
        const top = projectY(z.y)
        const height = z.height * TILT
        return (
          <g key={i}>
            <rect x={z.x} y={top} width={z.width} height={height} fill="url(#golf-updraft)" />
            {[0.25, 0.5, 0.75].map((f) => (
              <path
                key={f}
                d={`M ${z.x + z.width * f} ${top + height * 0.78}
                    l 0 ${-height * 0.5}
                    m -2.4 2.8 l 2.4 -2.8 l 2.4 2.8`}
                fill="none"
                stroke="#f0f9ff"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            ))}
          </g>
        )
      })}
    </g>
  )
}

/**
 * Das Loch liegt im Boden, also in der gekippten Ebene: Ein Kreis der Welt
 * erscheint darin als Ellipse, die genau um TILT gestaucht ist.
 */
function Hole({ hole }: { hole: Vec }) {
  const cy = projectY(hole.y)
  return (
    <g>
      <ellipse
        cx={hole.x}
        cy={cy}
        rx={HOLE_RADIUS + 0.6}
        ry={(HOLE_RADIUS + 0.6) * TILT}
        fill="#04350f"
        opacity={0.8}
      />
      <ellipse
        cx={hole.x}
        cy={cy}
        rx={HOLE_RADIUS}
        ry={HOLE_RADIUS * TILT}
        fill="url(#golf-hole)"
      />
      {/* Auf der hinteren Lochwand liegt Licht — sie ist dem Betrachter zugeneigt */}
      <path
        d={`M ${hole.x - HOLE_RADIUS * 0.9} ${cy - HOLE_RADIUS * TILT * 0.2}
            A ${HOLE_RADIUS * 0.9} ${HOLE_RADIUS * TILT * 0.8} 0 0 1
              ${hole.x + HOLE_RADIUS * 0.9} ${cy - HOLE_RADIUS * TILT * 0.2}`}
        fill="none"
        stroke="#6b5335"
        strokeWidth={0.7}
        opacity={0.85}
      />
    </g>
  )
}

/** Bodenschatten eines stehenden Körpers, in der gekippten Ebene. */
function GroundShadow({ center, radius }: { center: Vec; radius: number }) {
  return (
    <ellipse
      cx={center.x + 1.6}
      cy={projectY(center.y) + 1.2}
      rx={radius * 1.2}
      ry={radius * TILT * 0.85}
      fill="#000"
      opacity={0.5}
      filter="url(#golf-soft)"
    />
  )
}

/** Findling: Schatten, Seitenwand als Kapsel, beleuchtete Kuppel. */
function Boulder({ center, radius }: { center: Vec; radius: number }) {
  const base = projectY(center.y)
  // Ein Stein steckt zum Teil im Boden. Stünde er auf voller Höhe darauf, sähe
  // er aus wie eine Pille, die über dem Rasen schwebt.
  const top = base - radius * 0.75
  return (
    <g>
      <GroundShadow center={center} radius={radius} />
      <line
        x1={center.x}
        y1={base - radius * TILT * 0.4}
        x2={center.x}
        y2={top}
        stroke="#443f3a"
        strokeWidth={radius * 2}
        strokeLinecap="round"
      />
      <ellipse cx={center.x} cy={top} rx={radius} ry={radius * 0.92} fill="url(#golf-rock)" />
      <ellipse
        cx={center.x - radius * 0.3}
        cy={top - radius * 0.38}
        rx={radius * 0.32}
        ry={radius * 0.19}
        fill="#fff"
        opacity={0.32}
        transform={`rotate(-28 ${center.x - radius * 0.3} ${top - radius * 0.38})`}
      />
    </g>
  )
}

/**
 * Kristall — facettiert statt rund: Die Bahn heißt „Kristallhöhle", und ein
 * Kristall lebt von harten Kanten. Die Ecken liegen auf dem Kollisionskreis
 * aus `courses.ts`, damit sichtbare Form und Abprallpunkt zusammenpassen.
 */
function Crystal({ center, radius }: { center: Vec; radius: number }) {
  const base = projectY(center.y)
  const top = base - radius * 1.9
  const r = radius
  const tip = `${center.x},${top - r * 0.85}`
  const left = `${center.x - r},${top + r * 0.2}`
  const right = `${center.x + r},${top + r * 0.2}`
  const bottomLeft = `${center.x - r * 0.6},${top + r * 1.05}`
  const bottomRight = `${center.x + r * 0.6},${top + r * 1.05}`

  return (
    <g>
      <GroundShadow center={center} radius={radius} />
      <line
        x1={center.x}
        y1={base}
        x2={center.x}
        y2={top + r * 0.7}
        stroke="#4a1152"
        strokeWidth={radius * 1.4}
        strokeLinecap="round"
      />
      <g filter="url(#golf-glow)">
        <polygon
          points={`${tip} ${right} ${bottomRight} ${bottomLeft} ${left}`}
          fill="url(#golf-crystal)"
        />
        <polygon points={`${tip} ${left} ${bottomLeft}`} fill="#fae8ff" opacity={0.5} />
        <polygon points={`${tip} ${right} ${bottomRight}`} fill="#3b0764" opacity={0.45} />
        <polygon
          points={`${tip} ${bottomLeft} ${bottomRight}`}
          fill="none"
          stroke="#fdf4ff"
          strokeWidth={0.4}
          opacity={0.6}
        />
      </g>
    </g>
  )
}

/**
 * Fahnenstange samt Schatten und wehendem Tuch. Sie ragt am weitesten aus der
 * Fläche und macht die Kippung damit erst sichtbar.
 */
function Flag({ hole }: { hole: Vec }) {
  const base = projectY(hole.y)
  const top = base - FLAG_H
  return (
    <g>
      {/* Der Schatten läuft flach über den Rasen, nicht senkrecht nach unten */}
      <line
        x1={hole.x}
        y1={base}
        x2={hole.x + 15}
        y2={base + FLAG_H * TILT * 0.5}
        stroke="#000"
        strokeWidth={1.6}
        opacity={0.38}
        strokeLinecap="round"
        filter="url(#golf-soft)"
      />
      <line
        x1={hole.x}
        y1={base}
        x2={hole.x}
        y2={top}
        stroke="#3b2f22"
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      <line
        x1={hole.x}
        y1={base}
        x2={hole.x}
        y2={top}
        stroke="url(#golf-pole)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        className="golf-flag"
        d={`M ${hole.x} ${top}
            C ${hole.x + 6} ${top + 0.8}, ${hole.x + 8} ${top + 4.4}, ${hole.x + 14} ${top + 3.4}
            L ${hole.x + 12} ${top + 8.4}
            C ${hole.x + 7} ${top + 9.4}, ${hole.x + 5} ${top + 7.4}, ${hole.x} ${top + 8.4}
            Z`}
        fill="url(#golf-flag)"
      />
      <path
        className="golf-flag"
        d={`M ${hole.x + 6.2} ${top + 1.5} C ${hole.x + 7.8} ${top + 3.8}, ${hole.x + 7.8} ${
          top + 5.6
        }, ${hole.x + 6.6} ${top + 8}`}
        fill="none"
        stroke="#7f1d1d"
        strokeWidth={0.5}
        opacity={0.7}
      />
      <circle cx={hole.x} cy={top - 1} r={1.4} fill="#f9b316" />
      <circle cx={hole.x - 0.45} cy={top - 1.4} r={0.5} fill="#fff8e7" opacity={0.85} />
    </g>
  )
}

function AimLine({ from, to }: { from: Vec; to: Vec }) {
  const y1 = projectY(from.y, BALL_RADIUS)
  const y2 = projectY(to.y)
  return (
    <g>
      <line
        x1={from.x}
        y1={y1}
        x2={to.x}
        y2={y2}
        stroke="#000"
        strokeWidth={1.8}
        opacity={0.3}
        strokeLinecap="round"
        transform="translate(0.8 1.2)"
      />
      <line
        x1={from.x}
        y1={y1}
        x2={to.x}
        y2={y2}
        stroke="var(--color-gold)"
        strokeWidth={1.1}
        strokeDasharray="3 2.5"
        strokeLinecap="round"
      />
    </g>
  )
}

/**
 * Der Ball ist eine Kugel: Sein Mittelpunkt liegt einen Radius über dem Boden,
 * sein Schatten bleibt unten liegen. Erst dadurch liegt er auf dem Rasen,
 * statt darin zu stecken.
 */
function Ball({ at, moving }: { at: Vec; moving: boolean }) {
  const ground = projectY(at.y)
  const cy = projectY(at.y, BALL_RADIUS)
  return (
    <g>
      <ellipse
        cx={at.x + 0.8}
        cy={ground + 0.4}
        rx={BALL_RADIUS * 1.15}
        ry={BALL_RADIUS * TILT * 0.8}
        fill="#000"
        opacity={0.5}
        filter="url(#golf-soft)"
      />
      <circle cx={at.x} cy={cy} r={BALL_RADIUS} fill="url(#golf-ball)" />
      <ellipse
        cx={at.x - BALL_RADIUS * 0.28}
        cy={cy - BALL_RADIUS * 0.34}
        rx={BALL_RADIUS * 0.34}
        ry={BALL_RADIUS * 0.22}
        fill="#fff"
        opacity={0.9}
        transform={`rotate(-30 ${at.x - BALL_RADIUS * 0.28} ${cy - BALL_RADIUS * 0.34})`}
      />
      {moving && (
        <ellipse
          cx={at.x}
          cy={cy}
          rx={BALL_RADIUS * 1.6}
          ry={BALL_RADIUS * 1.6 * TILT}
          fill="none"
          stroke="#fff"
          strokeWidth={0.4}
          opacity={0.3}
        />
      )}
    </g>
  )
}
