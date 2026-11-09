export function Select({ label, value, onChange, options }) {
  return (
    <label className="field inline">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
export function DateInput({ label, value, onChange }) {
  return (
    <label className="field inline"><span>{label}</span><input type="date" value={value} onChange={(e) => onChange(e.target.value)} /></label>
  )
}
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => <button key={o.value} className={value === o.value ? 'on' : ''} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  )
}
// `t` is the translate function from useI18n().
export const courseOptions = (courses, t) => [{ value: 'all', label: t('common.allCourses') }, ...courses.map((c) => ({ value: c.id, label: c.title }))]
export const statusOptions = (t) => ['all', 'New', 'In Progress', 'Completed', 'Overdue'].map((v) => ({ value: v, label: v === 'all' ? t('common.allStatuses') : t(`status.${v}`) }))
