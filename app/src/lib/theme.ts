import { readPref, writePref } from './storage'

export type Theme = 'system' | 'light' | 'dark'

export function loadTheme(): Theme {
  const saved = readPref('theme')
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

// Sin data-theme, el CSS sigue al sistema (prefers-color-scheme).
export function applyTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  writePref('theme', theme)
}
