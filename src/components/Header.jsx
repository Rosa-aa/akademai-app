import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import LanguageSwitcher from './LanguageSwitcher'
import { fmtShort } from '../utils/dates'

export default function Header({ onMenu }) {
  const { profile, assignments, studies, exams, courses, unread } = useApp()
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const box = useRef(null)
  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setQ('') }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  const results = useMemo(() => {
    const s = q.trim().toLowerCase(); if (!s) return []
    const m = (x) => x.toLowerCase().includes(s)
    return [
      ...courses.filter((c) => m(c.title) || m(c.instructor)).map((c) => ({ key: c.id, label: c.title, hint: c.instructor, to: `/assignments?course=${c.id}` })),
      ...assignments.filter((a) => m(a.title)).map((a) => ({ key: a.id, label: a.title, hint: t('header.hintAssignment'), to: `/assignments?open=${a.id}` })),
      ...studies.filter((a) => m(a.title)).map((a) => ({ key: a.id, label: a.title, hint: t('header.hintStudy'), to: `/independent-studies?open=${a.id}` })),
      ...exams.filter((e) => m(e.courseTitle) || m(e.title)).slice(0, 4).map((e) => ({ key: e.id, label: `${e.courseTitle}: ${e.title}`, hint: fmtShort(e.date), to: '/exams' })),
    ].slice(0, 8)
  }, [q, assignments, studies, exams, courses, t])
  const go = (to) => { setQ(''); nav(to) }
  const initials = (profile.firstName[0] ?? '') + (profile.lastName[0] ?? '')

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label={t('header.openMenu')}><Menu size={22} /></button>
      <div className="search" ref={box}>
        <Search size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('header.searchPlaceholder')} aria-label={t('header.search')} />
        {q.trim() && (
          <ul className="search-pop">
            {results.length === 0 && <li className="empty">{t('header.noResults', { q })}</li>}
            {results.map((r) => <li key={r.key}><button onClick={() => go(r.to)}>{r.label}<small>{r.hint}</small></button></li>)}
          </ul>
        )}
      </div>
      <LanguageSwitcher />
      <button className="icon-btn bell" onClick={() => nav('/notifications')} aria-label={t('header.notifications', { n: unread })}>
        <Bell size={22} />{unread > 0 && <i>{unread}</i>}
      </button>
      <button className="profile" onClick={() => nav('/settings')} aria-label={t('header.openSettings')}>
        <span className="avatar">{initials}</span>
        <span className="who"><b>{profile.firstName} {profile.lastName}</b><small>{t('header.student')}</small></span>
      </button>
    </header>
  )
}
