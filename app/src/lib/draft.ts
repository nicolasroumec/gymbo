import type { Texts } from './i18n'
import { parseDecimal } from './numbers'
import type { PastSet } from './previous'
import { readPref, writePref } from './storage'

// La sesión en curso tal cual se ve en pantalla: los campos son texto, como los escribió el usuario.
export type DraftSet = { kg: string; reps: string; done: boolean }
export type DraftExercise = { exercise_id: string; sets: DraftSet[] }
// workout_id se genera al empezar: guardar dos veces (reintento tras un corte) pisa la misma sesión.
export type Draft = { workout_id: string; date: string; exercises: DraftExercise[] }

export const emptySet = (): DraftSet => ({ kg: '', reps: '', done: false })

// Lo guardado en localStorage puede venir roto o de una versión vieja: si no tiene la forma esperada, se descarta.
export function parseDraft(json: string | null): Draft | null {
  try {
    const d = JSON.parse(json ?? '')
    if (typeof d?.workout_id === 'string' && typeof d.date === 'string' && Array.isArray(d.exercises)) return d
  } catch {
    // JSON inválido
  }
  return null
}

export const loadDraft = () => parseDraft(readPref('draft'))
export const saveDraft = (draft: Draft) => writePref('draft', JSON.stringify(draft))

// Una serie anterior como texto de los campos: kg con coma, reps o "35s" si fue por tiempo.
export function pastValues(p: PastSet | undefined): { kg: string; reps: string } {
  if (!p) return { kg: '', reps: '' }
  return {
    kg: p.weight_kg == null ? '' : String(p.weight_kg).replace('.', ','),
    reps: p.seconds != null ? `${p.seconds}s` : String(p.reps ?? ''),
  }
}

// Tildar ✓ copia lo de la vez anterior en los campos vacíos; destildar no borra nada.
export function toggleDone(set: DraftSet, prev: PastSet | undefined): DraftSet {
  if (set.done) return { ...set, done: false }
  const p = pastValues(prev)
  return { kg: set.kg.trim() || p.kg, reps: set.reps.trim() || p.reps, done: true }
}

export type SetRow = {
  workout_id: string
  exercise_id: string
  position: number
  set_number: number
  reps: number | null
  seconds: number | null
  weight_kg: number | null
}

// Filas de workout_sets a guardar: solo las series tildadas, numeradas de nuevo desde 1 en cada ejercicio.
export function draftToRows(draft: Draft): { rows: SetRow[] } | { error: keyof Texts } {
  const rows: SetRow[] = []
  for (const [position, ex] of draft.exercises.entries()) {
    let setNumber = 0
    for (const s of ex.sets.filter((x) => x.done)) {
      const amount = /^(\d+)(s?)$/i.exec(s.reps.trim())
      const kg = s.kg.trim() ? parseDecimal(s.kg) : null
      if (!amount || (s.kg.trim() && kg === null)) return { error: 'invalidSet' }
      const n = Number(amount[1])
      rows.push({
        workout_id: draft.workout_id,
        exercise_id: ex.exercise_id,
        position,
        set_number: ++setNumber,
        reps: amount[2] ? null : n,
        seconds: amount[2] ? n : null,
        weight_kg: kg,
      })
    }
  }
  return rows.length ? { rows } : { error: 'noSetsDone' }
}
