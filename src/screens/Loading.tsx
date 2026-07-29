import { HERO_PORTRAIT } from '../content/assets'

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
    <div className="relative grid min-h-full place-items-center overflow-hidden bg-deep p-6">
      <img
        src={HERO_PORTRAIT}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-40 blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-deep/80 via-deep/70 to-deep" />

      <div className="relative w-full max-w-xs text-center">
        <h1 className="text-4xl font-black tracking-wide text-gold drop-shadow-[0_3px_0_rgba(0,0,0,0.6)]">
          FYNNOX
        </h1>
        <p className="text-xs font-bold tracking-[0.35em] text-ink uppercase">Puzzle Worlds</p>

        <img
          src={HERO_PORTRAIT}
          alt="Fynnox"
          className="mx-auto my-4 aspect-square w-44 rounded-2xl object-cover object-top shadow-2xl ring-2 ring-gold/70"
          fetchPriority="high"
        />

        <p className="rounded-xl bg-[#f5ead2] p-3 text-sm font-medium text-[#2b1d10] shadow-lg">
          Schön, dass du wieder da bist! Ein neues Abenteuer wartet auf uns!
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-deep/80 ring-1 ring-edge">
            <div
              className="h-full rounded-full bg-purple transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="tabular text-sm font-black">{percent}%</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">Wird geladen …</p>
      </div>
    </div>
  )
}
