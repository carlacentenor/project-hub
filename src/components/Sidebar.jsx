import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { IconDashboard, IconProjects, IconSettings } from './icons'

const baseItem =
  'flex items-center gap-3 px-3 py-[9px] rounded-md text-[13px] font-medium relative transition-colors'
const idle = 'text-text-on-navy-muted hover:bg-navy-400 hover:text-white'
const active = 'bg-navy-400 text-white'

function Item({ to, end, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `${baseItem} ${isActive ? active : idle} ${
          isActive
            ? 'before:content-[""] before:absolute before:-left-3 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-brand-cyan before:rounded-pill'
            : ''
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0 opacity-85" />
      {children}
    </NavLink>
  )
}

export default function Sidebar({ projects = [] }) {
  const { user, signOut } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-navy-500 text-white px-3 py-6 flex flex-col gap-6">
      <div className="flex items-center gap-2 px-3 pb-4 font-bold text-[15px]">
        <span className="w-[22px] h-[22px] rounded-md bg-brand-cyan flex items-center justify-center text-navy-500 font-bold text-xs">
          PH
        </span>
        Project Hub
      </div>

      <div className="flex flex-col gap-0.5">
        <Item to="/" end icon={IconDashboard}>
          Dashboard
        </Item>
        <Item to="/proyectos" icon={IconProjects}>
          Proyectos
        </Item>

        {projects.length > 0 && (
          <div className="flex flex-col gap-px my-1 ml-3 pl-3 border-l border-navy-300">
            {projects.slice(0, 5).map((p) => (
              <NavLink
                key={p.id}
                to={`/proyectos/${p.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium ${
                    isActive
                      ? 'bg-navy-400 text-white font-semibold'
                      : 'text-text-on-navy-muted hover:bg-navy-400 hover:text-white'
                  }`
                }
              >
                <span
                  className="w-[7px] h-[7px] rounded-[2px] shrink-0"
                  style={{ background: p.color || 'var(--color-proj-cyan)' }}
                />
                <span className="truncate">{p.name}</span>
              </NavLink>
            ))}
          </div>
        )}

      </div>

      <div className="h-px bg-navy-300 opacity-50 mx-3 my-2" />

      <div className="mt-auto flex flex-col gap-0.5">
        <Item to="/configuracion" icon={IconSettings}>
          Configuración
        </Item>
        <button
          type="button"
          onClick={signOut}
          className={`${baseItem} ${idle} w-full text-left`}
          title={user?.email || ''}
        >
          <span className="w-4 h-4 shrink-0 flex items-center justify-center opacity-85">
            ⎋
          </span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
