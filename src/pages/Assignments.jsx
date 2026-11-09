import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Paperclip, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import TaskModal from '../components/TaskModal'
import { Select, courseOptions, statusOptions } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { TASK_STATUSES } from '../utils/academics'
import { fmtDate, fmtShort, fmtMonthShort, relDays } from '../utils/dates'

export default function Assignments() {
  const { assignments, courses, today } = useApp()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [course, setCourse] = useState(params.get('course') ?? 'all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('asc')
  const openId = params.get('open')
  const openKey = openId ? `assignment:${openId}` : null

  const counts = useMemo(() => Object.fromEntries(TASK_STATUSES.map((s) => [s, assignments.filter((a) => a.status === s).length])), [assignments])
  const list = useMemo(() => assignments
    .filter((a) => (course === 'all' || a.courseId === course) && (status === 'all' || a.status === status))
    .sort((a, b) => (sort === 'asc' ? 1 : -1) * a.due.localeCompare(b.due)), [assignments, course, status, sort])
  const soon = useMemo(() => assignments.filter((a) => a.status !== 'Completed' && a.due >= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4), [assignments, today])
  const open = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set('open', id); return n })
  const close = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('open'); return n })

  return (
    <div className="page">
      <PageHeader title={t('nav.assignments')} subtitle={t('assign.subtitle')} />
      <div className="chips-row">
        {TASK_STATUSES.map((s) => (
          <button key={s} className={`sumchip t-${{ New: 'blue', 'In Progress': 'amber', Completed: 'green', Overdue: 'red' }[s]} ${status === s ? 'on' : ''}`} onClick={() => setStatus(status === s ? 'all' : s)} aria-pressed={status === s}>
            <b>{counts[s]}</b><span>{t(`status.${s}`)}</span>
          </button>
        ))}
      </div>

      <div className="g-side">
        <section className="card">
          <div className="filters">
            <Select label={t('exam.course')} value={course} onChange={setCourse} options={courseOptions(courses, t)} />
            <Select label={t('common.status')} value={status} onChange={setStatus} options={statusOptions(t)} />
            <Select label={t('assign.sortByDeadline')} value={sort} onChange={setSort} options={[{ value: 'asc', label: t('assign.earliest') }, { value: 'desc', label: t('assign.latest') }]} />
            <small className="muted count">{t('common.countOf', { n: list.length, total: assignments.length })}</small>
          </div>
          {list.length === 0 ? <EmptyState icon="SearchX" title={t('assign.noMatch')} action={<button className="btn ghost" onClick={() => { setCourse('all'); setStatus('all') }}>{t('common.clearFilters')}</button>} /> : (
            <ul className="task-list">
              {list.map((a) => (
                <li key={a.key}>
                  <button className={`task ${a.status === 'Overdue' ? 'overdue' : ''}`} onClick={() => open(a.id)} style={{ '--ec': a.color }}>
                    <span className="task-bar" />
                    <span className="grow">
                      <b>{a.title}</b>
                      <small>{a.courseTitle}. {a.instructor}</small>
                      <small className="task-meta">
                        {t('assign.assignedDue', { assigned: fmtShort(a.assigned), due: fmtDate(a.due) })}
                        {a.status === 'Overdue' && <em className="bad"><AlertTriangle size={12} /> {t('assign.daysOverdue', { n: -a.daysLeft })}</em>}
                        {a.files.length > 0 && <em><Paperclip size={12} /> {a.files.length}</em>}
                      </small>
                    </span>
                    {a.grade != null && <span className="grade-pill">{a.grade}</span>}
                    <Badge>{a.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="card">
          <div className="card-head"><h3>{t('assign.upcomingDeadlines')}</h3></div>
          {soon.length === 0 ? <p className="muted">{t('assign.nothingDue')}</p> : (
            <ul className="rows">
              {soon.map((a) => (
                <li key={a.key}><button className="row" onClick={() => open(a.id)}>
                  <span className="datebox" style={{ '--ec': a.color }}><b>{a.due.slice(8)}</b><small>{fmtMonthShort(a.due)}</small></span>
                  <span className="grow"><b>{a.title}</b><small>{a.courseTitle}</small></span>
                  <small className={a.daysLeft <= 3 ? 'bad' : 'muted'}>{relDays(a.due, today)}</small>
                </button></li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      {openKey && <TaskModal taskKey={openKey} onClose={close} />}
    </div>
  )
}
