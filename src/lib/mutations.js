import { supabase } from './supabaseClient'

/**
 * CRUD fino sobre las tablas. Ningún insert manda `user_id`
 * (la columna tiene `default auth.uid()` y RLS "owner only").
 * Cada función devuelve { data, error }.
 */

// Quita claves con string vacío → null, para no mandar '' a columnas date/text.
function clean(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === '' || v === undefined ? null : v
  }
  return out
}

// Omite claves vacías por completo (no las manda como null).
// Útil para columnas opcionales que quizá aún no existan en el esquema.
function omitEmpty(obj, keys) {
  const out = clean(obj)
  for (const k of keys) if (out[k] == null) delete out[k]
  return out
}

// ---- Projects --------------------------------------------------------
export const createProject = (values) =>
  supabase.from('projects').insert(clean(values)).select().single()

export const updateProject = (id, values) =>
  supabase.from('projects').update(clean(values)).eq('id', id).select().single()

export const deleteProject = (id) =>
  supabase.from('projects').delete().eq('id', id)

// ---- Project areas --------------------------------------------------
export const createArea = (projectId, values) =>
  supabase
    .from('project_areas')
    .insert(clean({ ...values, project_id: projectId }))
    .select()
    .single()

export const updateArea = (id, values) =>
  supabase.from('project_areas').update(clean(values)).eq('id', id)

export const deleteArea = (id) =>
  supabase.from('project_areas').delete().eq('id', id)

/** Reordena la lista completa de áreas asignando sort_order = índice. */
export const reorderAreas = (orderedIds) =>
  Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('project_areas').update({ sort_order: idx }).eq('id', id)
    )
  )

// ---- Documents ----------------------------------------------------
// `icon_url` es opcional: si va vacío se omite (por si la columna no existe aún).
export const createDocument = (projectId, values) =>
  supabase
    .from('documents')
    .insert(omitEmpty({ ...values, project_id: projectId }, ['icon_url']))
    .select()
    .single()

export const updateDocument = (id, values) =>
  supabase.from('documents').update(omitEmpty(values, ['icon_url'])).eq('id', id)

export const deleteDocument = (id) =>
  supabase.from('documents').delete().eq('id', id)

// ---- Notes -------------------------------------------------------
export const createNote = (projectId, values) =>
  supabase
    .from('notes')
    .insert(clean({ ...values, project_id: projectId }))
    .select()
    .single()

export const updateNote = (id, values) =>
  supabase.from('notes').update(clean(values)).eq('id', id)

export const deleteNote = (id) => supabase.from('notes').delete().eq('id', id)

// ---- Tasks ---------------------------------------------------------
export const createTask = (projectId, values) =>
  supabase
    .from('tasks')
    .insert(clean({ ...values, project_id: projectId }))
    .select()
    .single()

export const updateTask = (id, values) =>
  supabase.from('tasks').update(clean(values)).eq('id', id).select().single()

export const deleteTask = (id) => supabase.from('tasks').delete().eq('id', id)

// ---- Milestones --------------------------------------------------
export const createMilestone = (projectId, values) =>
  supabase
    .from('milestones')
    .insert(clean({ ...values, project_id: projectId }))
    .select()
    .single()

export const deleteMilestone = (id) =>
  supabase.from('milestones').delete().eq('id', id)

// ---- Risks -------------------------------------------------------
export const createRisk = (projectId, values) =>
  supabase
    .from('risks')
    .insert(clean({ ...values, project_id: projectId }))
    .select()
    .single()

export const updateRisk = (id, values) =>
  supabase.from('risks').update(clean(values)).eq('id', id)

export const deleteRisk = (id) => supabase.from('risks').delete().eq('id', id)

// ---- Activity log (opcional, para dejar rastro) -----------------
export const logActivity = (projectId, message) =>
  supabase.from('activity_log').insert(clean({ project_id: projectId, message }))
