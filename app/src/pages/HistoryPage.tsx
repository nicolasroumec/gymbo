import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { exerciseNames, formatDate } from '../lib/history'

type WorkoutItem = { id: string; date: string; workout_sets: { position: number; exercises: { name: string } | null }[] }

export default function HistoryPage() {
  const { t, lang } = useI18n()
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    // ponytail: últimas 100 sesiones; paginar si el historial importado (incremento 4) lo pide.
    supabase
      .from('workouts')
      .select('id, date, workout_sets(position, exercises(name))')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) return setError(true)
        setWorkouts(data)
        setLoaded(true)
      })
  }, [])

  return (
    <>
      <h1>{t.history}</h1>
      {error && <p role="alert" className="error">{t.loadError}</p>}
      {loaded && workouts.length === 0 && <p className="muted">{t.noWorkouts}</p>}
      <ul className="list">
        {workouts.map((w) => (
          <li key={w.id}>
            <Link to={w.id}>
              {formatDate(w.date, lang)}
              <span className="muted">{exerciseNames(w.workout_sets)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
