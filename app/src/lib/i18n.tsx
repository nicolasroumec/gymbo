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
  exercises: 'Ejercicios',
  search: 'Buscar',
  muscleGroup: 'Grupo muscular',
  allGroups: 'Todos los grupos',
  showArchived: 'Ver archivados',
  noExercises: 'No hay ejercicios.',
  newExercise: 'Nuevo ejercicio',
  editExercise: 'Editar ejercicio',
  equipment: 'Equipo',
  equipment_barbell: 'Barra',
  equipment_dumbbell: 'Mancuerna',
  equipment_machine: 'Máquina',
  equipment_cable: 'Polea',
  equipment_bodyweight: 'Peso corporal',
  equipment_other: 'Otro',
  weightStep: 'Salto de peso (kg)',
  weightStepHint: 'Vacío = el del equipo',
  videoUrl: 'Link al video',
  videoStart: 'Minuto del video',
  watchVideo: 'Probar el link',
  notes: 'Nota fija',
  save: 'Guardar',
  requiredFields: 'Completá el nombre y el grupo muscular.',
  invalidWeightStep: 'El salto de peso tiene que ser un número mayor a 0.',
  invalidTime: 'El minuto va como m:ss, por ejemplo 1:30.',
  invalidLink: 'El link tiene que empezar con http:// o https://.',
  confirmDelete: '¿Borrar este ejercicio? No se puede deshacer.',
  workout: 'Sesión',
  date: 'Fecha',
  setNumber: 'Serie',
  previous: 'Anterior',
  kg: 'kg',
  reps: 'Reps',
  done: 'Hecha',
  addSet: '+ Serie',
  removeExercise: 'Quitar ejercicio',
  addExercise: 'Agregar ejercicio',
  noMatches: 'No hay ejercicios con ese nombre.',
  saveWorkout: 'Guardar sesión',
  saving: 'Guardando…',
  workoutSaved: 'Sesión guardada.',
  discardWorkout: 'Descartar sesión',
  confirmDiscard: '¿Descartar la sesión en curso? Se pierde lo cargado.',
  noSetsDone: 'Tildá al menos una serie para guardar.',
  invalidSet: 'Revisá las series tildadas: reps es un número entero (o segundos, como 35s) y kg un número.',
  invalidDate: 'Elegí la fecha de la sesión.',
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
  exercises: 'Exercises',
  search: 'Search',
  muscleGroup: 'Muscle group',
  allGroups: 'All groups',
  showArchived: 'Show archived',
  noExercises: 'No exercises.',
  newExercise: 'New exercise',
  editExercise: 'Edit exercise',
  equipment: 'Equipment',
  equipment_barbell: 'Barbell',
  equipment_dumbbell: 'Dumbbell',
  equipment_machine: 'Machine',
  equipment_cable: 'Cable',
  equipment_bodyweight: 'Bodyweight',
  equipment_other: 'Other',
  weightStep: 'Weight step (kg)',
  weightStepHint: 'Empty = equipment default',
  videoUrl: 'Video link',
  videoStart: 'Video start',
  watchVideo: 'Test the link',
  notes: 'Pinned note',
  save: 'Save',
  requiredFields: 'Fill in the name and muscle group.',
  invalidWeightStep: 'Weight step must be a number greater than 0.',
  invalidTime: 'Start time goes as m:ss, for example 1:30.',
  invalidLink: 'The link must start with http:// or https://.',
  confirmDelete: 'Delete this exercise? This cannot be undone.',
  workout: 'Workout',
  date: 'Date',
  setNumber: 'Set',
  previous: 'Previous',
  kg: 'kg',
  reps: 'Reps',
  done: 'Done',
  addSet: '+ Set',
  removeExercise: 'Remove exercise',
  addExercise: 'Add exercise',
  noMatches: 'No exercises with that name.',
  saveWorkout: 'Save workout',
  saving: 'Saving…',
  workoutSaved: 'Workout saved.',
  discardWorkout: 'Discard workout',
  confirmDiscard: 'Discard the current workout? What you logged will be lost.',
  noSetsDone: 'Check at least one set to save.',
  invalidSet: 'Check the done sets: reps is a whole number (or seconds, like 35s) and kg a number.',
  invalidDate: 'Pick the workout date.',
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
