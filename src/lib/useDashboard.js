import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { progressByProject } from './progress'

/** Agregado para el Dashboard: proyectos, hitos, tareas y actividad global. */
export function useDashboard() {
  const [state, setState] = useState({
    projects: [],
    milestones: [],
    tasks: [],
    activity: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true
    ;(async () => {
      const [projects, milestones, tasks, activity] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase
          .from('milestones')
          .select('*, project:projects(name, color)')
          .order('due_date', { ascending: true }),
        supabase.from('tasks').select('*, project:projects(name, color)'),
        supabase
          .from('activity_log')
          .select('*, project:projects(name)')
          .order('created_at', { ascending: false })
          .limit(12),
      ])
      if (!active) return
      const error =
        [projects, milestones, tasks, activity].find((r) => r.error)?.error ?? null
      const rows = projects.data ?? []
      const byId = progressByProject(rows, [], tasks.data ?? [])
      setState({
        projects: rows.map((p) => ({
          ...p,
          progress_computed: byId.get(p.id) ?? p.progress ?? 0,
        })),
        milestones: milestones.data ?? [],
        tasks: tasks.data ?? [],
        activity: activity.data ?? [],
        loading: false,
        error,
      })
    })()
    return () => {
      active = false
    }
  }, [])

  return state
}
