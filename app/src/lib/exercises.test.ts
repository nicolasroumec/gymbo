import { describe, expect, it } from 'vitest'
import { filterExercises } from './exercises'

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
