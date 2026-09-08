import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProjectFormModal from '../components/ProjectFormModal'
import {
  Avatar,
  Button,
  Chip,
  KpiCard,
  ProgressRow,
  SectionCard,
  Spinner,
  ErrorBox,
} from '../components/ui'
import { IconProjects, IconTasks, IconBell, IconSearch } from '../components/icons'
import { useAuth } from '../lib/useAuth'
import { useDashboard } from '../lib/useDashboard'
import { projectStatus, isActiveProjectStatus, taskStatus } from '../lib/enums'
import { buildMilestoneTimeline } from '../lib/timeline'
import {
  fmtDayMonth,
  fmtRange,
  daysUntil,
  dueLabel,
  isToday,
  isOverdue,
  relativeTime,
  diffDays,
  toDate,
} from '../lib/format'

const MS_STATUS_COLOR = {
  completado: 'var(--color-state-success)',
  en_progreso: 'var(--color-brand-cyan)',
  pendiente: 'var(--color-gray-400)',
}

const GANTT_COLS = 8
const LABEL_W = 148

function GanttPreview({ projects, milestones = [] }) {
  const dated = projects.filter((p) => p.start_date && p.target_date)

  const { min, span, ticks, todayPct } = useMemo(() => {
    if (dated.length === 0) return { min: null, span: 1, ticks: [], todayPct: null }
    const times = []
    for (const p of dated) {
      times.push(toDate(p.start_date).getTime(), toDate(p.target_date).getTime())
    }
    for (const m of milestones) {
      if (m.due_date) times.push(toDate(m.due_date).getTime())
    }
    let lo = new Date(Math.min(...times))
    let hi = new Date(Math.max(...times))
    // Margen a los lados para que ningún marcador quede pegado al borde.
    const rawDays = Math.max(1, diffDays(lo, hi))
    const pad = Math.max(2, Math.ceil(rawDays * 0.07))
    lo = new Date(lo.getTime() - pad * 86400000)
    hi = new Date(hi.getTime() + pad * 86400000)
    const total = diffDays(lo, hi)
    const t = Array.from({ length: GANTT_COLS + 1 }, (_, i) => {
      const d = new Date(lo.getTime() + (i / GANTT_COLS) * (hi - lo))
      return fmtDayMonth(d)
    })
    const td = diffDays(lo, new Date())
    return {
      min: lo,
      span: total,
      ticks: t,
      todayPct: td >= 0 && td <= total ? (td / total) * 100 : null,
    }
  }, [dated, milestones])

  if (dated.length === 0)
    return (
      <div className="text-[12.5px] text-text-secondary">
        Sin fechas de proyecto para mostrar la línea de tiempo.
      </div>
    )

  const pos = (d) => (diffDays(min, toDate(d)) / span) * 100
  // Cuadrícula: una línea en cada k/GANTT_COLS (coincide con las marcas del header).
  const gridBg = {
    backgroundImage:
      'linear-gradient(to right, var(--color-border-default) 1px, transparent 1px)',
    backgroundSize: `${100 / GANTT_COLS}% 100%`,
  }

  return (
    <div className="border border-border-default rounded-md overflow-hidden">
      {/* Cabecera de fechas — marcas alineadas con la cuadrícula */}
      <div className="flex bg-gray-25 border-b border-border-default">
        <div
          className="px-2.5 py-1.5 text-[10.5px] font-semibold text-text-secondary shrink-0 border-r border-border-default"
          style={{ width: LABEL_W }}
        >
          Proyecto
        </div>
        <div className="relative flex-1 h-7">
          {ticks.map((t, i) => (
            <span
              key={i}
              className="absolute top-1.5 text-[10px] font-semibold text-text-tertiary whitespace-nowrap"
              style={{
                left: `${(i / GANTT_COLS) * 100}%`,
                transform:
                  i === 0
                    ? 'translateX(0)'
                    : i === GANTT_COLS
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Filas de proyecto */}
      {dated.map((p) => {
        const left = pos(p.start_date)
        const width = Math.max(2, pos(p.target_date) - left)
        const pMilestones = milestones.filter(
          (m) => m.project_id === p.id || m.project?.name === p.name
        )
        return (
          <div
            key={p.id}
            className="flex border-b border-border-default last:border-b-0 min-h-[40px] items-stretch"
          >
            <div
              className="px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shrink-0 border-r border-border-default"
              style={{ width: LABEL_W }}
            >
              <span
                className="w-2 h-2 rounded-[2px] shrink-0"
                style={{ background: p.color || 'var(--color-proj-cyan)' }}
              />
              <span className="truncate">{p.name}</span>
            </div>
            <div className="relative flex-1 min-h-[40px]" style={gridBg}>
              {todayPct !== null && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-brand-cyan/70 z-[1]"
                  style={{ left: `${todayPct}%` }}
                  title="Hoy"
                />
              )}
              <div
                className="absolute top-[11px] h-[18px] rounded-[5px] flex items-center px-2 text-[10.5px] font-semibold overflow-hidden whitespace-nowrap"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: p.color || 'var(--color-proj-cyan)',
                  color: 'var(--color-navy-500)',
                }}
              >
                {p.name}
              </div>
              {/* Marcador de fecha objetivo (fecha de salida) */}
              <div
                className="absolute top-[12px] w-4 h-4 rotate-45 rounded-[3px] border-2 border-white z-[3] shadow-[0_1px_3px_rgba(16,56,79,0.35)]"
                style={{
                  left: `${pos(p.target_date)}%`,
                  marginLeft: -8,
                  background: 'var(--color-navy-500)',
                }}
                title={`Fecha objetivo · ${fmtDayMonth(p.target_date)}`}
              />
              {/* Hitos del proyecto */}
              {pMilestones.map((m) => (
                <div
                  key={m.id}
                  className="absolute top-[13px] w-3 h-3 rotate-45 rounded-[2px] border border-white z-[2]"
                  style={{
                    left: `${pos(m.due_date)}%`,
                    marginLeft: -6,
                    background: MS_STATUS_COLOR[m.status] || 'var(--color-gray-400)',
                  }}
                  title={`${m.name} · ${fmtDayMonth(m.due_date)}`}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [newOpen, setNewOpen] = useState(false)
  const { projects, milestones, tasks, activity, loading, error } = useDashboard()

  const firstName = (user?.user_metadata?.name || user?.email || 'Hola')
    .split(/[@\s]/)[0]

  const activeProjects = projects.filter((p) => isActiveProjectStatus(p.status))
  const blockedTasks = tasks.filter((t) => t.status === 'bloqueado')

  const upcomingMilestones = useMemo(
    () => buildMilestoneTimeline({ milestones, tasks, limit: 6 }),
    [milestones, tasks]
  )

  const nextMilestoneDays = upcomingMilestones.length
    ? daysUntil(upcomingMilestones[0].date)
    : null

  const todayTasks = tasks.filter(
    (t) => t.status !== 'completado' && isToday(t.due_date)
  )
  const attention = [
    ...blockedTasks.map((t) => ({
      err: true,
      title: `${t.project?.name ?? 'Tarea'} — ${t.name} bloqueada`,
      sub: t.blocked_reason ? `Esperando: ${t.blocked_reason}` : 'Tarea bloqueada',
    })),
    ...tasks
      .filter(
        (t) =>
          t.status !== 'completado' &&
          !isToday(t.due_date) &&
          (daysUntil(t.due_date) ?? 99) >= 0 &&
          (daysUntil(t.due_date) ?? 99) <= 2
      )
      .map((t) => ({
        err: false,
        title: `${t.name} vence pronto`,
        sub: `${t.project?.name ?? ''} · ${dueLabel(t.due_date)}`,
      })),
    ...tasks
      .filter((t) => t.status !== 'completado' && isOverdue(t.due_date))
      .map((t) => ({
        err: true,
        title: `${t.name} atrasada`,
        sub: `${t.project?.name ?? ''} · ${dueLabel(t.due_date)}`,
      })),
  ].slice(0, 5)

  if (loading) {
    return (
      <>
        <TopBar />
        <Spinner />
      </>
    )
  }

  return (
    <>
      <TopBar />
      <div className="p-8 flex flex-col gap-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xl font-semibold capitalize">Hola, {firstName} 👋</div>
            <div className="text-[13px] text-text-secondary mt-0.5">
              Aquí tienes el resumen de lo que está pasando en tus proyectos.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => setNewOpen(true)}>
              + Nuevo proyecto
            </Button>
          </div>
        </div>

        <ProjectFormModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onSaved={(p) => p?.id && navigate(`/proyectos/${p.id}`)}
        />

        <ErrorBox error={error} what="el dashboard" />

        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Proyectos activos"
            value={activeProjects.length}
            icon={<IconProjects className="w-4 h-4" />}
            iconClass="bg-state-info-bg text-cyan-700"
          />
          <KpiCard
            label="Próximos hitos"
            value={upcomingMilestones.length}
            icon={<span className="text-sm">★</span>}
            iconClass="bg-state-success-bg text-[#4C7A0E]"
          >
            <div className="text-[11.5px] text-text-tertiary">
              {nextMilestoneDays === null
                ? '—'
                : nextMilestoneDays === 0
                  ? 'El más próximo es hoy'
                  : `El más próximo en ${nextMilestoneDays} días`}
            </div>
          </KpiCard>
          <KpiCard
            label="Tareas para hoy"
            value={todayTasks.length}
            icon={<IconTasks className="w-4 h-4" />}
            iconClass="bg-gray-50 text-text-secondary"
          />
          <KpiCard
            label="Bloqueados"
            value={blockedTasks.length}
            icon={<span className="text-sm">!</span>}
            iconClass="bg-state-error-bg text-[#A9302A]"
          >
            {blockedTasks.length > 0 && (
              <div className="text-[11.5px] text-state-error">Requieren atención</div>
            )}
          </KpiCard>
        </div>

        <SectionCard
          title="Proyectos activos"
          action={
            <Link to="/proyectos" className="text-xs font-semibold text-brand-teal no-underline hover:underline">
              Ver todos
            </Link>
          }
        >
          {activeProjects.length === 0 ? (
            <div className="text-[12.5px] text-text-secondary">Sin proyectos activos.</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {activeProjects.slice(0, 6).map((p) => {
                const s = projectStatus(p.status)
                return (
                  <Link
                    key={p.id}
                    to={`/proyectos/${p.id}`}
                    className="border border-border-default rounded-lg p-3.5 flex flex-col gap-2.5 no-underline text-inherit hover:shadow-2 hover:border-border-strong transition-[box-shadow,border-color]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-[9px] h-[9px] rounded-[3px]"
                        style={{ background: p.color || 'var(--color-proj-cyan)' }}
                      />
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-text-secondary">{p.description}</div>
                        )}
                      </div>
                    </div>
                    <Chip label={s.label} cls={s.cls} dot={s.dot} />
                    <ProgressRow value={p.progress_computed ?? p.progress} color={p.color} />
                    <div className="text-[11.5px] text-text-secondary">
                      {fmtRange(p.start_date, p.target_date)}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Timeline general">
          <GanttPreview projects={projects} milestones={milestones} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10.5px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-navy-500 inline-block" />
              Fecha objetivo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-state-success inline-block" />
              Hito completado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-brand-cyan inline-block" />
              Hito en progreso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-gray-400 inline-block" />
              Hito pendiente
            </span>
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 gap-4 items-start">
          <SectionCard title="Próximos hitos">
            {upcomingMilestones.length === 0 && (
              <div className="text-[12.5px] text-text-secondary">
                Sin hitos ni tareas con fecha próxima.
              </div>
            )}
            {upcomingMilestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 py-2.5 border-t border-border-default first:border-t-0"
              >
                <div
                  className="w-3.5 h-3.5 rotate-45 rounded-[3px] shrink-0"
                  style={{ background: m.project?.color || 'var(--color-proj-cyan)' }}
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold flex items-center gap-1.5">
                    {m.name}
                    <span className="text-[10px] font-bold text-text-tertiary">
                      {m.kind === 'milestone' ? '◆' : '•'}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-text-secondary">
                    {m.project?.name}
                  </div>
                </div>
                <div
                  className={`ml-auto text-xs font-semibold whitespace-nowrap ${
                    m.overdue ? 'text-state-error' : 'text-text-secondary'
                  }`}
                >
                  {fmtDayMonth(m.date)}
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Requiere atención">
            {attention.length === 0 && (
              <div className="text-[12.5px] text-text-secondary">Nada urgente. 🎉</div>
            )}
            {attention.map((a, i) => (
              <div
                key={i}
                className={`flex gap-2.5 items-start p-2.5 rounded-md mb-2 last:mb-0 ${
                  a.err ? 'bg-state-error-bg' : 'bg-state-warning-bg'
                }`}
              >
                <span className="text-[13px] mt-px">⚠</span>
                <div>
                  <div className="text-[13px] font-semibold">{a.title}</div>
                  <div className="text-[11.5px] text-text-secondary mt-0.5">{a.sub}</div>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <SectionCard title="Para hoy">
            {todayTasks.length === 0 && (
              <div className="text-[12.5px] text-text-secondary">Nada para hoy.</div>
            )}
            {todayTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 py-2 border-t border-border-default first:border-t-0"
              >
                <div className="w-4 h-4 rounded border-[1.5px] border-border-strong shrink-0" />
                <div>
                  <div className="text-[13px] font-medium">{t.name}</div>
                  <div className="text-[11px] text-text-tertiary mt-px">
                    {t.project?.name} · {taskStatus(t.status).label}
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Actividad reciente">
            {activity.length === 0 && (
              <div className="text-[12.5px] text-text-secondary">Sin actividad.</div>
            )}
            {activity.map((a) => (
              <div
                key={a.id}
                className="flex gap-2.5 py-2 border-t border-border-default first:border-t-0"
              >
                <div className="w-[26px] h-[26px] rounded-full bg-gray-50 border border-border-default flex items-center justify-center text-[11px] shrink-0 text-text-secondary">
                  ✎
                </div>
                <div>
                  <div className="text-[13px]">{a.message}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">
                    {[a.project?.name, relativeTime(a.created_at)].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </>
  )
}

function TopBar() {
  const { user } = useAuth()
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-border-default bg-surface sticky top-0 z-10">
      <div>
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="text-xs text-text-secondary mt-px">
          Resumen de tus proyectos y tareas
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md border border-border-default bg-white flex items-center justify-center text-text-secondary">
          <IconSearch className="w-4 h-4" />
        </div>
        <div className="w-8 h-8 rounded-md border border-border-default bg-white flex items-center justify-center text-text-secondary">
          <IconBell className="w-4 h-4" />
        </div>
        <Avatar name={user?.email} size={30} />
      </div>
    </div>
  )
}
