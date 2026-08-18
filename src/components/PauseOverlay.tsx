import { MOMENTS } from '../content/assets'

/**
 * Die Einblendung `PAUSE` aus docs/01-gamedesign.md — eine Schicht über dem
 * Spielfeld, kein eigener Bildschirm.
 *
 * Das Wort steht im Bild (siehe docs/03-art-ui-guide.md, Regel 7), deshalb
 * schreibt die Schicht es nicht daneben. Der Knopf sagt, was als Nächstes
 * passiert, nicht wo man gerade ist.
 */
export function PauseOverlay({ onResume }: { onResume(): void }) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-deep/90 p-4 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Pause"
    >
      <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-edge bg-card text-center shadow-2xl">
        <img src={MOMENTS.pause} alt="Pause" className="h-32 w-full object-cover object-top" />
        <div className="p-4">
          <p className="text-sm text-ink-muted">
            Das Spiel wartet auf dich. Nichts läuft weiter.
          </p>
          <button
            type="button"
            onClick={onResume}
            className="mt-4 min-h-12 w-full rounded-xl bg-gold text-sm font-black text-deep uppercase"
          >
            Weiterspielen
          </button>
        </div>
      </div>
    </div>
  )
}
