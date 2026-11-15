import { describe, expect, it } from 'vitest'
import { beatenRecords, computeRecords, estimateOneRepMax, type RecordSet } from './records'

// Datos inventados.
const s = (reps: number | null, weight_kg: number | null, set_type = 'normal'): RecordSet => ({ reps, weight_kg, set_type })

describe('estimateOneRepMax', () => {
  it('aplica Epley hasta 12 reps', () => {
    expect(estimateOneRepMax(30, 10)).toBe(40)
    expect(estimateOneRepMax(30, 12)).toBeCloseTo(42)
    expect(estimateOneRepMax(30, 13)).toBeNull()
    expect(estimateOneRepMax(null, 10)).toBeNull()
    expect(estimateOneRepMax(30, null)).toBeNull()
  })
})

describe('computeRecords', () => {
  it('saca mejor peso, mejor 1RM y más reps por peso, sin calentamiento ni series por tiempo', () => {
    const r = computeRecords([s(10, 30), s(5, 35), s(12, 30), s(20, 100, 'warmup'), s(null, 50), s(15, null)])
    expect(r.weight).toBe(35)
    expect(r.oneRepMax).toBeCloseTo(42) // 30 × 12
    expect(r.repsByWeight).toEqual(new Map([[30, 12], [35, 5], [0, 15]]))
  })
})

describe('beatenRecords', () => {
  const records = computeRecords([s(10, 30), s(6, 35)])

  it('detecta cada tipo de récord', () => {
    expect(beatenRecords(s(1, 40), records)).toEqual(['weight']) // 1RM 41,3 < 42 (35 × 6)
    expect(beatenRecords(s(3, 40), records)).toEqual(['weight', 'oneRepMax'])
    expect(beatenRecords(s(12, 35), records)).toEqual(['oneRepMax', 'reps'])
    expect(beatenRecords(s(11, 30), records)).toEqual(['reps'])
  })

  it('igualar no es récord', () => {
    expect(beatenRecords(s(10, 30), records)).toEqual([])
  })

  it('la primera vez de un ejercicio o de un peso no es récord', () => {
    expect(beatenRecords(s(10, 30), computeRecords([]))).toEqual([])
    expect(beatenRecords(s(20, 25), records)).toEqual([])
  })

  it('calentamiento y series por tiempo nunca son récord', () => {
    expect(beatenRecords(s(3, 50, 'warmup'), records)).toEqual([])
    expect(beatenRecords(s(null, 50), records)).toEqual([])
  })

  it('sin peso: récord de reps', () => {
    const bodyweight = computeRecords([s(12, null)])
    expect(beatenRecords(s(13, null), bodyweight)).toEqual(['reps'])
  })
})
