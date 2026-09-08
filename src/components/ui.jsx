import { initials } from '../lib/format'

export function Avatar({ name, className = '', size = 20, style }) {
  return (
    <span
      className={`rounded-full text-white font-semibold flex items-center justify-center shrink-0 bg-navy-400 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42, ...style }}
    >
      {initials(name)}
    </span>
  )
}

export function Chip({ label, cls = 'bg-gray-100 text-text-secondary', dot, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium w-fit px-2 py-[3px] rounded-pill ${cls} ${className}`}
    >
      {dot && <span className="w-[7px] h-[7px] rounded-full" style={{ background: dot }} />}
      {label}
    </span>
  )
}

export function ProgressBar({ value, color, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)))
  return (
    <div className={`h-1.5 rounded-pill bg-gray-100 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-pill"
        style={{ width: `${pct}%`, background: color || 'var(--color-brand-cyan)' }}
      />
    </div>
  )
}

export function ProgressRow({ value, color }) {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)))
  return (
    <div className="flex items-center gap-2.5">
      <ProgressBar value={pct} color={color} className="flex-1" />
      <div className="text-[11.5px] font-semibold text-text-secondary w-[30px] text-right">
        {pct}%
      </div>
    </div>
  )
}

export function SectionCard({ title, action, children, className = '' }) {
  return (
    <div
      className={`bg-surface border border-border-default rounded-lg shadow-1 p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <div className="text-[15px] font-semibold">{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Button({ variant = 'secondary', className = '', ...props }) {
  const base =
    'appearance-none border-none font-[inherit] text-[13px] font-semibold px-3.5 py-[9px] rounded-md inline-flex items-center gap-1.5 transition-colors disabled:opacity-60'
  const variants = {
    primary: 'bg-brand-cyan text-navy-500 hover:bg-cyan-600',
    secondary:
      'bg-white text-navy-500 border border-border-strong hover:bg-gray-50',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function KpiCard({ label, value, icon, iconClass, children }) {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4 shadow-1 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        {icon && (
          <span
            className={`w-7 h-7 rounded-md flex items-center justify-center ${iconClass || 'bg-gray-50 text-text-secondary'}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold leading-none tracking-tight">{value}</div>
      {children}
    </div>
  )
}

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="text-sm text-text-secondary py-8 text-center">{label}</div>
  )
}

export function ErrorBox({ error, what = 'los datos' }) {
  if (!error) return null
  return (
    <div className="text-[12.5px] text-state-error bg-state-error-bg rounded-md px-3 py-2">
      No se pudieron cargar {what}: {error.message}
    </div>
  )
}

export function EmptyBox({ children }) {
  return (
    <div className="text-sm text-text-secondary bg-surface border border-border-default rounded-lg p-8 text-center">
      {children}
    </div>
  )
}

export function PriorityTag({ p }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: p.color }}
    >
      <span>{p.arrow}</span>
      {p.label}
    </span>
  )
}
