import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { readPref, writePref } from './storage'

const es = {
  train: 'Entrenar',
  register: 'Registrar',
  history: 'Historial',
  stats: 'Estadísticas',
  more: 'Más',
  email: 'Email',
  password: 'Contraseña',
  signIn: 'Entrar',
  signingIn: 'Entrando…',
  wrongCredentials: 'Email o contraseña incorrectos.',
  networkError: 'No se pudo conectar. Probá de nuevo.',
  signOut: 'Salir',
  signOutError: 'No se pudo cerrar la sesión. Probá de nuevo.',
  language: 'Idioma',
  theme: 'Tema',
  themeSystem: 'Del sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
}

export type Texts = typeof es

// El tipo Texts obliga a que inglés tenga exactamente las mismas claves que español.
const en: Texts = {
  train: 'Train',
  register: 'Log',
  history: 'History',
  stats: 'Stats',
  more: 'More',
  email: 'Email',
  password: 'Password',
  signIn: 'Sign in',
  signingIn: 'Signing in…',
  wrongCredentials: 'Wrong email or password.',
  networkError: 'Could not connect. Try again.',
  signOut: 'Sign out',
  signOutError: 'Could not sign out. Try again.',
  language: 'Language',
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
}

export type Lang = 'es' | 'en'
const dictionaries: Record<Lang, Texts> = { es, en }

// Lo elegido en Más gana; si no hay nada, el idioma del navegador (español o, si no, inglés).
export function detectLang(saved: string | null, browser: string): Lang {
  if (saved === 'es' || saved === 'en') return saved
  return browser.toLowerCase().startsWith('es') ? 'es' : 'en'
}

type I18n = { t: Texts; lang: Lang; setLang: (lang: Lang) => void }
const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() => detectLang(readPref('lang'), navigator.language))

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function setLang(next: Lang) {
    setLangState(next)
    writePref('lang', next)
  }

  return <I18nContext.Provider value={{ t: dictionaries[lang], lang, setLang }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n se usa dentro de <I18nProvider>')
  return ctx
}
