import type { Texts } from './i18n'
import { parseDecimal } from './numbers'
import type { PastSet } from './previous'
import type { NotationSet } from './sets'
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
// editing = es una sesión ya guardada que se está corrigiendo desde el historial.
export type Draft = { workout_id: string; date: string; exercises: DraftExercise[]; editing?: boolean }

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

// Una serie como texto de los campos: kg con coma, reps o "35s" si fue por tiempo.
export function setText(s: NotationSet | undefined): { kg: string; reps: string } {
  if (!s) return { kg: '', reps: '' }
  return {
    kg: s.weight_kg == null ? '' : String(s.weight_kg).replace('.', ','),
    reps: s.seconds != null ? `${s.seconds}s` : String(s.reps ?? ''),
  }
}

// Lee los campos de una fila: reps entero o "35s", kg opcional con coma o punto. Inválido = null.
export function readSet(s: DraftSet): NotationSet | null {
  const amount = /^(\d+)(s?)$/i.exec(s.reps.trim())
  const kg = s.kg.trim() ? parseDecimal(s.kg) : null
  if (!amount || (s.kg.trim() && kg === null)) return null
  const n = Number(amount[1])
  return { reps: amount[2] ? null : n, seconds: amount[2] ? n : null, weight_kg: kg }
}

// Atajo de notación: las series escritas reemplazan la grilla, tildadas. Cada fila conserva su tipo.
export function setsFromNotation(current: DraftSet[], parsed: NotationSet[]): DraftSet[] {
  return parsed.map((p, i) => ({ ...setText(p), done: true, set_type: current[i]?.set_type ?? 'normal' }))
}

// La grilla como notación (para verla como texto): solo las filas con datos válidos.
export function setsToNotation(sets: DraftSet[]): NotationSet[] {
  return sets.map(readSet).filter((s) => s !== null)
}

// Tildar ✓ copia lo de la vez anterior en los campos vacíos; destildar no borra nada.
export function toggleDone(set: DraftSet, prev: PastSet | undefined): DraftSet {
  if (set.done) return { ...set, done: false }
  const p = setText(prev)
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
      const values = readSet(s)
      if (!values) return { error: 'invalidSet' }
      rows.push({
        ...values,
        workout_id: draft.workout_id,
        exercise_id: ex.exercise_id,
        position,
        set_number: ++setNumber,
        set_type: s.set_type ?? 'normal',
        tempo: ex.tempo ?? null,
        superset_group: ex.superset ?? null,
      })
    }
  }
  return rows.length ? { rows } : { error: 'noSetsDone' }
}

// Una serie guardada, tal como viene de workout_sets (los textos ya los valida la base con check).
export type SavedSet = Omit<SetRow, 'workout_id' | 'set_type' | 'tempo'> & { set_type: string; tempo: string | null }

// Sesión guardada → borrador para editarla con la misma grilla. Cada position es una tarjeta.
export function workoutToDraft(workout_id: string, date: string, sets: SavedSet[]): Draft {
  const sorted = [...sets].sort((a, b) => a.position - b.position || a.set_number - b.set_number)
  const exercises: DraftExercise[] = []
  let lastPosition: number | null = null
  for (const s of sorted) {
    if (s.position !== lastPosition) {
      exercises.push({ exercise_id: s.exercise_id, tempo: s.tempo as Tempo | null, superset: s.superset_group, sets: [] })
      lastPosition = s.position
    }
    exercises[exercises.length - 1].sets.push({ ...setText(s), done: true, set_type: s.set_type as SetType })
  }
  return { workout_id, date, exercises, editing: true }
}
