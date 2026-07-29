/**
 * Ladebildschirm nach dem Mockup-Ablauf: Logo, Fynnox mit Sprechblase,
 * Fortschrittsbalken mit Prozentzahl (docs/01-gamedesign.md, „Start der App").
 *
 * Der Fortschritt ist echt: Er zeigt, wie weit das Laden des Spielstands ist.
 * Ein vorgetäuschter Balken, der immer gleich lang läuft, wäre gelogen —
 * und auf einem schnellen Gerät nur eine künstliche Verzögerung.
 */
export function Loading({ percent }: { percent: number }) {
  return (
    <div className="grid min-h-full place-items-center bg-deep p-6">
      <div className="w-full max-w-xs text-center">
        <p className="text-6xl" aria-hidden>
          🦊
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-wide text-gold">FYNNOX</h1>
        <p className="text-xs font-bold tracking-[0.3em] text-ink-muted uppercase">
          Puzzle Worlds
        </p>

        <p className="mt-5 rounded-xl bg-elevated/70 p-3 text-sm">
          Schön, dass du wieder da bist! Ein neues Abenteuer wartet auf uns!
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full bg-purple transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="tabular text-sm font-bold">{percent}%</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">Wird geladen …</p>
      </div>
    </div>
  )
}
