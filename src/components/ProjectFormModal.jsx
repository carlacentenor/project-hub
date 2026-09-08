import { useState } from 'react'
import Modal, { Field, TextInput, TextArea, Select } from './Modal'
import { Button, ErrorBox } from './ui'
import { createProject, updateProject } from '../lib/mutations'
import {
  PROJECT_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PROJECT_COLORS,
} from '../lib/enums'

const empty = {
  name: '',
  description: '',
  color: PROJECT_COLORS[0],
  status: 'no_iniciado',
  owner_name: '',
  priority: 'media',
  progress: 0,
  start_date: '',
  target_date: '',
}

export default function ProjectFormModal({ open, onClose, project, onSaved }) {
  const editing = Boolean(project)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  // Rehidrata el formulario cada vez que se abre.
  const [lastOpen, setLastOpen] = useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setErr(null)
      setForm(
        project
          ? {
              name: project.name ?? '',
              description: project.description ?? '',
              color: project.color ?? PROJECT_COLORS[0],
              status: project.status ?? 'no_iniciado',
              owner_name: project.owner_name ?? '',
              priority: project.priority ?? 'media',
              progress: project.progress ?? 0,
              start_date: project.start_date ?? '',
              target_date: project.target_date ?? '',
            }
          : empty
      )
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setBusy(true)
    setErr(null)
    const payload = { ...form, progress: Number(form.progress) || 0 }
    const { data, error } = editing
      ? await updateProject(project.id, payload)
      : await createProject(payload)
    setBusy(false)
    if (error) return setErr(error)
    onSaved?.(data)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}
      width={520}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nombre">
          <TextInput
            required
            value={form.name}
            onChange={set('name')}
            placeholder="Loyalty — Pago mixto con puntos"
          />
        </Field>

        <Field label="Descripción">
          <TextArea rows={2} value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado">
            <Select
              options={PROJECT_STATUS_OPTIONS}
              value={form.status}
              onChange={set('status')}
            />
          </Field>
          <Field label="Prioridad">
            <Select
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={set('priority')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsable">
            <TextInput
              value={form.owner_name}
              onChange={set('owner_name')}
              placeholder="Carlita"
            />
          </Field>
          <Field label="Progreso (%)">
            <TextInput
              type="number"
              min="0"
              max="100"
              value={form.progress}
              onChange={set('progress')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio">
            <TextInput type="date" value={form.start_date} onChange={set('start_date')} />
          </Field>
          <Field label="Fecha objetivo">
            <TextInput type="date" value={form.target_date} onChange={set('target_date')} />
          </Field>
        </div>

        <Field label="Color">
          <div className="flex gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`w-7 h-7 rounded-md border-2 ${
                  form.color === c ? 'border-navy-500' : 'border-transparent'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>

        <ErrorBox error={err} what="el proyecto" />

        <div className="flex gap-2 justify-end pt-2 border-t border-border-default">
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear proyecto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
