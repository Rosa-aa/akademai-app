import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Upload, Eye, Download, Pencil, Trash2, LogOut, Loader2, FileText, Presentation, File as FileIcon, FolderOpen, DatabaseZap, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import MaterialForm from '../components/MaterialForm'
import MaterialPreview from '../components/MaterialPreview'
import MaterialsAuth from '../components/MaterialsAuth'
import { AuthProvider, useAuth } from '../store/AuthStore'
import { useI18n } from '../i18n/I18nProvider'
import { CATEGORIES, fetchCatalog, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, downloadMaterial, installSamples } from '../services/materials'
import { fmtDate, fmtSize } from '../utils/dates'
import { lower } from '../i18n'

const ICON = { pdf: FileText, doc: FileText, docx: FileText, ppt: Presentation, pptx: Presentation }
const TONE = { syllabus: 'violet', lecture: 'blue', presentation: 'amber', seminar: 'green', exam_prep: 'red', other: 'slate' }
const GROUP_BY = ['subject', 'faculty', 'department', 'year', 'group', 'teacher', 'none']
const uniq = (items, id, label) => [...new Map(items.filter((x) => id(x)).map((x) => [id(x), label(x)])).entries()].map(([value, text]) => ({ value, label: text })).sort((a, b) => String(a.label).localeCompare(String(b.label)))

export default function Materials() { return <AuthProvider><Gate /></AuthProvider> }

function Gate() {
  const { t } = useI18n()
  const auth = useAuth()
  const head = <PageHeader title={t('nav.materials')} subtitle={t('materials.subtitle')} />
  if (!auth.configured) return <div className="page">{head}<SetupCard /></div>
  if (auth.loading) return <div className="page">{head}<div className="card empty-state"><Loader2 className="spin" /> {t('common.loading')}</div></div>
  if (!auth.user) return <div className="page">{head}<MaterialsAuth /></div>
  if (!auth.profile) return (
    <div className="page">{head}
      <div className="card empty-state"><b>{t('materials.noProfile.title')}</b><p>{t('materials.noProfile.text')}</p><button className="btn ghost" onClick={auth.signOut}>{t('materials.account.signOut')}</button></div>
    </div>)
  return <Browser head={head} />
}

function SetupCard() {
  const { t } = useI18n()
  return (
    <section className="card">
      <div className="detail-top"><DatabaseZap size={22} /><h3>{t('materials.setup.title')}</h3></div>
      <p className="desc">{t('materials.setup.text')}</p>
      <ol className="setup-steps">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`materials.setup.step${n}`)}</li>)}</ol>
      <pre className="env-box">VITE_SUPABASE_URL=https://xxxx.supabase.co{'\n'}VITE_SUPABASE_ANON_KEY=eyJ…</pre>
      <p className="small-note">{t('materials.setup.doc')}</p>
    </section>
  )
}

