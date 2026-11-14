import type { Texts } from './i18n'
import { parseDecimal } from './numbers'
import { parseTimestamp, videoLink } from './video'

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

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as const
export type Equipment = (typeof EQUIPMENT)[number]

// Lo que tiene el formulario: todo texto, tal cual lo escribió el usuario.
export type ExerciseForm = {
  name: string
  muscleGroupId: string
  equipment: Equipment | ''
  weightStep: string
  videoUrl: string
  videoStart: string
  notes: string
}

type ExerciseRow = {
  name: string
  muscle_group_id: string
  equipment: Equipment | null
  weight_step: number | null
  video_url: string | null
  video_start_s: number | null
  notes: string | null
}

// Valida y convierte el formulario en la fila a guardar. Campos opcionales vacíos = null.
export function toExerciseRow(f: ExerciseForm): { row: ExerciseRow } | { error: keyof Texts } {
  const name = f.name.trim()
  if (!name || !f.muscleGroupId) return { error: 'requiredFields' }

  const weightStep = f.weightStep.trim() ? parseDecimal(f.weightStep) : null
  if (f.weightStep.trim() && !weightStep) return { error: 'invalidWeightStep' } // también rechaza 0

  const videoStart = f.videoStart.trim() ? parseTimestamp(f.videoStart) : null
  if (f.videoStart.trim() && videoStart === null) return { error: 'invalidTime' }

  const videoUrl = f.videoUrl.trim() || null
  if (videoUrl && !videoLink(videoUrl, null)) return { error: 'invalidLink' }

  return {
    row: {
      name,
      muscle_group_id: f.muscleGroupId,
      equipment: f.equipment || null,
      weight_step: weightStep,
      video_url: videoUrl,
      video_start_s: videoStart,
      notes: f.notes.trim() || null,
    },
  }
}
