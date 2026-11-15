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
