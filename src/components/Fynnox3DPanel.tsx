import { lazy, Suspense, useState } from 'react'
import { PORTRAITS } from '../content/assets'

/**
 * Umschalter für die 3D-Ansicht von Fynnox.
 *
 * Bis der Spieler sie öffnet, steht hier nur ein Bild — three.js und das
 * 2,4 MB große Modell werden erst beim Antippen nachgeladen. So bleibt die
 * App auf dem Handy schnell und im Mobilfunknetz sparsam.
 */
const Fynnox3D = lazy(() => import('./Fynnox3D'))

/** Ältere Geräte haben kein WebGL — dann bleibt es beim Bild. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function Fynnox3DPanel() {
  const [active, setActive] = useState(false)
  const [supported] = useState(hasWebGL)

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-edge bg-elevated">
      {active ? (
        <>
          <Suspense
            fallback={
              <div className="grid size-full place-items-center px-4 text-center text-sm text-ink-muted">
                Fynnox wird geladen … <br />
                <span className="text-xs">Das Modell ist 2,4 MB groß.</span>
              </div>
            }
          >
            <Fynnox3D />
          </Suspense>
          <button
            type="button"
            onClick={() => setActive(false)}
            className="absolute top-2 right-2 min-h-9 rounded-lg border border-edge bg-deep/80 px-3 text-xs font-bold text-ink backdrop-blur"
          >
            Schließen
          </button>
        </>
      ) : (
        <>
          <img
            src={PORTRAITS.Fynnox}
            alt="Fynnox"
            className="size-full object-cover opacity-70"
          />
          {supported ? (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="absolute inset-x-3 bottom-3 min-h-12 rounded-xl bg-gold text-sm font-black text-deep uppercase shadow-lg"
            >
              In 3D ansehen
            </button>
          ) : (
            <p className="absolute inset-x-3 bottom-3 rounded-xl bg-deep/85 p-2 text-center text-xs text-ink-muted">
              Dein Gerät unterstützt keine 3D-Darstellung.
            </p>
          )}
        </>
      )}
    </div>
  )
}
