import { describe, expect, it } from 'vitest'
import { toggleField } from './activities'

describe('toggleField', () => {
  it('agrega en el orden fijo y saca si ya estaba', () => {
    expect(toggleField(['km'], 'minutes')).toEqual(['minutes', 'km'])
    expect(toggleField(['minutes', 'km'], 'minutes')).toEqual(['km'])
    expect(toggleField([], 'best_streak')).toEqual(['best_streak'])
  })

  it('descarta valores desconocidos', () => {
    expect(toggleField(['otro', 'rounds'], 'km')).toEqual(['km', 'rounds'])
  })
})
