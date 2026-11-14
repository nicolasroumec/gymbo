import { describe, expect, it } from 'vitest'
import { filterExercises, toExerciseRow } from './exercises'

const list = [
  { name: 'Press plano', muscle_group_id: 'chest', archived: false },
  { name: 'Curl bíceps', muscle_group_id: 'arms', archived: false },
  { name: 'Aperturas', muscle_group_id: 'chest', archived: true },
  { name: 'Dominadas', muscle_group_id: 'back', archived: false },
]
const names = (r: typeof list) => r.map((e) => e.name)

describe('filterExercises', () => {
  it('oculta archivados y ordena por nombre', () => {
    expect(names(filterExercises(list, '', null, false))).toEqual(['Curl bíceps', 'Dominadas', 'Press plano'])
    expect(names(filterExercises(list, '', null, true))).toEqual(['Aperturas', 'Curl bíceps', 'Dominadas', 'Press plano'])
  })

  it('busca sin mayúsculas ni tildes', () => {
    expect(names(filterExercises(list, 'BICEPS', null, false))).toEqual(['Curl bíceps'])
    expect(names(filterExercises(list, ' press ', null, false))).toEqual(['Press plano'])
  })

  it('filtra por grupo', () => {
    expect(names(filterExercises(list, '', 'chest', true))).toEqual(['Aperturas', 'Press plano'])
    expect(names(filterExercises(list, 'dom', 'chest', true))).toEqual([])
  })
})

describe('toExerciseRow', () => {
  const base = {
    name: ' Press plano ',
    muscleGroupId: 'chest',
    equipment: '' as const,
    weightStep: '',
    videoUrl: '',
    videoStart: '',
    notes: '',
  }

  it('opcionales vacíos quedan en null', () => {
    expect(toExerciseRow(base)).toEqual({
      row: {
        name: 'Press plano',
        muscle_group_id: 'chest',
        equipment: null,
        weight_step: null,
        video_url: null,
        video_start_s: null,
        notes: null,
      },
    })
  })

  it('convierte decimal con coma, minuto y link', () => {
    const r = toExerciseRow({
      ...base,
      equipment: 'barbell',
      weightStep: '2,5',
      videoUrl: 'https://youtu.be/abc',
      videoStart: '1:30',
      notes: ' asiento en 4 ',
    })
    expect(r).toMatchObject({
      row: { equipment: 'barbell', weight_step: 2.5, video_url: 'https://youtu.be/abc', video_start_s: 90, notes: 'asiento en 4' },
    })
  })

  it('rechaza datos inválidos', () => {
    expect(toExerciseRow({ ...base, name: '  ' })).toEqual({ error: 'requiredFields' })
    expect(toExerciseRow({ ...base, muscleGroupId: '' })).toEqual({ error: 'requiredFields' })
    expect(toExerciseRow({ ...base, weightStep: 'abc' })).toEqual({ error: 'invalidWeightStep' })
    expect(toExerciseRow({ ...base, weightStep: '0' })).toEqual({ error: 'invalidWeightStep' })
    expect(toExerciseRow({ ...base, videoStart: '1:75' })).toEqual({ error: 'invalidTime' })
    expect(toExerciseRow({ ...base, videoUrl: 'javascript:alert(1)' })).toEqual({ error: 'invalidLink' })
  })
})
