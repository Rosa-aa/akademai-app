import { FileText, FileSpreadsheet, Presentation, File, Trash2, Download } from 'lucide-react'
import { extOf } from '../utils/fileStore'
import { fmtSize } from '../utils/dates'
import { useI18n } from '../i18n/I18nProvider'

const iconFor = (n) => { const e = extOf(n); return e === 'pdf' || e === 'doc' || e === 'docx' || e === 'txt' ? FileText : e === 'pptx' ? Presentation : e === 'xlsx' || e === 'csv' ? FileSpreadsheet : File }
export default function FileList({ files, onRemove, onDownload, renderExtra, disabled }) {
  const { t } = useI18n()
  if (!files.length) return null
  return (
    <ul className="file-list">
      {files.map((f) => {
        const I = iconFor(f.name)
        return (
          <li key={f.id}>
            <span className="ico t-violet"><I size={18} /></span>
            <span className="grow"><b title={f.name}>{f.name}</b><small>{(extOf(f.name) || t('file.generic')).toUpperCase()} · {fmtSize(f.size)}</small>{renderExtra?.(f)}</span>
            {onDownload && <button className="icon-btn" onClick={() => onDownload(f)} aria-label={t('file.download', { name: f.name })}><Download size={16} /></button>}
            {onRemove && !disabled && <button className="icon-btn" onClick={() => onRemove(f)} aria-label={t('file.remove', { name: f.name })}><Trash2 size={16} /></button>}
          </li>
        )
      })}
    </ul>
  )
}
