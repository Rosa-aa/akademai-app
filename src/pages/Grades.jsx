import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { Select } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { GRADE_WEIGHTS } from '../data'
import { letter } from '../utils/academics'
import { fmtDate } from '../utils/dates'

const n = (v) => (v == null ? '–' : Math.round(v))
const tip = { borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }
const PARTS = ['midterm', 'assignment', 'study', 'attendance', 'final'] // grade components; labels: grades.comp.* and grades.radar.*

export default function Grades() {
  const { reports, overall, assignments, studies, exams } = useApp()
  const { t } = useI18n()
  const [sel, setSel] = useState(reports[0].course.id)
  const r = reports.find((x) => x.course.id === sel)
  const cid = r.course.id
  const items = [
    ...exams.filter((e) => e.courseId === cid && e.score != null).map((e) => ({ k: e.id, name: `${t(`type.${e.type}`)}: ${e.title}`, kind: t(`type.${e.type}`), date: e.date, score: e.score })),
    ...assignments.filter((a) => a.courseId === cid && a.grade != null).map((a) => ({ k: a.id, name: a.title, kind: t('kind.assignment'), date: a.submittedAt, score: a.grade })),
    ...studies.filter((a) => a.courseId === cid && a.grade != null).map((a) => ({ k: a.id, name: a.title, kind: t('kind.study'), date: a.submittedAt, score: a.grade })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const bars = reports.map((x) => ({ name: t(`content.courseShort.${x.course.id}`), full: x.course.title, grade: Math.round(x.finalGrade ?? 0), color: x.course.color }))
  const radar = PARTS.map((k) => ({ part: t(`grades.radar.${k}`), value: Math.round(r.parts[k] ?? 0) }))

  return (
    <div className="page">
      <PageHeader title={t('nav.grades')} subtitle={t('grades.subtitle')} />
      <div className="stats three">
        <div className="stat"><small>{t('grades.overallAvg')}</small><b>{n(overall)}%</b><em>{t('grades.gradeLetter', { l: letter(overall) })}</em></div>
        <div className="stat"><small>{t('grades.bestCourse')}</small><b>{[...reports].sort((a, b) => b.finalGrade - a.finalGrade)[0].course.title.split(' ').slice(0, 2).join(' ')}</b><em>{n([...reports].sort((a, b) => b.finalGrade - a.finalGrade)[0].finalGrade)}%</em></div>
        <div className="stat"><small>{t('grades.avgAttendance')}</small><b>{n(reports.reduce((s, x) => s + x.parts.attendance, 0) / reports.length)}%</b><em>{t('grades.acrossCourses', { n: reports.length })}</em></div>
      </div>

      <section className="card">
        <div className="card-head"><h3>{t('grades.courseGrades')}</h3></div>
        <div className="scroll-x"><table className="table">
          <thead><tr><th>{t('exam.course')}</th><th>{t('grades.th.midterms')}</th><th>{t('grades.th.exam')}</th><th>{t('grades.th.study')}</th><th>{t('grades.th.assignments')}</th><th>{t('grades.th.attendance')}</th><th>{t('grades.th.courseGrade')}</th></tr></thead>
          <tbody>{reports.map((x) => (
            <tr key={x.course.id} className={`clickable ${x.course.id === sel ? 'sel' : ''}`} onClick={() => setSel(x.course.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(x.course.id)}>
              <td><span className="cell-course"><i className="dot lg" style={{ background: x.course.color }} /><b>{x.course.title}</b></span><small className="muted block">{x.course.instructor}</small></td>
              <td>{n(x.parts.midterm)}</td><td>{x.parts.final == null ? <span className="muted">{t('grades.notTaken')}</span> : n(x.parts.final)}</td><td>{n(x.parts.study)}</td><td>{n(x.parts.assignment)}</td><td>{n(x.parts.attendance)}%</td>
              <td><b>{n(x.finalGrade)}</b> <Badge tone={x.finalGrade >= 90 ? 'green' : x.finalGrade >= 80 ? 'violet' : x.finalGrade >= 70 ? 'amber' : 'red'}>{x.letter}</Badge></td>
            </tr>))}</tbody>
        </table></div>
      </section>

      <section className="card">
        <div className="card-head"><h3>{t('grades.finalByCourse')}</h3></div>
        <div className="chart" style={{ height: 260 }}>
          <ResponsiveContainer><BarChart data={bars} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
            <Tooltip contentStyle={tip} cursor={{ fill: 'var(--tint)' }} formatter={(v, _n, p) => [v, p.payload.full]} />
            <Bar dataKey="grade" radius={[6, 6, 0, 0]} onClick={(d) => { const hit = reports.find((x) => x.course.title === d.full); if (hit) setSel(hit.course.id) }}>
              {bars.map((b) => <Cell key={b.full} fill={b.color} />)}
            </Bar>
          </BarChart></ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>{t('grades.courseDetail')}</h3>
          <Select label={t('exam.course')} value={sel} onChange={setSel} options={reports.map((x) => ({ value: x.course.id, label: x.course.title }))} /></div>
        <div className="g2 tight">
          <div>
            <div className="detail-top"><b className="big">{n(r.finalGrade)}</b><Badge tone="violet">{t('grades.gradeLetter', { l: r.letter })}</Badge><span className="muted">{r.course.instructor}</span></div>
            <ul className="rows comp">
              {PARTS.map((k) => (
                <li key={k}><div className="row static">
                  <span className="grow"><b>{t(`grades.comp.${k}`)}</b><small>{t('grades.weight', { n: Math.round(GRADE_WEIGHTS[k] * 100) })}{k === 'attendance' && r.attendance ? `. ${t('grades.attended', { a: r.attendance.attended, h: r.attendance.held })}` : ''}</small></span>
                  <div className="bar-row"><div className="bar"><i style={{ width: `${r.parts[k] ?? 0}%`, background: r.course.color }} /></div><span>{r.parts[k] == null ? t('grades.notYet') : `${n(r.parts[k])}%`}</span></div>
                </div></li>))}
            </ul>
          </div>
          <div className="chart" style={{ height: 250 }}>
            <ResponsiveContainer><RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="var(--line)" /><PolarAngleAxis dataKey="part" tick={{ fontSize: 12, fill: 'var(--muted)' }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={r.course.color} fill={r.course.color} fillOpacity={0.25} /><Tooltip contentStyle={tip} />
            </RadarChart></ResponsiveContainer>
          </div>
        </div>
        <h4>{t('grades.gradedWork')}</h4>
        {items.length === 0 ? <p className="muted">{t('grades.nothingGraded')}</p> : (
          <div className="scroll-x"><table className="table"><thead><tr><th>{t('grades.th.item')}</th><th>{t('exam.type')}</th><th>{t('exam.date')}</th><th>{t('exams.score')}</th></tr></thead>
            <tbody>{items.map((i) => <tr key={i.k}><td>{i.name}</td><td>{i.kind}</td><td>{fmtDate(i.date)}</td><td><b>{i.score}</b></td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  )
}
