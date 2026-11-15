// Lo mínimo de una serie para calcular récords.
export type RecordSet = {
  reps: number | null
  weight_kg: number | null
  set_type: string
}

export type Records = {
  weight: number // mayor peso levantado; 0 = ninguno
  oneRepMax: number // mejor 1RM estimado; 0 = ninguno
  repsByWeight: Map<number, number> // peso (0 = sin peso) → más reps con ese peso
}

export type RecordKind = 'weight' | 'oneRepMax' | 'reps'

// Epley: w × (1 + r/30). Solo con peso y de 1 a 12 reps; fuera de eso la fórmula no es confiable.
export function estimateOneRepMax(weight: number | null, reps: number | null): number | null {
  if (!weight || !reps || reps > 12) return null
  return weight * (1 + reps / 30)
}

// Récords de un ejercicio a partir de sus series. Ignora calentamiento y series por tiempo.
export function computeRecords(sets: RecordSet[]): Records {
  const records: Records = { weight: 0, oneRepMax: 0, repsByWeight: new Map() }
  for (const s of sets) {
    if (s.set_type === 'warmup' || s.reps == null) continue
    const weight = s.weight_kg ?? 0
    records.weight = Math.max(records.weight, weight)
    records.oneRepMax = Math.max(records.oneRepMax, estimateOneRepMax(weight, s.reps) ?? 0)
    records.repsByWeight.set(weight, Math.max(records.repsByWeight.get(weight) ?? 0, s.reps))
  }
  return records
}

// Qué récords supera la serie. Solo cuenta superar uno que ya existía: la primera vez de un ejercicio
// o de un peso no es récord (si no, todo sería 🏆 al empezar).
export function beatenRecords(set: RecordSet, records: Records): RecordKind[] {
  if (set.set_type === 'warmup' || set.reps == null) return []
  const weight = set.weight_kg ?? 0
  const kinds: RecordKind[] = []
  if (records.weight > 0 && weight > records.weight) kinds.push('weight')
  const orm = estimateOneRepMax(weight, set.reps)
  if (records.oneRepMax > 0 && orm != null && orm > records.oneRepMax) kinds.push('oneRepMax')
  const bestReps = records.repsByWeight.get(weight)
  if (bestReps != null && set.reps > bestReps) kinds.push('reps')
  return kinds
}

// Para cada serie de la sesión (null = sin tildar o inválida): si supera los récords del historial
// o de una serie anterior de la misma sesión. Así el 🏆 aparece en el momento de tildar.
export function sessionRecords(history: RecordSet[], session: (RecordSet | null)[]): boolean[] {
  const seen = [...history]
  return session.map((s) => {
    if (!s) return false
    const beaten = beatenRecords(s, computeRecords(seen)).length > 0
    seen.push(s)
    return beaten
  })
}
