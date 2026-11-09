// Date helpers. All app dates are plain 'YYYY-MM-DD' strings (local calendar days).
// Names of months and weekdays and the date patterns come from the active language (i18n/locales/<lang>/ui.js, section `date`).
import { translate as tr } from '../i18n'

export const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5)
export const startOfWeek = (d, weekStart = 1) => addDays(d, -((d.getDay() - weekStart + 7) % 7))
export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

// Demo "today": the real date while it falls in November 2026, otherwise 7 Nov 2026.
const now = new Date()
export const TODAY = now.getFullYear() === 2026 && now.getMonth() === 10 ? toISO(now) : '2026-11-07'

// weekday index: 0 = Sunday … 6 = Saturday
export const weekdayShort = (i) => tr('date.weekdaysShort')[i]
export const weekdayLong = (i) => tr('date.weekdaysLong')[i]
export const fmtWeekday = (iso) => weekdayLong(parseISO(iso).getDay())
export const fmtWeekdayShort = (iso) => weekdayShort(parseISO(iso).getDay())
export const fmtMonthShort = (iso) => tr('date.monthsShort')[parseISO(iso).getMonth()]

export const fmtDate = (iso) => { const d = parseISO(iso); return tr('date.fmtFull', { d: d.getDate(), m: tr('date.monthsShort')[d.getMonth()], y: d.getFullYear() }) }
export const fmtShort = (iso) => { const d = parseISO(iso); return tr('date.fmtShort', { d: d.getDate(), m: tr('date.monthsShort')[d.getMonth()] }) }
export const fmtLong = (iso) => {
  const d = parseISO(iso)
  return tr('date.fmtLong', { w: tr('date.weekdaysInDate')[d.getDay()], d: d.getDate(), M: tr('date.monthsOf')[d.getMonth()], y: d.getFullYear() })
}
export const monthTitle = (d) => tr('date.fmtMonthTitle', { M: tr('date.monthsLong')[d.getMonth()], y: d.getFullYear() })

export function relDays(iso, today = TODAY) {
  const n = daysBetween(today, iso)
  if (n === 0) return tr('rel.today')
  if (n === 1) return tr('rel.tomorrow')
  if (n === -1) return tr('rel.yesterday')
  return n > 0 ? tr('rel.inDays', { n }) : tr('rel.daysAgo', { n: -n })
}
export const fmtDateTime = (iso) => {
  const d = new Date(iso)
  return tr('date.fmtDateTime', { d: d.getDate(), m: tr('date.monthsShort')[d.getMonth()], time: `${pad(d.getHours())}:${pad(d.getMinutes())}` })
}
export const fmtSize = (b) => (b < 1024 ? `${b} ${tr('unit.b')}` : b < 1048576 ? `${(b / 1024).toFixed(0)} ${tr('unit.kb')}` : `${(b / 1048576).toFixed(1)} ${tr('unit.mb')}`)
