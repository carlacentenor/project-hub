import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Avatar,
  Button,
  KpiCard,
  ProgressBar,
  SectionCard,
  ErrorBox,
} from '../components/ui'
import { Field, TextInput, Select } from '../components/Modal'
import ProjectFormModal from '../components/ProjectFormModal'
import TaskFormModal from '../components/TaskFormModal'
import { useProjectDetail } from '../lib/useProjectDetail'
import {
  computeProjectProgress,
  computeAreaProgress,
  deriveAreaStatus,
} from '../lib/progress'
import { buildMilestoneTimeline, timelineStatus } from '../lib/timeline'
import { createMilestone, createRisk } from '../lib/mutations'
import { fileToResizedDataUrl } from '../lib/imageResize'
import {
  areaStatus,
  severity,
  noteType,
  NOTE_TYPES,
  taskStatus,
  docIcon,
  MILESTONE_STATUS_OPTIONS,
  SEVERITY_OPTIONS,
} from '../lib/enums'
import {
  fmtLong,
  fmtDayMonth,
  daysUntil,
  relativeTime,
  fmtTime,
} from '../lib/format'

function DeadlineBar({ targetDate, startDate }) {
  const total =
    startDate && targetDate
      ? Math.max(1, daysUntil(targetDate) - daysUntil(startDate))
      : 10
  const elapsed = startDate ? -daysUntil(startDate) : 0
  const filled = Math.max(0, Math.min(10, Math.round((elapsed / total) * 10)))
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`flex-1 h-1 rounded-[2px] ${
            i < filled ? 'bg-state-warning' : 'bg-gray-100'
          }`}
        />
      ))}
    </div>
  )
}

// --------- Documentos -------------------------------------------------
const EMPTY_DOC = { title: '', url: '', source: '', area: '', icon_url: '' }
const inputCls =
  'px-2.5 py-1.5 rounded-md border border-border-strong text-[12.5px] outline-none focus:border-brand-cyan'

