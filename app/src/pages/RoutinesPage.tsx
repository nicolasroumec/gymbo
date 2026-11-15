import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { moveItem, positionChanges } from '../lib/routines'
import { dbErrorKey } from '../lib/dbErrors'
import type { Tables } from '../lib/database.types'

type Routine = Tables<'routines'>

export default function RoutinesPage() {
  const { t } = useI18n()
  // null = cargando. El orden de la lista es el orden del ciclo.
  const [routines, setRoutines] = useState<Routine[] | null>(null)
  const [error, setError] = useState<keyof Texts | null>(null)
  const [name, setName] = useState('')

  async function load() {
    const { data, error } = await supabase.from('routines').select().order('position').order('created_at')
    if (error) setError('loadError')
    else setRoutines(data)
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
    const position = routines?.length ?? 0 // al final del ciclo
    if (await run(supabase.from('routines').insert({ name: name.trim(), position }))) setName('')
  }

  function rename(r: Routine, next: string) {
    next = next.trim()
    if (next && next !== r.name) run(supabase.from('routines').update({ name: next }).eq('id', r.id))
  }

  // Reordenar: se guardan solo las filas que cambiaron de lugar.
  async function move(index: number, delta: -1 | 1) {
    if (!routines) return
    const changes = positionChanges(moveItem(routines, index, delta))
    const results = await Promise.all(changes.map((c) => supabase.from('routines').update({ position: c.position }).eq('id', c.id)))
    const failed = results.find((r) => r.error)
    setError(dbErrorKey(failed?.error ?? null))
    await load()
  }

  function remove(r: Routine) {
    if (confirm(t.confirmDeleteRoutine)) run(supabase.from('routines').delete().eq('id', r.id))
  }

  return (
    <>
      <h1>{t.routines}</h1>
      {error && <p role="alert" className="error">{t[error]}</p>}
      <p className="muted">{t.routinesHint}</p>

      <ul className="rows">
        {routines?.map((r, i) => (
          <li key={r.id} className={r.active ? undefined : 'archived'}>
            {/* defaultValue = input no controlado: si la base rechaza el cambio, lo escrito queda para corregirlo */}
            <input defaultValue={r.name} aria-label={t.name} onBlur={(e) => rename(r, e.target.value)} />
            <Link to={r.id} className="button secondary">{t.recipe}</Link>
            <button type="button" className="secondary" aria-label={`${t.moveUp}: ${r.name}`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button type="button" className="secondary" aria-label={`${t.moveDown}: ${r.name}`} disabled={i === routines.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button type="button" className="secondary" onClick={() => run(supabase.from('routines').update({ active: !r.active }).eq('id', r.id))}>
              {r.active ? t.archive : t.unarchive}
            </button>
            <button type="button" className="secondary" onClick={() => remove(r)}>{t.delete}</button>
          </li>
        ))}
      </ul>

      <form className="rows" onSubmit={add}>
        <input required placeholder={t.newRoutine} aria-label={t.newRoutine} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">{t.add}</button>
      </form>
    </>
  )
}
