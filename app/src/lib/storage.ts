// Preferencias del dispositivo. localStorage puede fallar (modo privado, bloqueado): nunca rompe la app.
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(`gymbo.${key}`)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`gymbo.${key}`, value)
  } catch {
    // sin almacenamiento, la preferencia dura hasta recargar
  }
}
