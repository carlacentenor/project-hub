/* Utilidades de formato compartidas por las pantallas. */

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function parse(d) {
  if (!d) return null
  // Fechas 'YYYY-MM-DD' → interpretar como fecha local, sin desfase de zona.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d))
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export const toDate = parse

/** Días completos entre dos fechas (b - a). */
export function diffDays(a, b) {
  const da = parse(a)
  const db = parse(b)
  if (!da || !db) return null
  return Math.round((db - da) / 86400000)
}

export function addDays(d, n) {
  const dt = parse(d)
  if (!dt) return null
  const r = new Date(dt)
  r.setDate(r.getDate() + n)
  return r
}

/** "21 Sep" */
export function fmtDayMonth(d) {
  const dt = parse(d)
  if (!dt) return '—'
  return `${String(dt.getDate()).padStart(2, '0')} ${MONTHS[dt.getMonth()]}`
}

/** "30 Sep 2026" */
export function fmtLong(d) {
  const dt = parse(d)
  if (!dt) return '—'
  return `${String(dt.getDate()).padStart(2, '0')} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

/** "01 Sep — 30 Sep" */
export function fmtRange(a, b) {
  const s = parse(a)
  const e = parse(b)
  if (s && e) return `${fmtDayMonth(a)} — ${fmtDayMonth(b)}`
  if (s) return fmtDayMonth(a)
  if (e) return fmtDayMonth(b)
  return '—'
}

const DAY = 86400000

/** Días entre hoy y la fecha (negativo = pasada). */
export function daysUntil(d) {
  const dt = parse(d)
  if (!dt) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((dt - today) / DAY)
}

/** "Hoy", "Mañana", "Atrasada 2 días", "en 3 días"… */
export function dueLabel(d) {
  const n = daysUntil(d)
  if (n === null) return null
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Mañana'
  if (n === -1) return 'Atrasada 1 día'
  if (n < 0) return `Atrasada ${Math.abs(n)} días`
  return `en ${n} días`
}

export function isOverdue(d) {
  const n = daysUntil(d)
  return n !== null && n < 0
}

export function isToday(d) {
  return daysUntil(d) === 0
}

/** "Hace 2 horas", "Ayer", "Hace 3 días" */
export function relativeTime(ts) {
  const dt = ts ? new Date(ts) : null
  if (!dt || Number.isNaN(dt.getTime())) return ''
  const diff = Date.now() - dt.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `Hace ${hrs} ${hrs === 1 ? 'hora' : 'horas'}`
  const days = Math.round(hrs / 24)
  if (days === 1) return 'Ayer'
  if (days < 30) return `Hace ${days} días`
  return fmtLong(ts)
}

/** "15:42" */
export function fmtTime(ts) {
  const dt = ts ? new Date(ts) : null
  if (!dt || Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Iniciales para el avatar: "Carlita" → "C", "José Ramírez" → "JR" */
export function initials(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
