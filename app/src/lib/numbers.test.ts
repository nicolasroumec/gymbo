import { describe, expect, it } from 'vitest'
import { parseDecimal } from './numbers'

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
