import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import * as M from './mutations'

/**
 * Carga todo lo que necesita la pantalla de Resumen de un proyecto:
 * áreas, hitos, riesgos, documentos, notas, próximas tareas y actividad.
 * Los `insert` NO mandan user_id (la columna tiene `default auth.uid()`).
 */
export function useProjectDetail(projectId) {
  const [data, setData] = useState({
    areas: [],
    milestones: [],
    risks: [],
    documents: [],
    notes: [],
    tasks: [],
    activity: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)

    const [areas, milestones, risks, documents, notes, tasks, activity] =
      await Promise.all([
        supabase
          .from('project_areas')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true }),
        supabase
          .from('risks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true }),
        supabase
          .from('activity_log')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

    const firstError =
      [areas, milestones, risks, documents, notes, tasks, activity].find(
        (r) => r.error
      )?.error ?? null

    setError(firstError)
    setData({
      areas: areas.data ?? [],
      milestones: milestones.data ?? [],
      risks: risks.data ?? [],
      documents: documents.data ?? [],
      notes: notes.data ?? [],
      tasks: tasks.data ?? [],
      activity: activity.data ?? [],
    })
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  // Ejecuta una mutación y recarga; devuelve el error (o null) para la UI.
  const run = useCallback(
    async (promise) => {
      const { error: err } = await promise
      if (!err) await load()
      return err
    },
    [load]
  )

  const mutations = {
    // Documentos
    addDocument: (v) => run(M.createDocument(projectId, v)),
    updateDocument: (id, v) => run(M.updateDocument(id, v)),
    deleteDocument: (id) => run(M.deleteDocument(id)),
    // Notas
    addNote: (v) => run(M.createNote(projectId, v)),
    updateNote: (id, v) => run(M.updateNote(id, v)),
    deleteNote: (id) => run(M.deleteNote(id)),
    // Áreas
    addArea: (v) => run(M.createArea(projectId, v)),
    updateArea: (id, v) => run(M.updateArea(id, v)),
    deleteArea: (id) => run(M.deleteArea(id)),
    reorderAreas: (ids) => run(M.reorderAreas(ids).then(() => ({ error: null }))),
  }

  return {
    ...data,
    loading,
    error,
    reload: load,
    ...mutations,
  }
}
