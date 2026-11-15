type CycleRoutine = { id: string; position: number; active: boolean }

// Qué rutina toca hoy: la siguiente activa después de la última que hiciste, en el orden del ciclo (vuelve al principio).
// Si la última fue archivada, se sigue desde su lugar; si nunca hiciste una o ya no existe, toca la primera.
// lastRoutineId = rutina de la sesión más reciente que tuvo rutina (las sesiones libres no mueven el ciclo).
export function nextRoutine<T extends CycleRoutine>(routines: readonly T[], lastRoutineId: string | null): T | null {
  const ordered = routines.map((r, i) => ({ r, i })).sort((a, b) => a.r.position - b.r.position || a.i - b.i).map((x) => x.r)
  const last = ordered.findIndex((r) => r.id === lastRoutineId) // -1 = arrancar desde el principio
  for (let step = 1; step <= ordered.length; step++) {
    const candidate = ordered[(last + step) % ordered.length]
    if (candidate.active) return candidate
  }
  return null
}
