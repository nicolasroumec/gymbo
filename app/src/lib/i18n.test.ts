import { describe, expect, it } from 'vitest'
import { detectLang } from './i18n'

describe('detectLang', () => {
  it('respeta lo elegido a mano', () => {
    expect(detectLang('en', 'es-AR')).toBe('en')
    expect(detectLang('es', 'en-US')).toBe('es')
  })

  it('sin elección, usa el navegador', () => {
    expect(detectLang(null, 'es-AR')).toBe('es')
    expect(detectLang(null, 'ES')).toBe('es')
    expect(detectLang(null, 'en-US')).toBe('en')
  })

  it('cualquier otro idioma o valor guardado inválido cae en inglés', () => {
    expect(detectLang(null, 'pt-BR')).toBe('en')
    expect(detectLang('fr', 'pt-BR')).toBe('en')
    expect(detectLang('fr', 'es-AR')).toBe('es')
  })
})
