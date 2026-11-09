import { useI18n } from '../i18n/I18nProvider'

// `children` is a status / type key (New, Completed, Lecture, Midterm …); the visible label is translated.
const TONE = { New: 'blue', 'In Progress': 'amber', Completed: 'green', Overdue: 'red', Upcoming: 'violet', Postponed: 'orange',
  Lecture: 'violet', Seminar: 'blue', Laboratory: 'green', Midterm: 'violet', Final: 'red', Quiz: 'amber' }
const LABEL = { New: 'status.New', 'In Progress': 'status.In Progress', Completed: 'status.Completed', Overdue: 'status.Overdue', Upcoming: 'status.Upcoming', Postponed: 'status.Postponed',
  Lecture: 'type.Lecture', Seminar: 'type.Seminar', Laboratory: 'type.Laboratory', Midterm: 'type.Midterm', Final: 'type.Final', Quiz: 'type.Quiz' }
export default function Badge({ children, tone }) {
  const { t } = useI18n()
  return <span className={`badge t-${tone ?? TONE[children] ?? 'slate'}`}>{LABEL[children] ? t(LABEL[children]) : children}</span>
}
