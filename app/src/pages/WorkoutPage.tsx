import { Fragment, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { filterExercises } from '../lib/exercises'
import {
  draftToRows, emptySet, groupSupersets, loadDraft, nextSetType, readSet, saveDraft, setsFromNotation, setsToNotation, setText,
  TEMPOS, toggleDone,
  type Draft, type DraftExercise, type DraftSet, type SetType, type Tempo,
} from '../lib/draft'
import { previousSets, type PastSet } from '../lib/previous'
import { sessionRecords, type RecordSet } from '../lib/records'
import { format, parse } from '../lib/sets'
import { formatTimestamp } from '../lib/video'
import type { Tables } from '../lib/database.types'

// Sin receta todavía: el descanso por ejercicio (routine_exercises.rest_s) llega con las rutinas, en el incremento 4.
const REST_S = 90

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

type RecordRow = RecordSet & { exercise_id: string }

// Todas las series efectivas de un ejercicio, para los récords. Paginado: Supabase devuelve hasta 1000 filas por consulta.
async function fetchRecordSets(exerciseId: string, workoutId: string): Promise<RecordRow[] | null> {
  const rows: RecordRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('exercise_id, reps, weight_kg, set_type')
      .eq('exercise_id', exerciseId)
      .neq('workout_id', workoutId)
      .neq('set_type', 'warmup')
      .not('reps', 'is', null)
      .order('id')
      .range(from, from + 999)
    if (error) return null
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

// "Anterior" y récords de un ejercicio, sin contar la sesión que se está cargando. null = error de red.
async function fetchHistory(exerciseId: string, workoutId: string) {
  const [past, records] = await Promise.all([fetchPast(exerciseId, workoutId), fetchRecordSets(exerciseId, workoutId)])
  return past && records ? { past, records } : null
}

export default function WorkoutPage() {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Draft>(() => loadDraft() ?? newDraft())
  const [catalog, setCatalog] = useState<Tables<'exercises'>[]>([])
  const [past, setPast] = useState<PastSet[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [restEnd, setRestEnd] = useState<number | null>(null) // hora (ms) en que termina el descanso
  const [now, setNow] = useState(() => Date.now())
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<keyof Texts | null>(null)
  const [saving, setSaving] = useState(false)

  // Cada cambio queda en localStorage: si se corta la señal o se cierra la pestaña, no se pierde nada.
  useEffect(() => saveDraft(draft), [draft])

  // Solo al abrir: después cada ejercicio trae su historial al agregarlo.
  useEffect(() => {
    supabase.from('exercises').select().then(({ data, error }) => (error ? setMessage('loadError') : setCatalog(data)))
    Promise.all(draft.exercises.map((e) => fetchHistory(e.exercise_id, draft.workout_id))).then((results) => {
      if (results.includes(null)) setMessage('loadError')
      setPast(results.flatMap((r) => r?.past ?? []))
      setRecords(results.flatMap((r) => r?.records ?? []))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito: solo al montar
  }, [])

  // Temporizador: se refresca 4 veces por segundo mientras corre; al terminar vibra (si el celular puede).
  useEffect(() => {
    if (restEnd === null) return
    const id = setInterval(() => {
      const time = Date.now()
      setNow(time)
      if (time >= restEnd) {
        navigator.vibrate?.(300)
        setRestEnd(null)
      }
    }, 250)
    return () => clearInterval(id)
  }, [restEnd])

  function startRest() {
    setNow(Date.now())
    setRestEnd(Date.now() + REST_S * 1000)
  }

  const previous = previousSets(past, null)
  const added = new Set(draft.exercises.map((e) => e.exercise_id))
  const matches = filterExercises(catalog.filter((c) => !added.has(c.id)), query, null, false)

  async function addExercise(id: string) {
    setQuery('')
    const history = await fetchHistory(id, draft.workout_id)
    if (!history) setMessage('loadError')
    setPast((p) => [...p, ...(history?.past ?? [])])
    setRecords((r) => [...r, ...(history?.records ?? [])])
    // Arranca con las filas de la vez anterior y sus tipos (el calentamiento vuelve a ser C). set_type viene validado por la base.
    const prevSets = previousSets(history?.past ?? [], null).get(id) ?? []
    const sets = prevSets.length ? prevSets.map((p) => emptySet(p.set_type as SetType)) : [emptySet()]
    setDraft((d) => ({ ...d, exercises: [...d.exercises, { exercise_id: id, sets }] }))
  }

  function updateExercise(index: number, patch: Partial<DraftExercise>) {
    setDraft((d) => {
      const exercises = d.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e))
      return { ...d, exercises: 'superset' in patch ? groupSupersets(exercises) : exercises }
    })
  }

  // Atajo: "8-6-4 x 20" reemplaza la grilla del ejercicio.
  function applyNotation(index: number, form: HTMLFormElement) {
    const parsed = parse(String(new FormData(form).get('notation') ?? ''))
    if (!parsed || parsed.length === 0) return setMessage('invalidNotation')
    updateExercise(index, { sets: setsFromNotation(draft.exercises[index].sets, parsed) })
    setMessage(null)
    form.reset()
  }

  function removeExercise(index: number) {
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== index) }))
  }

  function discard() {
    if (!confirm(t.confirmDiscard)) return
    setDraft(newDraft())
    setPast([])
    setRecords([])
    setRestEnd(null)
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
    setRecords([])
    setRestEnd(null)
    setMessage('workoutSaved')
  }

  return (
    <>
      <h1>{draft.editing ? t.editWorkout : t.workout}</h1>
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
        const exRecords = records.filter((r) => r.exercise_id === ex.exercise_id)
        const isRecord = sessionRecords(exRecords, ex.sets.map((s) => {
          const values = s.done ? readSet(s) : null
          return values && { ...values, set_type: s.set_type ?? 'normal' }
        }))
        return (
          <section key={ex.exercise_id} className={ex.superset ? 'card superset' : 'card'}>
            {ex.superset && <p className="tag">{t.superset} {ex.superset}</p>}
            <h2>{info?.name}</h2>
            {info?.notes && <p className="muted">{info.notes}</p>}
            <div className="actions compact">
              <select aria-label={t.tempo} value={ex.tempo ?? ''}
                onChange={(e) => updateExercise(i, { tempo: (e.target.value || null) as Tempo | null })}>
                <option value="">{t.noTempo}</option>
                {TEMPOS.map((tempo) => <option key={tempo} value={tempo}>{t[`tempo_${tempo}`]}</option>)}
              </select>
              <select aria-label={t.superset} value={ex.superset ?? ''}
                onChange={(e) => updateExercise(i, { superset: e.target.value ? Number(e.target.value) : null })}>
                <option value="">{t.noSuperset}</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{t.superset} {n}</option>)}
              </select>
            </div>
            <div className="grid">
              <span>{t.setNumber}</span>
              <span>{t.previous}</span>
              <span>{t.kg}</span>
              <span>{t.reps}</span>
              <span aria-hidden="true">✓</span>
              {ex.sets.map((s, j) => {
                const p = prev.find((x) => x.set_number === j + 1)
                const pv = setText(p)
                const update = (next: DraftSet) => updateExercise(i, { sets: ex.sets.map((x, k) => (k === j ? next : x)) })
                const type = s.set_type ?? 'normal'
                return (
                  <Fragment key={j}>
                    <button type="button" className={`set-type ${type}`} aria-label={`${t.setNumber} ${j + 1}: ${t[`setType_${type}`]}`}
                      onClick={() => update({ ...s, set_type: nextSetType(type) })}>
                      {type === 'normal' ? j + 1 : t[`setShort_${type}`]}
                    </button>
                    <span className="muted">
                      {isRecord[j] && <span role="img" aria-label={t.newRecord}>🏆 </span>}
                      {!p ? '–' : pv.kg ? `${pv.kg} × ${pv.reps}` : pv.reps}
                    </span>
                    <input inputMode="decimal" aria-label={`${t.kg} ${j + 1}`} placeholder={pv.kg} value={s.kg}
                      onChange={(e) => update({ ...s, kg: e.target.value })} />
                    <input inputMode="numeric" aria-label={`${t.reps} ${j + 1}`} placeholder={pv.reps} value={s.reps}
                      onChange={(e) => update({ ...s, reps: e.target.value })} />
                    <input type="checkbox" aria-label={`${t.done} ${j + 1}`} checked={s.done}
                      onChange={() => {
                        const next = toggleDone(s, p)
                        update(next)
                        if (next.done) startRest()
                      }} />
                  </Fragment>
                )
              })}
            </div>
            <form className="notation" onSubmit={(e) => { e.preventDefault(); applyNotation(i, e.currentTarget) }}>
              <input name="notation" autoComplete="off" aria-label={t.notation}
                placeholder={format(setsToNotation(ex.sets)) || t.notationExample} />
              <button type="submit" className="secondary">{t.apply}</button>
            </form>
            <div className="actions">
              <button className="secondary" onClick={() => updateExercise(i, { sets: [...ex.sets, emptySet()] })}>{t.addSet}</button>
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
        {(draft.exercises.length > 0 || draft.editing) && (
          <button className="secondary" onClick={discard}>{draft.editing ? t.cancelEdit : t.discardWorkout}</button>
        )}
      </div>

      {restEnd !== null && (
        <>
          <div className="rest-spacer" />
          <div className="rest" role="timer">
            <span>{t.rest} {formatTimestamp(Math.max(0, Math.ceil((restEnd - now) / 1000)))}</span>
            <button className="secondary" onClick={() => setRestEnd((e) => e && e - 15_000)}>−15</button>
            <button className="secondary" onClick={() => setRestEnd((e) => e && e + 15_000)}>+15</button>
            <button className="secondary" onClick={() => setRestEnd(null)}>{t.skip}</button>
          </div>
        </>
      )}
    </>
  )
}
