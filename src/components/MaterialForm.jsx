import { useMemo, useState } from 'react'
import { Loader2, FileText } from 'lucide-react'
import Modal from './Modal'
import FileDropzone from './FileDropzone'
import { useI18n } from '../i18n/I18nProvider'
import { CATEGORIES, MATERIAL_EXTS, MAX_FILE_SIZE, academicYears } from '../services/materials'
import { fmtSize } from '../utils/dates'

// Create (material = null) or edit a material. When editing, choosing a file replaces the stored one.
export default function MaterialForm({ material, catalog, onSave, onClose }) {
  const { t } = useI18n()
  const editing = !!material
  const years = useMemo(() => { const y = academicYears(); return material && !y.includes(material.academic_year) ? [material.academic_year, ...y] : y }, [material])
  const [f, setF] = useState(() => ({
    title: material?.title ?? '', description: material?.description ?? '', category: material?.category ?? 'lecture',
    subjectId: material?.subjectId ?? '', academicYear: material?.academic_year ?? years[2] ?? years[0], groupIds: material?.groups.map((g) => g.id) ?? [],
  }))
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const [failMsg, setFailMsg] = useState('')
  const set = (patch) => setF((p) => ({ ...p, ...patch }))

  const subject = catalog.subjects.find((s) => s.id === f.subjectId)
  const faculty = subject ? catalog.departments.find((d) => d.id === subject.department_id)?.faculty_id : null
  const groups = catalog.groups.filter((g) => !faculty || g.faculty_id === faculty)
  const deptName = (s) => catalog.departments.find((d) => d.id === s.department_id)?.name ?? ''
  const toggleGroup = (id) => set({ groupIds: f.groupIds.includes(id) ? f.groupIds.filter((x) => x !== id) : [...f.groupIds, id] })
  const pickSubject = (id) => {
    const s = catalog.subjects.find((x) => x.id === id), fac = s ? catalog.departments.find((d) => d.id === s.department_id)?.faculty_id : null
    set({ subjectId: id, groupIds: f.groupIds.filter((g) => !fac || catalog.groups.find((x) => x.id === g)?.faculty_id === fac) })
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = []
    if (!f.title.trim()) errs.push('materials.form.errTitle')
    if (!f.subjectId) errs.push('materials.form.errSubject')
    if (!editing && !file) errs.push('materials.form.errFile')
    setErrors(errs); setFailMsg('')
    if (errs.length) return
    setBusy(true)
    try { await onSave({ ...f, file }) } catch (er) { setFailMsg(t(`materials.err.${er.key ?? 'generic'}`) + (er.key === 'generic' && er.detail ? ` (${er.detail})` : '')); setBusy(false) }
  }

  return (
    <Modal title={editing ? t('materials.form.titleEdit') : t('materials.form.titleNew')} onClose={busy ? () => {} : onClose} wide>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field" style={{ gridColumn: '1 / -1' }}><span>{t('materials.form.title')}</span>
            <input type="text" value={f.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} required /></label>
          <label className="field" style={{ gridColumn: '1 / -1' }}><span>{t('materials.form.description')}</span>
            <textarea rows={3} maxLength={2000} value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder={t('materials.form.descriptionHint')} /></label>
          <label className="field"><span>{t('materials.form.category')}</span>
            <select value={f.category} onChange={(e) => set({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`materials.category.${c}`)}</option>)}</select></label>
          <label className="field"><span>{t('materials.form.year')}</span>
            <select value={f.academicYear} onChange={(e) => set({ academicYear: e.target.value })}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
          <label className="field" style={{ gridColumn: '1 / -1' }}><span>{t('materials.form.subject')}</span>
            <select value={f.subjectId} onChange={(e) => pickSubject(e.target.value)} required>
              <option value="">{t('materials.form.chooseSubject')}</option>
              {catalog.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''} — {deptName(s)}</option>)}
            </select></label>
        </div>
        <fieldset className="mat-fieldset"><legend>{t('materials.form.groups')}</legend>
          {groups.length === 0 ? <small className="muted">{t('materials.form.noGroups')}</small> : (
            <div className="chk-list">{groups.map((g) => <label key={g.id} className="check"><input type="checkbox" checked={f.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} /> {g.name}</label>)}</div>)}
          <small className="muted block" style={{ marginTop: 6 }}>{t('materials.form.groupsHint')}</small>
        </fieldset>
        <h4>{editing ? t('materials.form.replaceFile') : t('materials.form.file')}</h4>
        {editing && <p className="small-note" style={{ marginTop: 0 }}><FileText size={14} style={{ verticalAlign: '-2px' }} /> {t('materials.form.current', { name: material.file_name, size: fmtSize(material.file_size) })}</p>}
        <FileDropzone accept={MATERIAL_EXTS} maxSize={MAX_FILE_SIZE} compact={editing} onFiles={(l) => setFile(l[0])} disabled={busy} />
        {file && <p className="form-ok" style={{ marginTop: 8 }}>{t('materials.form.selected', { name: file.name, size: fmtSize(file.size) })}</p>}
        {errors.length > 0 && <ul className="form-errors" role="alert">{errors.map((k) => <li key={k}>{t(k)}</li>)}</ul>}
        {failMsg && <p className="form-bad" role="alert">{failMsg}</p>}
        <div className="modal-actions">
          <button className="btn" type="submit" disabled={busy}>{busy && <Loader2 size={16} className="spin" />}{busy ? t('materials.form.saving') : t('materials.form.save')}</button>
          <button className="btn ghost" type="button" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
        </div>
      </form>
    </Modal>
  )
}
