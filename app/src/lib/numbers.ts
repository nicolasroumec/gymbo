// Lee un decimal no negativo escrito con coma o punto ("2,5", "2.5", ",5"). Vacío o inválido = null.
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(',', '.')
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null
  return Number(s)
}

// Entero no negativo ("10000"). Vacío, decimal o inválido = null.
export function parseWholeNumber(input: string): number | null {
  const s = input.trim()
  return /^\d+$/.test(s) ? Number(s) : null
}
