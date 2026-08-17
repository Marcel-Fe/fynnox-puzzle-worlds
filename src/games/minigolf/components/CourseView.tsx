import { FIELD_HEIGHT, FIELD_WIDTH, HOLE_RADIUS, type Course } from '../logic/courses'
import { BALL_RADIUS, type Vec } from '../logic/physics'

/**
 * Darstellung einer Minigolf-Bahn (docs/01-gamedesign.md, Abschnitt 6).
 *
 * **Reine Darstellung.** Physik, Bahnendaten und Bedienung liegen woanders und
 * werden hier nicht angefasst. Die spielbare Fläche ist und bleibt exakt das
 * `boundary`-Polygon aus `courses.ts` — die Bande wächst optisch nach **außen**
 * und nach oben, nie in das Feld hinein. Sonst stünde die sichtbare Kante
 * woanders als die, an der der Ball abprallt.
 *
 * Warum SVG statt eines geschnittenen Bildes: Ein Bahnbild ließe sich nicht aus
 * den Konzeptbildern gewinnen, weil jede Bande aus Daten entsteht — ändert sich
 * eine Koordinate in `courses.ts`, muss die Grafik mitgehen. Die Regel aus
 * CLAUDE.md („Grafik wird nicht nachgebaut") meint die Kulissen und Figuren;
 * die liegen hier unverändert als Foto hinter dem Feld.
 *
 * Der Tiefeneindruck entsteht aus drei Mitteln, mehr braucht es nicht:
 * Licht kommt immer von oben links, alles Erhabene wirft einen Schatten nach
 * unten rechts, und Höhe wird als Versatz entlang −Y gezeichnet.
 */

/** Wie hoch die Bande über dem Rasen steht, in Feldeinheiten. */
const WALL_HEIGHT = 3.2
/** Breite des Bandenkörpers. Er sitzt mittig auf der Kollisionslinie. */
const WALL_WIDTH = 5.2
/**
 * Die Krone ist breiter als der Körper.
 *
 * Sonst bleibt an der unteren Bande ein Rasensaum zwischen Krone und Wandfuß
 * stehen: Die Krone ist um WALL_HEIGHT nach oben versetzt, ihre Unterkante läge
 * damit über der Kollisionslinie. Mit dieser Breite reicht sie 0,4 Einheiten
 * darunter und deckt den Saum ab — bei 100 Einheiten Feldbreite unsichtbar
 * wenig, und es ist die Wandflanke, die man dort ohnehin sähe.
 */
const CROWN_WIDTH = WALL_WIDTH + 2.4

export function CourseView({
  course,
  ball,
  aimTarget,
  moving,
  onPointerDown,
}: {
  course: Course
  ball: Vec
  /** Zielpunkt der Hilfslinie; null blendet sie aus */
  aimTarget: Vec | null
  moving: boolean
  onPointerDown(event: React.PointerEvent<SVGSVGElement>): void
}) {
  const points = course.boundary.map((p) => `${p.x},${p.y}`).join(' ')
  const clipId = `green-${course.number}`

  return (
    <svg
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      className="relative block w-full touch-none"
      onPointerDown={onPointerDown}
      role="application"
      aria-label={`Spielfeld ${course.name}. Tippe, um zu zielen.`}
    >
      <Defs clipId={clipId} points={points} />

      {/* 1. Schatten, den die ganze Bahn auf die Kulisse wirft */}
      <polygon
        points={points}
        fill="#000"
        opacity={0.5}
        transform={`translate(1.6 ${WALL_HEIGHT + 1.4})`}
        filter="url(#golf-blur)"
      />

      {/* 2. Bandenkörper: erst die dunkle Seitenwand am Boden … */}
      <polygon
        points={points}
        fill="none"
        stroke="#6b4a25"
        strokeWidth={WALL_WIDTH}
        strokeLinejoin="round"
      />

      {/* 3. … dann der Rasen, der innen darüber liegt */}
      <polygon points={points} fill="url(#golf-green)" />
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={0}
          y={0}
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
          fill="url(#golf-stripes)"
          opacity={0.5}
        />
        {/* Schattenkante dort, wo die Bande auf den Rasen trifft */}
        <polygon
          points={points}
          fill="none"
          stroke="#000"
          strokeWidth={7}
          opacity={0.3}
          filter="url(#golf-blur)"
        />
      </g>

      <Hazards course={course} clipId={clipId} />
      <Updrafts course={course} clipId={clipId} />
      <Hole hole={course.hole} />

      {/* 4. Bandenkrone: um die Wandhöhe nach oben versetzt — das ist der
             ganze Trick, aus dem der Höhen­eindruck entsteht. */}
      <polygon
        points={points}
        fill="none"
        stroke="url(#golf-wall)"
        strokeWidth={CROWN_WIDTH}
        strokeLinejoin="round"
        transform={`translate(0 ${-WALL_HEIGHT})`}
      />
      <polygon
        points={points}
        fill="none"
        stroke="#fff8e7"
        strokeWidth={0.9}
        strokeLinejoin="round"
        opacity={0.55}
        transform={`translate(0 ${-WALL_HEIGHT - CROWN_WIDTH / 2 + 0.5})`}
      />

      <Obstacles course={course} />
      <Flag hole={course.hole} />

      {aimTarget && <AimLine from={ball} to={aimTarget} />}
      <Ball at={ball} moving={moving} />
    </svg>
  )
}

