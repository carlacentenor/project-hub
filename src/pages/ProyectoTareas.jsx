import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { IconSearch } from '../components/icons'
import {
  Avatar,
  Button,
  ProgressRow,
  PriorityTag,
  Spinner,
  ErrorBox,
  EmptyBox,
} from '../components/ui'
import TaskFormModal from '../components/TaskFormModal'
import { useProjectTasks } from '../lib/useProjectTasks'
import { updateTask } from '../lib/mutations'
import {
  taskStatus,
  priority,
  TASK_STATUS_ORDER,
  PRIORITY_RANK,
} from '../lib/enums'
import { fmtDayMonth, dueLabel, isOverdue, isToday } from '../lib/format'

const QF = [
  ['all', 'Todas'],
  ['pendiente', 'Pendientes'],
  ['en_progreso', 'En progreso'],
  ['bloqueado', 'Bloqueadas'],
  ['completado', 'Completadas'],
  ['atrasada', 'Atrasadas'],
]

function TaskCheck({ task, onToggle }) {
  return (
    <input
      type="checkbox"
      className="w-3.5 h-3.5 accent-brand-cyan shrink-0"
      checked={task.status === 'completado'}
      onChange={() => {}}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(task)
      }}
    />
  )
}

function DueCell({ date, done }) {
  if (!date) return <span className="text-text-tertiary text-[12.5px]">—</span>
  const over = !done && isOverdue(date)
  return (
    <div>
      <div
        className={`text-[12.5px] font-semibold ${
          over
            ? 'text-[#A9302A]'
            : !done && isToday(date)
              ? 'text-cyan-700'
              : 'text-text-primary'
        }`}
      >
        {!done && isToday(date) ? 'Hoy' : fmtDayMonth(date)}
      </div>
      {over && (
        <div className="text-[10.5px] text-state-error font-semibold">
          {dueLabel(date)}
        </div>
      )}
    </div>
  )
}

