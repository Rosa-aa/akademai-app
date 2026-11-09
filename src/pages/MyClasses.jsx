import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import MonthGrid from '../components/MonthGrid'
import TimeGrid, { EventChip } from '../components/TimeGrid'
import { Segmented } from '../components/Filters'
import ExamModal from '../components/ExamModal'
import Icon from '../components/Icon'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { fmtRoom } from '../utils/format'
import { schedule } from '../data'
import { eventsForDate } from '../utils/academics'
import { addDays, addMonths, parseISO, startOfWeek, toISO, fmtLong, fmtShort, fmtDate, monthTitle, weekdayShort } from '../utils/dates'

export default function MyClasses() {
  const { prefs, exams, courses, today } = useApp()
  const { t } = useI18n()
  const [view, setView] = useState(prefs.calendarView)
  const [sel, setSel] = useState(today)
  const [showExams, setShowExams] = useState(true)
  const [open, setOpen] = useState(null)
  const selDate = parseISO(sel)
  const eventsFor = (iso) => eventsForDate(iso, exams, { showExams })

  const move = (dir) => setSel(toISO(view === 'month' ? addMonths(selDate, dir) : addDays(selDate, dir * (view === 'week' ? 7 : 1))))
  const weekDays = useMemo(() => { const s = startOfWeek(selDate, prefs.weekStart); return Array.from({ length: 7 }, (_, i) => addDays(s, i)) }, [sel, prefs.weekStart])
  const title = view === 'month' ? monthTitle(selDate) : view === 'week' ? `${fmtShort(toISO(weekDays[0]))} – ${fmtDate(toISO(weekDays[6]))}` : fmtLong(sel)
  const dayEvents = eventsFor(sel)

  return (
    <div className="page">
      <PageHeader title={t('nav.classes')} subtitle={t('classes.subtitle')} />
      <section className="card">
        <div className="cal-bar">
          <div className="cal-nav">
            <button className="icon-btn bordered" onClick={() => move(-1)} aria-label={t(`cal.prev.${view}`)}><ChevronLeft size={18} /></button>
            <button className="icon-btn bordered" onClick={() => move(1)} aria-label={t(`cal.next.${view}`)}><ChevronRight size={18} /></button>
            <button className="btn ghost" onClick={() => setSel(today)}>{t('cal.today')}</button>
            <h2 className="cal-title" aria-live="polite">{title}</h2>
          </div>
          <div className="cal-tools">
            <label className="check"><input type="checkbox" checked={showExams} onChange={(e) => setShowExams(e.target.checked)} /> {t('classes.showExams')}</label>
            <label className="field inline"><span>{t('cal.goTo')}</span><input type="date" value={sel} onChange={(e) => e.target.value && setSel(e.target.value)} /></label>
            <Segmented label={t('cal.view')} value={view} onChange={setView} options={[{ value: 'day', label: t('cal.day') }, { value: 'week', label: t('cal.week') }, { value: 'month', label: t('cal.month') }]} />
          </div>
        </div>

        {view === 'month' ? (
          <MonthGrid month={selDate} weekStart={prefs.weekStart} selected={sel} today={today} onSelect={setSel}
            renderDay={(iso) => { const evs = eventsFor(iso); return <>{evs.slice(0, 3).map((e) => <EventChip key={e.id} ev={e} small onClick={setOpen} />)}{evs.length > 3 && <small className="more-n">{t('cal.more', { n: evs.length - 3 })}</small>}</> }} />
        ) : (
          <TimeGrid days={view === 'week' ? weekDays : [selDate]} eventsFor={eventsFor} today={today} selected={sel} onSelect={(iso) => { setSel(iso) }} onEvent={setOpen} />
        )}
        <div className="legend-row">{courses.map((c) => <span key={c.id}><i className="dot" style={{ background: c.color }} />{c.title}</span>)}</div>
      </section>

      {view === 'month' && (
        <section className="card">
          <div className="card-head"><h3>{fmtLong(sel)}</h3></div>
          {dayEvents.length === 0 ? <p className="muted">{t('classes.nothing')}</p> : (
            <ul className="rows">{dayEvents.map((e) => (
              <li key={e.id}><button className="row" onClick={() => setOpen(e)}>
                <span className="datebox" style={{ '--ec': e.color }}><small>{e.start}</small></span>
                <span className="grow"><b>{e.title}</b><small>{e.start}–{e.end}, {fmtRoom(e.room)}, {e.instructor}</small></span>
                {e.cancelled ? <Badge tone="red">{t('classes.cancelled')}</Badge> : <Badge>{e.type}</Badge>}
              </button></li>))}
            </ul>
          )}
        </section>
      )}

      <section className="card">
        <div className="card-head"><h3>{t('dash.enrolled')}</h3><small className="muted">{t('classes.courseCount', { courses: t('classes.nCourses', { n: courses.length }), credits: t('dash.credits', { n: courses.reduce((s, c) => s + c.credits, 0) }) })}</small></div>
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>{t('exam.course')}</th><th>{t('exam.instructor')}</th><th>{t('classes.weeklySessions')}</th><th>{t('classes.credits')}</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span className="cell-course"><i className="dot lg" style={{ background: c.color }} /><Icon name={c.icon} size={16} /><Link to={`/assignments?course=${c.id}`}>{c.title}</Link></span></td>
                  <td>{c.instructor}</td>
                  <td className="sessions">{schedule.filter((s) => s.courseId === c.id).map((s) => <span key={s.id}>{weekdayShort(s.weekday)} {s.start}–{s.end}, {fmtRoom(s.room)} ({t(`type.${s.type}`)})</span>)}</td>
                  <td>{c.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open?.kind === 'exam' && <ExamModal exam={open.exam} onClose={() => setOpen(null)} />}
      {open?.kind === 'class' && (
        <Modal title={open.title} onClose={() => setOpen(null)}>
          <div className="detail-top"><Badge>{open.type}</Badge>{open.cancelled && <Badge tone="red">{t('classes.cancelled')}</Badge>}</div>
          <dl className="meta-grid">
            <div><dt>{t('exam.course')}</dt><dd><i className="dot" style={{ background: open.color }} />{open.title}</dd></div>
            <div><dt>{t('exam.instructor')}</dt><dd>{open.instructor}</dd></div>
            <div><dt>{t('exam.date')}</dt><dd>{fmtLong(open.date)}</dd></div>
            <div><dt>{t('exam.time')}</dt><dd>{open.start} – {open.end}</dd></div>
            <div><dt>{t('exam.classroom')}</dt><dd>{fmtRoom(open.room)}</dd></div>
            <div><dt>{t('classes.classType')}</dt><dd>{t(`type.${open.type}`)}</dd></div>
          </dl>
          {open.cancelled && <p className="note-box">{open.reason}</p>}
          <div className="modal-actions"><Link className="btn ghost" to={`/assignments?course=${open.courseId}`} onClick={() => setOpen(null)}>{t('classes.viewAssignments')}</Link></div>
        </Modal>
      )}
    </div>
  )
}
