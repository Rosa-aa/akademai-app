import { useState } from 'react'
import { Trash2, CheckCheck, Check, Undo2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import { Select, Segmented } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { NOTIFICATION_CATEGORIES } from '../data'
import { fmtDateTime } from '../utils/dates'
import { Link } from 'react-router-dom'

const catIcon = { Homework: 'ClipboardList', Midterms: 'FileCheck2', 'Exam schedule': 'CalendarClock', Evaluations: 'CheckCircle2', Grades: 'Award', 'Class schedule': 'CalendarDays' }
const catTone = { Homework: 'blue', Midterms: 'violet', 'Exam schedule': 'orange', Evaluations: 'green', Grades: 'amber', 'Class schedule': 'slate' }

export default function Notifications() {
  const { notifications, unread, markRead, markAllRead, removeNote } = useApp()
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const [cat, setCat] = useState('all')
  const list = notifications.filter((n) => (filter === 'all' || !n.read) && (cat === 'all' || n.category === cat)).sort((a, b) => b.at.localeCompare(a.at))
  return (
    <div className="page">
      <PageHeader title={t('nav.notifications')} subtitle={unread ? t('notif.unreadCount', { n: unread }) : t('notif.caughtUp')}>
        <button className="btn ghost" onClick={markAllRead} disabled={!unread}><CheckCheck size={16} /> {t('notif.markAllRead')}</button>
      </PageHeader>
      <section className="card">
        <div className="filters">
          <Segmented label={t('notif.filter')} value={filter} onChange={setFilter} options={[{ value: 'all', label: t('notif.all') }, { value: 'unread', label: t('notif.unreadN', { n: unread }) }]} />
          <Select label={t('notif.category')} value={cat} onChange={setCat} options={[{ value: 'all', label: t('notif.allCategories') }, ...NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: t(`cat.${c}`) }))]} />
        </div>
        {list.length === 0 ? <EmptyState icon="BellOff" title={filter === 'unread' ? t('notif.noUnread') : t('notif.none')} text={t('notif.emptyText')} action={<Link className="btn ghost" to="/settings">{t('notif.settingsLink')}</Link>} /> : (
          <ul className="notif-list">
            {list.map((n) => (
              <li key={n.id} className={n.read ? 'read' : 'unread'}>
                <span className={`ico t-${catTone[n.category]}`}><Icon name={catIcon[n.category]} size={18} /></span>
                <div className="grow">
                  <div className="notif-top"><b>{n.title}</b>{!n.read && <i className="unread-dot" aria-label={t('common.unread')} />}</div>
                  <p>{n.text}</p>
                  <small className="muted">{t(`cat.${n.category}`)}. {fmtDateTime(n.at)}</small>
                </div>
                <div className="notif-actions">
                  {n.read ? <button className="icon-btn" onClick={() => markRead(n.id, false)} aria-label={t('notif.markUnread')} title={t('notif.markUnread')}><Undo2 size={16} /></button>
                    : <button className="icon-btn" onClick={() => markRead(n.id)} aria-label={t('notif.markRead')} title={t('notif.markRead')}><Check size={16} /></button>}
                  <button className="icon-btn" onClick={() => removeNote(n.id)} aria-label={t('notif.delete')} title={t('common.delete')}><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
