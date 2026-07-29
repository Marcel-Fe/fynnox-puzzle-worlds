import { Card } from '../components/Card'

/**
 * Bildschirm, der noch nicht gebaut ist. Zeigt ehrlich an, dass hier nichts ist,
 * statt eine leere Seite auszugeben.
 */
export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <Card>
        <h1 className="text-xl font-black text-gold">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Dieser Bereich ist noch nicht gebaut. Geplant für <strong>{phase}</strong> — siehe
          <code className="mx-1 rounded bg-deep px-1.5 py-0.5 text-xs">docs/05-roadmap.md</code>.
        </p>
      </Card>
    </div>
  )
}
