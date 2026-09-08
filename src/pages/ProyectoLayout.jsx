import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useProject } from '../lib/useProjects'
import { projectStatus, isActiveProjectStatus } from '../lib/enums'
import { Spinner } from '../components/ui'

function Tab({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `py-[9px] px-1 mx-2.5 text-[13px] border-b-2 ${
          isActive
            ? 'text-cyan-700 border-brand-cyan font-semibold'
            : 'text-text-secondary border-transparent font-medium hover:text-text-primary'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function ProyectoLayout() {
  const { id } = useParams()
  const { project, loading, error, reload } = useProject(id)

  const st = projectStatus(project?.status)

  return (
    <>
      <div className="bg-surface border-b border-border-default px-8 pt-3.5 sticky top-0 z-10">
        <div className="flex items-center gap-2.5 mb-2.5">
          <NavLink
            to="/proyectos"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-secondary no-underline hover:text-text-primary"
          >
            ← Proyectos
          </NavLink>
          <span className="text-border-strong">/</span>
          <span className="text-[13px] font-semibold text-text-primary">
            {project?.name ?? '…'}
          </span>
          {project && isActiveProjectStatus(project.status) && (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide px-2.5 py-[3px] rounded-pill bg-state-success-bg text-[#4C7A0E] ml-1">
              🟢 EN EJECUCIÓN
            </span>
          )}
          {project && !isActiveProjectStatus(project.status) && (
            <span
              className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide px-2.5 py-[3px] rounded-pill ml-1 ${st.cls}`}
            >
              {st.label.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Tab to={`/proyectos/${id}`} end>
            Resumen
          </Tab>
          <Tab to={`/proyectos/${id}/tareas`}>Tareas</Tab>
          <Tab to={`/proyectos/${id}/plan`}>Plan de trabajo</Tab>
        </div>
      </div>

      {loading && <Spinner />}
      {error && (
        <div className="p-8 text-[12.5px] text-state-error">
          No se pudo cargar el proyecto: {error.message}
        </div>
      )}
      {!loading && !error && !project && (
        <div className="p-8 text-sm text-text-secondary">
          Proyecto no encontrado.
        </div>
      )}
      {project && <Outlet context={{ project, reloadProject: reload }} />}
    </>
  )
}
