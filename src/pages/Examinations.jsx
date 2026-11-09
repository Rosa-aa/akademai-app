import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import ExamModal from '../components/ExamModal'
import MonthGrid from '../components/MonthGrid'
import { EventChip } from '../components/TimeGrid'
import { Select, Segmented, courseOptions } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { fmtRoom } from '../utils/format'
import { addMonths, parseISO, fmtDate, fmtWeekdayShort, monthTitle } from '../utils/dates'

export default function Examinations() {
  const { exams, courses, prefs, today } = useApp()
  const { t } = useI18n()
  const [mode, setMode] = useState('list')
  const [course, setCourse] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('asc')
  const [month, setMonth] = useState(() => new Date(parseISO(today).getFullYear(), parseISO(today).getMonth(), 1))
  const [open, setOpen] = useState(null)

  const list = useMemo(() => exams
    .filter((e) => (course === 'all' || e.courseId === course) && (type === 'all' || e.type === type)
      && (status === 'all' || (status === 'upcoming' ? e.status !== 'Completed' : e.status === 'Completed')))
    .sort((a, b) => (sort === 'asc' ? 1 : -1) * (a.date + a.start).localeCompare(b.date + b.start)), [exams, course, type, status, sort])
  const upcoming = list.filter((e) => e.status !== 'Completed'), completed = list.filter((e) => e.status === 'Completed')

  const Row = ({ e }) => (
    <tr className="clickable" onClick={() => setOpen(e)} tabIndex={0} onKeyDown={(ev) => ev.key === 'Enter' && setOpen(e)}>
      <td><span className="cell-course"><i className="dot lg" style={{ background: e.color }} /><b>{e.courseTitle}</b></span><small className="muted block">{e.title}</small></td>
      <td><Badge>{e.type}</Badge></td>
      <td>{e.instructor}</td>
      <td>{fmtWeekdayShort(e.date)}, {fmtDate(e.date)}</td>
      <td>{e.start} – {e.end}</td>
      <td>{fmtRoom(e.room)}</td>
      <td><Badge>{e.status}</Badge></td>
      <td>{e.status === 'Completed' ? (e.score != null ? <b>{e.score}</b> : '–') : <span className={e.daysLeft <= 3 ? 'bad' : ''}>{e.daysLeft === 0 ? t('rel.today') : t('exams.daysN', { n: e.daysLeft })}</span>}</td>
    </tr>
  )
  const Table = ({ rows, last }) => (
    <div className="scroll-x"><table className="table">
      <thead><tr><th>{t('exam.course')}</th><th>{t('exam.type')}</th><th>{t('exam.instructor')}</th><th>{t('exam.date')}</th><th>{t('exam.time')}</th><th>{t('exam.classroom')}</th><th>{t('common.status')}</th><th>{last}</th></tr></thead>
      <tbody>{rows.map((e) => <Row key={e.id} e={e} />)}</tbody>
    </table></div>
  )

  return (
    <div className="page">
      <PageHeader title={t('nav.exams')} subtitle={t('exams.subtitle')}>
        <Segmented label={t('exams.viewMode')} value={mode} onChange={setMode} options={[{ value: 'list', label: t('exams.list') }, { value: 'calendar', label: t('exams.calendar') }]} />
      </PageHeader>
      <section className="card">
        <div className="filters">
          <Select label={t('exam.course')} value={course} onChange={setCourse} options={courseOptions(courses, t)} />
          <Select label={t('exam.type')} value={type} onChange={setType} options={[{ value: 'all', label: t('exams.allTypes') }, { value: 'Midterm', label: t('type.Midterm') }, { value: 'Quiz', label: t('type.Quiz') }, { value: 'Final', label: t('type.Final') }]} />
          <Select label={t('exams.show')} value={status} onChange={setStatus} options={[{ value: 'all', label: t('exams.showAll') }, { value: 'upcoming', label: t('exams.showUpcoming') }, { value: 'completed', label: t('exams.showCompleted') }]} />
          <Select label={t('common.order')} value={sort} onChange={setSort} options={[{ value: 'asc', label: t('common.chronological') }, { value: 'desc', label: t('common.newestFirst') }]} />
          <small className="muted count">{t('common.countOf', { n: list.length, total: exams.length })}</small>
        </div>
      </section>

      {mode === 'list' ? (
        list.length === 0 ? <div className="card"><EmptyState icon="SearchX" title={t('exams.noMatch')} action={<button className="btn ghost" onClick={() => { setCourse('all'); setType('all'); setStatus('all') }}>{t('common.clearFilters')}</button>} /></div> : (
          <>
            {upcoming.length > 0 && <section className="card"><div className="card-head"><h3>{t('status.Upcoming')} <small className="muted">{upcoming.length}</small></h3></div><Table rows={upcoming} last={t('exams.daysLeft')} /></section>}
            {completed.length > 0 && <section className="card"><div className="card-head"><h3>{t('status.Completed')} <small className="muted">{completed.length}</small></h3></div><Table rows={completed} last={t('exams.score')} /></section>}
          </>
        )
      ) : (
        <section className="card">
          <div className="cal-bar">
            <div className="cal-nav">
              <button className="icon-btn bordered" onClick={() => setMonth(addMonths(month, -1))} aria-label={t('cal.prev.month')}><ChevronLeft size={18} /></button>
              <button className="icon-btn bordered" onClick={() => setMonth(addMonths(month, 1))} aria-label={t('cal.next.month')}><ChevronRight size={18} /></button>
              <button className="btn ghost" onClick={() => setMonth(new Date(parseISO(today).getFullYear(), parseISO(today).getMonth(), 1))}>{t('cal.today')}</button>
              <h2 className="cal-title">{monthTitle(month)}</h2>
            </div>
          </div>
          <MonthGrid month={month} weekStart={prefs.weekStart} today={today} selected={null} onSelect={() => {}}
            renderDay={(iso) => list.filter((e) => e.date === iso).map((e) => (
              <EventChip key={e.id} small onClick={() => setOpen(e)} ev={{ ...e, title: `${e.courseTitle}`, kind: 'exam', color: e.color }} />))} />
          <p className="muted small-note">{t('exams.selectHint')}</p>
        </section>
      )}
      <ExamModal exam={open} onClose={() => setOpen(null)} />
    </div>
  )
}