function DocumentsCard({ documents, onAdd, onUpdate, onDelete }) {
  const [mode, setMode] = useState(null) // null | 'add' | doc.id
  const [form, setForm] = useState(EMPTY_DOC)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  function startAdd() {
    setMode(mode === 'add' ? null : 'add')
    setForm(EMPTY_DOC)
    setErr(null)
  }
  function startEdit(d) {
    setMode(d.id)
    setForm({
      title: d.title ?? '',
      url: d.url ?? '',
      source: d.source ?? '',
      area: d.area ?? '',
      icon_url: d.icon_url ?? '',
    })
    setErr(null)
  }

  async function pickIcon(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToResizedDataUrl(file, 48)
      setForm((f) => ({ ...f, icon_url: dataUrl }))
    } catch (ex) {
      setErr({ message: ex.message })
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) return
    setBusy(true)
    const error = mode === 'add' ? await onAdd(form) : await onUpdate(mode, form)
    setBusy(false)
    if (error) return setErr(error)
    setMode(null)
    setForm(EMPTY_DOC)
    setErr(null)
  }

  const DocForm = (
    <form
      onSubmit={submit}
      className="mb-3 grid grid-cols-2 gap-2 bg-gray-25 border border-border-default rounded-md p-3"
    >
      <input
        required
        placeholder="Título"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className={`col-span-2 ${inputCls}`}
      />
      <input
        required
        type="url"
        placeholder="https://…"
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        className={`col-span-2 ${inputCls}`}
      />
      <input
        placeholder="Fuente (Figma, Jira…)"
        value={form.source}
        onChange={(e) => setForm({ ...form, source: e.target.value })}
        className={inputCls}
      />
      <input
        placeholder="Área"
        value={form.area}
        onChange={(e) => setForm({ ...form, area: e.target.value })}
        className={inputCls}
      />
      <div className="col-span-2 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-md bg-gray-50 border border-border-default flex items-center justify-center shrink-0 overflow-hidden text-base">
          {form.icon_url ? (
            <img src={form.icon_url} alt="" className="w-full h-full object-cover" />
          ) : (
            docIcon(form.source)
          )}
        </div>
        <label className="text-[12px] font-semibold text-brand-teal hover:underline cursor-pointer">
          {form.icon_url ? 'Cambiar icono' : 'Subir icono'}
          <input type="file" accept="image/*" onChange={pickIcon} className="hidden" />
        </label>
        {form.icon_url && (
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, icon_url: '' }))}
            className="text-[12px] text-text-tertiary hover:text-state-error"
          >
            Quitar
          </button>
        )}
      </div>
      <ErrorBox error={err} what="el documento" />
      <div className="col-span-2 flex gap-2">
        <Button variant="primary" disabled={busy} type="submit">
          {busy ? 'Guardando…' : mode === 'add' ? 'Guardar documento' : 'Guardar cambios'}
        </Button>
        <Button type="button" onClick={() => setMode(null)}>
          Cancelar
        </Button>
      </div>
    </form>
  )

  return (
    <SectionCard
      title="Documentos"
      action={
        <button
          type="button"
          onClick={startAdd}
          className="text-xs font-semibold text-brand-teal hover:underline"
        >
          {mode === 'add' ? 'Cancelar' : '+ Agregar'}
        </button>
      }
    >
      {mode === 'add' && DocForm}

      {documents.length === 0 && (
        <div className="text-[12.5px] text-text-secondary py-2">
          Sin documentos todavía.
        </div>
      )}
      {documents.map((d) =>
        mode === d.id ? (
          <div key={d.id}>{DocForm}</div>
        ) : (
          <div
            key={d.id}
            className="flex items-center gap-2.5 py-2.5 border-b border-border-default last:border-b-0 group"
          >
            <div className="w-[30px] h-[30px] rounded-md bg-gray-50 flex items-center justify-center shrink-0 text-[13px] overflow-hidden">
              {d.icon_url ? (
                <img src={d.icon_url} alt="" className="w-full h-full object-cover" />
              ) : (
                docIcon(d.source)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] font-semibold hover:underline block truncate"
              >
                {d.title}
              </a>
              <div className="text-[11px] text-text-secondary">
                {[d.area, d.source].filter(Boolean).join(' · ') || 'Documento'}
              </div>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => startEdit(d)}
                className="text-text-tertiary hover:text-text-primary text-xs"
                title="Editar"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => onDelete(d.id)}
                className="text-text-tertiary hover:text-state-error text-sm"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          </div>
        )
      )}
    </SectionCard>
  )
}

