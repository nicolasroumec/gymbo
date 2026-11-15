import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { filterExercises } from '../lib/exercises'
import { draftToRows, emptySet, loadDraft, pastValues, saveDraft, toggleDone, type Draft, type DraftSet } from '../lib/draft'
import { previousSets, type PastSet } from '../lib/previous'
import type { Tables } from '../lib/database.types'

const newDraft = (): Draft => ({
  workout_id: crypto.randomUUID(),
  date: new Date().toLocaleDateString('sv'),
  exercises: [],
})

// Series pasadas de un ejercicio, aplanadas con los datos de su sesión. null = error de red.
// ponytail: últimas 20 sesiones, alcanza para "Anterior"; los récords van a necesitar el historial completo.
async function fetchPast(exerciseId: string, workoutId: string): Promise<PastSet[] | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, date, created_at, routine_id, workout_sets!inner(exercise_id, set_number, reps, seconds, weight_kg, set_type)')
    .eq('workout_sets.exercise_id', exerciseId)
    .neq('id', workoutId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return null
  return data.flatMap((w) =>
    w.workout_sets.map((s) => ({ ...s, workout_id: w.id, date: w.date, workout_created_at: w.created_at, routine_id: w.routine_id })),
  )
}

export default function WorkoutPage() {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Draft>(() => loadDraft() ?? newDraft())
  const [catalog, setCatalog] = useState<Tables<'exercises'>[]>([])
  const [past, setPast] = useState<PastSet[]>([])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<keyof Texts | null>(null)
  const [saving, setSaving] = useState(false)

  // Cada cambio queda en localStorage: si se corta la señal o se cierra la pestaña, no se pierde nada.
  useEffect(() => saveDraft(draft), [draft])

  // Solo al abrir: después cada ejercicio trae su historial al agregarlo.
  useEffect(() => {
    supabase.from('exercises').select().then(({ data, error }) => (error ? setMessage('loadError') : setCatalog(data)))
    Promise.all(draft.exercises.map((e) => fetchPast(e.exercise_id, draft.workout_id))).then((results) => {
      if (results.includes(null)) setMessage('loadError')
      setPast(results.flatMap((r) => r ?? []))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito: solo al montar
  }, [])

  const previous = previousSets(past, null)
  const added = new Set(draft.exercises.map((e) => e.exercise_id))
  const matches = filterExercises(catalog.filter((c) => !added.has(c.id)), query, null, false)

  async function addExercise(id: string) {
    setQuery('')
    const rows = await fetchPast(id, draft.workout_id)
    if (!rows) setMessage('loadError')
    setPast((p) => [...p, ...(rows ?? [])])
    // Arranca con tantas filas como series hizo la vez anterior.
    const count = previousSets(rows ?? [], null).get(id)?.length || 1
    setDraft((d) => ({ ...d, exercises: [...d.exercises, { exercise_id: id, sets: Array.from({ length: count }, emptySet) }] }))
  }

  function setSets(index: number, sets: DraftSet[]) {
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, i) => (i === index ? { ...e, sets } : e)) }))
  }

  function removeExercise(index: number) {
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== index) }))
  }

  function discard() {
    if (!confirm(t.confirmDiscard)) return
    setDraft(newDraft())
    setPast([])
    setMessage(null)
  }

  async function save() {
    if (!draft.date) return setMessage('invalidDate')
    const result = draftToRows(draft)
    if ('error' in result) return setMessage(result.error)
    setSaving(true)
    setMessage(null)
    // Pisa la sesión y sus series: si un intento anterior se cortó a la mitad, reintentar no duplica nada.
    const workout = await supabase.from('workouts').upsert({ id: draft.workout_id, date: draft.date })
    const cleared = workout.error ? workout : await supabase.from('workout_sets').delete().eq('workout_id', draft.workout_id)
    const inserted = cleared.error ? cleared : await supabase.from('workout_sets').insert(result.rows)
    setSaving(false)
    if (inserted.error) return setMessage('saveError')
    // Recién con el OK de Supabase se reemplaza el borrador.
    setDraft(newDraft())
    setPast([])
    setMessage('workoutSaved')
  }

  return (
    <>
      <h1>{t.workout}</h1>
      {message &&
        (message === 'workoutSaved' ? (
          <p role="status" className="success">{t.workoutSaved}</p>
        ) : (
          <p role="alert" className="error">{t[message]}</p>
        ))}

      <label className="field">
        {t.date}
        <input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
      </label>

      {draft.exercises.map((ex, i) => {
        const info = catalog.find((c) => c.id === ex.exercise_id)
        const prev = previous.get(ex.exercise_id) ?? []
        return (
          <section key={ex.exercise_id} className="card">
            <h2>{info?.name}</h2>
            {info?.notes && <p className="muted">{info.notes}</p>}
            <div className="grid">
              <span>{t.setNumber}</span>
              <span>{t.previous}</span>
              <span>{t.kg}</span>
              <span>{t.reps}</span>
              <span aria-hidden="true">✓</span>
              {ex.sets.map((s, j) => {
                const p = prev.find((x) => x.set_number === j + 1)
                const pv = pastValues(p)
                const update = (next: DraftSet) => setSets(i, ex.sets.map((x, k) => (k === j ? next : x)))
                return (
                  <Fragment key={j}>
                    <span>{j + 1}</span>
                    <span className="muted">{!p ? '–' : pv.kg ? `${pv.kg} × ${pv.reps}` : pv.reps}</span>
                    <input inputMode="decimal" aria-label={`${t.kg} ${j + 1}`} placeholder={pv.kg} value={s.kg}
                      onChange={(e) => update({ ...s, kg: e.target.value })} />
                    <input inputMode="numeric" aria-label={`${t.reps} ${j + 1}`} placeholder={pv.reps} value={s.reps}
                      onChange={(e) => update({ ...s, reps: e.target.value })} />
                    <input type="checkbox" aria-label={`${t.done} ${j + 1}`} checked={s.done}
                      onChange={() => update(toggleDone(s, p))} />
                  </Fragment>
                )
              })}
            </div>
            <div className="actions">
              <button className="secondary" onClick={() => setSets(i, [...ex.sets, emptySet()])}>{t.addSet}</button>
              <button className="secondary" onClick={() => removeExercise(i)}>{t.removeExercise}</button>
            </div>
          </section>
        )
      })}

      <input type="search" placeholder={t.addExercise} aria-label={t.addExercise} value={query}
        onChange={(e) => setQuery(e.target.value)} />
      {query && matches.length === 0 && <p className="muted">{t.noMatches}</p>}
      {query && (
        <ul className="list">
          {matches.slice(0, 10).map((e) => (
            <li key={e.id}>
              <button className="pick" onClick={() => addExercise(e.id)}>{e.name}</button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button onClick={save} disabled={saving}>{saving ? t.saving : t.saveWorkout}</button>
        {draft.exercises.length > 0 && <button className="secondary" onClick={discard}>{t.discardWorkout}</button>}
      </div>
    </>
  )
}
