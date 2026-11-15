import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { ACTIVITY_FIELDS, suggestedActivityTypes, toggleField, type ActivityField } from '../lib/activities'
import { dbErrorKey } from '../lib/dbErrors'
import type { Tables } from '../lib/database.types'

type ActivityType = Tables<'activity_types'>

export default function ActivityTypesPage() {
  const { t, lang } = useI18n()
  // null = cargando
  const [types, setTypes] = useState<ActivityType[] | null>(null)
  const [error, setError] = useState<keyof Texts | null>(null)
  const [name, setName] = useState('')
  const [fields, setFields] = useState<ActivityField[]>(['minutes'])

  async function load() {
    const { data, error } = await supabase.from('activity_types').select().order('name')
    if (error) setError('loadError')
    else setTypes(data)
  }

  useEffect(() => {
    load()
  }, [])

  // Toda escritura pasa por acá: muestra el error de la base o recarga la lista.
  async function run(query: PromiseLike<{ error: { code?: string } | null }>) {
    const { error } = await query
    setError(dbErrorKey(error))
    if (!error) await load()
    return !error
  }

  async function add(e: FormEvent) {
    e.preventDefault()
    if (await run(supabase.from('activity_types').insert({ name: name.trim(), fields }))) {
      setName('')
      setFields(['minutes'])
    }
  }

  function rename(type: ActivityType, next: string) {
    next = next.trim()
    if (next && next !== type.name) run(supabase.from('activity_types').update({ name: next }).eq('id', type.id))
  }

  function update(type: ActivityType, changes: Partial<ActivityType>) {
    run(supabase.from('activity_types').update(changes).eq('id', type.id))
  }

  // Checkboxes de campos: los usa cada fila y el formulario de alta.
  function fieldChecks(selected: readonly string[], onToggle: (f: ActivityField) => void) {
    return (
      <fieldset className="fields">
        <legend>{t.activityFields}</legend>
        {ACTIVITY_FIELDS.map((f) => (
          <label key={f} className="check">
            <input type="checkbox" checked={selected.includes(f)} onChange={() => onToggle(f)} />
            {t[`field_${f}`]}
          </label>
        ))}
      </fieldset>
    )
  }

  return (
    <>
      <h1>{t.activityTypes}</h1>
      {error && <p role="alert" className="error">{t[error]}</p>}

      {types?.length === 0 && (
        <button type="button" onClick={() => run(supabase.from('activity_types').insert(suggestedActivityTypes(lang)))}>
          {t.loadSuggestedActivities}
        </button>
      )}

      <ul className="rows">
        {types?.map((type) => (
          <li key={type.id} className={type.archived ? 'archived' : undefined}>
            {/* defaultValue = input no controlado: si la base rechaza el cambio, lo escrito queda para corregirlo */}
            <input defaultValue={type.name} aria-label={t.name} onBlur={(e) => rename(type, e.target.value)} />
            {fieldChecks(type.fields, (f) => update(type, { fields: toggleField(type.fields, f) }))}
            <button type="button" className="secondary" onClick={() => update(type, { archived: !type.archived })}>
              {type.archived ? t.unarchive : t.archive}
            </button>
            <button type="button" className="secondary" onClick={() => run(supabase.from('activity_types').delete().eq('id', type.id))}>
              {t.delete}
            </button>
          </li>
        ))}
      </ul>

      <form className="rows" onSubmit={add}>
        <input required placeholder={t.newActivityType} aria-label={t.newActivityType} value={name} onChange={(e) => setName(e.target.value)} />
        {fieldChecks(fields, (f) => setFields(toggleField(fields, f)))}
        <button type="submit">{t.add}</button>
      </form>
    </>
  )
}
