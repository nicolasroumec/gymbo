import { describe, expect, it } from 'vitest'
import { parseDecimal, parseWholeNumber } from './numbers'

describe('parseDecimal', () => {
  it('acepta coma y punto', () => {
    expect(parseDecimal('2,5')).toBe(2.5)
    expect(parseDecimal('2.5')).toBe(2.5)
    expect(parseDecimal(' 20 ')).toBe(20)
    expect(parseDecimal(',5')).toBe(0.5)
    expect(parseDecimal('5,')).toBe(5)
  })

  it('vacío, negativo o basura da null', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('-2')).toBeNull()
    expect(parseDecimal('2,5,1')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('2 kg')).toBeNull()
  })
})

describe('parseWholeNumber', () => {
  it('acepta enteros no negativos', () => {
    expect(parseWholeNumber(' 10000 ')).toBe(10000)
    expect(parseWholeNumber('0')).toBe(0)
  })

  it('decimal, negativo, vacío o basura da null', () => {
    for (const bad of ['', '2,5', '2.5', '-3', '10k']) expect(parseWholeNumber(bad), bad).toBeNull()
  })
})
