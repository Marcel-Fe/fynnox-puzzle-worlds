import { Avatar } from '../components/Avatar'
import { LEADERBOARD_NOTE } from '../content/friends'
import { type LeaderboardEntry } from '../core/friends'

/**
 * Die Rangliste — **eine** Komponente für zwei Bildschirme: den eigenen
 * Ranglistenbildschirm und den Reiter „Bestenliste" bei den Freunden
 * (docs/01-gamedesign.md). Zwei Listen, die auseinanderlaufen können, wären
 * ein Fehler, der sich erst spät zeigt.
 */
export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div>
      <p className="mb-3 text-xs text-ink-muted">{LEADERBOARD_NOTE}</p>
      <ol className="flex flex-col gap-1.5">
        {entries.map((entry, i) => (
          <Row key={entry.name + i} entry={entry} place={i + 1} />
        ))}
      </ol>
    </div>
  )
}

/** Bronze, Silber, Gold für die ersten drei — sonst die nackte Zahl. */
function medal(place: number): string {
  return place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `${place}.`
}

function Row({ entry, place }: { entry: LeaderboardEntry; place: number }) {
  return (
    <li
      className={[
        'flex min-h-14 items-center gap-3 rounded-xl border px-2.5 py-2',
        entry.isPlayer ? 'border-gold bg-gold/12' : 'border-edge bg-deep/50',
      ].join(' ')}
    >
      <span
        className="tabular w-8 shrink-0 text-center text-sm font-black"
        style={{ color: place <= 3 ? 'var(--color-gold)' : 'var(--color-ink-muted)' }}
      >
        {medal(place)}
      </span>
      <Avatar
        name={entry.isPlayer ? 'Fynnox' : entry.name}
        size={40}
        ring={entry.isPlayer ? 'var(--color-gold)' : undefined}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {entry.name}
          {entry.isPlayer && <span className="ml-1.5 text-xs font-black text-gold">(du)</span>}
        </p>
        <p className="tabular text-xs text-ink-muted">
          Level {entry.level} · {entry.wins.toLocaleString('de-DE')} von{' '}
          {entry.games.toLocaleString('de-DE')} gewonnen
        </p>
      </div>
      <span className="tabular shrink-0 text-sm font-black text-gold">
        🏆 {entry.trophies.toLocaleString('de-DE')}
      </span>
    </li>
  )
}
