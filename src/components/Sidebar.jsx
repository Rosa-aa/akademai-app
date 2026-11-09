import { useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { GraduationCap, X } from 'lucide-react'
import Icon from './Icon'
import { useI18n } from '../i18n/I18nProvider'

// `key` is the translation key of the menu label.
export const navItems = [
  { to: '/', key: 'nav.dashboard', icon: 'LayoutDashboard' },
  { to: '/classes', key: 'nav.classes', icon: 'CalendarDays' },
  { to: '/materials', key: 'nav.materials', icon: 'Library' },
  { to: '/assignments', key: 'nav.assignments', icon: 'ClipboardList' },
  { to: '/midterms', key: 'nav.midterms', icon: 'FileCheck2' },
  { to: '/exams', key: 'nav.exams', icon: 'ClipboardCheck' },
  { to: '/independent-studies', key: 'nav.studies', icon: 'PenLine' },
  { to: '/grades', key: 'nav.grades', icon: 'Award' },
  { to: '/ai-teacher', key: 'nav.ai', icon: 'Bot' },
  { to: '/notifications', key: 'nav.notifications', icon: 'Bell' },
  { to: '/settings', key: 'nav.settings', icon: 'Settings' },
]

export default function Sidebar({ open, onClose, unread }) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label={t('sidebar.mainNav')}>
        <div className="brand-row">
          <Link to="/" className="brand" onClick={onClose}>
            <GraduationCap size={34} strokeWidth={1.7} />
            <span><b>Akadem<i>AI</i></b><small>{t('brand.tagline')}</small></span>
          </Link>
          <button className="icon-btn side-close" onClick={onClose} aria-label={t('sidebar.closeMenu')}><X size={20} /></button>
        </div>
        <nav>
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon name={n.icon} size={19} /><span>{t(n.key)}</span>
              {n.to === '/notifications' && unread > 0 && <em className="nav-badge">{unread}</em>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
