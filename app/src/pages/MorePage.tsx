import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Lang } from '../lib/i18n'
import { applyTheme, loadTheme, type Theme } from '../lib/theme'

// Ejercicios, actividades, rutinas, importar y exportar se suman en sus incrementos.
export default function MorePage() {
  const { t, lang, setLang } = useI18n()
  const [theme, setTheme] = useState(loadTheme)
  const [error, setError] = useState(false)

  function changeTheme(next: Theme) {
    setTheme(next)
    applyTheme(next)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    setError(Boolean(error))
  }

  return (
    <>
      <h1>{t.more}</h1>
      <nav className="menu">
        <Link to="/mas/grupos">{t.muscleGroups}</Link>
      </nav>
      <div className="settings">
        <label>
          {t.language}
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          {t.theme}
          <select value={theme} onChange={(e) => changeTheme(e.target.value as Theme)}>
            <option value="system">{t.themeSystem}</option>
            <option value="light">{t.themeLight}</option>
            <option value="dark">{t.themeDark}</option>
          </select>
        </label>
        {error && <p role="alert" className="error">{t.signOutError}</p>}
        <button type="button" onClick={signOut}>
          {t.signOut}
        </button>
      </div>
    </>
  )
}
