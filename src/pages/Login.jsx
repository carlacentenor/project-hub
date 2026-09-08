import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!loading && session) return <Navigate to={from} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: err } = await signIn(email, password)
    setSubmitting(false)
    if (err) {
      setError('No se pudo iniciar sesión. Revisa el correo y la contraseña.')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2 mb-6 font-bold text-[15px] text-navy-500">
          <span className="w-[22px] h-[22px] rounded-md bg-brand-cyan flex items-center justify-center text-navy-500 font-bold text-xs">
            PH
          </span>
          Project Hub
        </div>

        <div className="bg-surface border border-border-default rounded-lg shadow-1 p-6">
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Accede a tu espacio de proyectos.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">
                Correo
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 rounded-md border border-border-strong bg-white text-[13px] text-text-primary outline-none focus:border-brand-cyan"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">
                Contraseña
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 rounded-md border border-border-strong bg-white text-[13px] text-text-primary outline-none focus:border-brand-cyan"
              />
            </label>

            {error && (
              <div className="text-[12.5px] text-state-error bg-state-error-bg rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 bg-brand-cyan text-navy-500 text-[13px] font-semibold px-3.5 py-[9px] rounded-md hover:bg-cyan-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
