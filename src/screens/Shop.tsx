import { useState } from 'react'
import { Card } from '../components/Card'
import { Tabs } from '../components/Tabs'
import {
  SHOP_ITEMS,
  SHOP_NOTE,
  SHOP_TABS,
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
                className="flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-deep/60 px-3 text-sm font-bold"
              >
                <span aria-hidden>{item.icon}</span>
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

  const label =
    refusal === null
      ? `Kaufen · 💎 ${item.crystals!.toLocaleString('de-DE')}`
      : refusal === 'owned'
        ? 'Gekauft'
        : refusal === 'too-expensive'
          ? `Zu teuer · 💎 ${item.crystals!.toLocaleString('de-DE')}`
          : 'Keine Bezahlung'

  return (
    <li className="flex flex-col rounded-xl border border-edge bg-deep/50 p-3">
      <div className="flex items-start gap-2">
        <span className="text-3xl" aria-hidden>
          {item.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{item.title}</p>
          <p className="text-xs text-ink-muted">{item.description}</p>
        </div>
      </div>
      <p className="tabular mt-2 text-sm font-black text-gold">
        {item.crystals !== undefined
          ? `💎 ${item.crystals.toLocaleString('de-DE')}`
          : item.euro}
      </p>
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
