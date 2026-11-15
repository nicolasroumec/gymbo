import { describe, expect, it } from 'vitest'
import { moveItem, positionChanges } from './routines'

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
