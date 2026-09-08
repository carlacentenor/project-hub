import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useProjects } from '../lib/useProjects'

export default function Layout() {
  const { projects } = useProjects()

  return (
    <div className="flex min-h-screen">
      <Sidebar projects={projects} />
      <div className="flex-1 min-w-0 max-w-[1440px]">
        <Outlet />
      </div>
    </div>
  )
}
