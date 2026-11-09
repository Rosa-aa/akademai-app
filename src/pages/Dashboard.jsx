import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { lower } from '../i18n'
import { fmtRoom } from '../utils/format'
import { eventsForDate, letter, courseById } from '../utils/academics'
import { addDays, parseISO, toISO, fmtLong, fmtShort, fmtMonthShort, fmtWeekday, fmtWeekdayShort, relDays, fmtDateTime, daysBetween } from '../utils/dates'

const catIcon = { Homework: 'ClipboardList', Midterms: 'FileCheck2', 'Exam schedule': 'CalendarClock', Evaluations: 'CheckCircle2', Grades: 'Award', 'Class schedule': 'CalendarDays' }
const catTone = { Homework: 'blue', Midterms: 'violet', 'Exam schedule': 'orange', Evaluations: 'green', Grades: 'amber', 'Class schedule': 'slate' }

export default function Dashboard() {
  const { profile, courses, assignments, exams, overall, notifications, markRead, today } = useApp()
  const { t } = useI18n()
  const nav = useNavigate()
  const done = assignments.filter((a) => a.status === 'Completed').length
  const upcoming = exams.filter((e) => e.isFuture && e.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  const next = upcoming[0]
  const overdue = assignments.filter((a) => a.status === 'Overdue').length

  // Next five days that actually have classes, starting today.
  const week = []
  for (let i = 0; i < 14 && week.length < 5; i++) {
    const iso = toISO(addDays(parseISO(today), i))
    const evs = eventsForDate(iso, exams, { showExams: false })
    if (evs.length) week.push({ iso, evs })
  }
  const homework = [...assignments].sort((a, b) => b.assigned.localeCompare(a.assigned) || b.id.localeCompare(a.id)).slice(0, 5)

  return (
    <div className="page">
      <div className="welcome">
        <h1>{t('dash.welcomeBack', { name: profile.firstName })}</h1>
        <p>{fmtLong(today)}. {overdue > 0 ? t('dash.overdue', { n: overdue }) : t('dash.noOverdue')}</p>
      </div>

      <div className="stats">
        <StatCard to="/classes" label={t('dash.enrolled')} value={courses.length} sub={t('dash.credits', { n: courses.reduce((s, c) => s + c.credits, 0) })} icon="BookOpen" tone="violet" />
        <StatCard to="/assignments" label={t('dash.completedAssignments')} value={`${done} / ${assignments.length}`} sub={t('dash.inProgress', { n: assignments.filter((a) => a.status === 'In Progress').length })} icon="CheckCircle2" tone="green" />
        <StatCard to="/exams" label={t('dash.upcomingExams')} value={upcoming.length} sub={next ? t('dash.next', { when: lower(relDays(next.date, today)) }) : t('dash.noneScheduled')} icon="CalendarClock" tone="orange" />
        <StatCard to="/grades" label={t('dash.overall')} value={overall == null ? '–' : `${Math.round(overall)}%`} sub={t('grades.gradeLetter', { l: letter(overall) })} icon="Trophy" tone="amber" />
      </div>

      <div className="g2">
        <section className="card">
          <div className="card-head"><h3>{t('dash.upcomingTitle')}</h3><Link className="more" to="/exams">{t('dash.allExams')} <ArrowRight size={14} /></Link></div>
          {upcoming.length === 0 ? <EmptyState icon="CalendarCheck" title={t('dash.noUpcoming')} /> : (
            <ul className="rows">
              {upcoming.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <button className="row" onClick={() => nav('/exams')}>
                    <span className="datebox" style={{ '--ec': e.color }}><b>{parseISO(e.date).getDate()}</b><small>{fmtMonthShort(e.date)}</small></span>
                    <span className="grow"><b>{e.courseTitle}: {e.title}</b><small>{fmtWeekday(e.date)}, {e.start}–{e.end}, {fmtRoom(e.room)}</small></span>
                    <Badge tone={e.status === 'Postponed' ? 'orange' : daysBetween(today, e.date) <= 3 ? 'red' : 'violet'}>{e.status === 'Postponed' ? e.status : relDays(e.date, today)}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h3>{t('dash.weekPreview')}</h3><Link className="more" to="/classes">{t('dash.openCalendar')} <ArrowRight size={14} /></Link></div>
          <div className="mini-sched">
            {week.map(({ iso, evs }) => (
              <div key={iso} className="ms-day">
                <div className={`ms-date ${iso === today ? 'today' : ''}`}><b>{fmtWeekdayShort(iso)}</b><small>{fmtShort(iso)}</small></div>
                <div className="ms-list">
                  {evs.map((e) => (
                    <Link key={e.id} to="/classes" className={`ms-ev ${e.cancelled ? 'cancelled' : ''}`} style={{ '--ec': e.color }}>
                      <b>{e.title}</b>
                      <small>{e.start}–{e.end} <MapPin size={11} /> {e.room} · {t(`type.${e.type}`)}{e.cancelled ? ` · ${t('classes.cancelled')}` : ''}</small>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3>{t('dash.recentHomework')}</h3><Link className="more" to="/assignments">{t('dash.allAssignments')} <ArrowRight size={14} /></Link></div>
          <ul className="rows">
            {homework.map((a) => (
              <li key={a.id}>
                <button className="row" onClick={() => nav(`/assignments?open=${a.id}`)}>
                  <span className="ico" style={{ '--tc': a.color, background: 'color-mix(in srgb, var(--tc) 14%, var(--surface))', color: a.color }}><Icon name={courseById[a.courseId].icon} size={18} /></span>
                  <span className="grow"><b>{a.title}</b><small>{t('dash.courseDue', { course: a.courseTitle, date: fmtShort(a.due) })}</small></span>
                  <Badge>{a.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-head"><h3>{t('dash.recentNotifs')}</h3><Link className="more" to="/notifications">{t('dash.allNotifs')} <ArrowRight size={14} /></Link></div>
          {notifications.length === 0 ? <EmptyState icon="BellOff" title={t('notif.none')} /> : (
            <ul className="rows">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <button className={`row ${n.read ? 'read' : ''}`} onClick={() => { markRead(n.id); nav('/notifications') }}>
                    <span className={`ico t-${catTone[n.category]}`}><Icon name={catIcon[n.category]} size={18} /></span>
                    <span className="grow"><b>{n.title}</b><small>{n.text}</small></span>
                    <small className="time">{fmtDateTime(n.at)}</small>
                    {!n.read && <i className="unread-dot" aria-label={t('common.unread')} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
