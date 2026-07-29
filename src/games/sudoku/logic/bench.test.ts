import { describe, expect, it } from 'vitest'
import { countSolutions, createPuzzle, createSolution } from './grid'

/**
 * Messung, kein Regelwerk: Die Rätselerzeugung läuft beim Start jeder Runde
 * im Browser. Dauert sie zu lange, hängt die App sichtbar.
 */
describe('Geschwindigkeit', () => {
  it('erzeugt ein volles Gitter in unter 100 ms', () => {
    const t0 = performance.now()
    createSolution(1)
    const dauer = performance.now() - t0
    console.log(`  createSolution: ${dauer.toFixed(1)} ms`)
    expect(dauer).toBeLessThan(100)
  })

  it('zählt Lösungen eines vollen Gitters in unter 50 ms', () => {
    const { grid } = createSolution(1)
    const t0 = performance.now()
    countSolutions(grid)
    const dauer = performance.now() - t0
    console.log(`  countSolutions (voll): ${dauer.toFixed(1)} ms`)
    expect(dauer).toBeLessThan(50)
  })

  it('erzeugt ein leichtes Rätsel in unter 1 s', () => {
    const t0 = performance.now()
    createPuzzle(1, 'leicht')
    const dauer = performance.now() - t0
    console.log(`  createPuzzle leicht: ${dauer.toFixed(1)} ms`)
    expect(dauer).toBeLessThan(1000)
  })

  it('erzeugt ein schweres Rätsel in unter 3 s', () => {
    const t0 = performance.now()
    createPuzzle(1, 'schwer')
    const dauer = performance.now() - t0
    console.log(`  createPuzzle schwer: ${dauer.toFixed(1)} ms`)
    expect(dauer).toBeLessThan(3000)
  })
})
