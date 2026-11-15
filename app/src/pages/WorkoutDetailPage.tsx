import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { loadDraft, repeatDraft, saveDraft, setsToNotation, workoutToDraft, type Draft } from '../lib/draft'
import { formatDate } from '../lib/history'
import { format } from '../lib/sets'

export default function WorkoutDetailPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const [workout, setWorkout] = useState<Draft | null>(null)
  const [names, setNames] = useState(new Map<string, string>())
  const [routineName, setRoutineName] = useState<string | null>(null)
  const [error, setError] = useState<keyof Texts | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('workouts')
      .select('id, date, routine_id, routines(name), workout_sets(exercise_id, position, set_number, reps, seconds, weight_kg, set_type, tempo, superset_group, exercises(name))')
      .eq('id', id!)
      .single()
      .then(({ data, error }) => {
        if (error) return setError('loadError')
        setWorkout(workoutToDraft(data.id, data.date, data.workout_sets, data.routine_id))
        setRoutineName(data.routines?.name ?? null)
        setNames(new Map(data.workout_sets.map((s) => [s.exercise_id, s.exercises?.name ?? ''])))
      })
  }, [id])

  // Abre un borrador en la pantalla de carga, avisando si pisa otra sesión en curso sin guardar.
  function openInWorkout(next: Draft) {
    const current = loadDraft()
    const unsaved = current && current.workout_id !== next.workout_id && current.exercises.length > 0
    if (unsaved && !confirm(t.confirmReplaceDraft)) return
    saveDraft(next)
    navigate('/')
  }

  async function remove() {
    if (!confirm(t.confirmDeleteWorkout)) return
    setBusy(true)
    // Las series se borran solas (on delete cascade).
    const { error } = await supabase.from('workouts').delete().eq('id', id!)
    setBusy(false)
    if (error) return setError('saveError')
    navigate('/historial')
  }

  return (
    <>
      <h1>{workout ? formatDate(workout.date, lang) : t.workout}</h1>
      {error && <p role="alert" className="error">{t[error]}</p>}
      {routineName && <p className="muted">{routineName}</p>}

      {workout?.exercises.map((ex, i) => {
        const special = ex.sets.flatMap((s, j) => (s.set_type && s.set_type !== 'normal' ? [`${j + 1}: ${t[`setShort_${s.set_type}`]}`] : []))
        return (
          <section key={i} className={ex.superset ? 'card superset' : 'card'}>
            {ex.superset && <p className="tag">{t.superset} {ex.superset}</p>}
            <h2>{names.get(ex.exercise_id)}</h2>
            <p>{format(setsToNotation(ex.sets))}</p>
            {(ex.tempo || special.length > 0) && (
              <p className="muted">{[ex.tempo && t[`tempo_${ex.tempo}`], ...special].filter(Boolean).join(' · ')}</p>
            )}
          </section>
        )
      })}

      {workout && (
        <div className="actions">
          <button onClick={() => openInWorkout(repeatDraft(workout, crypto.randomUUID(), new Date().toLocaleDateString('sv')))} disabled={busy}>
            {t.repeat}
          </button>
          {/* Editar: misma sesión (mismo id), así al guardar se pisa */}
          <button className="secondary" onClick={() => openInWorkout(workout)} disabled={busy}>{t.edit}</button>
          <button className="secondary" onClick={remove} disabled={busy}>{t.delete}</button>
        </div>
      )}
    </>
  )
}
