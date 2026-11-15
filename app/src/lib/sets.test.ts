import { describe, expect, it } from 'vitest'
import { format, parse, type NotationSet } from './sets'

const r = (reps: number, weight_kg: number | null = null): NotationSet => ({ reps, seconds: null, weight_kg })
const s = (seconds: number, weight_kg: number | null = null): NotationSet => ({ reps: null, seconds, weight_kg })

// La tabla de "Notación de series" de la especificación: entrada, series, forma canónica.
const examples: [string, NotationSet[], string][] = [
  ['8-6-4 x 20', [r(8, 20), r(6, 20), r(4, 20)], '8-6-4 x 20'],
  ['10 x 32 7 x 37', [r(10, 32), r(7, 37)], '10 x 32 7 x 37'],
  ['8-8', [r(8), r(8)], '8-8'],
  ['8-8-', [r(8), r(8)], '8-8'],
  ['5-5 x 2,5', [r(5, 2.5), r(5, 2.5)], '5-5 x 2,5'],
  ['5-5 x 2.5', [r(5, 2.5), r(5, 2.5)], '5-5 x 2,5'],
  ['35s-30s-22s', [s(35), s(30), s(22)], '35s-30s-22s'],
  ['40s x 20', [s(40, 20)], '40s x 20'],
]

describe('parse', () => {
  it.each(examples)('%s', (input, sets) => {
    expect(parse(input)).toEqual(sets)
  })

  it('tolera espacios, mayúsculas y ×', () => {
    expect(parse('  8 - 6 X20 ')).toEqual([r(8, 20), r(6, 20)])
    expect(parse('10×32')).toEqual([r(10, 32)])
  })

  it('vacío da lista vacía', () => {
    expect(parse('')).toEqual([])
    expect(parse('   ')).toEqual([])
  })

  it('basura da null', () => {
    for (const bad of ['abc', 'x 20', '8 x', '8--6', '8s5', '8 x 2,5,1', '-8', '8 x -2']) {
      expect(parse(bad), bad).toBeNull()
    }
  })
})

describe('format', () => {
  it.each(examples)('ida y vuelta: %s', (input, _sets, canonical) => {
    expect(format(parse(input)!)).toBe(canonical)
  })

  it('junta series seguidas con el mismo peso y separa las que no', () => {
    expect(format([r(8, 20), r(8, 20), r(6, 25), r(4, 20)])).toBe('8-8 x 20 6 x 25 4 x 20')
    expect(format([])).toBe('')
  })
})