// --------- Notas ----------------------------------------------------
function NoteForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [type, setType] = useState(initial?.type ?? 'idea')
  const [content, setContent] = useState(initial?.content ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setBusy(true)
    const error = await onSubmit({ type, content })
    setBusy(false)
    if (error) return setErr(error)
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 bg-gray-25 border border-border-default rounded-md p-3 flex flex-col gap-2"
    >
      <div className="flex gap-1.5">
        {NOTE_TYPES.map((t) => {
          const nt = noteType(t)
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`text-[10.5px] font-bold px-2 py-1 rounded-pill ${
                type === t ? nt.cls : 'bg-gray-100 text-text-secondary'
              }`}
            >
              {nt.icon} {nt.label}
            </button>
          )
        })}
      </div>
      <textarea
        required
        rows={2}
        placeholder="Escribe la nota…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="px-2.5 py-1.5 rounded-md border border-border-strong text-[12.5px] outline-none focus:border-brand-cyan resize-y"
      />
      <ErrorBox error={err} what="la nota" />
      <div className="flex gap-2">
        <Button variant="primary" disabled={busy} type="submit">
          {busy ? 'Guardando…' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function NotesCard({ notes, onAdd, onUpdate, onDelete, ownerName }) {
  const [mode, setMode] = useState(null) // null | 'add' | note.id

  return (
    <SectionCard
      title="Notas"
      action={
        <button
          type="button"
          onClick={() => setMode(mode === 'add' ? null : 'add')}
          className="text-xs font-semibold text-brand-teal hover:underline"
        >
          {mode === 'add' ? 'Cancelar' : '+ Nueva nota'}
        </button>
      }
    >
      {mode === 'add' && (
        <NoteForm
          submitLabel="Guardar nota"
          onCancel={() => setMode(null)}
          onSubmit={async (v) => {
            const error = await onAdd({ ...v, author_name: ownerName })
            if (!error) setMode(null)
            return error
          }}
        />
      )}

      {notes.length === 0 && (
        <div className="text-[12.5px] text-text-secondary py-2">
          Sin notas todavía.
        </div>
      )}
      {notes.map((n) => {
        if (mode === n.id) {
          return (
            <NoteForm
              key={n.id}
              initial={n}
              submitLabel="Guardar cambios"
              onCancel={() => setMode(null)}
              onSubmit={async (v) => {
                const error = await onUpdate(n.id, v)
                if (!error) setMode(null)
                return error
              }}
            />
          )
        }
        const nt = noteType(n.type)
        return (
          <div
            key={n.id}
            className="py-3 border-b border-border-default last:border-b-0 group"
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-[2px] rounded-pill ${nt.cls}`}
              >
                {nt.icon} {nt.label}
              </span>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setMode(n.id)}
                  className="text-text-tertiary hover:text-text-primary text-xs"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="text-text-tertiary hover:text-state-error text-sm"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="text-[13px] my-1.5 leading-normal">{n.content}</div>
            <div className="text-[11px] text-text-tertiary">
              {[n.author_name, relativeTime(n.created_at)].filter(Boolean).join(' · ')}
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}

function AddToggle({ open, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-xs font-semibold text-brand-teal hover:underline"
    >
      {open ? 'Cancelar' : label}
    </button>
  )
}

function AreaForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const error = await onSubmit({ name: name.trim() })
    setBusy(false)
    if (error) return setErr(error)
  }
  return (
    <form
      onSubmit={submit}
      className="bg-gray-25 border border-border-default rounded-md p-3 flex flex-col gap-2"
    >
      <Field label="Nombre del área">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Desarrollo"
          required
          autoFocus
        />
      </Field>
      <ErrorBox error={err} what="el área" />
      <div className="flex gap-2">
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Guardando…' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function AddMilestoneForm({ projectId, onDone }) {
  const [f, setF] = useState({ name: '', due_date: '', status: 'pendiente' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  async function submit(e) {
    e.preventDefault()
    if (!f.name.trim()) return
    setBusy(true)
    const { error } = await createMilestone(projectId, f)
    setBusy(false)
    if (error) return setErr(error)
    onDone()
  }
  return (
    <form onSubmit={submit} className="bg-gray-25 border border-border-default rounded-md p-3 grid grid-cols-2 gap-2">
      <Field label="Nombre" className="col-span-2">
        <TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Inicio de QA" required />
      </Field>
      <Field label="Fecha">
        <TextInput type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
      </Field>
      <Field label="Estado">
        <Select options={MILESTONE_STATUS_OPTIONS} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} />
      </Field>
      <ErrorBox error={err} what="el hito" />
      <div className="col-span-2">
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Guardando…' : 'Agregar hito'}
        </Button>
      </div>
    </form>
  )
}

function AddRiskForm({ projectId, onDone }) {
  const [f, setF] = useState({ title: '', severity: 'medio', responsible_name: '', impact: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  async function submit(e) {
    e.preventDefault()
    if (!f.title.trim()) return
    setBusy(true)
    const { error } = await createRisk(projectId, f)
    setBusy(false)
    if (error) return setErr(error)
    onDone()
  }
  return (
    <form onSubmit={submit} className="bg-gray-25 border border-border-default rounded-md p-3 grid grid-cols-2 gap-2">
      <Field label="Título" className="col-span-2">
        <TextInput value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="API del proveedor pendiente" required />
      </Field>
      <Field label="Severidad">
        <Select options={SEVERITY_OPTIONS} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} />
      </Field>
      <Field label="Responsable">
        <TextInput value={f.responsible_name} onChange={(e) => setF({ ...f, responsible_name: e.target.value })} />
      </Field>
      <Field label="Impacto" className="col-span-2">
        <TextInput value={f.impact} onChange={(e) => setF({ ...f, impact: e.target.value })} placeholder="Desarrollo / QA" />
      </Field>
      <ErrorBox error={err} what="el riesgo" />
      <div className="col-span-2">
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Guardando…' : 'Registrar riesgo'}
        </Button>
      </div>
    </form>
  )
}

export default function ProyectoResumen() {
  const { project, reloadProject } = useOutletContext()
  const detail = useProjectDetail(project.id)
  const [editOpen, setEditOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [adding, setAdding] = useState(null) // 'area' | 'milestone' | 'risk' | null
  const [editAreaId, setEditAreaId] = useState(null)
  const toggle = (k) => () => setAdding((v) => (v === k ? null : k))
  const closeAdd = () => {
    setAdding(null)
    detail.reload()
  }

  async function moveArea(index, dir) {
    const j = dir === 'up' ? index - 1 : index + 1
    if (j < 0 || j >= detail.areas.length) return
    const ids = detail.areas.map((a) => a.id)
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await detail.reorderAreas(ids)
  }
  const {
    areas,
    milestones,
    risks,
    documents,
    notes,
    tasks,
    activity,
    loading,
    error,
  } = detail

  const parentTasks = useMemo(
    () => tasks.filter((t) => !t.parent_task_id),
    [tasks]
  )
  const doneCount = parentTasks.filter((t) => t.status === 'completado').length
  const overallProgress = computeProjectProgress(project, { areas, tasks })
  const timeline = useMemo(
    () => buildMilestoneTimeline({ milestones, tasks, limit: 8 }),
    [milestones, tasks]
  )
  const openRisks = risks.filter((r) => r.status !== 'cerrado')
  const highRisks = openRisks.filter((r) => r.severity === 'alto').length
  const medRisks = openRisks.filter((r) => r.severity === 'medio').length
  const nextTasks = parentTasks
    .filter((t) => t.status !== 'completado')
    .slice(0, 4)
  const remaining = daysUntil(project.target_date)

  const activityByDay = useMemo(() => {
    const groups = {}
    for (const a of activity) {
      const d = new Date(a.created_at)
      const key = d.toDateString()
      ;(groups[key] ??= []).push(a)
    }
    return Object.entries(groups)
  }, [activity])

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[22px] font-bold flex items-center gap-2.5">
            {project.name}
          </div>
          {project.description && (
            <div className="text-[13px] text-text-secondary mt-1.5 max-w-[620px]">
              {project.description}
            </div>
          )}
          <div className="flex gap-6 mt-3.5 flex-wrap">
            <div className="text-[12.5px]">
              <span className="text-text-tertiary block mb-0.5">Responsable</span>
              <span className="font-semibold flex items-center gap-1.5">
                <Avatar name={project.owner_name} size={20} />
                {project.owner_name || '—'}
              </span>
            </div>
            <div className="text-[12.5px]">
              <span className="text-text-tertiary block mb-0.5">Inicio</span>
              <span className="font-semibold">{fmtLong(project.start_date)}</span>
            </div>
            <div className="text-[12.5px]">
              <span className="text-text-tertiary block mb-0.5">Fecha objetivo</span>
              <span className="font-semibold">{fmtLong(project.target_date)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => setEditOpen(true)}>Editar proyecto</Button>
        </div>
      </div>

      <ProjectFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        onSaved={() => reloadProject?.()}
      />

      <TaskFormModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projectId={project.id}
        areas={detail.areas}
        onSaved={() => detail.reload()}
      />

      <TaskFormModal
        open={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask}
        projectId={project.id}
        areas={detail.areas}
        onSaved={() => detail.reload()}
      />

      <div>
        <div className="text-[15px] font-semibold">Resumen</div>
        <div className="text-xs text-text-secondary mt-0.5">
          Vista general del estado y avance del proyecto.
        </div>
      </div>

      <ErrorBox error={error} what="el detalle del proyecto" />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Progreso general" value={`${overallProgress}%`}>
          <ProgressBar value={overallProgress} color={project.color} className="mt-0.5" />
        </KpiCard>
        <KpiCard
          label="Tareas completadas"
          value={`${doneCount} / ${parentTasks.length}`}
        />
        <KpiCard label="Riesgos activos" value={openRisks.length}>
          <div className="flex gap-1.5 mt-0.5">
            {highRisks > 0 && (
              <span className="text-[10px] font-bold px-[7px] py-[2px] rounded-pill bg-state-error-bg text-[#A9302A]">
                {highRisks} alto
              </span>
            )}
            {medRisks > 0 && (
              <span className="text-[10px] font-bold px-[7px] py-[2px] rounded-pill bg-state-warning-bg text-[#8A6200]">
                {medRisks} medio
              </span>
            )}
          </div>
        </KpiCard>
        <KpiCard
          label="Fecha objetivo"
          value={fmtDayMonth(project.target_date)}
        >
          <div className="text-[11.5px] text-text-tertiary">
            {remaining === null
              ? '—'
              : remaining >= 0
                ? `${remaining} días restantes`
                : `${Math.abs(remaining)} días de retraso`}
          </div>
          <DeadlineBar targetDate={project.target_date} startDate={project.start_date} />
        </KpiCard>
      </div>

      {/* Estado por área */}
      <SectionCard
        title="Estado por área"
        action={
          <AddToggle open={adding === 'area'} onToggle={toggle('area')} label="+ Área" />
        }
      >
        {adding === 'area' && (
          <div className="mb-4">
            <AreaForm
              submitLabel="Agregar área"
              onCancel={() => setAdding(null)}
              onSubmit={async (v) => {
                const error = await detail.addArea(v)
                if (!error) setAdding(null)
                return error
              }}
            />
          </div>
        )}
        {areas.length === 0 && (
          <div className="text-[12.5px] text-text-secondary py-2">
            Sin áreas definidas.
          </div>
        )}
        {areas.map((a, i) => {
          if (editAreaId === a.id) {
            return (
              <div key={a.id} className="py-2">
                <AreaForm
                  initial={a}
                  submitLabel="Guardar cambios"
                  onCancel={() => setEditAreaId(null)}
                  onSubmit={async (v) => {
                    const error = await detail.updateArea(a.id, v)
                    if (!error) setEditAreaId(null)
                    return error
                  }}
                />
              </div>
            )
          }
          const pct = computeAreaProgress(a, tasks)
          const derived = deriveAreaStatus(a, tasks)
          const s = areaStatus(derived)
          const taskCount = tasks.filter(
            (t) => t.area_id === a.id && !t.parent_task_id
          ).length
          const barColor =
            derived === 'completado'
              ? 'var(--color-state-success)'
              : derived === 'proximo'
                ? 'var(--color-state-warning)'
                : derived === 'pendiente'
                  ? 'var(--color-gray-300)'
                  : undefined
          return (
            <div
              key={a.id}
              className="flex items-center gap-3.5 py-3 px-1 rounded-md hover:bg-gray-25 border-t border-border-default first:border-t-0 group"
            >
              <div className="flex flex-col gap-0.5 shrink-0 text-text-tertiary">
                <button
                  type="button"
                  onClick={() => moveArea(i, 'up')}
                  disabled={i === 0}
                  className="text-[9px] leading-none disabled:opacity-25 hover:text-text-primary"
                  title="Subir"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveArea(i, 'down')}
                  disabled={i === areas.length - 1}
                  className="text-[9px] leading-none disabled:opacity-25 hover:text-text-primary"
                  title="Bajar"
                >
                  ▼
                </button>
              </div>
              <div className="w-[120px] shrink-0">
                <div className="text-[13px] font-semibold">{a.name}</div>
                <div className="text-[10.5px] text-text-tertiary">
                  {taskCount === 0
                    ? 'sin tareas'
                    : `${taskCount} ${taskCount === 1 ? 'tarea' : 'tareas'}`}
                </div>
              </div>
              <ProgressBar value={pct} color={barColor} className="flex-1" />
              <div className="w-[38px] text-xs font-semibold text-text-secondary text-right shrink-0">
                {pct}%
              </div>
              <div className="w-[100px] text-right shrink-0">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-[3px] rounded-pill ${s.cls}`}
                >
                  {s.label}
                </span>
              </div>
              <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditAreaId(a.id)}
                  className="text-text-tertiary hover:text-text-primary text-xs"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar el área "${a.name}"? Las tareas quedarán sin área.`
                      )
                    )
                      detail.deleteArea(a.id)
                  }}
                  className="text-text-tertiary hover:text-state-error text-sm"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </SectionCard>

      {/* Hitos / Riesgos */}
      <div className="grid grid-cols-[1.3fr_1fr] gap-4 items-start">
        <SectionCard
          title="Próximos hitos"
          action={
            <AddToggle
              open={adding === 'milestone'}
              onToggle={toggle('milestone')}
              label="+ Hito"
            />
          }
        >
          {adding === 'milestone' && (
            <div className="mb-4">
              <AddMilestoneForm projectId={project.id} onDone={closeAdd} />
            </div>
          )}
          {timeline.length === 0 && (
            <div className="text-[12.5px] text-text-secondary py-2">
              Sin hitos ni tareas con fecha próxima.
            </div>
          )}
          <div className="pl-1">
            {timeline.map((it, i) => {
              const st = timelineStatus(it.status)
              const prevDone = i > 0 && timeline[i - 1].status === 'completado'
              return (
                <div key={it.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i > 0 && (
                    <span
                      className={`absolute left-[5px] -top-4 h-4 w-[2px] ${
                        prevDone ? 'bg-state-success' : 'bg-border-default'
                      }`}
                    />
                  )}
                  {i < timeline.length - 1 && (
                    <span
                      className={`absolute left-[5px] top-3 bottom-0 w-[2px] ${
                        it.status === 'completado'
                          ? 'bg-state-success'
                          : 'bg-border-default'
                      }`}
                    />
                  )}
                  <span
                    className={`mt-1 w-3 h-3 rounded-full border-2 shrink-0 z-[1] ${st.dot}`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold">{it.name}</span>
                      <span
                        className="text-[10px] font-bold text-text-tertiary"
                        title={it.kind === 'milestone' ? 'Hito' : 'Fecha de tarea'}
                      >
                        {it.kind === 'milestone' ? '◆ Hito' : '• Tarea'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-px rounded-pill ${st.chip}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div
                      className={`text-[11.5px] mt-0.5 ${
                        it.overdue ? 'text-state-error font-semibold' : 'text-text-secondary'
                      }`}
                    >
                      {fmtDayMonth(it.date)}
                      {it.overdue ? ' · atrasado' : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Bloqueos y riesgos"
          action={
            <AddToggle
              open={adding === 'risk'}
              onToggle={toggle('risk')}
              label="+ Riesgo"
            />
          }
        >
          {adding === 'risk' && (
            <div className="mb-4">
              <AddRiskForm projectId={project.id} onDone={closeAdd} />
            </div>
          )}
          {openRisks.length === 0 && (
            <div className="text-[12.5px] text-text-secondary py-2">
              Sin riesgos abiertos.
            </div>
          )}
          {openRisks.map((r) => {
            const sv = severity(r.severity)
            return (
              <div
                key={r.id}
                className="flex gap-2.5 py-3 border-t border-border-default first:border-t-0"
              >
                <span
                  className={`text-[10px] font-bold px-2 py-[3px] rounded-pill shrink-0 h-fit ${sv.badge}`}
                >
                  {sv.label}
                </span>
                <div>
                  <div className="text-[13px] font-semibold">{r.title}</div>
                  <div className="flex gap-3.5 text-[11.5px] text-text-secondary mt-1 flex-wrap">
                    {r.responsible_name && (
                      <span>
                        <span className="text-text-tertiary">Responsable:</span>{' '}
                        {r.responsible_name}
                      </span>
                    )}
                    {r.impact && (
                      <span>
                        <span className="text-text-tertiary">Impacto:</span> {r.impact}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </SectionCard>
      </div>

      {/* Próximas tareas */}
      <SectionCard
        title="Próximas tareas"
        action={
          <button
            type="button"
            onClick={() => setTaskOpen(true)}
            className="text-xs font-semibold text-brand-teal hover:underline"
          >
            + Tarea
          </button>
        }
      >
        {nextTasks.length === 0 && (
          <div className="text-[12.5px] text-text-secondary py-2">
            Sin tareas próximas.
          </div>
        )}
        {nextTasks.map((t) => (
          <div
            key={t.id}
            onClick={() => setEditTask(t)}
            className="flex items-center gap-2.5 py-2.5 border-t border-border-default first:border-t-0 cursor-pointer hover:bg-gray-25 -mx-2 px-2 rounded-md"
          >
            <div className="w-4 h-4 rounded border-[1.5px] border-border-strong shrink-0" />
            <div>
              <div className="text-[13px] font-medium">{t.name}</div>
              <div className="text-[11.5px] text-text-tertiary mt-px flex gap-2">
                {t.assignee_name && <span>{t.assignee_name}</span>}
                {t.due_date && <span>Vence {fmtDayMonth(t.due_date)}</span>}
                <span>{taskStatus(t.status).label}</span>
              </div>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Documentos / Notas */}
      <div className="grid grid-cols-[1.3fr_1fr] gap-4 items-start">
        <DocumentsCard
          documents={documents}
          onAdd={detail.addDocument}
          onUpdate={detail.updateDocument}
          onDelete={detail.deleteDocument}
        />
        <NotesCard
          notes={notes}
          onAdd={detail.addNote}
          onUpdate={detail.updateNote}
          onDelete={detail.deleteNote}
          ownerName={project.owner_name}
        />
      </div>

      {/* Actividad */}
      <SectionCard title="Actividad reciente">
        {activity.length === 0 && (
          <div className="text-[12.5px] text-text-secondary py-2">
            Sin actividad registrada.
          </div>
        )}
        {activityByDay.map(([day, items]) => (
          <div key={day}>
            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide mt-3.5 first:mt-0 mb-1.5">
              {relativeTime(items[0].created_at).startsWith('Ayer') ? 'Ayer' : day === new Date().toDateString() ? 'Hoy' : fmtDayMonth(items[0].created_at)}
            </div>
            {items.map((a) => (
              <div key={a.id} className="flex gap-2.5 py-2.5">
                <div className="text-[11px] text-text-tertiary w-[38px] shrink-0 pt-px">
                  {fmtTime(a.created_at)}
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-50 border border-border-default flex items-center justify-center text-[10px] shrink-0 text-text-secondary">
                  ✎
                </div>
                <div className="text-[12.5px]">{a.message}</div>
              </div>
            ))}
          </div>
        ))}
      </SectionCard>

      {loading && (
        <div className="text-sm text-text-secondary text-center">Cargando…</div>
      )}
    </div>
  )
}
