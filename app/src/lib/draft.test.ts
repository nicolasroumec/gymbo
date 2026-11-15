import { describe, expect, it } from 'vitest'
import { draftToRows, parseDraft, toggleDone, type Draft, type DraftSet } from './draft'
import type { PastSet } from './previous'

// Datos inventados.
const past = (extra: Partial<PastSet>): PastSet => ({
  workout_id: 'w0', date: '2026-01-01', workout_created_at: '2026-01-01T10:00:00+00:00', routine_id: null,
  exercise_id: 'press', set_number: 1, reps: 8, seconds: null, weight_kg: 22.5, set_type: 'normal', ...extra,
})
const set = (kg: string, reps: string, done = true): DraftSet => ({ kg, reps, done })
const draft = (...exercises: DraftSet[][]): Draft => ({
  workout_id: 'w1', date: '2026-01-08',
  exercises: exercises.map((sets, i) => ({ exercise_id: `e${i}`, sets })),
})

describe('parseDraft', () => {
  it('recupera un borrador guardado', () => {
    const d = draft([set('20', '8')])
    expect(parseDraft(JSON.stringify(d))).toEqual(d)
  })

  it('descarta lo que no es un borrador', () => {
    for (const bad of [null, '', '{roto', '"texto"', '{"date":"2026-01-01"}']) {
      expect(parseDraft(bad), String(bad)).toBeNull()
    }
  })
})

describe('toggleDone', () => {
  it('al tildar copia lo anterior solo en los campos vacíos', () => {
    expect(toggleDone(set('', '', false), past({}))).toEqual(set('22,5', '8'))
    expect(toggleDone(set('25', '', false), past({}))).toEqual(set('25', '8'))
    expect(toggleDone(set('', '', false), past({ reps: null, seconds: 40, weight_kg: null }))).toEqual(set('', '40s'))
    expect(toggleDone(set('', '', false), undefined)).toEqual(set('', ''))
  })

  it('al destildar deja los valores', () => {
    expect(toggleDone(set('20', '8'), past({}))).toEqual(set('20', '8', false))
  })
})

describe('draftToRows', () => {
  it('guarda solo las tildadas, numeradas desde 1 por ejercicio', () => {
    const result = draftToRows(draft([set('20', '8'), set('20', '6', false), set('2,5', '6')], [set('', '35s')]))
    expect(result).toEqual({
      rows: [
        { workout_id: 'w1', exercise_id: 'e0', position: 0, set_number: 1, reps: 8, seconds: null, weight_kg: 20 },
        { workout_id: 'w1', exercise_id: 'e0', position: 0, set_number: 2, reps: 6, seconds: null, weight_kg: 2.5 },
        { workout_id: 'w1', exercise_id: 'e1', position: 1, set_number: 1, reps: null, seconds: 35, weight_kg: null },
      ],
    })
  })

  it('sin series tildadas no hay nada que guardar', () => {
    expect(draftToRows(draft([set('20', '8', false)]))).toEqual({ error: 'noSetsDone' })
    expect(draftToRows(draft())).toEqual({ error: 'noSetsDone' })
  })

  it('una serie tildada con datos inválidos frena el guardado', () => {
    for (const bad of [set('20', ''), set('20', '8,5'), set('abc', '8'), set('-5', '8')]) {
      expect(draftToRows(draft([bad])), JSON.stringify(bad)).toEqual({ error: 'invalidSet' })
    }
  })
})
