import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

/** Tareas + áreas de un proyecto, para la lista/kanban de tareas del proyecto. */
export function useProjectTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const [tasksRes, areasRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, area:project_areas(id, name)')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true }),
      supabase
        .from('project_areas')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
    ])
    setError(tasksRes.error ?? areasRes.error ?? null)
    setTasks(tasksRes.data ?? [])
    setAreas(areasRes.data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  return { tasks, areas, loading, error, reload: load }
}
