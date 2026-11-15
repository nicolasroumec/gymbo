import { describe, expect, it } from 'vitest'
import { filledFields, readActivity, ropeTimes, toggleField } from './activities'

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

describe('readActivity', () => {
  it('lee solo los campos del tipo, con coma decimal en minutos y km', () => {
    const result = readActivity(['minutes', 'km'], { minutes: '45,5', km: '5', rounds: '10' })
    expect(result).toEqual({ values: { minutes: 45.5, km: 5, rounds: null, work_s: null, rest_s: null, jumps: null, best_streak: null } })
  })

  it('vacío es null: se puede anotar solo que se hizo', () => {
    expect(readActivity(['minutes'], {})).toEqual({
      values: { minutes: null, km: null, rounds: null, work_s: null, rest_s: null, jumps: null, best_streak: null },
    })
  })

  it('un campo inválido frena el guardado', () => {
    for (const form of [{ rounds: '2,5' }, { rounds: 'diez' }, { minutes: '-5' }, { km: '1,2,3' }]) {
      expect(readActivity(['minutes', 'km', 'rounds'], form), JSON.stringify(form)).toEqual({ error: 'invalidActivity' })
    }
  })
})

describe('ropeTimes', () => {
  it('no cuenta el descanso después de la última ronda', () => {
    expect(ropeTimes(10, 30, 30)).toEqual({ jumpS: 300, totalS: 570 })
    expect(ropeTimes(1, 60, 30)).toEqual({ jumpS: 60, totalS: 60 })
    expect(ropeTimes(5, 40, null)).toEqual({ jumpS: 200, totalS: 200 })
  })

  it('sin rondas o sin segundos de salto no hay cálculo', () => {
    expect(ropeTimes(null, 30, 30)).toBeNull()
    expect(ropeTimes(10, null, 30)).toBeNull()
  })
})

describe('filledFields', () => {
  it('devuelve los campos con valor en orden fijo', () => {
    expect(filledFields({ km: 5, minutes: 30, jumps: null })).toEqual([['minutes', 30], ['km', 5]])
  })
})
