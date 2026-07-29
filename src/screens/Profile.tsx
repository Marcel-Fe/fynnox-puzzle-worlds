import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Card, ProgressBar } from '../components/Card'
import { Fynnox3DPanel } from '../components/Fynnox3DPanel'
import { formatTime } from '../components/GameTile'
import { GAMES_BY_ID } from '../content/games'
import { xpForNextLevel } from '../core/progression'
import { useGameStore } from '../store/gameStore'

/**
 * Profilbildschirm mit Statistik und Erfolgen (docs/01-gamedesign.md).
 */
export function Profile() {
  const save = useGameStore((s) => s.save)
  const renameProfile = useGameStore((s) => s.renameProfile)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (!save) return null
  const { profile, stats, achievements } = save
  const unlocked = achievements.filter((a) => a.unlockedAt !== null).length

  function startEditing() {
    setDraft(profile.name)
    setEditing(true)
  }

  function saveName() {
    renameProfile(draft)
    setEditing(false)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name="Fynnox" size={64} ring="var(--color-gold)" />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={20}
                  aria-label="Profilname"
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-edge bg-deep px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="min-h-11 rounded-lg bg-gold px-4 text-sm font-bold text-deep"
                >
                  OK
                </button>
              </div>
            ) : (
              <p className="truncate text-lg font-black">{profile.name}</p>
            )}
            <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
              Level {profile.level}
            </p>
            <div className="mt-1.5">
              <ProgressBar value={profile.xp} goal={xpForNextLevel(profile.level)} />
            </div>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="mt-3 min-h-11 w-full rounded-xl border border-edge text-sm font-bold text-ink uppercase"
          >
            Namen ändern
          </button>
        )}
      </Card>

      <Card title="Fynnox in 3D">
        <Fynnox3DPanel />
        <p className="mt-2 text-xs text-ink-muted">
          Das Modell stammt aus Fynnox Adventure. Es wird erst geladen, wenn du es öffnest.
        </p>
      </Card>

      <Card title="Statistik">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Gesamtspiele" value={stats.totalGames.toLocaleString('de-DE')} />
          <Stat label="Gewonnene Spiele" value={stats.totalWins.toLocaleString('de-DE')} />
          <Stat label="Bestes Level" value={String(stats.bestLevel)} />
          <Stat label="Spielzeit" value={formatPlaytime(stats.totalPlaytimeMs)} />
          <Stat
            label="Gesammelte Münzen"
            value={stats.coinsEarnedTotal.toLocaleString('de-DE')}
          />
          <Stat
            label="Gesammelte Kristalle"
            value={stats.crystalsEarnedTotal.toLocaleString('de-DE')}
          />
          <Stat
            label="Lieblingsspiel"
            value={profile.favoriteGame ? GAMES_BY_ID[profile.favoriteGame].title : '—'}
          />
          <Stat label="Mitglied seit" value={formatMonth(profile.createdAt)} />
        </dl>
      </Card>

      <Card title={`Erfolge ${unlocked} / ${achievements.length}`}>
        <ul className="flex flex-col gap-4">
          {achievements.map((a) => (
            <li key={a.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">
                  {a.unlockedAt !== null && <span aria-hidden>✅ </span>}
                  {a.title}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">{a.description}</span>
              </div>
              <ProgressBar
                value={Math.min(a.progress, a.goal)}
                goal={a.goal}
                color={a.unlockedAt !== null ? 'var(--color-gold)' : 'var(--color-purple)'}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Bestwerte je Spiel">
        <ul className="flex flex-col gap-2 text-sm">
          {Object.entries(save.progress).map(([id, p]) => {
            const info = GAMES_BY_ID[id as keyof typeof GAMES_BY_ID]
            if (p.gamesPlayed === 0) return null
            return (
              <li key={id} className="flex items-baseline justify-between gap-2">
                <span className="font-semibold" style={{ color: info.colorVar }}>
                  {info.title}
                </span>
                <span className="tabular text-ink-muted">
                  {p.gamesPlayed} Runden · Beste{' '}
                  {info.bestLabel === 'Bestzeit' && p.bestTimeMs
                    ? formatTime(p.bestTimeMs)
                    : p.highScore.toLocaleString('de-DE')}
                </span>
              </li>
            )
          })}
          {stats.totalGames === 0 && (
            <li className="text-ink-muted">Noch keine Runde gespielt.</li>
          )}
        </ul>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="tabular font-bold">{value}</dd>
    </div>
  )
}

function formatPlaytime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

function formatMonth(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}
