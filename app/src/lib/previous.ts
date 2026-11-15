// Una serie pasada con los datos de su sesión (workout_sets + workouts aplanados).
export type PastSet = {
  workout_id: string
  date: string // YYYY-MM-DD
  workout_created_at: string // desempata dos sesiones del mismo día
  routine_id: string | null
  exercise_id: string
  set_number: number
  reps: number | null
  seconds: number | null
  weight_kg: number | null
  set_type: string
}

// Para cada ejercicio, las series de su última sesión, ordenadas por set_number.
// Prefiere la última sesión de routineId; si el ejercicio nunca se hizo en esa rutina, la última de cualquiera.
export function previousSets(history: PastSet[], routineId: string | null): Map<string, PastSet[]> {
  const newestFirst = [...history].sort(
    (a, b) => b.date.localeCompare(a.date) || b.workout_created_at.localeCompare(a.workout_created_at),
  )
  const chosen = new Map<string, string>() // exercise_id → workout_id
  for (const s of newestFirst) {
    if (routineId != null && s.routine_id === routineId && !chosen.has(s.exercise_id)) chosen.set(s.exercise_id, s.workout_id)
  }
  for (const s of newestFirst) {
    if (!chosen.has(s.exercise_id)) chosen.set(s.exercise_id, s.workout_id)
  }

  const result = new Map<string, PastSet[]>()
  for (const s of newestFirst) {
    if (chosen.get(s.exercise_id) !== s.workout_id) continue
    result.set(s.exercise_id, [...(result.get(s.exercise_id) ?? []), s])
  }
  for (const sets of result.values()) sets.sort((a, b) => a.set_number - b.set_number)
  return result
}
