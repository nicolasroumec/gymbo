import { parseDecimal } from './numbers'

// Una serie según la notación del Excel. Mismos nombres que las columnas de workout_sets.
export type NotationSet = {
  reps: number | null
  seconds: number | null
  weight_kg: number | null
}

// Un grupo: "8-6-4", "35s-30s" o "8-8-", con " x 20" opcional. Tiene que terminar en espacio o fin de texto.
const GROUP = /\s*(\d+s?(?:\s*-\s*\d+s?)*)\s*-?(?:\s*[x×]\s*(\d+(?:[.,]\d*)?|[.,]\d+))?(?=\s|$)\s*/iy

// "8-6-4 x 20 5 x 25" → una NotationSet por serie. Vacío = []. Inválido = null.
export function parse(input: string): NotationSet[] | null {
  input = input.trim()
  const sets: NotationSet[] = []
  GROUP.lastIndex = 0
  while (GROUP.lastIndex < input.length) {
    const m = GROUP.exec(input)
    if (!m || m[0] === '') return null
    const weight_kg = m[2] === undefined ? null : parseDecimal(m[2])
    for (const item of m[1].split('-')) {
      const n = parseInt(item, 10)
      const isTime = /s/i.test(item)
      sets.push({ reps: isTime ? null : n, seconds: isTime ? n : null, weight_kg })
    }
  }
  return sets
}

// Forma canónica: series seguidas con el mismo peso van juntas ("8-6-4 x 20"), decimales con coma.
export function format(sets: NotationSet[]): string {
  const groups: string[] = []
  let i = 0
  while (i < sets.length) {
    const weight = sets[i].weight_kg
    const items: string[] = []
    for (; i < sets.length && sets[i].weight_kg === weight; i++) {
      items.push(sets[i].seconds != null ? `${sets[i].seconds}s` : `${sets[i].reps}`)
    }
    groups.push(items.join('-') + (weight == null ? '' : ` x ${String(weight).replace('.', ',')}`))
  }
  return groups.join(' ')
}
