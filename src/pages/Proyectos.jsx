import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageTopbar from '../components/PageTopbar'
import ProjectFormModal from '../components/ProjectFormModal'
import { IconSearch } from '../components/icons'
import {
  Avatar,
  Button,
  Chip,
  ProgressRow,
  PriorityTag,
  Spinner,
  ErrorBox,
  EmptyBox,
} from '../components/ui'
import { useProjects } from '../lib/useProjects'
import { projectStatus, priority } from '../lib/enums'
import { fmtRange } from '../lib/format'

function StatusChip({ status }) {
  const s = projectStatus(status)
  return <Chip label={s.label} cls={s.cls} dot={s.dot} />
}

function ProjectCard({ p }) {
  return (
    <Link
      to={`/proyectos/${p.id}`}
      className="bg-surface border border-border-default rounded-lg p-4 flex flex-col gap-2.5 shadow-1 hover:shadow-2 hover:border-border-strong transition-[box-shadow,border-color] no-underline text-inherit"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="w-2.5 h-2.5 rounded-[3px] shrink-0 mt-[3px]"
          style={{ background: p.color || 'var(--color-proj-cyan)' }}
        />
        <div>
          <div className="text-sm font-semibold">{p.name}</div>
          {p.description && (
            <div className="text-xs text-text-secondary mt-px">{p.description}</div>
          )}
        </div>
      </div>
      <StatusChip status={p.status} />
      <ProgressRow value={p.progress_computed ?? p.progress} color={p.color} />
      <div className="flex items-center justify-between text-[11.5px] text-text-secondary">
        <span className="text-text-tertiary">Fechas</span>
        <span>{fmtRange(p.start_date, p.target_date)}</span>
      </div>
      <hr className="h-px bg-border-default border-none my-0.5" />
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Avatar name={p.owner_name} size={20} />
          {p.owner_name || '—'}
        </span>
        <PriorityTag p={priority(p.priority)} />
      </div>
    </Link>
  )
}

export default function Proyectos() {
  const { projects, loading, error, reload } = useProjects()
  const navigate = useNavigate()
  const [view, setView] = useState('cards')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    )
  }, [projects, query])

  return (
    <>
      <PageTopbar
        title="Proyectos"
        description="Gestiona y da seguimiento a todos tus proyectos."
      />

      <div className="p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border-strong bg-white w-[260px] text-text-tertiary text-[13px]">
              <IconSearch className="w-3.5 h-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar proyectos..."
                className="border-none outline-none text-[13px] w-full text-text-primary placeholder:text-text-tertiary bg-transparent"
              />
            </div>
            {['Estado', 'Responsable', 'Prioridad', 'Fecha'].map((f) => (
              <button
                key={f}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-md border border-border-strong bg-white text-xs font-medium text-text-primary hover:bg-gray-50"
              >
                {f} <span className="text-text-tertiary text-[9px]">▾</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-border-strong rounded-md overflow-hidden">
              {['cards', 'list'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-2.5 py-[7px] text-xs font-medium ${
                    v === 'list' ? 'border-l border-border-strong' : ''
                  } ${
                    view === v
                      ? 'bg-state-info-bg text-cyan-700'
                      : 'bg-white text-text-secondary'
                  }`}
                >
                  {v === 'cards' ? 'Cards' : 'Lista'}
                </button>
              ))}
            </div>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              + Nuevo proyecto
            </Button>
          </div>
        </div>

        <ProjectFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={(p) => {
            reload()
            if (p?.id) navigate(`/proyectos/${p.id}`)
          }}
        />

        <div className="text-xs text-text-tertiary">
          {loading
            ? 'Cargando…'
            : `${filtered.length} ${filtered.length === 1 ? 'proyecto' : 'proyectos'}`}
        </div>

        <ErrorBox error={error} what="los proyectos" />
        {loading && <Spinner />}

        {!loading && !error && filtered.length === 0 && (
          <EmptyBox>Aún no hay proyectos.</EmptyBox>
        )}

        {!loading && filtered.length > 0 && view === 'cards' && (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'list' && (
          <div className="bg-surface border border-border-default rounded-lg overflow-hidden shadow-1">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Proyecto', 'Estado', 'Progreso', 'Fechas', 'Responsable', 'Prioridad'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold text-text-secondary px-3.5 py-2.5 bg-gray-25 border-b border-border-default whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-25">
                    <td className="px-3.5 py-3 border-b border-border-default">
                      <Link
                        to={`/proyectos/${p.id}`}
                        className="flex items-center gap-2.5 no-underline text-inherit"
                      >
                        <span
                          className="w-[9px] h-[9px] rounded-[3px] shrink-0"
                          style={{ background: p.color || 'var(--color-proj-cyan)' }}
                        />
                        <span>
                          <span className="block font-semibold text-[13px]">{p.name}</span>
                          {p.description && (
                            <span className="block text-[11.5px] text-text-secondary">
                              {p.description}
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border-default">
                      <StatusChip status={p.status} />
                    </td>
                    <td className="px-3.5 py-3 border-b border-border-default w-[160px]">
                      <ProgressRow value={p.progress_computed ?? p.progress} color={p.color} />
                    </td>
                    <td className="px-3.5 py-3 border-b border-border-default text-[12.5px] whitespace-nowrap">
                      {fmtRange(p.start_date, p.target_date)}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border-default text-[12.5px] whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Avatar name={p.owner_name} size={20} />
                        {p.owner_name || '—'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border-default">
                      <PriorityTag p={priority(p.priority)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
