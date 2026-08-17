import { useEffect, useState } from 'react'
import { countUpValue, motionAllowed } from '../core/motion'
import { useGameStore } from '../store/gameStore'

/** Dauer einer Zählanimation. Lang genug, um sie zu sehen, kurz genug zum Weitertippen. */
const COUNT_MS = 700

/**
 * Ob sich etwas bewegen darf — Schalter aus den Einstellungen und
 * Systemeinstellung zusammen (docs/01-gamedesign.md, „Bewegung").
 */
export function useMotionAllowed(): boolean {
  const powerSaving = useGameStore((s) => s.save?.settings.powerSaving ?? false)
  const [prefersReduced, setPrefersReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return motionAllowed(powerSaving, prefersReduced)
}

/**
 * Zählt von 0 auf `target` hoch. Steht Bewegung aus, kommt sofort der Endwert —
 * kein Zwischenschritt, kein Flackern.
 *
 * `requestAnimationFrame` statt `setInterval`: Der Browser taktet damit im
 * Bildwiederholtakt und hält die Animation an, wenn der Tab in den Hintergrund
 * geht. Ein Zähler, der im Hintergrund weiterrechnet, kostet nur Akku.
 */
export function useCountUp(target: number): number {
  const allowed = useMotionAllowed()
  const [value, setValue] = useState(() => (allowed ? 0 : target))

  useEffect(() => {
    if (!allowed) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS)
      setValue(countUpValue(target, progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, allowed])

  return value
}
