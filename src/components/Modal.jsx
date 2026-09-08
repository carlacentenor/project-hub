import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, width = 460 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-[rgba(16,56,79,0.25)] z-40"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-3 w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] overflow-y-auto"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border-default sticky top-0 bg-white">
          <div className="text-base font-bold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary text-base"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  )
}

// ---- Campos de formulario reutilizables -------------------------------
export function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputCls =
  'px-3 py-2 rounded-md border border-border-strong bg-white text-[13px] text-text-primary outline-none focus:border-brand-cyan w-full'

export function TextInput(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`${inputCls} resize-y ${props.className || ''}`}
    />
  )
}

export function Select({ options, ...props }) {
  return (
    <select {...props} className={`${inputCls} ${props.className || ''}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
