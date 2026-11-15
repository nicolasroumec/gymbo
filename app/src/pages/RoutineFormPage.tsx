import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n, type Texts } from '../lib/i18n'
import { filterExercises } from '../lib/exercises'
import { SET_TYPES, type SetType } from '../lib/draft'
import { moveItem, recipeToItems, toRecipeRows, type RecipeItem } from '../lib/routines'
import type { Tables } from '../lib/database.types'

const newItem = (exercise_id: string): RecipeItem => ({
  exercise_id, target_sets: '3', rep_min: '', rep_max: '', default_set_type: 'normal', rest_s: '', superset: '',
})

// Campos numéricos de cada ejercicio de la receta.
const NUMBER_FIELDS = ['target_sets', 'rep_min', 'rep_max', 'rest_s'] as const

export default function RoutineFormPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const [name, setName] = useState('')
  const [items, setItems] = useState<RecipeItem[]>([])
  const [catalog, setCatalog] = useState<Tables<'exercises'>[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<keyof Texts | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('routines').select('name').eq('id', id!).single(),
      supabase.from('routine_exercises').select().eq('routine_id', id!),
      supabase.from('exercises').select(),
    ]).then(([routine, recipe, exercises]) => {
      if (routine.error || recipe.error || exercises.error) return setError('loadError')
      setName(routine.data.name)
      setItems(recipeToItems(recipe.data))
      setCatalog(exercises.data)
    })
  }, [id])

  const names = new Map(catalog.map((e) => [e.id, e.name]))
  const added = new Set(items.map((i) => i.exercise_id))
  const matches = filterExercises(catalog.filter((c) => !added.has(c.id)), query, null, false)

  function update(index: number, patch: Partial<RecipeItem>) {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function save() {
    const result = toRecipeRows(id!, items)
    if ('error' in result) return setError(result.error)
    setSaving(true)
    // Reemplaza la receta completa. Si el insert falla, el formulario sigue en pantalla para reintentar.
    const cleared = await supabase.from('routine_exercises').delete().eq('routine_id', id!)
    const inserted = cleared.error || result.rows.length === 0 ? cleared : await supabase.from('routine_exercises').insert(result.rows)
    setSaving(false)
    if (inserted.error) return setError('saveError')
    navigate('/mas/rutinas')
  }

  return (
    <>
      <h1>{name || t.routines}</h1>
      {error && <p role="alert" className="error">{t[error]}</p>}

      {items.map((item, i) => (
        <section key={item.exercise_id} className={item.superset ? 'card superset' : 'card'}>
          {item.superset && <p className="tag">{t.superset} {item.superset}</p>}
          <h2>{names.get(item.exercise_id)}</h2>
          <div className="pair">
            {NUMBER_FIELDS.map((f) => (
              <label key={f} className="field">
                {t[`recipe_${f}`]}
                <input inputMode="numeric" value={item[f]} onChange={(e) => update(i, { [f]: e.target.value })} />
              </label>
            ))}
            <label className="field">
              {t.defaultSetType}
              <select value={item.default_set_type} onChange={(e) => update(i, { default_set_type: e.target.value as SetType })}>
                {SET_TYPES.map((s) => <option key={s} value={s}>{t[`setType_${s}`]}</option>)}
              </select>
            </label>
            <label className="field">
              {t.superset}
              <select value={item.superset} onChange={(e) => update(i, { superset: e.target.value })}>
                <option value="">{t.noSuperset}</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{t.superset} {n}</option>)}
              </select>
            </label>
          </div>
          <div className="actions">
            <button type="button" className="secondary" aria-label={t.moveUp} disabled={i === 0}
              onClick={() => setItems((list) => moveItem(list, i, -1))}>↑</button>
            <button type="button" className="secondary" aria-label={t.moveDown} disabled={i === items.length - 1}
              onClick={() => setItems((list) => moveItem(list, i, 1))}>↓</button>
            <button type="button" className="secondary" onClick={() => setItems((list) => list.filter((_, k) => k !== i))}>
              {t.removeExercise}
            </button>
          </div>
        </section>
      ))}

      <input type="search" placeholder={t.addExercise} aria-label={t.addExercise} value={query}
        onChange={(e) => setQuery(e.target.value)} />
      {query && matches.length === 0 && <p className="muted">{t.noMatches}</p>}
      {query && (
        <ul className="list">
          {matches.slice(0, 10).map((e) => (
            <li key={e.id}>
              <button className="pick" onClick={() => { setItems((list) => [...list, newItem(e.id)]); setQuery('') }}>{e.name}</button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button onClick={save} disabled={saving}>{saving ? t.saving : t.save}</button>
      </div>
    </>
  )
}