function StatusChip({ status }) {
  const s = taskStatus(status)
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-[3px] rounded-pill ${s.cls}`}>
      {s.short}
    </span>
  )
}

// -------- Lista agrupada por área --------
function ListView({ tasks, areas, onEdit, onToggle }) {
  const groups = useMemo(() => {
    const byArea = new Map()
    for (const a of areas) byArea.set(a.id, { area: a, items: [] })
    byArea.set('__none', { area: { id: '__none', name: 'Sin área' }, items: [] })
    for (const t of tasks) {
      const key = t.area_id && byArea.has(t.area_id) ? t.area_id : '__none'
      byArea.get(key).items.push(t)
    }
    return [...byArea.values()].filter((g) => g.items.length > 0)
  }, [tasks, areas])

  const [collapsed, setCollapsed] = useState({})

  return (
    <div className="bg-surface border border-border-default rounded-lg shadow-1 overflow-hidden">
      {groups.map((g) => {
        const isCol = collapsed[g.area.id]
        const pct = Math.round(
          g.items.reduce(
            (a, t) => a + (t.status === 'completado' ? 100 : t.progress || 0),
            0
          ) / g.items.length
        )
        return (
          <div key={g.area.id}>
            <div
              className="flex items-center gap-2.5 px-4 py-3 bg-gray-25 border-b border-border-default cursor-pointer hover:bg-gray-50"
              onClick={() => setCollapsed((c) => ({ ...c, [g.area.id]: !c[g.area.id] }))}
            >
              <span className="text-[10px] text-text-tertiary w-2.5">
                {isCol ? '▸' : '▾'}
              </span>
              <span className="text-[13px] font-bold">{g.area.name}</span>
              <span className="text-[11.5px] text-text-tertiary ml-1">
                {g.items.length} {g.items.length === 1 ? 'tarea' : 'tareas'} · {pct}%
              </span>
            </div>
            {!isCol &&
              g.items.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEdit(t)}
                  className="grid grid-cols-[minmax(200px,2.6fr)_130px_120px_90px_120px] gap-2.5 items-center px-4 py-2.5 border-b border-border-default last:border-b-0 hover:bg-gray-25 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TaskCheck task={t} onToggle={onToggle} />
                    <span className="text-[13px] font-medium truncate">{t.name}</span>
                    {t.parent_task_id && (
                      <span className="text-[10.5px] text-text-tertiary shrink-0">
                        subtarea
                      </span>
                    )}
                    {t.blocked_reason && <span title={t.blocked_reason}>🔒</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Avatar name={t.assignee_name} size={20} />
                    <span className="text-xs truncate">{t.assignee_name || '—'}</span>
                  </div>
                  <StatusChip status={t.status} />
                  <PriorityTag p={priority(t.priority)} />
                  <DueCell date={t.due_date} done={t.status === 'completado'} />
                </div>
              ))}
          </div>
        )
      })}
    </div>
  )
}

// -------- Kanban --------
function KanbanView({ tasks, onEdit }) {
  const cols = TASK_STATUS_ORDER.map((s) => ({
    key: s,
    label: taskStatus(s).kanban,
    items: tasks.filter((t) => t.status === s),
  }))
  return (
    <div className="flex gap-4 items-start overflow-x-auto pb-2">
      {cols.map((c) => (
        <div
          key={c.key}
          className="bg-gray-25 border border-border-default rounded-lg w-[270px] shrink-0 flex flex-col max-h-[720px]"
        >
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-border-default">
            <span className="text-[12.5px] font-bold">{c.label}</span>
            <span className="text-[11px] font-bold text-text-secondary bg-white border border-border-default px-2 rounded-pill">
              {c.items.length}
            </span>
          </div>
          <div className="p-2.5 flex flex-col gap-2 overflow-y-auto">
            {c.items.map((t) => (
              <div
                key={t.id}
                onClick={() => onEdit(t)}
                className="bg-white border border-border-default rounded-md p-2.5 flex flex-col gap-1.5 shadow-1 cursor-pointer hover:shadow-2"
              >
                <div className="text-[12.5px] font-semibold">{t.name}</div>
                {t.area?.name && (
                  <div className="text-[11px] text-text-secondary">{t.area.name}</div>
                )}
                <div className="flex items-center gap-2 text-[11px]">
                  <Avatar name={t.assignee_name} size={20} />
                  <PriorityTag p={priority(t.priority)} />
                  {(() => {
                    const done = t.status === 'completado'
                    const over = !done && isOverdue(t.due_date)
                    const today = !done && isToday(t.due_date)
                    return (
                      <span
                        className={`ml-auto font-semibold ${
                          over
                            ? 'text-state-error'
                            : today
                              ? 'text-cyan-700'
                              : 'text-text-secondary'
                        }`}
                      >
                        {t.due_date ? (today ? 'Hoy' : fmtDayMonth(t.due_date)) : '—'}
                      </span>
                    )
                  })()}
                </div>
                <ProgressRow value={t.progress} color="var(--color-brand-cyan)" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProyectoTareas() {
  const { project } = useOutletContext()
  const { tasks, areas, loading, error, reload } = useProjectTasks(project.id)
  const [view, setView] = useState('list')
  const [qf, setQf] = useState('all')
  const [query, setQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)

  async function handleToggle(t) {
    await updateTask(t.id, {
      status: t.status === 'completado' ? 'pendiente' : 'completado',
      progress: t.status === 'completado' ? t.progress : 100,
    })
    reload()
  }

  const counts = useMemo(() => {
    const c = { all: tasks.length, atrasada: 0 }
    for (const t of tasks) {
      c[t.status] = (c[t.status] || 0) + 1
      if (t.status !== 'completado' && isOverdue(t.due_date)) c.atrasada++
    }
    return c
  }, [tasks])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return tasks
      .filter((t) => {
        if (qf === 'atrasada')
          return t.status !== 'completado' && isOverdue(t.due_date)
        if (qf !== 'all') return t.status === qf
        return true
      })
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          (t.assignee_name || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        return (a.due_date || '9999').localeCompare(b.due_date || '9999')
      })
  }, [tasks, qf, query])

  return (
    <div className="p-8 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xl font-bold">Tareas del proyecto</div>
          <div className="text-[13px] text-text-secondary mt-1">
            Todas las tareas de {project.name}.
          </div>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          + Nueva tarea
        </Button>
      </div>

      <TaskFormModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        projectId={project.id}
        areas={areas}
        onSaved={reload}
      />
      <TaskFormModal
        open={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask}
        projectId={project.id}
        areas={areas}
        onSaved={reload}
      />

      <div className="flex gap-2 flex-wrap">
        {QF.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setQf(key)}
            className={`flex flex-col items-start gap-0.5 px-4 py-2 rounded-md border min-w-[84px] ${
              qf === key
                ? 'border-brand-cyan bg-state-info-bg'
                : 'border-border-default bg-white hover:border-border-strong'
            }`}
          >
            <span className="text-[11px] font-semibold text-text-secondary">
              {label}
            </span>
            <span
              className={`text-base font-bold ${
                key === 'atrasada' || key === 'bloqueado' ? 'text-state-error' : ''
              }`}
            >
              {counts[key] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border-strong bg-white w-[240px] text-text-tertiary text-[12.5px]">
          <IconSearch className="w-3 h-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas..."
            className="border-none outline-none text-[12.5px] w-full text-text-primary bg-transparent placeholder:text-text-tertiary"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-text-tertiary">{filtered.length} tareas</span>
          <div className="flex border border-border-strong rounded-md overflow-hidden">
            {[
              ['list', 'Lista'],
              ['kanban', 'Kanban'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-[7px] text-xs font-medium border-l border-border-strong first:border-l-0 ${
                  view === v
                    ? 'bg-state-info-bg text-cyan-700'
                    : 'bg-white text-text-secondary'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ErrorBox error={error} what="las tareas" />
      {loading && <Spinner />}
      {!loading && !error && tasks.length === 0 && (
        <EmptyBox>Este proyecto todavía no tiene tareas.</EmptyBox>
      )}
      {!loading && tasks.length > 0 && (
        <>
          {view === 'list' && (
            <ListView
              tasks={filtered}
              areas={areas}
              onEdit={setEditTask}
              onToggle={handleToggle}
            />
          )}
          {view === 'kanban' && <KanbanView tasks={filtered} onEdit={setEditTask} />}
        </>
      )}
    </div>
  )
}
