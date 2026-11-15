import type { Lang, Texts } from './i18n'
import { parseDecimal } from './numbers'

// Campos que puede pedir un tipo de actividad: mismos nombres que las columnas de activities y que el check de activity_types.fields.
export const ACTIVITY_FIELDS = ['minutes', 'km', 'rounds', 'work_s', 'rest_s', 'jumps', 'best_streak'] as const
export type ActivityField = (typeof ACTIVITY_FIELDS)[number]

// Prende o apaga un campo, dejando siempre el orden de ACTIVITY_FIELDS (así el formulario sale igual para todos los tipos).
export function toggleField(fields: readonly string[], field: ActivityField): ActivityField[] {
  return ACTIVITY_FIELDS.filter((f) => (f === field ? !fields.includes(f) : fields.includes(f)))
}

// Tipos que se ofrecen cargar cuando la lista está vacía; después son datos del usuario y no se traducen.
const SUGGESTED: { es: string; en: string; fields: ActivityField[] }[] = [
  { es: 'Fútbol', en: 'Football', fields: ['minutes'] },
  { es: 'Pádel', en: 'Padel', fields: ['minutes'] },
  { es: 'HIIT', en: 'HIIT', fields: ['minutes'] },
  { es: 'Bici', en: 'Cycling', fields: ['minutes', 'km'] },
  { es: 'Movilidad', en: 'Mobility', fields: ['minutes'] },
  { es: 'Running', en: 'Running', fields: ['minutes', 'km'] },
  { es: 'Soga', en: 'Jump rope', fields: ['rounds', 'work_s', 'rest_s', 'jumps', 'best_streak'] },
]

export function suggestedActivityTypes(lang: Lang): { name: string; fields: ActivityField[] }[] {
  return SUGGESTED.map((s) => ({ name: s[lang], fields: s.fields }))
}

// minutes y km aceptan decimales con coma o punto; el resto son enteros.
const DECIMAL_FIELDS: readonly ActivityField[] = ['minutes', 'km']

export type ActivityValues = Record<ActivityField, number | null>

// Lee los campos del formulario. Solo cuenta los campos del tipo; vacío = null. Un campo inválido frena el guardado.
export function readActivity(
  fields: readonly string[],
  form: Partial<Record<ActivityField, string>>,
): { values: ActivityValues } | { error: keyof Texts } {
  const values = Object.fromEntries(ACTIVITY_FIELDS.map((f) => [f, null])) as ActivityValues
  for (const f of ACTIVITY_FIELDS) {
    const text = (form[f] ?? '').trim()
    if (!fields.includes(f) || !text) continue
    const n = DECIMAL_FIELDS.includes(f) ? parseDecimal(text) : /^\d+$/.test(text) ? Number(text) : null
    if (n === null) return { error: 'invalidActivity' }
    values[f] = n
  }
  return { values }
}

// Soga: segundos saltando y total con descansos. Después de la última ronda no hay descanso.
export function ropeTimes(rounds: number | null, workS: number | null, restS: number | null): { jumpS: number; totalS: number } | null {
  if (!rounds || !workS) return null
  const jumpS = rounds * workS
  return { jumpS, totalS: jumpS + (rounds - 1) * (restS ?? 0) }
}

// Los campos con valor de una actividad guardada, en el orden fijo, para mostrarla en una línea.
export function filledFields(row: Partial<ActivityValues>): [ActivityField, number][] {
  return ACTIVITY_FIELDS.flatMap((f) => (row[f] != null ? [[f, row[f]] as [ActivityField, number]] : []))
}
