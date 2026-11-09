import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { extOf } from '../utils/fileStore'
import { fmtSize } from '../utils/dates'
import { useI18n } from '../i18n/I18nProvider'

// accept: list of extensions without dot, e.g. ['pdf','docx']. Rejected files are reported, never silently dropped.
// `hint` must already be translated by the caller. Errors are kept as { key, p } so they re-translate when the language changes.
export default function FileDropzone({ accept, onFiles, maxSize = 25 * 1048576, hint, compact, disabled }) {
  const { t } = useI18n()
  const input = useRef(null)
  const [drag, setDrag] = useState(false)
  const [errors, setErrors] = useState([])
  const handle = (list) => {
    const ok = [], bad = []
    for (const f of Array.from(list)) {
      if (accept && !accept.includes(extOf(f.name))) bad.push({ key: 'file.err.type', p: { name: f.name, ext: extOf(f.name) || null } })
      else if (f.size > maxSize) bad.push({ key: 'file.err.size', p: { name: f.name, size: maxSize } })
      else if (f.size === 0) bad.push({ key: 'file.err.empty', p: { name: f.name } })
      else ok.push(f)
    }
    setErrors(bad)
    if (ok.length) onFiles(ok)
  }
  const errText = ({ key, p }) => t(key, { ...p, ext: p.ext ?? t('file.unknown'), size: p.size != null ? fmtSize(p.size) : undefined })
  return (
    <div>
      <div className={`dropzone ${drag ? 'drag' : ''} ${compact ? 'compact' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) handle(e.dataTransfer.files) }}>
        <UploadCloud size={compact ? 22 : 30} />
        <div><b>{t('file.drop')}</b><small>{t('file.limit', { hint: hint ?? (accept ? t('file.accepted', { list: accept.map((a) => a.toUpperCase()).join(', ') }) : t('file.anyType')), size: fmtSize(maxSize) })}</small></div>
        <button className="btn ghost" type="button" disabled={disabled} onClick={() => input.current?.click()}>{t('file.browse')}</button>
        <input ref={input} type="file" multiple hidden accept={accept?.map((a) => '.' + a).join(',')}
          onChange={(e) => { handle(e.target.files); e.target.value = '' }} />
      </div>
      {errors.length > 0 && <ul className="form-errors" role="alert">{errors.map((e) => <li key={e.p.name + e.key}>{errText(e)}</li>)}</ul>}
    </div>
  )
}
