import { Link } from 'react-router-dom'
import { Card, ProgressBar } from '../components/Card'
import {
  ADVENTURE_DONE_LINE,
  ADVENTURE_LINE,
  CHAPTERS,
  NODES_PER_CHAPTER,
} from '../content/adventure'
import { PORTRAITS } from '../content/assets'
import { GAMES_BY_ID } from '../content/games'
import {
  chapterAt,
  chapterProgress,
  chapterStars,
  chestReward,
  isChapterComplete,
  isChestClaimed,
  nodeGame,
  starsAt,
} from '../core/adventure'
import type { AdventurePath } from '../save/types'
import { useGameStore } from '../store/gameStore'

/**
 * Abenteuerpfad nach Entwurf B (docs/01-gamedesign.md): Kapitelkopf mit
 * eigenem Fortschrittsbalken, senkrechter Pfad mit nummerierten Knoten,
 * am Ende eine Truhe.
 *
 * Ein Knoten ist eine Runde im vorgegebenen Spiel — deshalb führt der Knopf
 * in genau dieses Spiel und die Runde zählt über die normale Rundenauswertung.
 */
export function Adventure() {
  const save = useGameStore((s) => s.save)
  const claimChest = useGameStore((s) => s.claimChest)
  if (!save) return null

  const { adventure } = save
  const chapter = chapterAt(adventure.chapter)
  const done = chapterProgress(adventure, chapter.number)
  const stars = chapterStars(adventure, chapter.number)
  const complete = isChapterComplete(adventure, chapter.number)
  const chestClaimed = isChestClaimed(adventure, chapter.number)
  const allDone = complete && chestClaimed && chapter.number === CHAPTERS.length

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-edge shadow-xl shadow-black/40">
        <img src={chapter.image} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/80 to-deep/30" />
        <div className="relative p-4">
          <p className="text-xs font-bold tracking-widest text-ink-muted uppercase">
            Kapitel {chapter.number} von {CHAPTERS.length}
          </p>
          <h1 className="text-2xl font-black tracking-wide text-gold drop-shadow-[0_2px_0_rgba(0,0,0,0.7)]">
            {chapter.world}
          </h1>
          <div className="mt-2">
            <ProgressBar
              value={done}
              goal={NODES_PER_CHAPTER}
              color={chapter.accent}
            />
          </div>
          <p className="tabular mt-1 text-xs font-bold text-ink-muted">
            <span className="text-gold">★ {stars}</span> von {NODES_PER_CHAPTER * 3} Sternen
          </p>
        </div>
      </section>

      <Card>
        <ol className="flex flex-col">
          {Array.from({ length: NODES_PER_CHAPTER }, (_, i) => i + 1).map((node) => (
            <NodeRow
              key={node}
              adventure={adventure}
              chapter={chapter.number}
              node={node}
              accent={chapter.accent}
            />
          ))}
        </ol>

        <div
          className={[
            'mt-3 rounded-xl border p-3 text-center',
            complete && !chestClaimed ? 'border-gold bg-gold/15' : 'border-edge bg-deep/60',
          ].join(' ')}
        >
          <p className="text-3xl" aria-hidden>
            {chestClaimed ? '📭' : complete ? '🎁' : '🔒'}
          </p>
          <p className="mt-1 text-sm font-bold">Truhe am Kapitelende</p>
          <p className="tabular mt-0.5 text-xs text-ink-muted">
            🪙 {chestReward(stars).coins.toLocaleString('de-DE')} · 💎{' '}
            {chestReward(stars).crystals}
          </p>
          <button
            type="button"
            disabled={!complete || chestClaimed}
            onClick={() => claimChest(chapter.number)}
            className="mt-2 min-h-11 w-full rounded-lg bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
          >
            {chestClaimed
              ? 'Abgeholt'
              : complete
                ? 'Truhe öffnen'
                : `Noch ${NODES_PER_CHAPTER - done} Knoten`}
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <img
            src={PORTRAITS.Fynnox}
            alt="Fynnox"
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-full bg-elevated object-cover"
            style={{ boxShadow: '0 0 0 2px var(--color-gold)' }}
          />
          <p className="flex-1 rounded-xl rounded-tl-none bg-[#f5ead2] p-2.5 text-sm font-medium text-[#2b1d10]">
            {allDone ? ADVENTURE_DONE_LINE : done === 0 ? chapter.intro : ADVENTURE_LINE}
          </p>
        </div>
      </Card>
    </div>
  )
}

function NodeRow({
  adventure,
  chapter,
  node,
  accent,
}: {
  adventure: AdventurePath
  chapter: number
  node: number
  accent: string
}) {
  const stars = starsAt(adventure, chapter, node)
  const isCurrent = stars === null && node === adventure.nodeInChapter
  const locked = stars === null && !isCurrent
  const game = GAMES_BY_ID[nodeGame(chapter, node)]

  return (
    <li className="flex items-stretch gap-3">
      {/* Der Pfad: senkrechte Linie durch alle Knoten, oben und unten offen */}
      <div className="flex w-11 shrink-0 flex-col items-center">
        <span className={`w-0.5 flex-1 ${node === 1 ? 'bg-transparent' : 'bg-edge'}`} />
        <span
          className="tabular grid size-11 place-items-center rounded-full text-sm font-black"
          style={{
            background: stars !== null ? accent : isCurrent ? 'var(--color-gold)' : 'var(--color-card)',
            color: stars !== null || isCurrent ? 'var(--color-deep)' : 'var(--color-ink-muted)',
            boxShadow: isCurrent ? '0 0 0 3px var(--color-gold)' : `0 0 0 1px var(--color-edge)`,
          }}
        >
          {locked ? '🔒' : node}
        </span>
        <span
          className={`w-0.5 flex-1 ${node === 15 ? 'bg-transparent' : 'bg-edge'}`}
        />
      </div>

      <div className={`min-w-0 flex-1 py-2 ${locked ? 'opacity-45' : ''}`}>
        <p className="text-sm font-bold" style={{ color: game.colorVar }}>
          {game.title}
        </p>
        <p className="text-xs text-ink-muted">
          {stars !== null ? (
            <span aria-label={`${stars} von 3 Sternen`}>
              <span className="text-gold">{'★'.repeat(stars)}</span>
              <span className="text-edge">{'★'.repeat(3 - stars)}</span>
            </span>
          ) : isCurrent ? (
            'Erreiche mindestens einen Stern'
          ) : (
            'Gesperrt'
          )}
        </p>
        {isCurrent && (
          <Link
            to={`/spiel/${game.id}`}
            className="mt-1.5 inline-flex min-h-11 items-center rounded-lg bg-gold px-4 text-sm font-black text-deep uppercase"
          >
            Starten
          </Link>
        )}
      </div>
    </li>
  )
}
