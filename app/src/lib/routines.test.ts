import { describe, expect, it } from 'vitest'
import { moveItem, positionChanges, recipeToItems, toRecipeRows, type RecipeItem } from './routines'

describe('moveItem', () => {
  it('sube y baja un elemento', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
  })

  it('en los bordes no cambia nada', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
  })

  it('no modifica la lista original', () => {
    const list = ['a', 'b']
    moveItem(list, 0, 1)
    expect(list).toEqual(['a', 'b'])
  })
})

describe('positionChanges', () => {
  it('devuelve solo las filas cuya posición no coincide con su lugar', () => {
    const list = [{ id: 'b', position: 1 }, { id: 'a', position: 0 }, { id: 'c', position: 2 }]
    expect(positionChanges(list)).toEqual([{ id: 'b', position: 0 }, { id: 'a', position: 1 }])
  })

  it('arregla posiciones repetidas o con huecos', () => {
    expect(positionChanges([{ id: 'a', position: 0 }, { id: 'b', position: 0 }, { id: 'c', position: 7 }]))
      .toEqual([{ id: 'b', position: 1 }, { id: 'c', position: 2 }])
  })
})

const item = (extra: Partial<RecipeItem> = {}): RecipeItem => ({
  exercise_id: 'press', target_sets: '3', rep_min: '8', rep_max: '12', default_set_type: 'normal', rest_s: '90', superset: '',
  ...extra,
})

describe('toRecipeRows', () => {
  it('arma las filas en el orden de la lista, con vacíos como null', () => {
    const result = toRecipeRows('r1', [item(), item({ exercise_id: 'remo', target_sets: '', rep_min: '', rep_max: '', rest_s: '0', superset: '2', default_set_type: 'warmup' })])
    expect(result).toEqual({
      rows: [
        { routine_id: 'r1', exercise_id: 'press', position: 0, target_sets: 3, rep_min: 8, rep_max: 12, default_set_type: 'normal', rest_s: 90, superset_group: null },
        { routine_id: 'r1', exercise_id: 'remo', position: 1, target_sets: null, rep_min: null, rep_max: null, default_set_type: 'warmup', rest_s: 0, superset_group: 2 },
      ],
    })
  })

  it('rechaza números inválidos y series o reps en 0', () => {
    for (const bad of [{ target_sets: '0' }, { rep_min: '0' }, { rep_max: '8,5' }, { rest_s: '-10' }, { target_sets: 'tres' }]) {
      expect(toRecipeRows('r1', [item(bad)]), JSON.stringify(bad)).toEqual({ error: 'invalidRecipe' })
    }
  })

  it('el mínimo de reps no puede superar al máximo', () => {
    expect(toRecipeRows('r1', [item({ rep_min: '12', rep_max: '8' })])).toEqual({ error: 'invalidRepRange' })
    expect(toRecipeRows('r1', [item({ rep_min: '12', rep_max: '' })])).toHaveProperty('rows')
  })
})

describe('recipeToItems', () => {
  it('ida y vuelta con toRecipeRows, ordenando por posición', () => {
    const items = [item(), item({ exercise_id: 'remo', rest_s: '', superset: '1' })]
    const result = toRecipeRows('r1', items)
    if (!('rows' in result)) throw new Error('inválido')
    expect(recipeToItems([...result.rows].reverse())).toEqual(items)
  })
})
