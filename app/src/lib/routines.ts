import type { SetType } from './draft'
import type { Texts } from './i18n'
import { parseWholeNumber } from './numbers'

// Mueve un elemento una posición arriba (-1) o abajo (+1). En los bordes devuelve la lista igual.
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return [...list]
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

// Después de reordenar: qué filas cambiaron de posición (la posición es el índice en la lista).
export function positionChanges<T extends { id: string; position: number }>(list: readonly T[]): { id: string; position: number }[] {
  return list.flatMap((item, i) => (item.position === i ? [] : [{ id: item.id, position: i }]))
}

// Un ejercicio de la receta tal como está en el formulario: todo texto, como lo escribió el usuario.
export type RecipeItem = {
  exercise_id: string
  target_sets: string
  rep_min: string
  rep_max: string
  default_set_type: SetType
  rest_s: string
  superset: string // '' = sin superserie
}

export type RecipeRow = {
  routine_id: string
  exercise_id: string
  position: number
  target_sets: number | null
  rep_min: number | null
  rep_max: number | null
  default_set_type: SetType
  rest_s: number | null
  superset_group: number | null
}

// Vacío = null; si no, entero (mayor a 0 salvo el descanso, que puede ser 0). undefined = inválido.
function optionalInt(text: string, min: number): number | null | undefined {
  if (!text.trim()) return null
  const n = parseWholeNumber(text)
  return n !== null && n >= min ? n : undefined
}

// Valida el formulario y arma las filas de routine_exercises en el orden de la lista.
export function toRecipeRows(routineId: string, items: RecipeItem[]): { rows: RecipeRow[] } | { error: keyof Texts } {
  const rows: RecipeRow[] = []
  for (const [position, item] of items.entries()) {
    const target_sets = optionalInt(item.target_sets, 1)
    const rep_min = optionalInt(item.rep_min, 1)
    const rep_max = optionalInt(item.rep_max, 1)
    const rest_s = optionalInt(item.rest_s, 0)
    if (target_sets === undefined || rep_min === undefined || rep_max === undefined || rest_s === undefined) {
      return { error: 'invalidRecipe' }
    }
    if (rep_min !== null && rep_max !== null && rep_min > rep_max) return { error: 'invalidRepRange' }
    rows.push({
      routine_id: routineId,
      exercise_id: item.exercise_id,
      position,
      target_sets,
      rep_min,
      rep_max,
      default_set_type: item.default_set_type,
      rest_s,
      superset_group: item.superset ? Number(item.superset) : null,
    })
  }
  return { rows }
}

// Filas guardadas → formulario (default_set_type ya viene validado por el check de la base).
export function recipeToItems(rows: (Omit<RecipeRow, 'routine_id' | 'default_set_type'> & { default_set_type: string })[]): RecipeItem[] {
  const text = (n: number | null) => (n == null ? '' : String(n))
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((r) => ({
      exercise_id: r.exercise_id,
      target_sets: text(r.target_sets),
      rep_min: text(r.rep_min),
      rep_max: text(r.rep_max),
      default_set_type: r.default_set_type as SetType,
      rest_s: text(r.rest_s),
      superset: text(r.superset_group),
    }))
}
