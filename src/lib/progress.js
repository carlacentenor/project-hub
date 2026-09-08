/**
 * Avance basado en la CANTIDAD DE TAREAS: porcentaje de tareas completadas
 * sobre el total (solo tareas de nivel superior, no subtareas).
 *
 *   avance de un ÁREA     = tareas completadas del área / tareas del área
 *   avance de un PROYECTO = tareas completadas del proyecto / tareas del proyecto
 *
 * Si no hay tareas, cae al campo manual (`project_areas.progress` /
 * `projects.progress`).
 */

function rootTasks(tasks) {
  return tasks.filter((t) => !t.parent_task_id)
}

function ratioDone(tasks) {
  if (tasks.length === 0) return null
  const done = tasks.filter((t) => t.status === 'completado').length
  return Math.round((done / tasks.length) * 100)
}

/** Avance de un área = % de sus tareas de nivel superior que están completadas. */
export function computeAreaProgress(area, tasks = []) {
  const inArea = rootTasks(tasks).filter((t) => t.area_id === area.id)
  return ratioDone(inArea) ?? area.progress ?? 0
}

/** Estado de un área derivado de su avance por tareas. */
export function deriveAreaStatus(area, tasks = []) {
  const inArea = rootTasks(tasks).filter((t) => t.area_id === area.id)
  if (inArea.length === 0) return area.status ?? 'pendiente'
  if (inArea.some((t) => t.status === 'bloqueado')) return 'en_progreso'
  const done = inArea.filter((t) => t.status === 'completado').length
  if (done === inArea.length) return 'completado'
  if (done === 0 && inArea.every((t) => t.status === 'pendiente')) return 'pendiente'
  return 'en_progreso'
}

/** Avance del proyecto = % de sus tareas de nivel superior completadas. */
export function computeProjectProgress(project, { tasks = [] } = {}) {
  return ratioDone(rootTasks(tasks)) ?? project?.progress ?? 0
}

/**
 * Avance de varios proyectos a la vez desde una lista plana de tareas
 * (1 consulta, no N+1). Devuelve Map<projectId, number>.
 */
export function progressByProject(projects, _areas = [], tasks = []) {
  const tasksBy = new Map()
  for (const t of tasks) {
    if (!tasksBy.has(t.project_id)) tasksBy.set(t.project_id, [])
    tasksBy.get(t.project_id).push(t)
  }
  const out = new Map()
  for (const p of projects) {
    out.set(p.id, computeProjectProgress(p, { tasks: tasksBy.get(p.id) ?? [] }))
  }
  return out
}
