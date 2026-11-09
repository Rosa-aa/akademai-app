import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from './Modal'
import Badge from './Badge'
import FileDropzone from './FileDropzone'
import FileList from './FileList'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { downloadFile } from '../utils/fileStore'
import { fmtDate, relDays } from '../utils/dates'

// Shared detail view for assignments and independent studies.
export default function TaskModal({ taskKey, onClose }) {
  const { assignments, studies, updateTask, addTaskFiles, removeTaskFile, addNote, today } = useApp()
  const { t } = useI18n()
  const task = [...assignments, ...studies].find((x) => x.key === taskKey)
  const [text, setText] = useState(task?.text ?? '')
  const [msg, setMsg] = useState(null) // { ok, k } where k is a translation key, so the message follows the language
  if (!task) return null
  const isStudy = task.kind === 'study'
  const graded = task.grade != null
  const done = task.status === 'Completed'
  const locked = graded

  const saveDraft = () => { updateTask(task.key, { text }); setMsg({ ok: true, k: 'task.draftSaved' }) }
  const submit = () => {
    if (!text.trim() && task.files.length === 0) return setMsg({ ok: false, k: isStudy ? 'task.needStudy' : 'task.needAssignment' })
    updateTask(task.key, { text, status: 'Completed', submittedAt: today })
    // Stored as keys + ids (not text), so the notification is shown in whichever language is active later.
    addNote({ category: 'Homework', titleKey: 'notif.tpl.submitted.title', textKey: task.due < today ? 'notif.tpl.submitted.textLate' : 'notif.tpl.submitted.text',
      params: { task: task.key, course: task.courseId, fullDate: today } })
    setMsg({ ok: true, k: 'task.submitted' })
  }
  const reopen = () => { updateTask(task.key, { status: 'In Progress', submittedAt: null }); setMsg({ ok: true, k: 'task.reopened' }) }
  const setStatus = (s) => updateTask(task.key, { status: s })

  return (
    <Modal title={task.title} onClose={onClose} wide>
      <div className="detail-top">
        <Badge>{task.status}</Badge>
        {task.late && <Badge tone="orange">{t('task.late')}</Badge>}
        <span className="muted">{isStudy ? t('task.kindStudy') : t('task.kindAssignment')}</span>
      </div>
      <dl className="meta-grid">
        <div><dt>{t('exam.course')}</dt><dd><i className="dot" style={{ background: task.color }} />{task.courseTitle}</dd></div>
        <div><dt>{t('exam.instructor')}</dt><dd>{task.instructor}</dd></div>
        <div><dt>{t('task.assigned')}</dt><dd>{fmtDate(task.assigned)}</dd></div>
        <div><dt>{t('task.deadline')}</dt><dd>{fmtDate(task.due)}{!done && <small className={task.daysLeft < 0 ? 'bad' : 'muted'}> {relDays(task.due, today)}</small>}</dd></div>
        <div><dt>{t('task.grade')}</dt><dd>{graded ? <b>{task.grade} / 100</b> : done ? t('task.awaitingEval') : t('task.notEvaluated')}</dd></div>
        {done && <div><dt>{t('task.submittedOn')}</dt><dd>{fmtDate(task.submittedAt)}</dd></div>}
      </dl>
      <h4>{t('task.description')}</h4>
      <p className="desc">{task.description}</p>

      {!locked && !done && (
        <div className="status-row">
          <span>{t('task.progress')}</span>
          <div className="seg">
            {['New', 'In Progress'].map((s) => <button key={s} className={task.storedStatus === s ? 'on' : ''} onClick={() => setStatus(s)}>{t(`status.${s}`)}</button>)}
          </div>
          {task.status === 'Overdue' && <small className="bad">{t('task.pastDeadline')}</small>}
        </div>
      )}

      <h4>{isStudy ? t('task.yourWork') : t('task.yourSubmission')}</h4>
      <label className="field">
        <span>{isStudy ? t('task.notesLabel') : t('task.answerLabel')}</span>
        <textarea rows={4} value={text} disabled={locked || done} onChange={(e) => setText(e.target.value)} placeholder={done ? '' : t('task.typeHere')} />
      </label>
      {!locked && !done && <FileDropzone compact hint={t('task.uploadHint')} onFiles={(f) => addTaskFiles(task.key, f)} />}
      <FileList files={task.files} onDownload={(f) => downloadFile(f.id, f.name)} onRemove={(f) => removeTaskFile(task.key, f.id)} disabled={locked || done} />
      {msg && <p className={msg.ok ? 'form-ok' : 'form-bad'} role="status">{t(msg.k)}</p>}

      <div className="modal-actions">
        <Link className="btn ghost" to={`/assignments?course=${task.courseId}`} onClick={onClose}>{t('task.moreFromCourse')}</Link>
        <span className="grow" />
        {!locked && !done && <><button className="btn ghost" onClick={saveDraft}>{t('task.saveDraft')}</button><button className="btn" onClick={submit}>{t('task.submit')}</button></>}
        {!locked && done && <button className="btn ghost" onClick={reopen}>{t('task.reopen')}</button>}
        {locked && <small className="muted">{t('task.locked')}</small>}
      </div>
    </Modal>
  )
}
