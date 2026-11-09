import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import TaskModal from '../components/TaskModal'
import { Select, courseOptions, statusOptions } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { lower } from '../i18n'
import { fmtDate, relDays } from '../utils/dates'

export default function IndependentStudies() {
  const { studies, courses, today } = useApp()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [course, setCourse] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('due-asc')
  const openId = params.get('open')

  const list = useMemo(() => studies
    .filter((s) => (course === 'all' || s.courseId === course) && (status === 'all' || s.status === status))
    .sort((a, b) => {
      const [k, d] = sort.split('-'); const f = k === 'due' ? 'due' : 'assigned'
      return (d === 'asc' ? 1 : -1) * a[f].localeCompare(b[f])
    }), [studies, course, status, sort])

  return (
    <div className="page">
      <PageHeader title={t('nav.studies')} subtitle={t('study.subtitle')} />
      <section className="card">
        <div className="filters">
          <Select label={t('exam.course')} value={course} onChange={setCourse} options={courseOptions(courses, t)} />
          <Select label={t('common.status')} value={status} onChange={setStatus} options={statusOptions(t)} />
          <Select label={t('study.sort')} value={sort} onChange={setSort} options={[
            { value: 'due-asc', label: t('study.dueAsc') }, { value: 'due-desc', label: t('study.dueDesc') },
            { value: 'assigned-desc', label: t('study.assignedDesc') }, { value: 'assigned-asc', label: t('study.assignedAsc') }]} />
          <small className="muted count">{t('common.countOf', { n: list.length, total: studies.length })}</small>
        </div>
        {list.length === 0 ? <EmptyState icon="SearchX" title={t('study.noMatch')} action={<button className="btn ghost" onClick={() => { setCourse('all'); setStatus('all') }}>{t('common.clearFilters')}</button>} /> : (
          <div className="card-grid">
            {list.map((s) => (
              <button key={s.key} className={`study ${s.status === 'Overdue' ? 'overdue' : ''}`} style={{ '--ec': s.color }} onClick={() => setParams({ open: s.id })}>
                <div className="study-top"><Badge>{s.status}</Badge>{s.grade != null && <span className="grade-pill">{s.grade}</span>}</div>
                <b>{s.title}</b>
                <small>{s.courseTitle}</small>
                <small>{s.instructor}</small>
                <p>{s.description}</p>
                <div className="study-foot">
                  <span>{t('study.assigned', { date: fmtDate(s.assigned) })}</span>
                  <span className={s.status === 'Overdue' ? 'bad' : ''}>{t('study.due', { date: fmtDate(s.due) })}{s.status !== 'Completed' && ` (${lower(relDays(s.due, today))})`}</span>
                  {s.files.length > 0 && <span><Paperclip size={12} /> {t('study.files', { n: s.files.length })}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      {openId && <TaskModal taskKey={`study:${openId}`} onClose={() => setParams({})} />}
    </div>
  )
}
