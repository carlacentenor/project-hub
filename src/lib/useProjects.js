import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { progressByProject } from './progress'

/**
 * Lee la tabla `projects` (RLS "owner only"). Columnas según el esquema:
 * id, name, description, color, status, owner_name, priority, progress,
 * start_date, target_date, created_at, updated_at.
 *
 * A cada proyecto le añade `progress_computed`: progreso calculado a partir de
 * sus áreas / tareas (2 consultas extra, no N+1). Ver src/lib/progress.js.
 */
export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [projRes, taskRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('project_id, parent_task_id, status'),
    ])
    const err = projRes.error ?? taskRes.error ?? null
    setError(err)
    if (err) {
      setProjects([])
    } else {
      const rows = projRes.data ?? []
      const byId = progressByProject(rows, [], taskRes.data ?? [])
      setProjects(rows.map((p) => ({ ...p, progress_computed: byId.get(p.id) ?? p.progress ?? 0 })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { projects, loading, error, reload: load }
}

export function useProject(id) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    setError(err ?? null)
    setProject(err ? null : data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { project, loading, error, reload: load }
}
