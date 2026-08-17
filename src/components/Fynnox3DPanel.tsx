import { Component, lazy, Suspense, useState, type ReactNode } from 'react'
import { PORTRAITS } from '../content/assets'
import { FYNNOX_3D_TEXT as T } from '../content/profile'

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

/**
 * Fängt den Fehlschlag beim Laden des Modells ab.
 *
 * Nötig, weil das Modell absichtlich nicht im Vorab-Cache liegt: Wer die
 * Ansicht zum ersten Mal ohne Netz öffnet, riss ohne diesen Auffangnetz den
 * halben Profilbildschirm mit — `useGLTF` wirft, und ein geworfener Fehler
 * unter `Suspense` braucht eine Fehlergrenze, keine zweite Zusicherung.
 *
 * Eine Klasse, weil React für Fehlergrenzen bis heute keinen Hook anbietet.
 */
class ModelBoundary extends Component<
  { children: ReactNode; onFail(): void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function Fynnox3DPanel() {
  const [active, setActive] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [supported] = useState(hasWebGL)

  function retry() {
    setFailed(false)
    // Neuer Schlüssel: Sonst zeigt React die bereits gescheiterte Grenze weiter.
    setAttempt((n) => n + 1)
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-edge bg-elevated">
      {active && !failed ? (
        <>
          <ModelBoundary key={attempt} onFail={() => setFailed(true)}>
            <Suspense
              fallback={
                <div className="grid size-full place-items-center px-4 text-center text-sm text-ink-muted">
                  {T.loading} <br />
                  <span className="text-xs">{T.size}</span>
                </div>
              }
            >
              <Fynnox3D />
            </Suspense>
          </ModelBoundary>
          <button
            type="button"
            onClick={() => setActive(false)}
            className="absolute top-2 right-2 min-h-9 rounded-lg border border-edge bg-deep/80 px-3 text-xs font-bold text-ink backdrop-blur"
          >
            {T.close}
          </button>
        </>
      ) : (
        <>
          <img src={PORTRAITS.Fynnox} alt="Fynnox" className="size-full object-cover opacity-70" />
          {failed ? (
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-deep/90 p-3 text-center">
              <p className="text-xs text-ink-muted">{T.offline}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-2 min-h-11 w-full rounded-lg border border-edge text-sm font-bold text-ink uppercase"
              >
                {T.retry}
              </button>
            </div>
          ) : supported ? (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="absolute inset-x-3 bottom-3 min-h-12 rounded-xl bg-gold text-sm font-black text-deep uppercase shadow-lg"
            >
              {T.open}
            </button>
          ) : (
            <p className="absolute inset-x-3 bottom-3 rounded-xl bg-deep/85 p-2 text-center text-xs text-ink-muted">
              {T.noWebGL}
            </p>
          )}
        </>
      )}
    </div>
  )
}
