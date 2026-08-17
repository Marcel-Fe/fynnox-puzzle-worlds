/**
 * Vollbild am Handy.
 *
 * Zwei getrennte Wege, weil es nur zwei gibt:
 *
 * 1. **Installiert** (vom Startbildschirm): Das Manifest sagt `display: fullscreen`,
 *    das System startet die App ohne Browser- und ohne Statusleiste. Hier ist
 *    nichts zu tun.
 * 2. **Im Browser-Tab**: Vollbild lässt sich nur nach einer Nutzergeste anfordern —
 *    beim Laden lehnen alle Browser es ab. Darum wird beim ersten Antippen gefragt.
 *
 * Bewusst `click` statt `pointerdown`: Ein Klick kommt erst nach dem Loslassen.
 * Beim Wechsel in den Vollbildmodus ändert sich die Fenstergröße, die Fläche
 * zeichnet sich neu — mitten in einer laufenden Zeigergeste würde das die Geste
 * abbrechen (siehe lessons.md, „Ziehen auf Flächen, die sich neu zeichnen").
 */

function alreadyBorderless(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    // iOS meldet den Startbildschirm-Modus nur über diese alte Eigenschaft
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Meldet einen Aufräumer zurück, damit React den Zuhörer wieder abmelden kann. */
export function requestFullscreenOnFirstTap(): () => void {
  // Nur auf Geräten mit grobem Zeiger, also Finger. Am Desktop wäre ein
  // ungefragter Vollbildwechsel eine Zumutung.
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (!touch || alreadyBorderless()) return () => {}

  const ask = () => {
    const root = document.documentElement
    // iPhone-Safari kennt die Schnittstelle nicht — dort bleibt es beim
    // Browserrahmen, und nur „Zum Home-Bildschirm" bringt echtes Vollbild.
    if (document.fullscreenElement || typeof root.requestFullscreen !== 'function') return
    void root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
      /* Abgelehnt oder nicht erlaubt: Die App läuft im Rahmen weiter. */
    })
  }

  window.addEventListener('click', ask, { once: true })
  return () => window.removeEventListener('click', ask)
}
