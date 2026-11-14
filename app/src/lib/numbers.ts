// Lee un decimal no negativo escrito con coma o punto ("2,5", "2.5", ",5"). Vacío o inválido = null.
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(',', '.')
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null
  return Number(s)
}
