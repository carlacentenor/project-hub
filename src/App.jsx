import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Proyectos from './pages/Proyectos'
import ProyectoLayout from './pages/ProyectoLayout'
import ProyectoResumen from './pages/ProyectoResumen'
import ProyectoTareas from './pages/ProyectoTareas'
import PlanTrabajo from './pages/PlanTrabajo'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="proyectos/:id" element={<ProyectoLayout />}>
              <Route index element={<ProyectoResumen />} />
              <Route path="tareas" element={<ProyectoTareas />} />
              <Route path="plan" element={<PlanTrabajo />} />
            </Route>
            <Route
              path="configuracion"
              element={<Placeholder title="Configuración" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
