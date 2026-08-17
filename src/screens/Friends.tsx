import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Card } from '../components/Card'
import { Leaderboard } from '../components/Leaderboard'
import { Tabs } from '../components/Tabs'
import {
  ALL_LABEL,
  FRIEND_TABS,
  FRIENDS_NOTE,
  ONLINE_LABEL,
  REQUESTS_EMPTY,
  type FriendsTab,
} from '../content/friends'
import { GAMES_BY_ID } from '../content/games'
import { friendList, leaderboard, type Friend } from '../core/friends'
import { useGameStore } from '../store/gameStore'

/**
 * Freunde mit den drei Reitern Freunde · Anfragen · Bestenliste
 * (docs/01-gamedesign.md, „Ranglisten und Freunde").
 *
 * Die „Freunde" sind die zehn Begleitfiguren — das steht sichtbar in der ersten
 * Zeile, statt echte Menschen vorzutäuschen.
 */
export function Friends() {
  const save = useGameStore((s) => s.save)
  const [tab, setTab] = useState<FriendsTab>('freunde')
  // Einmal je Aufruf des Bildschirms: Der Online-Zustand hängt am Kalendertag,
  // eine laufende Uhr würde die Liste bloß neu zeichnen, ohne etwas zu ändern.
  const [now] = useState(() => Date.now())

  if (!save) return null

  const friends = friendList(now)
  const online = friends.filter((f) => f.presence.online)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Tabs<FriendsTab>
        tabs={FRIEND_TABS.map((t) => ({
          key: t.key,
          label: t.label,
          badge: t.key === 'freunde' ? online.length : undefined,
        }))}
        active={tab}
        onChange={setTab}
      />

      {tab === 'freunde' && (
        <>
          <Card>
            <p className="text-xs text-ink-muted">{FRIENDS_NOTE}</p>
          </Card>
          <Card title={`${ONLINE_LABEL} · ${online.length}`}>
            <ul className="flex flex-col gap-1.5">
              {online.map((friend) => (
                <FriendRow key={friend.name} friend={friend} />
              ))}
              {online.length === 0 && (
                <li className="text-sm text-ink-muted">Heute ist gerade niemand unterwegs.</li>
              )}
            </ul>
          </Card>
          <Card title={`${ALL_LABEL} · ${friends.length}`}>
            <ul className="flex flex-col gap-1.5">
              {friends.map((friend) => (
                <FriendRow key={friend.name} friend={friend} />
              ))}
            </ul>
          </Card>
        </>
      )}

      {tab === 'anfragen' && (
        <Card title="Anfragen">
          <div className="flex flex-col gap-2">
            {REQUESTS_EMPTY.map((line) => (
              <p key={line} className="text-sm text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        </Card>
      )}

      {tab === 'bestenliste' && (
        <Card title="Bestenliste">
          <Leaderboard entries={leaderboard(save)} />
        </Card>
      )}
    </div>
  )
}

function FriendRow({ friend }: { friend: Friend }) {
  const { presence } = friend
  const status = presence.online
    ? `Spielt ${GAMES_BY_ID[presence.playing!].title}`
    : `Zuletzt online: ${presence.hoursAgo} h`

  return (
    <li className="flex min-h-14 items-center gap-3 rounded-xl border border-edge bg-deep/50 px-2.5 py-2">
      <div className="relative shrink-0">
        <Avatar name={friend.name} size={44} />
        {/* Der Punkt ist nie die einzige Rückmeldung — der Zustand steht
            zusätzlich als Text daneben (docs/03-art-ui-guide.md). */}
        {presence.online && (
          <span
            className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-deep bg-[#4caf50]"
            aria-hidden
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {friend.name}
          <span className="ml-1.5 text-xs font-medium text-ink-muted">{friend.role}</span>
        </p>
        <p className="truncate text-xs text-ink-muted">{status}</p>
      </div>
      <span className="tabular shrink-0 text-right text-xs font-black text-gold">
        🏆 {friend.trophies.toLocaleString('de-DE')}
        <span className="tabular block font-semibold text-ink-muted">Level {friend.level}</span>
      </span>
    </li>
  )
}
