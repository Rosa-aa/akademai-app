import Modal from './Modal'
import Badge from './Badge'
import { fmtLong, relDays } from '../utils/dates'
import { fmtRoom } from '../utils/format'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'

export default function ExamModal({ exam, onClose }) {
  const { today } = useApp()
  const { t } = useI18n()
  if (!exam) return null
  return (
    <Modal title={`${exam.courseTitle}: ${exam.title}`} onClose={onClose}>
      <div className="detail-top"><Badge>{exam.status}</Badge><Badge>{exam.type}</Badge>
        {exam.status !== 'Completed' && <span className="muted">{relDays(exam.date, today)}</span>}</div>
      <dl className="meta-grid">
        <div><dt>{t('exam.course')}</dt><dd><i className="dot" style={{ background: exam.color }} />{exam.courseTitle}</dd></div>
        <div><dt>{t('exam.instructor')}</dt><dd>{exam.instructor}</dd></div>
        <div><dt>{t('exam.date')}</dt><dd>{fmtLong(exam.date)}</dd></div>
        <div><dt>{t('exam.time')}</dt><dd>{exam.start} – {exam.end}</dd></div>
        <div><dt>{t('exam.classroom')}</dt><dd>{fmtRoom(exam.room)}</dd></div>
        <div><dt>{t('exam.result')}</dt><dd>{exam.score != null ? <b>{exam.score} / 100</b> : exam.status === 'Completed' ? t('exam.awaiting') : t('exam.notTaken')}</dd></div>
      </dl>
      {exam.note && <p className="note-box">{exam.note}</p>}
    </Modal>
  )
}
