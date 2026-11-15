import { describe, expect, it } from 'vitest'
import { nextRoutine } from './cycle'

const r = (id: string, position: number, active = true) => ({ id, position, active })
const next = (...args: Parameters<typeof nextRoutine>) => nextRoutine(...args)?.id ?? null

describe('nextRoutine', () => {
  const cycle = [r('pierna', 2), r('empuje', 0), r('tiron', 1)]

  it('toca la siguiente del ciclo y vuelve al principio', () => {
    expect(next(cycle, 'empuje')).toBe('tiron')
    expect(next(cycle, 'tiron')).toBe('pierna')
    expect(next(cycle, 'pierna')).toBe('empuje')
  })

  it('sin sesiones previas, o si la última rutina ya no existe, toca la primera', () => {
    expect(next(cycle, null)).toBe('empuje')
    expect(next(cycle, 'borrada')).toBe('empuje')
  })

  it('saltea las archivadas', () => {
    expect(next([r('a', 0), r('b', 1, false), r('c', 2)], 'a')).toBe('c')
  })

  it('si la última fue archivada, sigue desde su lugar', () => {
    expect(next([r('a', 0), r('b', 1, false), r('c', 2)], 'b')).toBe('c')
  })

  it('una sola rutina se repite', () => {
    expect(next([r('full', 0)], 'full')).toBe('full')
  })

  it('sin rutinas activas no toca ninguna', () => {
    expect(next([], null)).toBeNull()
    expect(next([r('a', 0, false)], 'a')).toBeNull()
  })

  it('con posiciones repetidas respeta el orden de la lista', () => {
    expect(next([r('a', 0), r('b', 0)], 'a')).toBe('b')
  })
})
