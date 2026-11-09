import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import ExamModal from '../components/ExamModal'
import { Select, DateInput, courseOptions } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { fmtRoom } from '../utils/format'
import { fmtLong, relDays } from '../utils/dates'
import { Clock, MapPin, User } from 'lucide-react'

function MidtermCard({ e, onOpen, today }) {
  return (
    <button className="mcard" style={{ '--ec': e.color }} onClick={() => onOpen(e)}>
      <div className="mcard-top"><Badge>{e.status}</Badge>{e.status !== 'Completed' && <small className={e.daysLeft <= 3 ? 'bad' : 'muted'}>{relDays(e.date, today)}</small>}
        {e.score != null && <span className="grade-pill">{e.score}</span>}</div>
      <b>{e.title}</b>
      <span className="mcard-course">{e.courseTitle}</span>
      <ul>
        <li><User size={14} />{e.instructor}</li>
        <li><Clock size={14} />{fmtLong(e.date)}</li>
        <li><Clock size={14} />{e.start} – {e.end}</li>
        <li><MapPin size={14} />{fmtRoom(e.room)}</li>
      </ul>
    </button>
  )
}

export default function Midterms() {
  const { exams, courses, today } = useApp()
  const { t } = useI18n()
  const [course, setCourse] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('asc')
  const [open, setOpen] = useState(null)

  const mids = useMemo(() => exams.filter((e) => e.type === 'Midterm')
    .filter((e) => (course === 'all' || e.courseId === course) && (!from || e.date >= from) && (!to || e.date <= to))
    .sort((a, b) => (sort === 'asc' ? 1 : -1) * (a.date + a.start).localeCompare(b.date + b.start)), [exams, course, from, to, sort])
  const upcoming = mids.filter((e) => e.status !== 'Completed')
  const completed = mids.filter((e) => e.status === 'Completed')
  const filtered = course !== 'all' || from || to

  return (
    <div className="page">
      <PageHeader title={t('nav.midterms')} subtitle={t('mid.subtitle')} />
      <section className="card">
        <div className="filters">
          <Select label={t('exam.course')} value={course} onChange={setCourse} options={courseOptions(courses, t)} />
          <DateInput label={t('common.from')} value={from} onChange={setFrom} />
          <DateInput label={t('common.to')} value={to} onChange={setTo} />
          <Select label={t('common.order')} value={sort} onChange={setSort} options={[{ value: 'asc', label: t('common.chronological') }, { value: 'desc', label: t('common.newestFirst') }]} />
          {filtered && <button className="btn ghost" onClick={() => { setCourse('all'); setFrom(''); setTo('') }}>{t('common.clearFilters')}</button>}
        </div>
      </section>
      <h2 className="section-title">{t('status.Upcoming')} <small>{upcoming.length}</small></h2>
      {upcoming.length ? <div className="card-grid">{upcoming.map((e) => <MidtermCard key={e.id} e={e} onOpen={setOpen} today={today} />)}</div>
        : <div className="card"><EmptyState icon="CalendarCheck" title={t('mid.noUpcoming')} text={filtered ? t('common.widenFilters') : t('mid.newDates')} /></div>}
      <h2 className="section-title">{t('status.Completed')} <small>{completed.length}</small></h2>
      {completed.length ? <div className="card-grid">{completed.map((e) => <MidtermCard key={e.id} e={e} onOpen={setOpen} today={today} />)}</div>
        : <div className="card"><EmptyState icon="History" title={t('mid.noCompleted')} text={filtered ? t('common.widenFilters') : undefined} /></div>}
      <ExamModal exam={open} onClose={() => setOpen(null)} />
    </div>
  )
}
