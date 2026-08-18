import { useState } from 'react'
import { Card } from '../components/Card'
import { CurrencyIcon } from '../components/CurrencyIcon'
import { Tabs } from '../components/Tabs'
import {
  SHOP_CATEGORY_ACCENT,
  SHOP_HEADLINE,
  SHOP_HERO,
  SHOP_ITEMS,
  SHOP_NOTE,
  SHOP_TABS,
  SHOP_TEASER,
  type ShopItem,
  type ShopTab,
} from '../content/shop'
import { sfx } from '../core/audio'
import { owns, refusalFor } from '../core/shop'
import type { SaveData } from '../save/types'
import { useGameStore } from '../store/gameStore'

/**
 * Shop mit den vier Reitern Empfohlen · Outfits · Helfer · Booster
 * (docs/01-gamedesign.md).
 *
 * Bezahlt wird nur mit Kristallen. Waren mit Euro-Preis stehen im Mockup und
 * werden deshalb gezeigt, sind aber nicht anklickbar — es gibt keine Bezahlung.
 */
export function Shop() {
  const save = useGameStore((s) => s.save)
  const buy = useGameStore((s) => s.buyItem)
  const [tab, setTab] = useState<ShopTab>('empfohlen')

  if (!save) return null

  const items =
    tab === 'empfohlen'
      ? SHOP_ITEMS.filter((i) => i.featured || i.euro)
      : SHOP_ITEMS.filter((i) => i.category === tab)
  const owned = SHOP_ITEMS.filter((i) => owns(save, i.id))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {/* Kopfbereich nach dem Muster des Mehr-Bildschirms: Bild, Verlauf,
          Schrift darauf. Das Motiv ist der Shop-Bildschirm der Mockups. */}
      <section className="relative flex min-h-28 flex-col justify-end overflow-hidden rounded-2xl border border-edge shadow-lg shadow-black/30">
        <img
          src={SHOP_HERO}
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_40%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/70 to-deep/10" />
        <div className="relative p-3">
          <h1 className="text-xl font-black text-gold drop-shadow-[0_2px_0_rgba(0,0,0,0.7)]">
            {SHOP_HEADLINE}
          </h1>
          <p className="mt-0.5 text-xs text-ink-muted">{SHOP_TEASER}</p>
        </div>
      </section>

      <Tabs<ShopTab>
        tabs={SHOP_TABS.map((t) => ({ key: t.key, label: t.label }))}
        active={tab}
        onChange={setTab}
      />

      <Card title={SHOP_TABS.find((t) => t.key === tab)?.label ?? ''}>
        <p className="mb-3 text-xs text-ink-muted">{SHOP_NOTE}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <ShopCard key={item.id} item={item} save={save} onBuy={buy} />
          ))}
        </ul>
      </Card>

      <Card title={`Deine Sammlung ${owned.length} / ${SHOP_ITEMS.filter((i) => i.crystals).length}`}>
        {owned.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Noch nichts gekauft. Kristalle gibt es bei Levelaufstiegen, aus Missionen und
            aus den Truhen im Abenteuerpfad.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {owned.map((item) => (
              <li
                key={item.id}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-deep/60 py-1 pr-3 pl-1 text-sm font-bold"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="size-9 rounded-md object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid size-9 place-items-center" aria-hidden>
                    {item.icon}
                  </span>
                )}
                {item.title}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function ShopCard({
  item,
  save,
  onBuy,
}: {
  item: ShopItem
  save: SaveData
  onBuy(id: string): void
}) {
  const refusal = refusalFor(save, item.id)
  const accent = SHOP_CATEGORY_ACCENT[item.category]

  // Als Bausteine statt als Zeichenkette, damit im Preis das geschnittene
  // Kristallsymbol steht und nicht das System-Emoji.
  const label =
    refusal === null || refusal === 'too-expensive' ? (
      <>
        {refusal === null ? 'Kaufen' : 'Zu teuer'} · <CurrencyIcon kind="crystals" size={16} />{' '}
        {item.crystals!.toLocaleString('de-DE')}
      </>
    ) : refusal === 'owned' ? (
      'Gekauft'
    ) : (
      'Keine Bezahlung'
    )

  return (
    <li
      className="flex flex-col rounded-xl border border-edge bg-deep/50 p-3"
      style={{ borderTopColor: accent, borderTopWidth: 2 }}
    >
      <div className="flex items-start gap-3">
        {/* Warenbild in der Größe der Mockup-Kachel. Wo keines existiert,
            steht das Emoji auf derselben Fläche vor der Kategoriefarbe —
            damit bleiben alle Karten gleich hoch. */}
        <div
          className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg text-4xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] ring-1 ring-edge"
          style={{
            // color-mix statt `${accent}66`: `accent` ist eine CSS-Variable,
            // und ein angehaengtes Alpha ergaebe `var(--color-gold)66` — kein
            // gueltiger Farbwert, der Verlauf faellt dann still aus.
            background: `linear-gradient(155deg, color-mix(in srgb, ${accent} 55%, transparent), color-mix(in srgb, ${accent} 12%, transparent))`,
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span aria-hidden>{item.icon}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{item.title}</p>
          <p className="text-xs text-ink-muted">{item.description}</p>
          <p className="tabular mt-1 text-sm font-black text-gold">
            {item.crystals !== undefined ? (
              <>
                <CurrencyIcon kind="crystals" size={16} />{' '}
                {item.crystals.toLocaleString('de-DE')}
              </>
            ) : (
              item.euro
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={refusal !== null}
        onClick={() => {
          onBuy(item.id)
          sfx('purchase')
        }}
        className="mt-2 min-h-11 w-full rounded-lg bg-gold text-sm font-black text-deep uppercase disabled:opacity-40"
      >
        {label}
      </button>
    </li>
  )
}
