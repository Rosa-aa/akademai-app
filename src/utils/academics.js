import { courses, schedule, scheduleExceptions, semester, GRADE_WEIGHTS } from '../data'
import { TODAY, daysBetween, parseISO, toMin } from './dates'
import { tOr } from '../i18n'

export const courseById = Object.fromEntries(courses.map((c) => [c.id, c]))
// Course names, task texts and exam titles are translated through i18n; the English text in data/ is the fallback.
export const courseTitle = (c) => tOr(`content.course.${c.id}`, c.title)
export const localizedCourses = () => courses.map((c) => ({ ...c, title: courseTitle(c) }))
export const TASK_STATUSES = ['New', 'In Progress', 'Completed', 'Overdue']
export const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)
export const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10)

// Merge a base task (assignment / study) with the student's saved changes.
export function mergeTask(base, kind, saved = {}, today = TODAY) {
  const stored = saved.status ?? base.status
  const status = stored === 'Completed' ? 'Completed' : base.due < today ? 'Overdue' : stored
  const submittedAt = status === 'Completed' ? (saved.submittedAt ?? base.submittedAt ?? today) : null
  const course = courseById[base.courseId]
  const group = kind === 'study' ? 'study' : 'assignment'
  return {
    ...base, key: `${kind}:${base.id}`, kind, status, storedStatus: stored, submittedAt,
    title: tOr(`content.${group}.${base.id}.title`, base.title), description: tOr(`content.${group}.${base.id}.desc`, base.description),
    late: !!submittedAt && submittedAt > base.due, text: saved.text ?? '', files: saved.files ?? [],
    grade: status === 'Completed' ? base.grade ?? null : null,
    courseTitle: courseTitle(course), instructor: course.instructor, color: course.color,
    daysLeft: daysBetween(today, base.due),
  }
}

export function mergeExam(e, today = TODAY) {
  const course = courseById[e.courseId]
  const status = e.status === 'Postponed' ? 'Postponed' : e.date < today ? 'Completed' : 'Upcoming'
  return { ...e, status, title: tOr(`content.examTitle.${e.title}`, e.title), note: e.noteKey ? tOr(e.noteKey, e.note) : e.note, courseTitle: courseTitle(course), instructor: course.instructor, color: course.color, daysLeft: daysBetween(today, e.date), score: e.score ?? null, isFuture: e.date >= today }
}

// Classes and exams that happen on one calendar day, sorted by start time.
export function eventsForDate(iso, exams = [], { showExams = true } = {}) {
  const wd = parseISO(iso).getDay()
  const inTerm = iso >= semester.start && iso <= semester.end
  const cls = schedule.filter((s) => inTerm && s.weekday === wd).map((s) => {
    const ex = scheduleExceptions.find((x) => x.classId === s.id && x.date === iso)
    const c = courseById[s.courseId]
    return { id: `${s.id}@${iso}`, kind: 'class', date: iso, courseId: s.courseId, title: courseTitle(c), instructor: c.instructor, color: c.color,
      start: s.start, end: s.end, room: s.room, type: s.type, cancelled: !!ex, reason: ex ? (ex.reasonKey ? tOr(ex.reasonKey, ex.reason) : ex.reason) : undefined }
  })
  const ex = showExams ? exams.filter((e) => e.date === iso).map((e) => ({ id: e.id, kind: 'exam', date: iso, courseId: e.courseId,
    title: `${e.courseTitle}: ${e.title}`, instructor: e.instructor, color: e.color, start: e.start, end: e.end, room: e.room, type: e.type, exam: e })) : []
  return [...cls, ...ex].sort((a, b) => toMin(a.start) - toMin(b.start))
}

export const letter = (n0) => { const n = n0 == null ? null : Math.round(n0); return n == null ? '–' : n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n >= 60 ? 'D' : 'F' }

// Per-course report. Final grade = weighted mean of the components that exist so far.
export function courseReport(course, { assignments, studies, exams, attendance }) {
  const mine = (l) => l.filter((x) => x.courseId === course.id)
  const att = attendance[course.id]
  const parts = {
    midterm: avg(mine(exams).filter((e) => e.type !== 'Final' && e.score != null).map((e) => e.score)),
    assignment: avg(mine(assignments).filter((a) => a.grade != null).map((a) => a.grade)),
    study: avg(mine(studies).filter((a) => a.grade != null).map((a) => a.grade)),
    attendance: att ? (att.attended / att.held) * 100 : null,
    final: avg(mine(exams).filter((e) => e.type === 'Final' && e.score != null).map((e) => e.score)),
  }
  let w = 0, sum = 0
  for (const k of Object.keys(parts)) if (parts[k] != null) { w += GRADE_WEIGHTS[k]; sum += parts[k] * GRADE_WEIGHTS[k] }
  const finalGrade = w ? sum / w : null
  return { course, parts, attendance: att, finalGrade, letter: letter(finalGrade) }
}
