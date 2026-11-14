// "1:30" -> 90, "1:02:03" -> 3723, "2" -> 120 (un número solo = minutos). Vacío o inválido = null.
export function parseTimestamp(input: string): number | null {
  const s = input.trim()
  if (/^\d+$/.test(s)) return Number(s) * 60
  if (!/^\d+(:[0-5]\d){1,2}$/.test(s)) return null
  return s.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

// 90 -> "1:30", 3723 -> "1:02:03"
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// Link listo para abrir: solo http(s) (evita "javascript:" en un href) y, si es YouTube, arranca en el minuto.
export function videoLink(url: string, startSeconds: number | null): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  const isYouTube = /(^|\.)youtube\.com$|^youtu\.be$/.test(parsed.hostname)
  if (isYouTube && startSeconds) parsed.searchParams.set('t', String(startSeconds))
  return parsed.toString()
}
