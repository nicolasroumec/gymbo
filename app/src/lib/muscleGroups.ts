import type { Lang } from './i18n'

export const BLOCKS = ['push', 'pull', 'legs', 'core', 'other'] as const
export type Block = (typeof BLOCKS)[number]

// Grupos que se ofrecen cargar cuando la lista está vacía; después son datos del usuario y no se traducen.
const SUGGESTED: { block: Block; es: string; en: string }[] = [
  { block: 'push', es: 'Pecho', en: 'Chest' },
  { block: 'push', es: 'Hombros', en: 'Shoulders' },
  { block: 'push', es: 'Tríceps', en: 'Triceps' },
  { block: 'pull', es: 'Espalda', en: 'Back' },
  { block: 'pull', es: 'Bíceps', en: 'Biceps' },
  { block: 'pull', es: 'Antebrazos', en: 'Forearms' },
  { block: 'legs', es: 'Cuádriceps', en: 'Quads' },
  { block: 'legs', es: 'Isquiotibiales', en: 'Hamstrings' },
  { block: 'legs', es: 'Glúteos', en: 'Glutes' },
  { block: 'legs', es: 'Gemelos', en: 'Calves' },
  { block: 'core', es: 'Abdominales', en: 'Abs' },
  { block: 'other', es: 'Otro', en: 'Other' },
]

export function suggestedGroups(lang: Lang): { name: string; block: Block }[] {
  return SUGGESTED.map((g) => ({ name: g[lang], block: g.block }))
}
