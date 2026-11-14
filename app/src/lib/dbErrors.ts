import type { Texts } from './i18n'

// Las reglas viven en Postgres; acá solo se traduce el código de error a un mensaje.
// 23505 = unique_violation (nombre repetido), 23503 = foreign_key_violation (borrar algo en uso).
export function dbErrorKey(error: { code?: string } | null): keyof Texts | null {
  if (!error) return null
  if (error.code === '23505') return 'nameTaken'
  if (error.code === '23503') return 'inUse'
  return 'saveError'
}
