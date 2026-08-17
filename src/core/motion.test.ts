import { describe, expect, it } from 'vitest'
import { countUpValue, motionAllowed } from './motion'

describe('motionAllowed', () => {
  it('erlaubt Bewegung nur, wenn beide Quellen einverstanden sind', () => {
    expect(motionAllowed(false, false)).toBe(true)
    expect(motionAllowed(true, false)).toBe(false)
    expect(motionAllowed(false, true)).toBe(false)
    expect(motionAllowed(true, true)).toBe(false)
  })

  it('lässt sich vom Schalter nicht über die Systemeinstellung hinwegsetzen', () => {
    // Der Kern der Regel: „Bewegung reduzieren" am Gerät sticht immer.
    expect(motionAllowed(false, true)).toBe(false)
  })
})

describe('countUpValue', () => {
  it('beginnt bei 0 und endet genau auf dem Zielwert', () => {
    expect(countUpValue(1000, 0)).toBe(0)
    expect(countUpValue(1000, 1)).toBe(1000)
  })

  it('überschreitet den Zielwert auch bei zu großem Fortschritt nicht', () => {
    expect(countUpValue(1000, 1.5)).toBe(1000)
    expect(countUpValue(1000, -0.2)).toBe(0)
  })

  it('läuft weich aus — die zweite Hälfte legt weniger zu als die erste', () => {
    const firstHalf = countUpValue(1000, 0.5)
    expect(firstHalf).toBeGreaterThan(500)
    expect(1000 - firstHalf).toBeLessThan(firstHalf)
  })

  it('steigt an keiner Stelle wieder ab', () => {
    let last = 0
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const value = countUpValue(750, p)
      expect(value).toBeGreaterThanOrEqual(last)
      last = value
    }
  })

  it('liefert immer ganze Zahlen', () => {
    for (let p = 0; p <= 1; p += 0.1) {
      expect(Number.isInteger(countUpValue(137, p))).toBe(true)
    }
  })

  it('kommt mit einer Belohnung von 0 zurecht', () => {
    expect(countUpValue(0, 0.5)).toBe(0)
    expect(countUpValue(0, 1)).toBe(0)
  })
})
