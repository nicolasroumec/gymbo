import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { filledFields, readActivity, ropeTimes, type ActivityField } from '../lib/activities'
import { parseDecimal, parseWholeNumber } from '../lib/numbers'
import { formatDate } from '../lib/history'
import { formatTimestamp } from '../lib/video'
import type { Tables } from '../lib/database.types'

type ActivityType = Tables<'activity_types'>
type RecentActivity = Tables<'activities'> & { activity_types: { name: string } | null }

const today = () => new Date().toLocaleDateString('sv')
const DECIMAL: readonly string[] = ['minutes', 'km']
const decimalText = (n: number) => String(n).replace('.', ',')

export default function RegisterPage() {
  const { t, lang } = useI18n()
  const [types, setTypes] = useState<ActivityType[] | null>(null) // null = cargando
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [weights, setWeights] = useState<Tables<'body_weights'>[]>([])
  const [steps, setSteps] = useState<Tables<'daily_steps'>[]>([])
  const [message, setMessage] = useState<keyof Texts | null>(null)
  const [saving, setSaving] = useState(false)
  // La fecha vale para todo lo que se registra en la pantalla.
  const [date, setDate] = useState(today)
  // Actividad: tipo, un texto por campo y nota.
  const [typeId, setTypeId] = useState('')
  const [form, setForm] = useState<Partial<Record<ActivityField, string>>>({})
  const [notes, setNotes] = useState('')

  async function loadRecent() {
    const [a, w, s] = await Promise.all([
      supabase.from('activities').select('*, activity_types(name)')
        .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(10),
      supabase.from('body_weights').select()
        .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      supabase.from('daily_steps').select().order('date', { ascending: false }).limit(5),
    ])
    if (a.error || w.error || s.error) return setMessage('loadError')
    setActivities(a.data)
    setWeights(w.data)
    setSteps(s.data)
  }

  useEffect(() => {
    supabase
      .from('activity_types')
      .select()
      .eq('archived', false)
      .order('name')
      .then(({ data, error }) => (error ? setMessage('loadError') : setTypes(data)))
    loadRecent()
  }, [])

  const type = types?.find((x) => x.id === typeId)
  const read = type ? readActivity(type.fields, form) : null
  const rope = read && 'values' in read ? ropeTimes(read.values.rounds, read.values.work_s, read.values.rest_s) : null

  // Toda escritura pasa por acá. Con error devuelve false y el formulario queda como estaba para reintentar.
  async function write(query: PromiseLike<{ error: unknown }>) {
    if (!date) {
      setMessage('invalidDate')
      return false
    }
    setSaving(true)
    const { error } = await query
    setSaving(false)
    setMessage(error ? 'saveError' : 'saved')
    if (!error) loadRecent()
    return !error
  }

  async function saveActivity(e: FormEvent) {
    e.preventDefault()
    if (!type || !read) return setMessage('chooseActivity')
    if ('error' in read) return setMessage(read.error)
    const row = { ...read.values, activity_type_id: type.id, date, notes: notes.trim() || null }
    if (await write(supabase.from('activities').insert(row))) {
      setForm({})
      setNotes('')
    }
  }

  async function saveWeight(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const kg = parseDecimal(String(new FormData(form).get('kg')))
    if (!kg) return setMessage('invalidWeight') // también rechaza 0
    if (await write(supabase.from('body_weights').insert({ date, kg }))) form.reset()
  }

  async function saveSteps(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const value = parseWholeNumber(String(new FormData(form).get('steps')))
    if (value === null) return setMessage('invalidSteps')
    // Un registro por día: si ya había pasos para esa fecha, se reemplazan.
    if (await write(supabase.from('daily_steps').upsert({ date, steps: value }, { onConflict: 'user_id,date' }))) form.reset()
  }

  async function remove(table: 'activities' | 'body_weights' | 'daily_steps', id: string) {
    if (!confirm(t.confirmDeleteEntry)) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return setMessage('saveError')
    loadRecent()
  }

  // Una fila de "últimos registros": texto a la izquierda, Borrar a la derecha.
  function entry(key: string, title: string, detail: string, onDelete: () => void) {
    return (
      <li key={key}>
        <div>
          {title}
          {detail && <div className="muted">{detail}</div>}
        </div>
        <button type="button" className="secondary" onClick={onDelete}>{t.delete}</button>
      </li>
    )
  }

  return (
    <>
      <h1>{t.register}</h1>
      {message &&
        (message === 'saved' ? (
          <p role="status" className="success">{t.saved}</p>
        ) : (
          <p role="alert" className="error">{t[message]}</p>
        ))}

      <label className="field">
        {t.date}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <h2>{t.activity}</h2>
      {types?.length === 0 && <p><Link to="/mas/actividades">{t.noActivityTypes}</Link></p>}
      <form className="stack" onSubmit={saveActivity}>
        <select aria-label={t.activity} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">{t.chooseActivity}</option>
          {types?.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
        {type && type.fields.length > 0 && (
          <div className="pair">
            {(type.fields as ActivityField[]).map((f) => (
              <label key={f} className="field">
                {t[`field_${f}`]}
                <input inputMode={DECIMAL.includes(f) ? 'decimal' : 'numeric'} value={form[f] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))} />
              </label>
            ))}
          </div>
        )}
        {rope && (
          <p className="muted">
            {t.jumpTime} {formatTimestamp(rope.jumpS)} · {t.totalTime} {formatTimestamp(rope.totalS)}
          </p>
        )}
        {type && <input placeholder={t.activityNotes} aria-label={t.activityNotes} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        <button type="submit" disabled={saving}>{saving ? t.saving : t.save}</button>
      </form>
      <ul className="entries">
        {activities.map((a) => entry(
          a.id,
          `${a.activity_types?.name ?? ''} · ${formatDate(a.date, lang)}`,
          [...filledFields(a).map(([f, v]) => `${t[`field_${f}`]} ${decimalText(v)}`), a.notes].filter(Boolean).join(' · '),
          () => remove('activities', a.id),
        ))}
      </ul>

      <h2>{t.bodyWeight}</h2>
      <form className="inline" onSubmit={saveWeight}>
        <input name="kg" inputMode="decimal" aria-label={t.bodyWeight} autoComplete="off" />
        <button type="submit" disabled={saving}>{t.save}</button>
      </form>
      <ul className="entries">
        {weights.map((w) => entry(w.id, `${decimalText(w.kg)} kg`, formatDate(w.date, lang), () => remove('body_weights', w.id)))}
      </ul>

      <h2>{t.steps}</h2>
      <form className="inline" onSubmit={saveSteps}>
        <input name="steps" inputMode="numeric" aria-label={t.steps} autoComplete="off" />
        <button type="submit" disabled={saving}>{t.save}</button>
      </form>
      <ul className="entries">
        {steps.map((s) => entry(s.id, s.steps.toLocaleString(lang), formatDate(s.date, lang), () => remove('daily_steps', s.id)))}
      </ul>
    </>
  )
}
