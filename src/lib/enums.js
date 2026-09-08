/* Mapeo de los enums de la base (esquema Supabase) a etiqueta + estilo,
   siguiendo los chips/estados de los mockups HTML. */

// ---- Estado de proyecto -------------------------------------------------
const PROJECT_STATUS = {
  no_iniciado: { label: 'No iniciado', cls: 'bg-gray-100 text-text-secondary', dot: 'var(--color-gray-400)' },
  planificacion: { label: 'En planificación', cls: 'bg-state-plan-bg text-state-plan', dot: 'var(--color-proj-plum)' },
  diseno: { label: 'En diseño', cls: 'bg-state-info-bg text-cyan-700', dot: 'var(--color-brand-cyan)' },
  desarrollo: { label: 'En desarrollo', cls: 'bg-state-info-bg text-cyan-700', dot: 'var(--color-brand-cyan)' },
  qa: { label: 'En QA', cls: 'bg-state-warning-bg text-[#8A6200]', dot: 'var(--color-state-warning)' },
  completado: { label: 'Completado', cls: 'bg-state-success-bg text-[#4C7A0E]', dot: 'var(--color-state-success)' },
  bloqueado: { label: 'Bloqueado', cls: 'bg-state-error-bg text-[#A9302A]', dot: 'var(--color-state-error)' },
  archivado: { label: 'Archivado', cls: 'bg-gray-100 text-text-secondary', dot: 'var(--color-gray-400)' },
}
export const projectStatus = (v) =>
  PROJECT_STATUS[v] ?? { label: v || '—', cls: 'bg-gray-100 text-text-secondary', dot: 'var(--color-gray-400)' }

// "En ejecución" pill del subnav de detalle: cualquier estado activo.
export const isActiveProjectStatus = (v) =>
  ['planificacion', 'diseno', 'desarrollo', 'qa'].includes(v)

// ---- Estado de tarea --------------------------------------------------
const TASK_STATUS = {
  pendiente: { label: 'Pendiente', short: '○ Pendiente', cls: 'bg-gray-100 text-text-secondary', kanban: 'Pendiente' },
  en_progreso: { label: 'En progreso', short: '● En progreso', cls: 'bg-state-info-bg text-cyan-700', kanban: 'En progreso' },
  completado: { label: 'Completado', short: '✓ Completado', cls: 'bg-state-success-bg text-[#4C7A0E]', kanban: 'Completado' },
  bloqueado: { label: 'Bloqueada', short: '🔒 Bloqueada', cls: 'bg-state-error-bg text-[#A9302A]', kanban: 'Bloqueada' },
}
export const taskStatus = (v) =>
  TASK_STATUS[v] ?? { label: v || '—', short: v || '—', cls: 'bg-gray-100 text-text-secondary', kanban: 'Pendiente' }
export const TASK_STATUS_ORDER = ['pendiente', 'en_progreso', 'bloqueado', 'completado']

// ---- Estado de área -------------------------------------------------
const AREA_STATUS = {
  pendiente: { label: 'Pendiente', cls: 'bg-gray-100 text-text-secondary' },
  proximo: { label: 'Próximo', cls: 'bg-state-warning-bg text-[#8A6200]' },
  en_progreso: { label: 'En progreso', cls: 'bg-state-info-bg text-cyan-700' },
  completado: { label: 'Completado', cls: 'bg-state-success-bg text-[#4C7A0E]' },
}
export const areaStatus = (v) =>
  AREA_STATUS[v] ?? { label: v || '—', cls: 'bg-gray-100 text-text-secondary' }

// ---- Prioridad -----------------------------------------------------
const PRIORITY = {
  alta: { label: 'Alta', arrow: '↑', color: '#8A6200' },
  media: { label: 'Media', arrow: '→', color: 'var(--color-brand-teal)' },
  baja: { label: 'Baja', arrow: '↓', color: 'var(--color-text-secondary)' },
}
export const priority = (v) => PRIORITY[v] ?? PRIORITY.media
export const PRIORITY_RANK = { alta: 0, media: 1, baja: 2 }

