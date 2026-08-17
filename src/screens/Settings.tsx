import { useState } from 'react'
import { Card } from '../components/Card'
import {
  ABOUT_TEXT,
  GAME_SETTINGS,
  GENERAL_SETTINGS,
  HELP_TEXT,
  PRIVACY_TEXT,
  type SettingRow,
} from '../content/settings'
import type { Settings as SettingsData } from '../save/types'
import { useGameStore } from '../store/gameStore'

/**
 * Einstellungen (docs/01-gamedesign.md). Drei Gruppen wie im Handy-Mockup.
 *
 * Die Schalter schreiben in den Spielstand — bis Phase 7 wurde `settings` zwar
 * angelegt, aber von keiner Zeile gelesen. Wo ein Schalter heute noch nichts
 * bewirkt, steht das dabei, statt es zu verschweigen.
 */
export function Settings() {
  const save = useGameStore((s) => s.save)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const resetSave = useGameStore((s) => s.resetSave)
  const [confirming, setConfirming] = useState(false)

  if (!save) return null
  const { settings } = save

  function toggle(row: SettingRow, value: boolean) {
    updateSettings({ [row.key]: value } as Partial<SettingsData>)
    // Wer die Vibration einschaltet, soll sofort merken, ob das Gerät sie kann.
    if (row.key === 'vibration' && value) buzz()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Card title="Allgemein">
        <ul className="divide-y divide-edge">
          {GENERAL_SETTINGS.map((row) => (
            <SwitchRow
              key={row.key}
              row={row}
              checked={settings[row.key]}
              onChange={(v) => toggle(row, v)}
            />
          ))}
        </ul>
      </Card>

      <Card title="Spiel">
        <ul className="divide-y divide-edge">
          {GAME_SETTINGS.map((row) => (
            <SwitchRow
              key={row.key}
              row={row}
              checked={settings[row.key]}
              onChange={(v) => toggle(row, v)}
            />
          ))}
          <InfoRow label="Sprache" value="Deutsch" hint="Weitere Sprachen sind nicht geplant." />
          <InfoRow
            label="Cloud-Speicherung"
            value="Nicht verbunden"
            hint="Der Spielstand liegt auf diesem Gerät. Die Cloud kommt in Phase 8."
          />
        </ul>
      </Card>

      <Card title="Datenschutz">
        <Prose lines={PRIVACY_TEXT} />
      </Card>

      <Card title="Hilfe">
        <Prose lines={HELP_TEXT} />
      </Card>

      <Card title="Über Fynnox Puzzle Worlds">
        <Prose lines={ABOUT_TEXT} />
      </Card>

      <Card title="Spielstand">
        <p className="text-sm text-ink-muted">
          Setzt Profil, Fortschritt, Missionen, Erfolge, Abenteuerpfad und Sammlung auf den
          Anfang zurück. Das lässt sich nicht rückgängig machen.
        </p>
        {confirming ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                void resetSave()
                setConfirming(false)
              }}
              className="min-h-11 flex-1 rounded-xl bg-[#c62828] text-sm font-black text-white uppercase"
            >
              Ja, alles löschen
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 flex-1 rounded-xl border border-edge text-sm font-bold text-ink uppercase"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 min-h-11 w-full rounded-xl border border-edge text-sm font-bold text-ink uppercase"
          >
            Spielstand zurücksetzen
          </button>
        )}
      </Card>
    </div>
  )
}

/**
 * Kurzes Rütteln. `navigator.vibrate` gibt es auf iOS nicht und auf dem Desktop
 * selten — der fehlende Effekt ist kein Fehler, deshalb wird nur geprüft, ob es
 * die Funktion überhaupt gibt.
 */
function buzz() {
  if ('vibrate' in navigator) navigator.vibrate(30)
}

function SwitchRow({
  row,
  checked,
  onChange,
}: {
  row: SettingRow
  checked: boolean
  onChange(value: boolean): void
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {row.label}
          {!row.effective && (
            <span className="ml-2 rounded bg-deep px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              später
            </span>
          )}
        </p>
        <p className="text-xs text-ink-muted">{row.hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={row.label}
        onClick={() => onChange(!checked)}
        className="relative h-8 w-14 shrink-0 rounded-full border transition"
        style={{
          background: checked ? 'var(--color-gold)' : 'var(--color-deep)',
          borderColor: checked ? 'var(--color-gold)' : 'var(--color-edge)',
        }}
      >
        {/* Der Knopf ist 32 px hoch, die Zeile mit Abstand über 44 px — die
            Zielfläche bleibt damit im Rahmen von CLAUDE.md „Touch zuerst". */}
        <span
          className="absolute top-1 size-6 rounded-full transition-all"
          style={{
            left: checked ? 'calc(100% - 1.75rem)' : '0.25rem',
            background: checked ? 'var(--color-deep)' : 'var(--color-ink-muted)',
          }}
        />
      </button>
    </li>
  )
}

function InfoRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      <span className="shrink-0 text-sm font-bold text-ink-muted">{value}</span>
    </li>
  )
}

function Prose({ lines }: { lines: readonly string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line) => (
        <p key={line} className="text-sm text-ink-muted">
          {line}
        </p>
      ))}
    </div>
  )
}
