import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { filledFields, readActivity, ropeTimes, type ActivityField } from '../lib/activities'
import { formatDate } from '../lib/history'
import { formatTimestamp } from '../lib/video'
import type { Tables } from '../lib/database.types'

type ActivityType = Tables<'activity_types'>
type RecentActivity = Tables<'activities'> & { activity_types: { name: string } | null }

const today = () => new Date().toLocaleDateString('sv')
const DECIMAL: readonly string[] = ['minutes', 'km']

export default function RegisterPage() {
  const { t, lang } = useI18n()
  const [types, setTypes] = useState<ActivityType[] | null>(null) // null = cargando
  const [recent, setRecent] = useState<RecentActivity[]>([])
  const [message, setMessage] = useState<keyof Texts | null>(null)
  const [saving, setSaving] = useState(false)
  // Formulario: tipo, fecha, un texto por campo y nota.
  const [typeId, setTypeId] = useState('')
  const [date, setDate] = useState(today)
  const [form, setForm] = useState<Partial<Record<ActivityField, string>>>({})
  const [notes, setNotes] = useState('')

  async function loadRecent() {
    const { data, error } = await supabase
      .from('activities')
      .select('*, activity_types(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) setMessage('loadError')
    else setRecent(data)
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

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!type || !read) return setMessage('chooseActivity')
    if ('error' in read) return setMessage(read.error)
    if (!date) return setMessage('invalidDate')
    setSaving(true)
    const { error } = await supabase
      .from('activities')
      .insert({ ...read.values, activity_type_id: type.id, date, notes: notes.trim() || null })
    setSaving(false)
    // Con error, el formulario queda como estaba para reintentar.
    if (error) return setMessage('saveError')
    setForm({})
    setNotes('')
    setMessage('activitySaved')
    loadRecent()
  }

  async function remove(id: string) {
    if (!confirm(t.confirmDeleteEntry)) return
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) return setMessage('saveError')
    loadRecent()
  }

  return (
    <>
      <h1>{t.register}</h1>
      {message &&
        (message === 'activitySaved' ? (
          <p role="status" className="success">{t.activitySaved}</p>
        ) : (
          <p role="alert" className="error">{t[message]}</p>
        ))}

      <h2>{t.activity}</h2>
      {types?.length === 0 && <p><Link to="/mas/actividades">{t.noActivityTypes}</Link></p>}
      <form className="stack" onSubmit={save}>
        <select aria-label={t.activity} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">{t.chooseActivity}</option>
          {types?.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
        <label className="field">
          {t.date}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
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

      {recent.length > 0 && (
        <>
          <h2>{t.recentEntries}</h2>
          <ul className="entries">
            {recent.map((a) => (
              <li key={a.id}>
                <div>
                  {a.activity_types?.name} <span className="muted">{formatDate(a.date, lang)}</span>
                  <div className="muted">
                    {filledFields(a).map(([f, v]) => `${t[`field_${f}`]} ${String(v).replace('.', ',')}`).join(' · ')}
                    {a.notes && ` · ${a.notes}`}
                  </div>
                </div>
                <button type="button" className="secondary" onClick={() => remove(a.id)}>{t.delete}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
