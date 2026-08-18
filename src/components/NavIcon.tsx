/**
 * Symbol eines Navigationspunkts.
 *
 * Die Piktogramme aus den Mockups liegen als **Maske** in `public/art/ui/`, nicht
 * als Bild: Die Datei gibt nur die Silhouette vor, die Farbe kommt über
 * `currentColor` aus dem Stylesheet. Damit erscheint dasselbe Symbol im aktiven
 * Punkt golden und sonst gedämpft — mit einer Datei statt zweien.
 *
 * Punkte ohne Maske („Mehr", „Profil") zeigen ihr Zeichen. Beide erben ebenfalls
 * die Textfarbe, sodass die Leiste einheitlich bleibt.
 */
export function NavIcon({
  mask,
  fallback,
  size = 22,
}: {
  mask?: string
  fallback: string
  size?: number
}) {
  if (!mask) {
    return (
      <span aria-hidden style={{ fontSize: size * 0.9, lineHeight: 1 }}>
        {fallback}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className="inline-block shrink-0 bg-current"
      style={{
        width: size,
        height: size,
        maskImage: `url(${mask})`,
        WebkitMaskImage: `url(${mask})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
