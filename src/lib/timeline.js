import { daysUntil } from './format'

/**
 * "Próximos hitos" = hitos explícitos (tabla `milestones`) + fechas límite de
 * tareas de nivel superior sin completar. Todo en una sola línea de tiempo
 * ordenada por fecha. Así la sección es útil aunque no se creen hitos a mano.
 */
export function buildMilestoneTimeline({
  milestones = [],
  tasks = [],
  limit = 6,
  includeCompleted = false,
}) {
  const items = []

  for (const m of milestones) {
    items.push({
      id: `m-${m.id}`,
      kind: 'milestone',
      name: m.name,
      date: m.due_date || null,
      status: m.status || 'pendiente',
      project: m.project || null,
    })
  }

  for (const t of tasks) {
    if (!t.due_date || t.parent_task_id) continue
    items.push({
      id: `t-${t.id}`,
      kind: 'task',
      name: t.name,
      date: t.due_date,
      status: t.status || 'pendiente',
      project: t.project || null,
    })
  }

  const visible = includeCompleted
    ? items
    : items.filter((i) => i.status !== 'completado')

  visible.sort((a, b) =>
    (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99')
  )

  return visible.slice(0, limit).map((i) => ({
    ...i,
    overdue:
      i.status !== 'completado' &&
      i.date != null &&
      (daysUntil(i.date) ?? 0) < 0,
  }))
}

export const TIMELINE_STATUS = {
  completado: { dot: 'bg-state-success border-state-success', chip: 'bg-state-success-bg text-[#4C7A0E]', label: 'Completado' },
  en_progreso: { dot: 'bg-brand-cyan border-brand-cyan', chip: 'bg-state-info-bg text-cyan-700', label: 'En progreso' },
  bloqueado: { dot: 'bg-state-error border-state-error', chip: 'bg-state-error-bg text-[#A9302A]', label: 'Bloqueada' },
  pendiente: { dot: 'bg-white border-border-strong', chip: 'bg-gray-100 text-text-secondary', label: 'Pendiente' },
}
export const timelineStatus = (s) => TIMELINE_STATUS[s] ?? TIMELINE_STATUS.pendiente
