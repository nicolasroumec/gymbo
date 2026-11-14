import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { BLOCKS, suggestedGroups, type Block } from '../lib/muscleGroups'
import { dbErrorKey } from '../lib/dbErrors'
import type { Tables } from '../lib/database.types'

type Group = Tables<'muscle_groups'>

export default function MuscleGroupsPage() {
  const { t, lang } = useI18n()
  // null = cargando
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [error, setError] = useState<keyof Texts | null>(null)
  const [name, setName] = useState('')
  const [block, setBlock] = useState<Block>('other')

  async function load() {
    const { data, error } = await supabase.from('muscle_groups').select().order('name')
    if (error) setError('loadError')
    else setGroups(data)
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
    if (await run(supabase.from('muscle_groups').insert({ name: name.trim(), block }))) setName('')
  }

  function rename(g: Group, next: string) {
    next = next.trim()
    if (next && next !== g.name) run(supabase.from('muscle_groups').update({ name: next }).eq('id', g.id))
  }

  function update(g: Group, changes: Partial<Group>) {
    run(supabase.from('muscle_groups').update(changes).eq('id', g.id))
  }

  return (
    <>
      <h1>{t.muscleGroups}</h1>
      {error && <p role="alert" className="error">{t[error]}</p>}

      {groups?.length === 0 && (
        <button type="button" onClick={() => run(supabase.from('muscle_groups').insert(suggestedGroups(lang)))}>
          {t.loadSuggested}
        </button>
      )}

      <ul className="rows">
        {groups?.map((g) => (
          <li key={g.id} className={g.archived ? 'archived' : undefined}>
            {/* defaultValue = input no controlado: si la base rechaza el cambio, lo escrito queda para corregirlo */}
            <input defaultValue={g.name} aria-label={t.name} onBlur={(e) => rename(g, e.target.value)} />
            <select value={g.block} aria-label={t.block} onChange={(e) => update(g, { block: e.target.value })}>
              {BLOCKS.map((b) => (
                <option key={b} value={b}>{t[`block_${b}`]}</option>
              ))}
            </select>
            <button type="button" className="secondary" onClick={() => update(g, { archived: !g.archived })}>
              {g.archived ? t.unarchive : t.archive}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => run(supabase.from('muscle_groups').delete().eq('id', g.id))}
            >
              {t.delete}
            </button>
          </li>
        ))}
      </ul>

      <form className="rows" onSubmit={add}>
        <input required placeholder={t.newGroup} aria-label={t.newGroup} value={name} onChange={(e) => setName(e.target.value)} />
        <select value={block} aria-label={t.block} onChange={(e) => setBlock(e.target.value as Block)}>
          {BLOCKS.map((b) => (
            <option key={b} value={b}>{t[`block_${b}`]}</option>
          ))}
        </select>
        <button type="submit">{t.add}</button>
      </form>
    </>
  )
}
