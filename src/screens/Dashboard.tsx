import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Card, ProgressBar } from '../components/Card'
import { DailyRewardCard } from '../components/DailyRewardCard'
import { GameTile } from '../components/GameTile'
import { NODES_PER_CHAPTER } from '../content/adventure'
import { asset, HERO_WIDE } from '../content/assets'
import { GAMES, GAMES_BY_ID } from '../content/games'
import { chapterAt, chapterProgress } from '../core/adventure'
import { xpForNextLevel } from '../core/progression'
import { useGameStore } from '../store/gameStore'

/**
 * Startbildschirm nach dem Handy-Design
 * (docs/referenzen/handy-app-10-bildschirme.png).
 */
export function Dashboard() {
  const save = useGameStore((s) => s.save)
  if (!save) return null

  const { profile, missions, adventure } = save
  const openMissions = missions.filter((m) => m.progress >= m.goal && !m.claimed).length
  const doneMissions = missions.filter((m) => m.progress >= m.goal).length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {/* Begrüßung mit Fynnox in der Landschaft, wie im Mockup */}
      <section className="relative min-h-56 overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
        {/* Landschaft als Grundfläche, weil der enge Fynnox-Ausschnitt die
            Breite des Banners nicht füllt */}
        <img
          src={asset('bg/sonnenwald.jpg')}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <img
          src={HERO_WIDE}
          alt="Fynnox begrüßt dich"
          className="absolute inset-y-0 right-0 h-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Verlauf von links, damit die Schrift auf jedem Motiv lesbar bleibt */}
        <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/90 to-transparent" />

        <div className="relative max-w-[62%] p-4">
          <p className="text-sm text-ink-muted">Willkommen zurück,</p>
          <h1 className="text-3xl font-black tracking-wide text-gold drop-shadow-[0_2px_0_rgba(0,0,0,0.7)]">
            Abenteurer!
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Wähle ein Spiel und lass uns Spaß haben!</p>

          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-deep/80 p-2 ring-1 ring-edge backdrop-blur">
            <Avatar name="Fynnox" size={40} ring="var(--color-gold)" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{profile.name}</p>
              <p className="text-[10px] font-bold tracking-widest text-ink-muted uppercase">
                Level {profile.level}
              </p>
              <div className="mt-1">
                <ProgressBar value={profile.xp} goal={xpForNextLevel(profile.level)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kurzwege: Missionen · aktuelles Kapitel · Profil. Das Bild jeder Kachel
          ist das des Bildschirms dahinter. */}
      <div className="flex gap-3">
        <QuickTile
          to="/missionen"
          label="Tägliche Missionen"
          value={`${doneMissions}/${missions.length}`}
          note={openMissions > 0 ? `${openMissions} abholbereit` : undefined}
          accent="var(--color-gold)"
          image={asset('bg/missionen-ziel.jpg')}
        />
        <QuickTile
          to="/abenteuer"
          label={chapterAt(adventure.chapter).world}
          value={`${chapterProgress(adventure, adventure.chapter)}/${NODES_PER_CHAPTER}`}
          note={`Kapitel ${adventure.chapter}`}
          accent="var(--color-purple)"
          image={chapterAt(adventure.chapter).image}
        />
        <QuickTile
          to="/profil"
          label="Gespielt"
          value={String(save.stats.totalGames)}
          accent="var(--color-game-kristallmix)"
          // Dasselbe Bild, das auch die Profil-Kachel auf dem Mehr-Bildschirm
          // trägt (src/content/navigation.ts) — beide führen zum Profil.
          image={asset('chars/fynnox-jubel.jpg')}
        />
      </div>

      <DailyRewardCard />

      {save.recentGames.length > 0 && (
        <Card title="Weiterspielen">
          <div className="flex flex-wrap gap-2">
            {save.recentGames.map((id) => {
              const game = GAMES_BY_ID[id]
              return (
                <Link
                  key={id}
                  to={game.available ? `/spiel/${id}` : '/spiele'}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-deep/60 py-2 pr-4 pl-2 text-sm font-bold"
                  style={{ color: game.colorVar }}
                >
                  <img
                    src={game.image}
                    alt=""
                    className="size-8 rounded-md object-cover"
                    loading="lazy"
                  />
                  {game.title}
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <Card title="Wähle dein Spiel">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GAMES.map((game) => (
            <GameTile key={game.id} game={game} progress={save.progress[game.id]} />
          ))}
        </div>
      </Card>
    </div>
  )
}

/**
 * Die drei Kurzwege unter dem Begrüßungsbanner. Jeder zeigt das Bild des
 * Bildschirms, in den er führt — dasselbe Muster wie die Kacheln auf dem
 * Mehr-Bildschirm (src/screens/More.tsx). Vorher war es ein leerer Kasten mit
 * farbigem Rand, obwohl für jeden der drei längst Bildmaterial im Projekt liegt.
 */
function QuickTile({
  to,
  label,
  value,
  note,
  accent,
  image,
}: {
  to: string
  label: string
  value: string
  note?: string
  accent: string
  image: string
}) {
  return (
    <Link
      to={to}
      className="relative flex min-h-24 flex-1 flex-col justify-end gap-0.5 overflow-hidden rounded-xl border border-edge px-3 py-2 shadow-lg shadow-black/30"
      style={{ borderBottomColor: accent, borderBottomWidth: 3 }}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 size-full object-cover object-[center_40%]"
        loading="lazy"
      />
      {/* Von unten aufgehellt, damit Beschriftung und Zahl auf jedem Motiv tragen */}
      <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/75 to-deep/10" />

      <span className="relative text-[10px] font-bold tracking-wider text-ink-muted uppercase">
        {label}
      </span>
      <span className="tabular relative text-sm font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        {value}
      </span>
      {note && <span className="relative text-[10px] font-bold text-gold">{note}</span>}
    </Link>
  )
}
