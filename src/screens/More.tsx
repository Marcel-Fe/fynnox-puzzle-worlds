import { Link } from 'react-router-dom'
import { MORE_ITEMS } from '../content/navigation'
import { Card } from '../components/Card'

/**
 * Fünfter Tab am Handy: alles, was nicht in die Tab-Leiste passt
 * (docs/03-art-ui-guide.md). Am Desktop stehen dieselben Punkte in der Seitenleiste.
 */
export function More() {
  return (
    <div className="mx-auto max-w-5xl">
      <Card title="Mehr">
        <ul className="divide-y divide-edge">
          {MORE_ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex min-h-14 items-center gap-3 text-sm font-semibold text-ink"
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
                <span className="ml-auto text-ink-muted" aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
