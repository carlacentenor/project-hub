import { useEffect, useState } from 'react'
import Modal, { Field, TextInput, TextArea, Select } from './Modal'
import { Button, ErrorBox } from './ui'
import { createTask, updateTask } from '../lib/mutations'
import { TASK_STATUS_OPTIONS, PRIORITY_OPTIONS } from '../lib/enums'
import { useProjects } from '../lib/useProjects'
import { supabase } from '../lib/supabaseClient'

const empty = {
  name: '',
  description: '',
  assignee_name: '',
  status: 'pendiente',
  priority: 'media',
  start_date: '',
  due_date: '',
  progress: 0,
  area_id: '',
  parent_task_id: '',
  blocked_reason: '',
}

export default function TaskFormModal({
  open,
  onClose,
  onSaved,
  projectId: fixedProjectId,
  areas: areasProp = [],
  task,
}) {
  const editing = Boolean(task)
  const needsProjectPicker = !fixedProjectId && !editing
  const { projects } = useProjects()
  const [form, setForm] = useState(empty)
  const [projectId, setProjectId] = useState(fixedProjectId || '')
  const [fetchedAreas, setFetchedAreas] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  // Áreas: las que llegan por prop, o se cargan según el proyecto elegido.
  const areas = areasProp.length > 0 ? areasProp : fetchedAreas

  useEffect(() => {
    if (!open || areasProp.length > 0 || !projectId) {
      setFetchedAreas([])
      return
    }
    let active = true
    supabase
      .from('project_areas')
      .select('id, name')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => active && setFetchedAreas(data ?? []))
    return () => {
      active = false
    }
  }, [open, projectId, areasProp.length])

  useEffect(() => {
    if (!open) return
    setErr(null)
    setProjectId(fixedProjectId || task?.project_id || '')
    setForm(
      task
        ? {
            name: task.name ?? '',
            description: task.description ?? '',
            assignee_name: task.assignee_name ?? '',
            status: task.status ?? 'pendiente',
            priority: task.priority ?? 'media',
            start_date: task.start_date ?? '',
            due_date: task.due_date ?? '',
            progress: task.progress ?? 0,
            area_id: task.area_id ?? '',
            parent_task_id: task.parent_task_id ?? '',
            blocked_reason: task.blocked_reason ?? '',
          }
        : empty
    )
  }, [open, task, fixedProjectId])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (!editing && !projectId) return setErr({ message: 'Elige un proyecto.' })
    setBusy(true)
    setErr(null)
    const payload = { ...form, progress: Number(form.progress) || 0 }
    const { data, error } = editing
      ? await updateTask(task.id, payload)
      : await createTask(projectId, payload)
    setBusy(false)
    if (error) return setErr(error)
    onSaved?.(data)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar tarea' : 'Nueva tarea'}
      width={520}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {needsProjectPicker && (
          <Field label="Proyecto">
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              options={[
                { value: '', label: 'Selecciona…' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </Field>
        )}

        <Field label="Nombre">
          <TextInput
            required
            value={form.name}
            onChange={set('name')}
            placeholder="Implementar pago mixto"
          />
        </Field>

        <Field label="Descripción">
          <TextArea rows={2} value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado">
            <Select options={TASK_STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          </Field>
          <Field label="Prioridad">
            <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={set('priority')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsable">
            <TextInput value={form.assignee_name} onChange={set('assignee_name')} placeholder="José" />
          </Field>
          <Field label="Progreso (%)">
            <TextInput type="number" min="0" max="100" value={form.progress} onChange={set('progress')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio">
            <TextInput type="date" value={form.start_date} onChange={set('start_date')} />
          </Field>
          <Field label="Fecha límite">
            <TextInput type="date" value={form.due_date} onChange={set('due_date')} />
          </Field>
        </div>

        {projectId && (
          <Field label="Área">
            {areas.length > 0 ? (
              <Select
                value={form.area_id}
                onChange={set('area_id')}
                options={[
                  { value: '', label: 'Sin área' },
                  ...areas.map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
            ) : (
              <div className="text-[12px] text-text-tertiary px-1 py-1.5">
                Este proyecto todavía no tiene áreas. Créalas en la pestaña
                “Resumen” del proyecto para poder mapear el avance por área.
              </div>
            )}
          </Field>
        )}

        {form.status === 'bloqueado' && (
          <Field label="Motivo del bloqueo">
            <TextInput
              value={form.blocked_reason}
              onChange={set('blocked_reason')}
              placeholder="API del proveedor"
            />
          </Field>
        )}

        <ErrorBox error={err} what="la tarea" />

        <div className="flex gap-2 justify-end pt-2 border-t border-border-default">
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
