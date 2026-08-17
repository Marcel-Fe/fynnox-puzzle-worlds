import { useEffect, useState } from 'react'
import { CLOUD_TEXT } from '../content/settings'
import { CloudSaveAdapter, type CloudState } from '../save/cloudAdapter'
import { cloudId, isPaired, linkTo, unlink } from '../save/cloudIdentity'
import { createPairingCode, redeemPairingCode } from '../save/supabase'
import { adapter, useGameStore } from '../store/gameStore'
import { Card } from './Card'

/**
 * Cloud-Speicherung im Einstellungsbildschirm
 * (docs/04-datenmodell.md, „Cloud-Speicher").
 *
 * Kein Konto, keine E-Mail: Ein Gerät lässt sich einen sechsstelligen Code
 * geben, das andere tippt ihn ein. Danach schreiben beide in dieselbe Zeile.
 *
 * Ohne Zugangsdaten in der `.env` sagt die Karte das offen, statt eine Cloud
 * vorzutäuschen, die es nicht gibt.
 */
export function CloudCard() {
  const cloud = adapter instanceof CloudSaveAdapter ? adapter : null
  const [state, setState] = useState<CloudState>(() => cloud?.getState() ?? { kind: 'aus' })

  useEffect(() => cloud?.subscribe(setState), [cloud])

  if (!cloud) {
    return (
      <Card title={CLOUD_TEXT.title}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm text-ink-muted">{CLOUD_TEXT.offHint}</p>
          <span className="shrink-0 text-sm font-bold text-ink-muted">{CLOUD_TEXT.offValue}</span>
        </div>
      </Card>
    )
  }

  return <ConnectedCard state={state} />
}

function ConnectedCard({ state }: { state: CloudState }) {
  const init = useGameStore((s) => s.init)
  const [paired, setPaired] = useState(() => isPaired())
  const [code, setCode] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const label =
    state.kind === 'verbunden'
      ? CLOUD_TEXT.connected
      : state.kind === 'fehler'
        ? CLOUD_TEXT.failed
        : CLOUD_TEXT.loading

  async function requestCode() {
    setBusy(true)
    setMessage(null)
    try {
      setCode(await createPairingCode(cloudId()))
    } catch {
      setMessage(CLOUD_TEXT.failed)
    } finally {
      setBusy(false)
    }
  }

  async function submitCode() {
    setBusy(true)
    setMessage(null)
    try {
      const id = await redeemPairingCode(input)
      if (!id) {
        setMessage(CLOUD_TEXT.badCode)
        return
      }
      linkTo(id)
      setPaired(true)
      setInput('')
      setMessage(CLOUD_TEXT.linked)
      // Neu laden: Ab jetzt hängt das Gerät an einer anderen Zeile, und der
      // Abgleich entscheidet, welcher der beiden Stände weiterläuft.
      await init()
    } catch {
      setMessage(CLOUD_TEXT.failed)
    } finally {
      setBusy(false)
    }
  }

  async function release() {
    unlink()
    setPaired(false)
    setCode(null)
    setMessage(null)
    await init()
  }

  return (
    <Card title={CLOUD_TEXT.title}>
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-ink-muted">
          {paired ? CLOUD_TEXT.pairedHint : CLOUD_TEXT.soloHint}
        </p>
        <span
          className="shrink-0 text-sm font-bold"
          style={{
            color: state.kind === 'fehler' ? 'var(--color-ink-muted)' : 'var(--color-gold)',
          }}
        >
          {label}
        </span>
      </div>

      {state.kind === 'fehler' && (
        <p className="mt-2 text-xs text-ink-muted">
          {state.message} Der Spielstand liegt weiterhin sicher auf diesem Gerät.
        </p>
      )}

      {code && (
        <div className="mt-3 rounded-xl border border-gold bg-gold/10 p-3 text-center">
          <p className="tabular text-3xl font-black tracking-[0.3em] text-gold">{code}</p>
          <p className="mt-1 text-xs text-ink-muted">{CLOUD_TEXT.codeHint}</p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void requestCode()}
          className="min-h-11 w-full rounded-xl border border-edge text-sm font-bold text-ink uppercase disabled:opacity-40"
        >
          {CLOUD_TEXT.showCode}
        </button>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 6))}
            placeholder={CLOUD_TEXT.codePlaceholder}
            aria-label={CLOUD_TEXT.enterCode}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="tabular min-h-11 min-w-0 flex-1 rounded-xl border border-edge bg-deep px-3 text-center text-sm font-bold tracking-[0.2em] text-ink placeholder:tracking-normal placeholder:text-ink-muted"
          />
          <button
            type="button"
            disabled={busy || input.length < 6}
            onClick={() => void submitCode()}
            className="min-h-11 shrink-0 rounded-xl bg-gold px-4 text-sm font-black text-deep uppercase disabled:opacity-40"
          >
            {CLOUD_TEXT.submit}
          </button>
        </div>

        {paired && (
          <button
            type="button"
            onClick={() => void release()}
            className="min-h-11 w-full rounded-xl border border-edge text-sm font-bold text-ink-muted uppercase"
          >
            {CLOUD_TEXT.unlink}
          </button>
        )}
      </div>

      {message && <p className="mt-2 text-xs font-bold text-gold">{message}</p>}
      <p className="mt-2 text-xs text-ink-muted">{CLOUD_TEXT.noAccount}</p>
    </Card>
  )
}
