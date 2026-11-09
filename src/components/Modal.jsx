import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
export default function Modal({ title, onClose, children, wide, xl }) {
  const { t } = useI18n()
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; prev?.focus?.() }
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''} ${xl ? 'xl' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label={t('common.close')}><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
