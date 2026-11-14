import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'

export default function LoginPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Se guarda la clave, no el texto: si cambia el idioma, el error se traduce solo.
  const [error, setError] = useState<keyof Texts | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Si sale bien, App se entera por onAuthStateChange y redirige solo.
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.status === 400 ? 'wrongCredentials' : 'networkError')
    setLoading(false)
  }

  return (
    <main className="login">
      <h1>Gymbo</h1>
      <form onSubmit={handleSubmit}>
        <label>
          {t.email}
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t.password}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p role="alert" className="error">{t[error]}</p>}
        <button type="submit" disabled={loading}>
          {loading ? t.signingIn : t.signIn}
        </button>
      </form>
    </main>
  )
}
