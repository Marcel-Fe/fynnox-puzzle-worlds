/**
 * Ton und Musik (docs/01-gamedesign.md, „Ton und Musik").
 *
 * Klangeffekte entstehen **prozedural** über WebAudio, nicht aus Dateien: keine
 * fremden Samples und damit keine Lizenzfrage, kein Byte zusätzlich im PWA-Cache,
 * sofort offline. Jeder Klang ist eine Handvoll Oszillatoren mit Hüllkurve.
 * Die Vorlage steht in `fynnox-adventure/src/audio/sfx.ts`.
 *
 * Die Musik ist dagegen eine echte Datei — prozedural erzeugte Musik klingt nach
 * Klingelton. Sie liegt bewusst **nicht** im Vorab-Cache (siehe vite.config.ts).
 *
 * Dieses Modul kennt weder React noch den Store. Wer die Einstellungen kennt,
 * schiebt sie mit `applyAudioSettings` herein — genauso wie `round.ts` und
 * `time.ts` ihre Uhr von außen bekommen.
 */

const MASTER_VOLUME = 0.22
const MUSIC_VOLUME = 0.3
const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/musik.mp3`

let ctx: AudioContext | null = null
let master: GainNode | null = null

let soundOn = true
let musicOn = true
/** Erst nach der ersten Nutzergeste darf Ton entstehen (Autoplay-Sperre). */
let armed = false
let music: HTMLAudioElement | null = null

/**
 * Baut den AudioContext beim ersten Bedarf auf. Vorher passiert nichts —
 * ein Context, der vor der ersten Geste entsteht, bleibt in Safari dauerhaft
 * auf „suspended" stehen.
 */
function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = MASTER_VOLUME
    master.connect(ctx.destination)
  }
  // Nach einem Tabwechsel steht der Context oft auf „suspended".
  if (ctx.state === 'suspended') void ctx.resume()
  return master ? { ctx, out: master } : null
}

/** Ein Ton mit weicher Hüllkurve. `slide` verstimmt ihn über die Laufzeit. */
function tone(
  freq: number,
  dur: number,
  opts: {
    type?: OscillatorType
    gain?: number
    delay?: number
    slide?: number
    attack?: number
  } = {},
): void {
  const a = audio()
  if (!a) return
  const { type = 'sine', gain = 0.5, delay = 0, slide = 0, attack = 0.008 } = opts
  const t0 = a.ctx.currentTime + delay

  const osc = a.ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur)

  const env = a.ctx.createGain()
  // Exponentiell ausklingen lassen — linear klingt nach „abgeschnitten".
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  osc.connect(env)
  env.connect(a.out)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/**
 * Kurzes gefiltertes Rauschen — für den Truhendeckel. Ein Oszillator klingt
 * dafür zu „musikalisch", Rauschen erdet das Geräusch.
 *
 * Das Rauschen ist der einzige ungesäte Zufall im Projekt. Er ist unbedenklich:
 * Er erzeugt Schallwellen, keinen Spielzustand — CLAUDE.md verlangt den Seed für
 * die *Spiellogik*, damit Bugs reproduzierbar bleiben.
 */
function noise(dur: number, opts: { gain?: number; delay?: number; cutoff?: number } = {}): void {
  const a = audio()
  if (!a) return
  const { gain = 0.4, delay = 0, cutoff = 900 } = opts
  const t0 = a.ctx.currentTime + delay
  const frames = Math.max(1, Math.floor(a.ctx.sampleRate * dur))
  const buf = a.ctx.createBuffer(1, frames, a.ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)

  const src = a.ctx.createBufferSource()
  src.buffer = buf

  const lp = a.ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = cutoff

  const env = a.ctx.createGain()
  env.gain.setValueAtTime(gain, t0)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

  src.connect(lp)
  lp.connect(env)
  env.connect(a.out)
  src.start(t0)
}

/** Die fünf Anlässe aus docs/01-gamedesign.md, „Ton und Musik". */
export type Sfx = 'win' | 'lose' | 'reward' | 'chest' | 'purchase'

export function sfx(kind: Sfx): void {
  if (!soundOn || !armed) return
  if (!audio()) return

  switch (kind) {
    case 'win':
      // Dur-Fanfare aufwärts, wie im Ergebnisbildschirm „GEWONNEN!"
      tone(523.25, 0.15, { type: 'triangle', gain: 0.45 })
      tone(659.25, 0.15, { type: 'triangle', gain: 0.45, delay: 0.13 })
      tone(783.99, 0.15, { type: 'triangle', gain: 0.45, delay: 0.26 })
      tone(1046.5, 0.45, { type: 'triangle', gain: 0.5, delay: 0.39 })
      break
    case 'lose':
      // Zwei fallende Töne — nicht traurig, nur „schade". Fynnox tröstet daneben.
      tone(392, 0.18, { type: 'triangle', gain: 0.36 })
      tone(311.13, 0.34, { type: 'triangle', gain: 0.34, delay: 0.15 })
      break
    case 'reward':
      // Münzklingeln: Grundton plus Oberton kurz danach.
      tone(783.99, 0.1, { type: 'triangle', gain: 0.45 })
      tone(1046.5, 0.14, { type: 'sine', gain: 0.28, delay: 0.06 })
      tone(1318.5, 0.2, { type: 'sine', gain: 0.22, delay: 0.13 })
      break
    case 'chest':
      noise(0.18, { gain: 0.35, cutoff: 1600 })
      tone(392, 0.16, { type: 'triangle', gain: 0.4, delay: 0.05 })
      tone(523.25, 0.16, { type: 'triangle', gain: 0.4, delay: 0.16 })
      tone(783.99, 0.36, { type: 'triangle', gain: 0.45, delay: 0.27 })
      break
    case 'purchase':
      tone(659.25, 0.09, { type: 'square', gain: 0.24 })
      tone(987.77, 0.16, { type: 'triangle', gain: 0.3, delay: 0.08 })
      break
  }
}

function ensureMusic(): HTMLAudioElement {
  if (!music) {
    music = new Audio(MUSIC_SRC)
    music.loop = true
    music.volume = MUSIC_VOLUME
    // Kein `preload`: Die Datei ist 4 MB groß und soll erst laden, wenn der
    // Schalter „Musik" wirklich an ist.
    music.preload = 'none'
  }
  return music
}

function syncMusic(): void {
  if (musicOn && armed) {
    // Ein abgelehntes play() ist kein Fehler — die nächste Geste versucht es erneut.
    void ensureMusic().play().catch(() => {})
  } else {
    music?.pause()
  }
}

/**
 * Übernimmt die Schalterstellung aus dem Spielstand. Wird aus der Oberfläche
 * aufgerufen, sobald der Spielstand da ist oder ein Schalter umgelegt wird.
 */
export function applyAudioSettings(settings: { sound: boolean; music: boolean }): void {
  soundOn = settings.sound
  musicOn = settings.music
  syncMusic()
}

/**
 * Gibt den Ton nach der ersten Nutzergeste frei und startet die Musik.
 * Meldet einen Aufräumer zurück, damit React den Zuhörer abmelden kann.
 *
 * `pointerdown` statt `click`: Ton verändert nichts am Layout, anders als der
 * Vollbildwechsel in `fullscreen.ts` — hier darf es so früh wie möglich sein.
 */
export function armAudioOnFirstGesture(): () => void {
  if (typeof window === 'undefined') return () => {}

  const arm = () => {
    armed = true
    syncMusic()
    window.removeEventListener('pointerdown', arm)
    window.removeEventListener('keydown', arm)
  }
  window.addEventListener('pointerdown', arm)
  window.addEventListener('keydown', arm)
  return () => {
    window.removeEventListener('pointerdown', arm)
    window.removeEventListener('keydown', arm)
  }
}

/** Nur für Tests: setzt das Modul auf den Ausgangszustand zurück. */
export function resetAudioForTest(): void {
  soundOn = true
  musicOn = true
  armed = false
  music = null
  ctx = null
  master = null
}
