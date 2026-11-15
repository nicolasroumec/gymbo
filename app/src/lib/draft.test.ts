import { describe, expect, it } from 'vitest'
import {
  draftToRows, groupSupersets, workoutToDraft, nextSetType, parseDraft, setsFromNotation, setsToNotation, toggleDone, type Draft, type DraftExercise, type DraftSet,
} from './draft'
import { format, parse } from './sets'
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

  it('conserva el tipo de serie', () => {
    expect(toggleDone({ ...set('', '', false), set_type: 'warmup' }, past({})).set_type).toBe('warmup')
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
        { workout_id: 'w1', exercise_id: 'e0', position: 0, set_number: 1, reps: 8, seconds: null, weight_kg: 20, set_type: 'normal', tempo: null, superset_group: null },
        { workout_id: 'w1', exercise_id: 'e0', position: 0, set_number: 2, reps: 6, seconds: null, weight_kg: 2.5, set_type: 'normal', tempo: null, superset_group: null },
        { workout_id: 'w1', exercise_id: 'e1', position: 1, set_number: 1, reps: null, seconds: 35, weight_kg: null, set_type: 'normal', tempo: null, superset_group: null },
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

describe('draftToRows con tipo, tempo y superserie', () => {
  it('el tipo va por serie; tempo y superserie salen del ejercicio', () => {
    const d: Draft = {
      workout_id: 'w1', date: '2026-01-08',
      exercises: [{ exercise_id: 'e0', tempo: 'slow', superset: 2, sets: [{ ...set('10', '12'), set_type: 'warmup' }, set('20', '8')] }],
    }
    const result = draftToRows(d)
    expect('rows' in result && result.rows.map((r) => [r.set_type, r.tempo, r.superset_group])).toEqual([
      ['warmup', 'slow', 2],
      ['normal', 'slow', 2],
    ])
  })
})

describe('nextSetType', () => {
  it('recorre los tipos y vuelve a normal', () => {
    expect(nextSetType(undefined)).toBe('warmup')
    expect(nextSetType('warmup')).toBe('drop')
    expect(nextSetType('rest_pause')).toBe('normal')
  })
})

describe('groupSupersets', () => {
  const ex = (id: string, superset: number | null = null): DraftExercise => ({ exercise_id: id, sets: [], superset })
  const ids = (list: DraftExercise[]) => list.map((e) => e.exercise_id)

  it('junta cada superserie donde aparece su primer ejercicio', () => {
    expect(ids(groupSupersets([ex('a', 1), ex('b'), ex('c', 1), ex('d', 2), ex('e'), ex('f', 2)]))).toEqual(['a', 'c', 'b', 'd', 'f', 'e'])
  })

  it('sin superseries no cambia el orden', () => {
    expect(ids(groupSupersets([ex('a'), ex('b'), ex('c')]))).toEqual(['a', 'b', 'c'])
  })
})

describe('atajo de notación', () => {
  it('rellena la grilla tildada y conserva el tipo de cada fila', () => {
    const current = [{ ...set('', '', false), set_type: 'warmup' as const }, set('', '', false)]
    expect(setsFromNotation(current, parse('12 x 10 8-6 x 22,5 40s')!)).toEqual([
      { kg: '10', reps: '12', done: true, set_type: 'warmup' },
      { kg: '22,5', reps: '8', done: true, set_type: 'normal' },
      { kg: '22,5', reps: '6', done: true, set_type: 'normal' },
      { kg: '', reps: '40s', done: true, set_type: 'normal' },
    ])
  })

  it('la grilla se ve como texto, salteando filas vacías o inválidas', () => {
    expect(format(setsToNotation([set('20', '8'), set('20', '6', false), set('', ''), set('abc', '5'), set('25', '4')]))).toBe('8-6 x 20 4 x 25')
  })
})

describe('workoutToDraft', () => {
  it('arma una tarjeta por ejercicio, en orden, con sus series tildadas', () => {
    const base = { reps: 8, seconds: null, weight_kg: 20, set_type: 'normal', tempo: null, superset_group: null }
    const d = workoutToDraft('w9', '2026-01-08', [
      { ...base, exercise_id: 'remo', position: 1, set_number: 1 },
      { ...base, exercise_id: 'press', position: 0, set_number: 2, weight_kg: 22.5, tempo: 'slow', superset_group: 1 },
      { ...base, exercise_id: 'press', position: 0, set_number: 1, set_type: 'warmup', tempo: 'slow', superset_group: 1 },
    ])
    expect(d).toEqual({
      workout_id: 'w9', date: '2026-01-08', editing: true,
      exercises: [
        { exercise_id: 'press', tempo: 'slow', superset: 1, sets: [
          { kg: '20', reps: '8', done: true, set_type: 'warmup' },
          { kg: '22,5', reps: '8', done: true, set_type: 'normal' },
        ] },
        { exercise_id: 'remo', tempo: null, superset: null, sets: [{ kg: '20', reps: '8', done: true, set_type: 'normal' }] },
      ],
    })
  })

  it('ida y vuelta: guardar el borrador da las mismas filas', () => {
    const rows = [
      { exercise_id: 'press', position: 0, set_number: 1, reps: null, seconds: 40, weight_kg: null, set_type: 'normal' as const, tempo: 'pause' as const, superset_group: null },
    ]
    expect(draftToRows(workoutToDraft('w9', '2026-01-08', rows))).toEqual({ rows: [{ ...rows[0], workout_id: 'w9' }] })
  })
})
