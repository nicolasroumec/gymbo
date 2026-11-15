import type { Texts } from './i18n'
import { parseDecimal } from './numbers'
import type { PastSet } from './previous'
import { readPref, writePref } from './storage'

// La sesión en curso tal cual se ve en pantalla: los campos son texto, como los escribió el usuario.
// Los campos opcionales pueden faltar en borradores guardados antes de que existieran.
export const SET_TYPES = ['normal', 'warmup', 'drop', 'failure', 'rest_pause'] as const
export type SetType = (typeof SET_TYPES)[number]
export const TEMPOS = ['slow', 'explosive', 'pause'] as const
export type Tempo = (typeof TEMPOS)[number]

export type DraftSet = { kg: string; reps: string; done: boolean; set_type?: SetType }
// tempo va por ejercicio (como lo anotaba el Excel) y se guarda en cada serie; superset = mismo número, se muestran juntos.
export type DraftExercise = { exercise_id: string; sets: DraftSet[]; tempo?: Tempo | null; superset?: number | null }
// workout_id se genera al empezar: guardar dos veces (reintento tras un corte) pisa la misma sesión.
export type Draft = { workout_id: string; date: string; exercises: DraftExercise[] }

export const emptySet = (set_type: SetType = 'normal'): DraftSet => ({ kg: '', reps: '', done: false, set_type })

// Tocar el número de serie pasa al tipo siguiente: normal → C → D → F → RP → normal.
export function nextSetType(current: SetType | undefined): SetType {
  return SET_TYPES[(SET_TYPES.indexOf(current ?? 'normal') + 1) % SET_TYPES.length]
}

// Reordena para que los ejercicios de una misma superserie queden juntos, donde aparece el primero. Orden estable.
export function groupSupersets(exercises: DraftExercise[]): DraftExercise[] {
  const firstIndex = (e: DraftExercise, i: number) =>
    e.superset == null ? i : exercises.findIndex((x) => x.superset === e.superset)
  return exercises
    .map((e, i) => ({ e, i, key: firstIndex(e, i) }))
    .sort((a, b) => a.key - b.key || a.i - b.i)
    .map((x) => x.e)
}

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
  return { ...set, kg: set.kg.trim() || p.kg, reps: set.reps.trim() || p.reps, done: true }
}

export type SetRow = {
  workout_id: string
  exercise_id: string
  position: number
  set_number: number
  reps: number | null
  seconds: number | null
  weight_kg: number | null
  set_type: SetType
  tempo: Tempo | null
  superset_group: number | null
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
        set_type: s.set_type ?? 'normal',
        tempo: ex.tempo ?? null,
        superset_group: ex.superset ?? null,
      })
    }
  }
  return rows.length ? { rows } : { error: 'noSetsDone' }
}
