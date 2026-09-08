import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Button, Avatar, ErrorBox, Spinner } from '../components/ui'
import TaskFormModal from '../components/TaskFormModal'
import { useProjectPlan } from '../lib/useProjectPlan'
import { updateTask, deleteTask } from '../lib/mutations'
import { taskStatus, priority } from '../lib/enums'
import { toDate, diffDays, addDays, fmtDayMonth } from '../lib/format'

const DAY_W = 26
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const WD = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

const BAR_BG = {
  completado: 'var(--color-state-success)',
  en_progreso: 'var(--color-brand-cyan)',
  bloqueado: 'var(--color-state-error)',
  pendiente: 'var(--color-gray-200)',
}

function taskBounds(t) {
  const s = toDate(t.start_date) || toDate(t.due_date)
  const e = toDate(t.due_date) || toDate(t.start_date)
  if (!s || !e) return null
  return [s, e]
}

export default function PlanTrabajo() {
  const { project } = useOutletContext()
  const { areas, tasks, deps, loading, error, reload } = useProjectPlan(project.id)
  const [collapsed, setCollapsed] = useState({})
  const [selected, setSelected] = useState(null)
  const [newOpen, setNewOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)

  async function toggleDone(t) {
    await updateTask(t.id, {
      status: t.status === 'completado' ? 'pendiente' : 'completado',
      progress: t.status === 'completado' ? t.progress : 100,
    })
    reload()
  }

  async function removeTask(t) {
    if (!window.confirm(`¿Eliminar la tarea "${t.name}"?`)) return
    await deleteTask(t.id)
    setSelected(null)
    reload()
  }

  // Rango temporal del Gantt
  const range = useMemo(() => {
    const dates = []
    if (project.start_date) dates.push(toDate(project.start_date))
    if (project.target_date) dates.push(toDate(project.target_date))
    for (const t of tasks) {
      const b = taskBounds(t)
      if (b) dates.push(b[0], b[1])
    }
    if (dates.length === 0) {
      const now = new Date()
      return { start: now, days: 30 }
    }
    const start = new Date(Math.min(...dates.map((d) => d.getTime())))
    const end = new Date(Math.max(...dates.map((d) => d.getTime())))
    return { start, days: Math.max(7, (diffDays(start, end) ?? 20) + 2) }
  }, [tasks, project])

  const totalW = range.days * DAY_W
  const offsetX = (d) => (diffDays(range.start, toDate(d)) ?? 0) * DAY_W
  const todayX = offsetX(new Date().toISOString().slice(0, 10))

  // Árbol: área → tareas raíz → subtareas
  const byArea = useMemo(() => {
    const roots = tasks.filter((t) => !t.parent_task_id)
    const kids = (id) => tasks.filter((t) => t.parent_task_id === id)
    const groups = areas.map((a) => ({
      area: a,
      tasks: roots.filter((t) => t.area_id === a.id).map((t) => ({ t, subs: kids(t.id) })),
    }))
    const orphan = roots.filter((t) => !areas.some((a) => a.id === t.area_id))
    if (orphan.length) {
      groups.push({
        area: { id: '__none', name: 'Sin área' },
        tasks: orphan.map((t) => ({ t, subs: kids(t.id) })),
      })
    }
    return groups
  }, [areas, tasks])

  const depsFor = (id) => deps.filter((d) => d.task_id === id || d.depends_on_task_id === id)

  function Bar({ t }) {
    const b = taskBounds(t)
    if (!b) return null
    const left = offsetX(t.start_date || t.due_date)
    const w = Math.max(DAY_W, ((diffDays(b[0], b[1]) ?? 0) + 1) * DAY_W)
    const isPending = t.status === 'pendiente'
    return (
      <div
        className="absolute top-[9px] h-5 rounded-[5px] flex items-center px-2 text-[10.5px] font-semibold whitespace-nowrap overflow-hidden"
        style={{
          left,
          width: w,
          background: BAR_BG[t.status] || 'var(--color-brand-cyan)',
          color: t.status === 'en_progreso' ? 'var(--color-navy-500)' : isPending ? 'var(--color-text-secondary)' : '#fff',
          border: isPending ? '1px dashed var(--color-border-strong)' : 'none',
        }}
      >
        {t.progress ? `${t.progress}%` : ''}
      </div>
    )
  }

  // Header de días
  const dayCells = Array.from({ length: range.days }).map((_, i) => {
    const d = addDays(range.start, i)
    return { d, wd: WD[d.getDay()], n: d.getDate() }
  })
  const monthSpans = []
  dayCells.forEach((c, i) => {
    const label = `${MONTHS[c.d.getMonth()]} ${c.d.getFullYear()}`
    const last = monthSpans[monthSpans.length - 1]
    if (last && last.label === label) last.span++
    else monthSpans.push({ label, span: 1, startIndex: i })
  })

  const rowGrid = { display: 'grid', gridTemplateColumns: `380px ${totalW}px` }

  return (
    <>
      <div className="px-8 pt-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xl font-bold">Plan de trabajo</div>
          <div className="text-[13px] text-text-secondary mt-1 max-w-[560px]">
            Planificación detallada de actividades, responsables, dependencias y fechas.
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

      <div className="px-8 py-3 flex items-center gap-6 flex-wrap text-[12.5px] text-text-secondary border-b border-border-default bg-surface mt-3.5">
        <span>
          <b className="text-text-primary">{tasks.length}</b> tareas
        </span>
        <span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-state-success mr-1.5" />
          <b className="text-text-primary">
            {tasks.filter((t) => t.status === 'completado').length}
          </b>{' '}
          completadas
        </span>
        <span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-cyan mr-1.5" />
          <b className="text-text-primary">
            {tasks.filter((t) => t.status === 'en_progreso').length}
          </b>{' '}
          en progreso
        </span>
        <span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mr-1.5" />
          <b className="text-text-primary">
            {tasks.filter((t) => t.status === 'pendiente').length}
          </b>{' '}
          pendientes
        </span>
      </div>

      <div className="p-8">
        <ErrorBox error={error} what="el plan de trabajo" />
        {loading && <Spinner />}

        {!loading && tasks.length === 0 && (
          <div className="text-sm text-text-secondary bg-surface border border-border-default rounded-lg p-8 text-center">
            Este proyecto todavía no tiene tareas.
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="border border-border-default rounded-lg bg-surface shadow-1 overflow-auto max-h-[640px] relative">
            <div style={{ width: `calc(380px + ${totalW}px)`, minWidth: '100%' }}>
              {/* Header meses */}
              <div style={rowGrid} className="sticky top-0 z-20 bg-gray-25 border-b border-border-default">
                <div className="sticky left-0 z-10 bg-gray-25 border-r border-border-default px-3 py-1.5 text-[11px] font-bold text-text-secondary">
                  Tarea
                </div>
                <div className="flex">
                  {monthSpans.map((m, i) => (
                    <div
                      key={i}
                      className="text-[11px] font-bold text-text-secondary px-1 py-1.5 border-l border-border-default"
                      style={{ width: m.span * DAY_W }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Header días */}
              <div style={rowGrid} className="sticky top-[29px] z-20 bg-gray-25 border-b border-border-strong">
                <div className="sticky left-0 z-10 bg-gray-25 border-r border-border-default px-3 py-1 text-[10px] font-bold text-text-tertiary uppercase">
                  Responsable · Estado
                </div>
                <div className="flex">
                  {dayCells.map((c, i) => (
                    <div
                      key={i}
                      className="text-[9px] font-semibold text-text-tertiary text-center py-1 border-l border-border-default flex flex-col items-center"
                      style={{ width: DAY_W }}
                    >
                      <span>{c.wd}</span>
                      <span>{c.n}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filas */}
              <div className="relative">
                {todayX >= 0 && todayX <= totalW && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-brand-cyan z-10 pointer-events-none"
                    style={{ left: 380 + todayX }}
                  >
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold text-brand-cyan bg-white px-1 rounded border border-brand-cyan whitespace-nowrap">
                      Hoy
                    </span>
                  </div>
                )}

                {byArea.map((g) => {
                  const isCol = collapsed[g.area.id]
                  return (
                    <div key={g.area.id}>
                      <div style={rowGrid} className="border-b border-border-default">
                        <div
                          className="sticky left-0 z-[1] bg-white border-r border-border-default flex items-center gap-2 px-3 min-h-[44px] cursor-pointer hover:bg-gray-25"
                          onClick={() =>
                            setCollapsed((c) => ({ ...c, [g.area.id]: !c[g.area.id] }))
                          }
                        >
                          <span className="text-[10px] text-text-tertiary w-3">
                            {isCol ? '▸' : '▾'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold tracking-wide uppercase">
                              {g.area.name}
                            </div>
                            <div className="text-[11px] text-text-tertiary">
                              {g.tasks.length} tareas
                            </div>
                          </div>
                        </div>
                        <div className="relative min-h-[44px]">
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                'linear-gradient(to right, var(--color-border-default) 1px, transparent 1px)',
                              backgroundSize: `${DAY_W}px 100%`,
                            }}
                          />
                        </div>
                      </div>

                      {!isCol &&
                        g.tasks.map(({ t, subs }) => (
                          <div key={t.id}>
                            <TaskRow
                              t={t}
                              indent={28}
                              rowGrid={rowGrid}
                              onClick={() => setSelected(t)}
                              onToggle={() => toggleDone(t)}
                              Bar={Bar}
                              DAY_W={DAY_W}
                            />
                            {subs.map((s) => (
                              <TaskRow
                                key={s.id}
                                t={s}
                                indent={48}
                                rowGrid={rowGrid}
                                onClick={() => setSelected(s)}
                                onToggle={() => toggleDone(s)}
                                Bar={Bar}
                                DAY_W={DAY_W}
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-[rgba(16,56,79,0.25)] z-30"
            onClick={() => setSelected(null)}
          />
          <div className="fixed top-0 right-0 w-[400px] h-full bg-white shadow-3 z-40 p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="text-base font-bold max-w-[300px]">{selected.name}</div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-text-tertiary text-base"
              >
                ✕
              </button>
            </div>
            {[
              ['Estado', taskStatus(selected.status).label],
              ['Responsable', selected.assignee_name || '—'],
              ['Prioridad', priority(selected.priority).label],
              [
                'Fecha',
                selected.start_date || selected.due_date
                  ? `${fmtDayMonth(selected.start_date)} – ${fmtDayMonth(selected.due_date)}`
                  : '—',
              ],
              ['Progreso', `${selected.progress ?? 0}%`],
              ...(selected.blocked_reason
                ? [['Bloqueada por', selected.blocked_reason]]
                : []),
            ].map(([k, v]) => (
              <div key={k} className="mb-4">
                <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                  {k}
                </div>
                <div className="text-[13.5px] font-medium">{v}</div>
              </div>
            ))}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                Dependencias
              </div>
              <div className="text-[12.5px] text-text-secondary">
                {depsFor(selected.id).length === 0
                  ? 'Sin dependencias registradas'
                  : depsFor(selected.id).map((d) => {
                      const other = tasks.find(
                        (x) =>
                          x.id ===
                          (d.task_id === selected.id ? d.depends_on_task_id : d.task_id)
                      )
                      const kind = d.task_id === selected.id ? 'Depende de' : 'Bloquea'
                      return (
                        <div key={d.id}>
                          <span className="text-text-tertiary">{kind}:</span>{' '}
                          {other?.name || '—'}
                        </div>
                      )
                    })}
              </div>
            </div>
            {selected.description && (
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
                  Descripción
                </div>
                <div className="text-[12.5px] text-text-secondary">
                  {selected.description}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6 pt-4 border-t border-border-default">
              <Button
                onClick={() => {
                  setEditTask(selected)
                  setSelected(null)
                }}
              >
                Editar
              </Button>
              <Button variant="primary" onClick={() => toggleDone(selected)}>
                {selected.status === 'completado' ? 'Reabrir' : 'Completar'}
              </Button>
              <button
                type="button"
                onClick={() => removeTask(selected)}
                className="ml-auto text-[13px] font-semibold text-state-error hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}

      <TaskFormModal
        open={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask}
        areas={areas}
        onSaved={reload}
      />
    </>
  )
}

function TaskRow({ t, indent, rowGrid, onClick, onToggle, Bar, DAY_W }) {
  const ts = taskStatus(t.status)
  return (
    <div style={rowGrid} className="border-b border-border-default group">
      <div
        className="sticky left-0 z-[1] bg-white group-hover:bg-[rgba(0,188,255,0.04)] border-r border-border-default flex items-center gap-2 pr-3 min-h-[38px] cursor-pointer"
        style={{ paddingLeft: indent }}
        onClick={onClick}
      >
        <input
          type="checkbox"
          className="w-3.5 h-3.5 accent-brand-cyan shrink-0"
          checked={t.status === 'completado'}
          onChange={() => {}}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        />
        <span className="text-[12.5px] font-medium flex-1 min-w-0 truncate">
          {t.name}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {t.assignee_name && <Avatar name={t.assignee_name} size={18} />}
          <span className={`text-[10px] font-semibold px-[7px] py-[2px] rounded-pill ${ts.cls}`}>
            {ts.short}
          </span>
        </span>
      </div>
      <div className="relative min-h-[38px] group-hover:bg-[rgba(0,188,255,0.04)]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-border-default) 1px, transparent 1px)',
            backgroundSize: `${DAY_W}px 100%`,
          }}
        />
        <Bar t={t} />
      </div>
    </div>
  )
}