function Browser({ head }) {
  const { t, lang } = useI18n()
  const { user, profile, role, signOut } = useAuth()
  const [catalog, setCatalog] = useState(null)
  const [items, setItems] = useState(null)
  const [loadErr, setLoadErr] = useState(null)
  const [notice, setNotice] = useState(null) // { ok, text }
  const [form, setForm] = useState(null)     // 'new' | material
  const [preview, setPreview] = useState(null)
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [flt, setFlt] = useState({ faculty: 'all', department: 'all', year: 'all', group: 'all', subject: 'all', teacher: 'all', category: 'all' })
  const [mine, setMine] = useState(false)
  const [groupBy, setGroupBy] = useState('subject')
  const canUpload = role === 'teacher' || role === 'admin'
  const canManage = (m) => role === 'admin' || (role === 'teacher' && m.teacher_id === user.id)
  const errText = (e) => t(`materials.err.${e.key ?? 'generic'}`) + (e.key === 'generic' && e.detail ? ` (${e.detail})` : '')
  const say = (ok, text) => setNotice({ ok, text })

  const load = useCallback(async () => {
    setLoadErr(null)
    try { const [c, m] = await Promise.all([fetchCatalog(), fetchMaterials()]); setCatalog(c); setItems(m) } catch (e) { setLoadErr(e) }
  }, [])
  useEffect(() => { load() }, [load])

  const options = useMemo(() => {
    const m = items ?? []
    return {
      faculty: uniq(m, (x) => x.facultyId, (x) => x.facultyName), department: uniq(m, (x) => x.departmentId, (x) => x.departmentName),
      year: uniq(m, (x) => x.academic_year, (x) => x.academic_year), subject: uniq(m, (x) => x.subjectId, (x) => x.subjectName),
      teacher: uniq(m, (x) => x.teacher_id, (x) => x.teacherName), group: uniq(m.flatMap((x) => x.groups), (g) => g.id, (g) => g.name),
    }
  }, [items])

  const list = useMemo(() => {
    const s = lower(q.trim())
    return (items ?? []).filter((m) =>
      (flt.faculty === 'all' || m.facultyId === flt.faculty) && (flt.department === 'all' || m.departmentId === flt.department) && (flt.year === 'all' || m.academic_year === flt.year)
      && (flt.subject === 'all' || m.subjectId === flt.subject) && (flt.teacher === 'all' || m.teacher_id === flt.teacher) && (flt.category === 'all' || m.category === flt.category)
      && (flt.group === 'all' || m.groups.some((g) => g.id === flt.group)) && (!mine || !profile.study_group_id || m.groups.some((g) => g.id === profile.study_group_id))
      && (!s || lower([m.title, m.description, m.file_name, m.subjectName, m.teacherName, m.groups.map((g) => g.name).join(' ')].join(' ')).includes(s)))
  }, [items, q, flt, mine, profile.study_group_id])

  const sections = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: null, items: list }]
    const keys = { subject: (m) => [m.subjectName], faculty: (m) => [m.facultyName], department: (m) => [m.departmentName], year: (m) => [m.academic_year], teacher: (m) => [m.teacherName],
      group: (m) => (m.groups.length ? m.groups.map((g) => g.name) : [t('materials.noGroup')]) }[groupBy]
    const map = new Map()
    for (const m of list) for (const k of keys(m)) map.set(k, [...(map.get(k) ?? []), m])
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], lang)).map(([label, its]) => ({ key: label, label, items: its }))
  }, [list, groupBy, lang, t])

  const hasFilter = q || mine || Object.values(flt).some((v) => v !== 'all')
  const reset = () => { setQ(''); setMine(false); setFlt({ faculty: 'all', department: 'all', year: 'all', group: 'all', subject: 'all', teacher: 'all', category: 'all' }) }

  const save = async (v) => {
    const base = { title: v.title, description: v.description, category: v.category, subjectId: v.subjectId, academicYear: v.academicYear, groupIds: v.groupIds }
    if (form === 'new') await createMaterial({ ...base, file: v.file, teacherId: user.id })
    else await updateMaterial(form, { ...base, file: v.file })
    const wasNew = form === 'new'
    setForm(null); say(true, t(wasNew ? 'materials.msg.created' : 'materials.msg.updated')); await load()
  }
  const confirmDelete = async () => {
    setBusy(true)
    try { await deleteMaterial(del); setDel(null); say(true, t('materials.msg.deleted')); await load() } catch (e) { setDel(null); say(false, errText(e)) } finally { setBusy(false) }
  }
  const download = (m) => downloadMaterial(m).catch((e) => say(false, errText(e)))
  const samples = async () => {
    setBusy(true); setNotice(null)
    try { const n = await installSamples({ catalog, teacherId: user.id, existing: items }); say(true, t('materials.msg.samples', { n })); await load() } catch (e) { say(false, errText(e)) } finally { setBusy(false) }
  }

  const sel = (k, label, opts) => (
    <label className="field"><span>{label}</span>
      <select value={flt[k]} onChange={(e) => setFlt((f) => ({ ...f, [k]: e.target.value }))}>
        <option value="all">{t('materials.filters.all')}</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select></label>)

  return (
    <div className="page">
      <PageHeader title={t('nav.materials')} subtitle={t('materials.subtitle')}>
        {canUpload && catalog && <button className="btn" onClick={() => setForm('new')}><Upload size={16} /> {t('materials.upload')}</button>}
      </PageHeader>

      <div className="mat-account">
        <span className="avatar sm">{(profile.full_name || user.email || '?').trim()[0]?.toUpperCase()}</span>
        <span className="grow"><b>{profile.full_name || user.email}</b><small className="muted block">{user.email}</small></span>
        <Badge tone={role === 'admin' ? 'red' : role === 'teacher' ? 'violet' : 'blue'}>{t(`materials.roles.${role}`)}</Badge>
        <button className="btn ghost sm" onClick={signOut}><LogOut size={15} /> {t('materials.account.signOut')}</button>
      </div>

      {notice && <p className={notice.ok ? 'form-ok' : 'form-bad'} role="status" style={{ margin: 0 }}>{notice.text}</p>}

      {loadErr && (
        <div className="card empty-state"><b>{t('materials.err.load')}</b><p>{t(`materials.err.${loadErr.key ?? 'generic'}`)}{loadErr.detail ? ` (${loadErr.detail})` : ''}</p>
          <button className="btn ghost" onClick={load}><RefreshCw size={15} /> {t('materials.retry')}</button></div>)}
      {!loadErr && !items && <div className="card empty-state"><Loader2 className="spin" /> {t('common.loading')}</div>}

      {items && (
        <>
          <section className="card">
            <div className="mat-search"><Search size={18} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('materials.filters.searchPlaceholder')} aria-label={t('materials.filters.search')} /></div>
            <div className="mat-filters">
              {sel('faculty', t('materials.filters.faculty'), options.faculty)}
              {sel('department', t('materials.filters.department'), options.department)}
              {sel('year', t('materials.filters.year'), options.year)}
              {sel('group', t('materials.filters.group'), options.group)}
              {sel('subject', t('materials.filters.subject'), options.subject)}
              {sel('teacher', t('materials.filters.teacher'), options.teacher)}
              {sel('category', t('materials.filters.category'), CATEGORIES.map((c) => ({ value: c, label: t(`materials.category.${c}`) })))}
              <label className="field"><span>{t('materials.filters.groupBy')}</span>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>{GROUP_BY.map((g) => <option key={g} value={g}>{t(`materials.groupBy.${g}`)}</option>)}</select></label>
            </div>
            <div className="mat-filter-foot">
              {role === 'student' && profile.study_group_id && <label className="check"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> {t('materials.filters.myGroup')}</label>}
              <small className="muted count">{t('common.countOf', { n: list.length, total: items.length })}</small>
              {hasFilter && <button className="btn ghost sm" onClick={reset}>{t('common.clearFilters')}</button>}
            </div>
          </section>

          {items.length === 0 ? (
            <section className="card"><EmptyState icon="FolderOpen" title={t('materials.empty.title')} text={canUpload ? t('materials.empty.teacher') : t('materials.empty.student')}
              action={canUpload ? <button className="btn" onClick={samples} disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : <FolderOpen size={16} />}{busy ? t('materials.empty.installing') : t('materials.empty.samples')}</button> : null} /></section>
          ) : list.length === 0 ? (
            <section className="card"><EmptyState icon="SearchX" title={t('materials.empty.noMatch')} text={t('common.widenFilters')} action={<button className="btn ghost" onClick={reset}>{t('common.clearFilters')}</button>} /></section>
          ) : sections.map((s) => (
            <section key={s.key}>
              {s.label && <h2 className="section-title">{s.label}<small>{s.items.length}</small></h2>}
              <div className="mat-grid">
                {s.items.map((m) => {
                  const I = ICON[m.file_ext] ?? FileIcon
                  return (
                    <article key={`${s.key}:${m.id}`} className="card mat-card">
                      <div className="mat-top">
                        <span className={`ico t-${TONE[m.category] ?? 'slate'}`}><I size={20} /></span>
                        <div className="grow"><h3 title={m.title}>{m.title}</h3><small className="muted">{m.subjectName}</small></div>
                      </div>
                      <div className="mat-badges"><Badge tone={TONE[m.category]}>{t(`materials.category.${m.category}`)}</Badge>{m.is_sample && <Badge tone="amber">{t('materials.sample')}</Badge>}
                        {m.groups.map((g) => <Badge key={g.id} tone="slate">{g.name}</Badge>)}</div>
                      {m.description && <p className="mat-desc">{m.description}</p>}
                      <ul className="mat-meta">
                        <li><b>{t('materials.card.teacher')}:</b> {m.teacherName}</li>
                        <li><b>{t('materials.info.department')}:</b> {m.departmentName}</li>
                        <li>{m.academic_year} · {(m.file_ext || '').toUpperCase()} · {fmtSize(m.file_size)} · {fmtDate(m.created_at.slice(0, 10))}</li>
                      </ul>
                      <div className="mat-actions">
                        <button className="btn sm" onClick={() => setPreview(m)}><Eye size={15} /> {t('materials.card.preview')}</button>
                        <button className="btn ghost sm" onClick={() => download(m)}><Download size={15} /> {t('materials.card.download')}</button>
                        <span className="grow" />
                        {canManage(m) && <>
                          <button className="icon-btn" onClick={() => setForm(m)} aria-label={t('materials.card.edit', { name: m.title })} title={t('materials.card.editShort')}><Pencil size={16} /></button>
                          <button className="icon-btn" onClick={() => setDel(m)} aria-label={t('materials.card.delete', { name: m.title })} title={t('common.delete')}><Trash2 size={16} /></button></>}
                      </div>
                    </article>)
                })}
              </div>
            </section>
          ))}
        </>
      )}

      {form && catalog && <MaterialForm material={form === 'new' ? null : form} catalog={catalog} onSave={save} onClose={() => setForm(null)} />}
      {preview && <MaterialPreview material={preview} onClose={() => setPreview(null)} onError={(e) => say(false, errText(e))} />}
      {del && (
        <Modal title={t('materials.delete.title')} onClose={() => setDel(null)}>
          <p className="desc">{t('materials.delete.text', { name: del.title })}</p>
          <div className="modal-actions">
            <button className="btn danger" onClick={confirmDelete} disabled={busy}>{busy && <Loader2 size={16} className="spin" />}{t('common.delete')}</button>
            <button className="btn ghost" onClick={() => setDel(null)} disabled={busy}>{t('common.cancel')}</button>
          </div>
        </Modal>)}
    </div>
  )
}
