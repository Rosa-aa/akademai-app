// Notifications are stored language-neutral: a text key plus parameters that refer to ids and ISO dates.
// They are turned into text only when displayed, so switching the language also translates existing notifications.
import { translate as tr, tOr } from '../i18n'
import { courses } from '../data'
import { fmtDate, fmtShort } from './dates'
import { fmtRoom } from './format'

const COURSE_PARAMS = ['course', 'overlapCourse']
const SHORT_DATE_PARAMS = ['date', 'from']

export function resolveNoteParams(params = {}) {
  const out = {}
  for (const [k, v] of Object.entries(params)) {
    if (COURSE_PARAMS.includes(k)) out[k] = tOr(`content.course.${v}`, courses.find((c) => c.id === v)?.title ?? v)
    else if (k === 'task') { const [kind, id] = String(v).split(':'); out[k] = tOr(`content.${kind}.${id}.title`, id) }
    else if (k === 'exam') out[k] = tOr(`content.examTitle.${v}`, v)
    else if (SHORT_DATE_PARAMS.includes(k)) out[k] = fmtShort(v)
    else if (k === 'fullDate') out[k] = fmtDate(v)
    else if (k === 'room') out[k] = fmtRoom(v)
    else out[k] = v
  }
  return out
}

// Returns the notification with `title` and `text` rendered in the active language.
export function renderNote(n) {
  if (!n.titleKey) return n // free-text notification (kept as stored)
  const p = resolveNoteParams(n.params)
  return { ...n, title: tr(n.titleKey, p), text: tr(n.textKey, p) }
}
