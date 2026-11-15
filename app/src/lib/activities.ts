import type { Lang } from './i18n'

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
