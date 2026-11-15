import type { Lang } from './i18n'

// "2026-01-08" como fecha local. new Date("2026-01-08") la toma en UTC y en Argentina mostraría el 7.
export function localDate(date: string): Date {
  return new Date(`${date}T00:00`)
}

export function formatDate(date: string, lang: Lang): string {
  return localDate(date).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// Nombres de los ejercicios de una sesión, en el orden en que se hicieron y sin repetir.
export function exerciseNames(sets: { position: number; exercises: { name: string } | null }[]): string {
  const ordered = [...sets].sort((a, b) => a.position - b.position)
  return [...new Set(ordered.map((s) => s.exercises?.name).filter(Boolean))].join(' · ')
}
