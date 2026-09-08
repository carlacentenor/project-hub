import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

/** Tareas + áreas + dependencias de un proyecto, para el Gantt del Plan de trabajo. */
export function useProjectPlan(projectId) {
  const [areas, setAreas] = useState([])
  const [tasks, setTasks] = useState([])
  const [deps, setDeps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const [areasRes, tasksRes] = await Promise.all([
      supabase
        .from('project_areas')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
    ])

    const taskIds = (tasksRes.data ?? []).map((t) => t.id)
    let depsRes = { data: [], error: null }
    if (taskIds.length > 0) {
      depsRes = await supabase
        .from('task_dependencies')
        .select('*')
        .in('task_id', taskIds)
    }

    setError(areasRes.error ?? tasksRes.error ?? depsRes.error ?? null)
    setAreas(areasRes.data ?? [])
    setTasks(tasksRes.data ?? [])
    setDeps(depsRes.data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  return { areas, tasks, deps, loading, error, reload: load }
}