// ---- Severidad de riesgo ------------------------------------------
const SEVERITY = {
  alto: { label: 'ALTO', cls: 'bg-state-error-bg text-[#A9302A]', badge: 'bg-state-error-bg text-[#A9302A]' },
  medio: { label: 'MEDIO', cls: 'bg-state-warning-bg text-[#8A6200]', badge: 'bg-state-warning-bg text-[#8A6200]' },
  bajo: { label: 'BAJO', cls: 'bg-gray-100 text-text-secondary', badge: 'bg-gray-100 text-text-secondary' },
}
export const severity = (v) => SEVERITY[v] ?? SEVERITY.medio
export const SEVERITY_RANK = { alto: 0, medio: 1, bajo: 2 }

// ---- Tipo de nota ------------------------------------------------
const NOTE_TYPE = {
  decision: { label: 'Decisión', icon: '📌', cls: 'bg-state-info-bg text-cyan-700' },
  pendiente: { label: 'Pendiente', icon: '⚠️', cls: 'bg-state-warning-bg text-[#8A6200]' },
  idea: { label: 'Idea', icon: '💡', cls: 'bg-state-success-bg text-[#4C7A0E]' },
}
export const noteType = (v) => NOTE_TYPE[v] ?? NOTE_TYPE.idea
export const NOTE_TYPES = Object.keys(NOTE_TYPE)

// ---- Estado de hito --------------------------------------------
const MILESTONE_STATUS = {
  pendiente: { label: 'Pendiente', state: '' },
  en_progreso: { label: 'En progreso', state: 'active' },
  completado: { label: 'Completado', state: 'done' },
}
export const milestoneStatus = (v) => MILESTONE_STATUS[v] ?? MILESTONE_STATUS.pendiente

// ---- Opciones para <select> de formularios ----------------------
export const PROJECT_STATUS_OPTIONS = [
  ['no_iniciado', 'No iniciado'],
  ['planificacion', 'En planificación'],
  ['diseno', 'En diseño'],
  ['desarrollo', 'En desarrollo'],
  ['qa', 'En QA'],
  ['completado', 'Completado'],
  ['bloqueado', 'Bloqueado'],
  ['archivado', 'Archivado'],
].map(([value, label]) => ({ value, label }))

export const TASK_STATUS_OPTIONS = [
  ['pendiente', 'Pendiente'],
  ['en_progreso', 'En progreso'],
  ['completado', 'Completado'],
  ['bloqueado', 'Bloqueada'],
].map(([value, label]) => ({ value, label }))

export const AREA_STATUS_OPTIONS = [
  ['pendiente', 'Pendiente'],
  ['proximo', 'Próximo'],
  ['en_progreso', 'En progreso'],
  ['completado', 'Completado'],
].map(([value, label]) => ({ value, label }))

export const PRIORITY_OPTIONS = [
  ['alta', 'Alta'],
  ['media', 'Media'],
  ['baja', 'Baja'],
].map(([value, label]) => ({ value, label }))

export const SEVERITY_OPTIONS = [
  ['alto', 'Alto'],
  ['medio', 'Medio'],
  ['bajo', 'Bajo'],
].map(([value, label]) => ({ value, label }))

export const MILESTONE_STATUS_OPTIONS = [
  ['pendiente', 'Pendiente'],
  ['en_progreso', 'En progreso'],
  ['completado', 'Completado'],
].map(([value, label]) => ({ value, label }))

export const NOTE_TYPE_OPTIONS = [
  ['decision', 'Decisión'],
  ['pendiente', 'Pendiente'],
  ['idea', 'Idea'],
].map(([value, label]) => ({ value, label }))

export const PROJECT_COLORS = [
  '#00BCFF', '#00617F', '#89D329', '#5B6FE0',
  '#9457C9', '#D68C2B', '#D65C7A',
]

// ---- Fuente de documento → icono --------------------------------
export const docIcon = (source) => {
  const s = String(source || '').toLowerCase()
  if (s.includes('figma')) return '🎨'
  if (s.includes('jira')) return '🎫'
  if (s.includes('sharepoint')) return '📄'
  if (s.includes('sheet') || s.includes('excel')) return '📊'
  return '📄'
}
