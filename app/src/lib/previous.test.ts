import { describe, expect, it } from 'vitest'
import { previousSets, type PastSet } from './previous'

// Datos inventados.
function set(workout_id: string, date: string, exercise_id: string, set_number: number, extra: Partial<PastSet> = {}): PastSet {
  return {
    workout_id, date, exercise_id, set_number,
    workout_created_at: `${date}T10:00:00+00:00`,
    routine_id: null, reps: 8, seconds: null, weight_kg: 20, set_type: 'normal',
    ...extra,
  }
}

const numbers = (sets: PastSet[] | undefined) => sets?.map((s) => `${s.workout_id}#${s.set_number}`)

describe('previousSets', () => {
  it('toma la última sesión de cada ejercicio, ordenada por número de serie', () => {
    const result = previousSets([
      set('w1', '2026-01-01', 'press', 1),
      set('w2', '2026-01-08', 'press', 2),
      set('w2', '2026-01-08', 'press', 1),
      set('w1', '2026-01-01', 'remo', 1),
    ], null)
    expect(numbers(result.get('press'))).toEqual(['w2#1', 'w2#2'])
    expect(numbers(result.get('remo'))).toEqual(['w1#1'])
    expect(result.get('sentadilla')).toBeUndefined()
  })

  it('prefiere la misma rutina aunque haya una sesión más nueva de otra', () => {
    const history = [
      set('wA', '2026-01-01', 'press', 1, { routine_id: 'empuje' }),
      set('wB', '2026-01-05', 'press', 1, { routine_id: 'torso' }),
    ]
    expect(numbers(previousSets(history, 'empuje').get('press'))).toEqual(['wA#1'])
    expect(numbers(previousSets(history, 'piernas').get('press'))).toEqual(['wB#1'])
  })

  it('dos sesiones el mismo día: gana la creada después', () => {
    const result = previousSets([
      set('tarde', '2026-01-01', 'press', 1, { workout_created_at: '2026-01-01T20:00:00+00:00' }),
      set('mañana', '2026-01-01', 'press', 1, { workout_created_at: '2026-01-01T09:00:00+00:00' }),
    ], null)
    expect(numbers(result.get('press'))).toEqual(['tarde#1'])
  })
})
