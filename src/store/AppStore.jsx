import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { student, assignments as baseAssignments, studies as baseStudies, exams as baseExams, attendance,
  notificationTemplates, defaultPrefs } from '../data'
import { load, save, clearAll } from '../utils/storage'
import { mergeTask, mergeExam, courseReport, avg, localizedCourses } from '../utils/academics'
import { putRecord, deleteRecord, clearFiles, newId } from '../utils/fileStore'
import { TODAY } from '../utils/dates'
import { renderNote } from '../utils/notifications'
import { migrateProfile } from '../utils/migrations'
import { useI18n } from '../i18n/I18nProvider'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

function usePersist(key, initial, migrate = (x) => x) {
  const [v, setV] = useState(() => migrate(load(key, initial)))
  useEffect(() => save(key, v), [key, v])
  return [v, setV]
}

// Notification templates that were saved before notifications became translatable only hold English text:
// attach the text keys again (matched by id) so they follow the selected language too.
const templateById = Object.fromEntries(notificationTemplates.map((n) => [n.id, n]))
const withKeys = (n) => (!n.titleKey && templateById[n.id] ? { ...n, titleKey: templateById[n.id].titleKey, textKey: templateById[n.id].textKey, params: templateById[n.id].params } : n)

export function AppProvider({ children }) {
  const { lang } = useI18n()
  const [profile, setProfile] = usePersist('profile', { firstName: student.firstName, lastName: student.lastName, email: student.email, group: student.group }, migrateProfile)
  const [prefs, setPrefsState] = usePersist('prefs', defaultPrefs)
  const [tasks, setTasks] = usePersist('tasks', {})
  const [rawNotes, setNotes] = usePersist('notifications', notificationTemplates)

  const mergedPrefs = useMemo(() => ({ ...defaultPrefs, ...prefs, notify: { ...defaultPrefs.notify, ...prefs.notify } }), [prefs])
  const setPrefs = useCallback((patch) => setPrefsState((p) => ({ ...p, ...patch })), [setPrefsState])

  // Apply appearance preferences to <html>.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mergedPrefs.theme === 'dark' || (mergedPrefs.theme === 'system' && mq?.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply(); mq?.addEventListener?.('change', apply)
    document.documentElement.dataset.density = mergedPrefs.density
    return () => mq?.removeEventListener?.('change', apply)
  }, [mergedPrefs.theme, mergedPrefs.density])

  // ---- tasks (assignments + independent studies)
  const updateTask = useCallback((key, patch) => setTasks((t) => ({ ...t, [key]: { ...t[key], ...patch } })), [setTasks])

  const addNote = useCallback((n) => setNotes((l) => [{ id: newId(), read: false, at: new Date().toISOString(), ...n }, ...l]), [setNotes])

  const addTaskFiles = useCallback(async (key, files) => {
    const metas = []
    for (const f of files) {
      const id = newId()
      await putRecord(id, { blob: f })
      metas.push({ id, name: f.name, size: f.size, type: f.type, addedAt: new Date().toISOString() })
    }
    setTasks((t) => ({ ...t, [key]: { ...t[key], files: [...(t[key]?.files ?? []), ...metas] } }))
  }, [setTasks])

  const removeTaskFile = useCallback((key, fileId) => {
    deleteRecord(fileId)
    setTasks((t) => ({ ...t, [key]: { ...t[key], files: (t[key]?.files ?? []).filter((f) => f.id !== fileId) } }))
  }, [setTasks])

  // ---- derived data (single source for every page)
  // Texts come from the translation files, so these lists are rebuilt when the language changes.
  const courses = useMemo(() => localizedCourses(), [lang])
  const assignments = useMemo(() => baseAssignments.map((a) => mergeTask(a, 'assignment', tasks[`assignment:${a.id}`])), [tasks, lang])
  const studies = useMemo(() => baseStudies.map((a) => mergeTask(a, 'study', tasks[`study:${a.id}`])), [tasks, lang])
  const exams = useMemo(() => baseExams.map((e) => mergeExam(e)), [lang])
  const reports = useMemo(() => courses.map((c) => courseReport(c, { assignments, studies, exams, attendance })), [courses, assignments, studies, exams])
  const overall = useMemo(() => avg(reports.filter((r) => r.finalGrade != null).map((r) => r.finalGrade)), [reports])

  // ---- notifications (respect per-category preferences)
  const notes = useMemo(() => rawNotes.map(withKeys), [rawNotes])
  const notifications = useMemo(() => notes.filter((n) => mergedPrefs.notify[n.category] !== false).map(renderNote), [notes, mergedPrefs.notify, lang])
  const unread = notifications.filter((n) => !n.read).length
  const markRead = (id, read = true) => setNotes((l) => l.map((n) => (n.id === id ? { ...n, read } : n)))
  const markAllRead = () => setNotes((l) => l.map((n) => (mergedPrefs.notify[n.category] !== false ? { ...n, read: true } : n)))
  const removeNote = (id) => setNotes((l) => l.filter((n) => n.id !== id))

  const resetDemo = async () => { clearAll(); await clearFiles(); save('lang', lang); window.location.assign('/') } // the chosen language is kept

  const value = {
    today: TODAY, profile, setProfile, prefs: mergedPrefs, setPrefs, tasks, updateTask, addTaskFiles, removeTaskFile,
    assignments, studies, exams, reports, overall, courses, attendance,
    notifications, unread, markRead, markAllRead, removeNote, addNote, resetDemo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
