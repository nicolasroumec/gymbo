import { describe, expect, it } from 'vitest'
import { exerciseNames, localDate } from './history'

describe('localDate', () => {
  it('toma la fecha en hora local, no en UTC', () => {
    const d = localDate('2026-01-08')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 0, 8, 0])
  })
})

describe('exerciseNames', () => {
  it('ordena por posición y no repite', () => {
    const sets = [
      { position: 1, exercises: { name: 'Remo' } },
      { position: 0, exercises: { name: 'Press' } },
      { position: 0, exercises: { name: 'Press' } },
      { position: 2, exercises: null },
    ]
    expect(exerciseNames(sets)).toBe('Press · Remo')
  })
})
