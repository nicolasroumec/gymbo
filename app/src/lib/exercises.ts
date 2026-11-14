// Para buscar sin distinguir mayúsculas ni tildes: "Bíceps" -> "biceps".
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

type Filterable = { name: string; muscle_group_id: string; archived: boolean }

// Catálogo filtrado y ordenado por nombre. groupId null = todos los grupos.
export function filterExercises<T extends Filterable>(
  list: T[],
  query: string,
  groupId: string | null,
  showArchived: boolean,
): T[] {
  const q = normalize(query)
  return list
    .filter((e) => showArchived || !e.archived)
    .filter((e) => groupId === null || e.muscle_group_id === groupId)
    .filter((e) => normalize(e.name).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
