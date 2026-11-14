import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { EQUIPMENT, toExerciseRow, type Equipment, type ExerciseForm } from '../lib/exercises'
import { formatTimestamp, parseTimestamp, videoLink } from '../lib/video'
import { dbErrorKey } from '../lib/dbErrors'
import type { Tables } from '../lib/database.types'

const empty: ExerciseForm = {
  name: '',
  muscleGroupId: '',
  equipment: '',
  weightStep: '',
  videoUrl: '',
  videoStart: '',
  notes: '',
}

export default function ExerciseFormPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams() // sin id = alta
  const [form, setForm] = useState(empty)
  const [groups, setGroups] = useState<Tables<'muscle_groups'>[]>([])
  const [loaded, setLoaded] = useState(!id)
  const [error, setError] = useState<keyof Texts | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('muscle_groups')
      .select()
      .order('name')
      .then(({ data, error }) => (error ? setError('loadError') : setGroups(data)))
    if (!id) return
    supabase
      .from('exercises')
      .select()
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) return setError('loadError')
        setForm({
          name: data.name,
          muscleGroupId: data.muscle_group_id,
          equipment: (data.equipment ?? '') as Equipment | '',
          weightStep: data.weight_step?.toString() ?? '',
          videoUrl: data.video_url ?? '',
          videoStart: data.video_start_s === null ? '' : formatTimestamp(data.video_start_s),
          notes: data.notes ?? '',
        })
        setLoaded(true)
      })
  }, [id])

  // Un solo handler para todos los campos: el name del input dice qué clave cambia.
  function set(e: { target: { name: string; value: string } }) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    const result = toExerciseRow(form)
    if ('error' in result) return setError(result.error)
    setSaving(true)
    const query = id
      ? supabase.from('exercises').update(result.row).eq('id', id)
      : supabase.from('exercises').insert(result.row)
    const { error } = await query
    setSaving(false)
    // Si falla, el formulario queda como está para reintentar.
    if (error) return setError(dbErrorKey(error))
    navigate('/mas/ejercicios')
  }

  // Grupos activos, más el del ejercicio aunque esté archivado.
  const options = groups.filter((g) => !g.archived || g.id === form.muscleGroupId)
  // Link de prueba con el minuto, para comprobar que arranca donde querés.
  const link = videoLink(form.videoUrl, parseTimestamp(form.videoStart))

  return (
    <>
      <h1>{id ? t.editExercise : t.newExercise}</h1>
      {error && <p role="alert" className="error">{t[error]}</p>}
      {loaded && (
        <form className="settings" onSubmit={save}>
          <label>
            {t.name}
            <input name="name" required value={form.name} onChange={set} />
          </label>
          <label>
            {t.muscleGroup}
            <select name="muscleGroupId" required value={form.muscleGroupId} onChange={set}>
              <option value="" disabled>—</option>
              {options.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>
          {groups.length === 0 && <Link to="/mas/grupos">{t.muscleGroups}</Link>}
          <label>
            {t.equipment}
            <select name="equipment" value={form.equipment} onChange={set}>
              <option value="">—</option>
              {EQUIPMENT.map((eq) => (
                <option key={eq} value={eq}>{t[`equipment_${eq}`]}</option>
              ))}
            </select>
          </label>
          <label>
            {t.weightStep}
            <input name="weightStep" inputMode="decimal" placeholder={t.weightStepHint} value={form.weightStep} onChange={set} />
          </label>
          <label>
            {t.videoUrl}
            <input name="videoUrl" type="url" inputMode="url" value={form.videoUrl} onChange={set} />
          </label>
          <label>
            {t.videoStart}
            {/* sin inputMode numérico: ese teclado no tiene ":" en iPhone */}
            <input name="videoStart" placeholder="m:ss" value={form.videoStart} onChange={set} />
          </label>
          {link && (
            <a href={link} target="_blank" rel="noreferrer">
              {t.watchVideo}
            </a>
          )}
          <label>
            {t.notes}
            <textarea name="notes" rows={2} value={form.notes} onChange={set} />
          </label>
          <button type="submit" disabled={saving}>{t.save}</button>
        </form>
      )}
    </>
  )
}
