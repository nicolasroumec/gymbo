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
  muscleGroups: 'Grupos musculares',
  newGroup: 'Nuevo grupo',
  loadSuggested: 'Cargar grupos sugeridos',
  name: 'Nombre',
  block: 'Bloque',
  block_push: 'Empuje',
  block_pull: 'Tirón',
  block_legs: 'Piernas',
  block_core: 'Core',
  block_other: 'Otro',
  add: 'Agregar',
  archive: 'Archivar',
  unarchive: 'Desarchivar',
  delete: 'Borrar',
  loadError: 'No se pudo cargar. Probá de nuevo.',
  saveError: 'No se pudo guardar. Probá de nuevo.',
  nameTaken: 'Ya existe uno con ese nombre.',
  inUse: 'Está en uso: archivalo en vez de borrarlo.',
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
  muscleGroups: 'Muscle groups',
  newGroup: 'New group',
  loadSuggested: 'Load suggested groups',
  name: 'Name',
  block: 'Block',
  block_push: 'Push',
  block_pull: 'Pull',
  block_legs: 'Legs',
  block_core: 'Core',
  block_other: 'Other',
  add: 'Add',
  archive: 'Archive',
  unarchive: 'Unarchive',
  delete: 'Delete',
  loadError: 'Could not load. Try again.',
  saveError: 'Could not save. Try again.',
  nameTaken: 'That name already exists.',
  inUse: 'It is in use: archive it instead of deleting.',
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
