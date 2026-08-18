import { Link } from 'react-router-dom'
import { MORE_ITEMS } from '../content/navigation'

/**
 * Fünfter Tab am Handy: alles, was nicht in die Tab-Leiste passt
 * (docs/03-art-ui-guide.md). Am Desktop stehen dieselben Punkte in der Seitenleiste.
 *
 * Bewusst Bildkacheln statt einer Liste: Als Textzeilen mit Emoji füllte der
 * Bildschirm keine halbe Seite und sah aus wie ein Systemmenü — obwohl für jeden
 * Punkt längst Bildmaterial im Projekt liegt. Die Bilder sind dieselben, die der
 * jeweilige Bildschirm dahinter auch zeigt; die Kachel ist damit eine Vorschau,
 * kein Schmuck.
 */
export function More() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-3 px-1 text-xl font-black text-gold">Mehr entdecken</h1>

      <ul className="grid grid-cols-2 gap-2.5">
        {MORE_ITEMS.map((item, i) => (
          // Der erste Punkt bekommt die volle Breite: Der Abenteuerpfad ist der
          // Weg durch das Spiel, nicht ein Eintrag unter sieben. Die Spaltenweite
          // gehoert an das Listenelement — es ist das Rasterfeld, nicht der Link.
          <li key={item.to} className={i === 0 ? 'col-span-2' : ''}>
            <Link
              to={item.to}
              className={[
                'group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-edge p-3 shadow-lg shadow-black/30',
                i === 0 ? 'min-h-40' : 'min-h-32',
              ].join(' ')}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  // Etwas oberhalb der Mitte ausgerichtet: Bei den Portraets sitzt
                  // dort das Gesicht der Portraets, bei den Kulissen der Horizont.
                  className="absolute inset-0 size-full object-cover object-[center_45%]"
                  loading="lazy"
                />
              )}
              {/* Von unten aufgehellt, damit die Schrift immer trägt — egal wie
                  hell das Bild an dieser Stelle ist. */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/75 to-deep/15" />

              <div className="relative">
                <p className="flex items-center gap-2 text-base font-black text-ink">
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </p>
                {item.teaser && (
                  <p className="mt-0.5 text-xs text-ink-muted">{item.teaser}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
