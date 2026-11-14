import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { filterExercises } from '../lib/exercises'
import type { Tables } from '../lib/database.types'

export default function ExercisesPage() {
  const { t } = useI18n()
  const [exercises, setExercises] = useState<Tables<'exercises'>[]>([])
  const [groups, setGroups] = useState<Tables<'muscle_groups'>[]>([])
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    // Las dos consultas en paralelo, como Task.WhenAll.
    Promise.all([
      supabase.from('exercises').select(),
      supabase.from('muscle_groups').select().order('name'),
    ]).then(([ex, gr]) => {
      if (ex.error || gr.error) return setError(true)
      setExercises(ex.data)
      setGroups(gr.data)
    })
  }, [])

  const groupName = new Map(groups.map((g) => [g.id, g.name]))
  const visible = filterExercises(exercises, query, groupId, showArchived)

  return (
    <>
      <h1>{t.exercises}</h1>
      <Link to="nuevo" className="button">{t.newExercise}</Link>
      {error && <p role="alert" className="error">{t.loadError}</p>}

      <div className="filters">
        <input type="search" placeholder={t.search} aria-label={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={groupId ?? ''} aria-label={t.muscleGroup} onChange={(e) => setGroupId(e.target.value || null)}>
          <option value="">{t.allGroups}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          {t.showArchived}
        </label>
      </div>

      {visible.length === 0 && !error && <p className="muted">{t.noExercises}</p>}
      <ul className="list">
        {visible.map((e) => (
          <li key={e.id} className={e.archived ? 'archived' : undefined}>
            <Link to={e.id}>
              {e.name}
              <span className="muted">{groupName.get(e.muscle_group_id)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