/**
 * Verläufe, Muster und Filter. Alles trägt einen Präfix, weil mehrere SVG auf
 * derselben Seite liegen können und Kennungen im Dokument eindeutig sein müssen.
 */
function Defs({ clipId, points }: { clipId: string; points: string }) {
  return (
    <defs>
      <clipPath id={clipId}>
        <polygon points={points} />
      </clipPath>

      {/* Rasen: Licht von oben links, Tiefe nach unten rechts */}
      <linearGradient id="golf-green" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#2f9e4f" />
        <stop offset="45%" stopColor="#127a37" />
        <stop offset="100%" stopColor="#065f2a" />
      </linearGradient>

      {/* Mähstreifen — nur ein Hauch, sonst wirkt der Rasen gestreift statt gemäht */}
      <pattern id="golf-stripes" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="transparent" />
        <rect width="5" height="10" fill="#ffffff" opacity={0.055} />
      </pattern>

      {/* Bandenkrone: helles Holz, oben beleuchtet */}
      <linearGradient id="golf-wall" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="#f7e6c4" />
        <stop offset="55%" stopColor="#dcc094" />
        <stop offset="100%" stopColor="#b28c56" />
      </linearGradient>

      <radialGradient id="golf-ball" cx="0.34" cy="0.3" r="0.78">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#eef1f4" />
        <stop offset="100%" stopColor="#a8b2bd" />
      </radialGradient>

      {/* Loch: außen dunkel, innen tiefschwarz */}
      <radialGradient id="golf-hole" cx="0.5" cy="0.42" r="0.62">
        <stop offset="0%" stopColor="#000000" />
        <stop offset="72%" stopColor="#0a0805" />
        <stop offset="100%" stopColor="#241a10" />
      </radialGradient>

      <radialGradient id="golf-rock" cx="0.33" cy="0.28" r="0.82">
        <stop offset="0%" stopColor="#a8a29e" />
        <stop offset="60%" stopColor="#6d6864" />
        <stop offset="100%" stopColor="#44403c" />
      </radialGradient>

      <radialGradient id="golf-crystal" cx="0.34" cy="0.28" r="0.8">
        <stop offset="0%" stopColor="#f0abfc" />
        <stop offset="55%" stopColor="#c026d3" />
        <stop offset="100%" stopColor="#701a75" />
      </radialGradient>

      {/* Lava: glühender Kern, erkaltete Kruste an den Rändern */}
      <linearGradient id="golf-lava" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c2d12" />
        <stop offset="22%" stopColor="#ea580c" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="78%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#7c2d12" />
      </linearGradient>

      <linearGradient id="golf-updraft" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity={0} />
        <stop offset="100%" stopColor="#e0f2fe" stopOpacity={0.5} />
      </linearGradient>

      <linearGradient id="golf-flag" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>

      <linearGradient id="golf-pole" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#d6d3d1" />
        <stop offset="100%" stopColor="#78716c" />
      </linearGradient>

      <filter id="golf-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.4" />
      </filter>

      <filter id="golf-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

/** Lava und Wasser — geglüht, mit erkalteter Kruste an den Kanten. */
function Hazards({ course, clipId }: { course: Course; clipId: string }) {
  if (course.hazards.length === 0) return null
  return (
    <g clipPath={`url(#${clipId})`}>
      {course.hazards.map((h, i) => (
        <g key={i}>
          <rect
            x={h.x}
            y={h.y}
            width={h.width}
            height={h.height}
            fill="url(#golf-lava)"
            filter="url(#golf-glow)"
          />
          {/* Zwei helle Adern im Strom, damit die Fläche nicht tot wirkt */}
          <rect
            x={h.x}
            y={h.y + h.height * 0.42}
            width={h.width}
            height={h.height * 0.1}
            fill="#fef3c7"
            opacity={0.75}
          />
          <rect
            x={h.x}
            y={h.y}
            width={h.width}
            height={1.2}
            fill="#1c1917"
            opacity={0.65}
          />
          <rect
            x={h.x}
            y={h.y + h.height - 1.2}
            width={h.width}
            height={1.2}
            fill="#1c1917"
            opacity={0.65}
          />
        </g>
      ))}
    </g>
  )
}

/** Aufwindzone: sichtbare Strömung samt Pfeilen in Wirkrichtung. */
function Updrafts({ course, clipId }: { course: Course; clipId: string }) {
  if (course.updrafts.length === 0) return null
  return (
    <g clipPath={`url(#${clipId})`}>
      {course.updrafts.map((z, i) => (
        <g key={i}>
          <rect x={z.x} y={z.y} width={z.width} height={z.height} fill="url(#golf-updraft)" />
          {[0.25, 0.5, 0.75].map((f) => (
            <path
              key={f}
              d={`M ${z.x + z.width * f} ${z.y + z.height * 0.72}
                  l 0 ${-z.height * 0.4}
                  m -2.6 3 l 2.6 -3 l 2.6 3`}
              fill="none"
              stroke="#f0f9ff"
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          ))}
        </g>
      ))}
    </g>
  )
}

/**
 * Findlinge und Kristalle als Körper mit Höhe: Bodenschatten, Seitenwand,
 * beleuchtete Kuppel. Die Seitenwand ist eine Strecke mit runden Enden und der
 * Breite des Durchmessers — das ergibt genau die Kapselform, ohne Pfadrechnerei.
 */
function Obstacles({ course }: { course: Course }) {
  return (
    <g>
      {course.obstacles.map((o, i) =>
        o.restitution ? (
          <Crystal key={i} center={o.center} radius={o.radius} />
        ) : (
          <Boulder key={i} center={o.center} radius={o.radius} />
        ),
      )}
    </g>
  )
}

/** Bodenschatten — gleiche Lichtrichtung wie überall, darum nach unten rechts. */
function GroundShadow({ center, radius }: { center: Vec; radius: number }) {
  return (
    <ellipse
      cx={center.x + 1.4}
      cy={center.y + 1.6}
      rx={radius * 1.15}
      ry={radius * 0.62}
      fill="#000"
      opacity={0.55}
      filter="url(#golf-blur)"
    />
  )
}

/**
 * Findling: Bodenschatten, Seitenwand, beleuchtete Kuppel.
 *
 * Die Seitenwand ist eine Strecke mit runden Enden und der Breite des
 * Durchmessers — das ergibt genau die Kapselform, ohne Pfadrechnerei.
 */
function Boulder({ center, radius }: { center: Vec; radius: number }) {
  const height = radius * 0.85
  const top = center.y - height
  return (
    <g>
      <GroundShadow center={center} radius={radius} />
      <line
        x1={center.x}
        y1={center.y}
        x2={center.x}
        y2={top}
        stroke="#3f3a36"
        strokeWidth={radius * 2}
        strokeLinecap="round"
      />
      <circle cx={center.x} cy={top} r={radius} fill="url(#golf-rock)" />
      <ellipse
        cx={center.x - radius * 0.32}
        cy={top - radius * 0.38}
        rx={radius * 0.34}
        ry={radius * 0.22}
        fill="#fff"
        opacity={0.3}
        transform={`rotate(-28 ${center.x - radius * 0.32} ${top - radius * 0.38})`}
      />
    </g>
  )
}

/**
 * Kristall — facettiert statt rund.
 *
 * Als Kugel gezeichnet sah er aus wie ein violettes Ei; die Bahn heißt aber
 * „Kristallhöhle", und ein Kristall lebt von harten Kanten. Die Ecken liegen
 * auf dem Kollisionskreis aus `courses.ts`, damit sichtbare Form und
 * Abprallpunkt zusammenpassen.
 */
function Crystal({ center, radius }: { center: Vec; radius: number }) {
  const height = radius * 1.05
  const top = center.y - height
  const r = radius
  // Sechsflächiger Körper: Spitze oben, breiteste Stelle auf halber Höhe.
  const tip = `${center.x},${top - r * 0.75}`
  const left = `${center.x - r},${top + r * 0.15}`
  const right = `${center.x + r},${top + r * 0.15}`
  const bottomLeft = `${center.x - r * 0.62},${top + r * 0.95}`
  const bottomRight = `${center.x + r * 0.62},${top + r * 0.95}`

  return (
    <g>
      <GroundShadow center={center} radius={radius} />
      {/* Sockel, auf dem der Kristall steht */}
      <line
        x1={center.x}
        y1={center.y}
        x2={center.x}
        y2={top + r * 0.6}
        stroke="#4a1152"
        strokeWidth={radius * 1.5}
        strokeLinecap="round"
      />
      <g filter="url(#golf-glow)">
        <polygon
          points={`${tip} ${right} ${bottomRight} ${bottomLeft} ${left}`}
          fill="url(#golf-crystal)"
        />
        {/* Beleuchtete Facette links, Schattenfacette rechts */}
        <polygon points={`${tip} ${left} ${bottomLeft}`} fill="#f5d0fe" opacity={0.55} />
        <polygon points={`${tip} ${right} ${bottomRight}`} fill="#4a044e" opacity={0.45} />
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

/** Das Loch liegt IM Boden — es bekommt darum keine Höhe, sondern Tiefe. */
function Hole({ hole }: { hole: Vec }) {
  return (
    <g>
      <ellipse
        cx={hole.x}
        cy={hole.y}
        rx={HOLE_RADIUS + 0.5}
        ry={HOLE_RADIUS * 0.82 + 0.5}
        fill="#04340f"
        opacity={0.75}
      />
      <ellipse
        cx={hole.x}
        cy={hole.y}
        rx={HOLE_RADIUS}
        ry={HOLE_RADIUS * 0.82}
        fill="url(#golf-hole)"
      />
      {/* Lichtkante an der unteren Lochwand — dort fällt das Licht hinein */}
      <path
        d={`M ${hole.x - HOLE_RADIUS * 0.85} ${hole.y + HOLE_RADIUS * 0.2}
            A ${HOLE_RADIUS * 0.85} ${HOLE_RADIUS * 0.6} 0 0 0
              ${hole.x + HOLE_RADIUS * 0.85} ${hole.y + HOLE_RADIUS * 0.2}`}
        fill="none"
        stroke="#5c4a33"
        strokeWidth={0.7}
        opacity={0.8}
      />
    </g>
  )
}

/**
 * Fahnenstange samt Schatten und wehendem Tuch. Sie ist der einzige Gegenstand,
 * der weit aus der Fläche ragt — deshalb der lange Schlagschatten auf den Rasen.
 */
function Flag({ hole }: { hole: Vec }) {
  const top = hole.y - 24
  return (
    <g>
      <line
        x1={hole.x}
        y1={hole.y}
        x2={hole.x + 9}
        y2={hole.y + 5.5}
        stroke="#000"
        strokeWidth={1.6}
        opacity={0.4}
        strokeLinecap="round"
        filter="url(#golf-blur)"
      />
      {/* Dunkle Kontur zuerst: Die Stange steht meist vor der hellen Bande und
          verschwände sonst darauf. */}
      <line
        x1={hole.x}
        y1={hole.y}
        x2={hole.x}
        y2={top}
        stroke="#3b2f22"
        strokeWidth={2.3}
        strokeLinecap="round"
        opacity={0.75}
      />
      <line
        x1={hole.x}
        y1={hole.y}
        x2={hole.x}
        y2={top}
        stroke="url(#golf-pole)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        className="golf-flag"
        d={`M ${hole.x} ${top}
            C ${hole.x + 6} ${top + 0.8}, ${hole.x + 8} ${top + 4.4}, ${hole.x + 13.5} ${top + 3.4}
            L ${hole.x + 11.5} ${top + 8}
            C ${hole.x + 7} ${top + 9}, ${hole.x + 5} ${top + 7.2}, ${hole.x} ${top + 8}
            Z`}
        fill="url(#golf-flag)"
      />
      {/* Falte im Tuch — ohne sie liest es sich als flacher Farbfleck */}
      <path
        className="golf-flag"
        d={`M ${hole.x + 6} ${top + 1.4} C ${hole.x + 7.5} ${top + 3.6}, ${hole.x + 7.5} ${
          top + 5.4
        }, ${hole.x + 6.4} ${top + 7.6}`}
        fill="none"
        stroke="#7f1d1d"
        strokeWidth={0.5}
        opacity={0.7}
      />
      <circle cx={hole.x} cy={top - 0.8} r={1.3} fill="#f9b316" />
      <circle cx={hole.x - 0.4} cy={top - 1.2} r={0.5} fill="#fff8e7" opacity={0.8} />
    </g>
  )
}

function AimLine({ from, to }: { from: Vec; to: Vec }) {
  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="#000"
        strokeWidth={1.8}
        opacity={0.35}
        strokeLinecap="round"
        transform="translate(0.6 1.2)"
      />
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="var(--color-gold)"
        strokeWidth={1.1}
        strokeDasharray="3 2.5"
        strokeLinecap="round"
      />
      {/* Bewusst ohne Markierung am Zielpunkt: Steht das Ziel auf dem Loch —
          der Normalfall vor dem ersten Schlag —, sähe das Loch mit Ring darum
          aus wie ein Auge statt wie eine Vertiefung. */}
    </g>
  )
}

/**
 * Der Ball bleibt exakt auf seiner gerechneten Position — nur der Schatten
 * sitzt versetzt. Ihn selbst anzuheben sähe beim Einlochen falsch aus.
 */
function Ball({ at, moving }: { at: Vec; moving: boolean }) {
  return (
    <g>
      <ellipse
        cx={at.x + 0.9}
        cy={at.y + 1.5}
        rx={BALL_RADIUS * 1.1}
        ry={BALL_RADIUS * 0.62}
        fill="#000"
        opacity={0.45}
        filter="url(#golf-blur)"
      />
      <circle cx={at.x} cy={at.y} r={BALL_RADIUS} fill="url(#golf-ball)" />
      <ellipse
        cx={at.x - BALL_RADIUS * 0.3}
        cy={at.y - BALL_RADIUS * 0.36}
        rx={BALL_RADIUS * 0.34}
        ry={BALL_RADIUS * 0.24}
        fill="#fff"
        opacity={0.9}
        transform={`rotate(-30 ${at.x - BALL_RADIUS * 0.3} ${at.y - BALL_RADIUS * 0.36})`}
      />
      {/* Solange er rollt, zieht er eine feine Spur — sonst wirkt schnelle
          Bewegung auf kleinen Bildschirmen wie ein Springen. */}
      {moving && (
        <circle
          cx={at.x}
          cy={at.y}
          r={BALL_RADIUS * 1.5}
          fill="none"
          stroke="#fff"
          strokeWidth={0.4}
          opacity={0.3}
        />
      )}
    </g>
  )
}
