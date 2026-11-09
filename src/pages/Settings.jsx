import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { Select, Segmented } from '../components/Filters'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { tOr } from '../i18n'
import { weekdayLong } from '../utils/dates'
import { student, NOTIFICATION_CATEGORIES } from '../data'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span className="grow"><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

export default function Settings() {
  const { profile, setProfile, prefs, setPrefs, resetDemo } = useApp()
  const { t, lang, setLang, languages } = useI18n()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null) // { ok, k } with a translation key
  const [confirmReset, setConfirmReset] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(profile)
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSaved(false) }

  const saveProfile = (e) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) return setSaved('error')
    setProfile({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() }); setSaved(true)
  }
  const changePw = (e) => {
    e.preventDefault()
    if (!pw.current) return setPwMsg({ ok: false, k: 'settings.pw.enterCurrent' })
    if (pw.next.length < 8) return setPwMsg({ ok: false, k: 'settings.pw.tooShort' })
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, k: 'settings.pw.mismatch' })
    setPw({ current: '', next: '', confirm: '' })
    setPwMsg({ ok: true, k: 'settings.pw.ok' })
  }

  return (
    <div className="page narrow">
      <PageHeader title={t('nav.settings')} subtitle={t('settings.subtitle')} />

      <form className="card" onSubmit={saveProfile}>
        <div className="card-head"><h3>{t('settings.profile')}</h3></div>
        <div className="form-grid">
          <label className="field"><span>{t('settings.firstName')}</span><input value={form.firstName} onChange={set('firstName')} required /></label>
          <label className="field"><span>{t('settings.lastName')}</span><input value={form.lastName} onChange={set('lastName')} required /></label>
          <label className="field"><span>{t('settings.email')}</span><input type="email" value={form.email} onChange={set('email')} /></label>
          <label className="field"><span>{t('settings.group')}</span><input value={form.group} onChange={set('group')} /></label>
        </div>
        <h4>{t('settings.academic')}</h4>
        <dl className="meta-grid">
          {[['studentId', student.studentId], ['faculty', tOr('content.student.faculty', student.faculty)], ['program', tOr('content.student.program', student.program)], ['year', tOr('content.student.year', student.year)], ['semester', tOr('content.student.semester', student.semester)], ['advisor', student.advisor], ['enrolled', student.enrolled]].map(([k, v]) => <div key={k}><dt>{t(`settings.info.${k}`)}</dt><dd>{v}</dd></div>)}
        </dl>
        <p className="muted small-note">{t('settings.academicNote')}</p>
        <div className="modal-actions">
          {saved === true && <span className="form-ok">{t('settings.saved')}</span>}
          {saved === 'error' && <span className="form-bad">{t('settings.nameRequired')}</span>}
          <span className="grow" />
          <button type="button" className="btn ghost" disabled={!dirty} onClick={() => { setForm(profile); setSaved(false) }}>{t('settings.discard')}</button>
          <button className="btn" disabled={!dirty}>{t('settings.saveProfile')}</button>
        </div>
      </form>

      <section className="card">
        <div className="card-head"><h3>{t('nav.notifications')}</h3></div>
        <p className="muted small-note">{t('settings.notifNote')}</p>
        {NOTIFICATION_CATEGORIES.map((c) => <Toggle key={c} label={t(`cat.${c}`)} checked={prefs.notify[c] !== false} onChange={(v) => setPrefs({ notify: { ...prefs.notify, [c]: v } })} />)}
        <Toggle label={t('settings.digest')} hint={t('settings.digestHint')} checked={prefs.emailDigest} onChange={(v) => setPrefs({ emailDigest: v })} />
      </section>

      <section className="card">
        <div className="card-head"><h3>{t('settings.appearance')}</h3></div>
        <div className="pref-grid">
          <div><span className="lbl">{t('settings.theme')}</span><Segmented label={t('settings.theme')} value={prefs.theme} onChange={(v) => setPrefs({ theme: v })} options={[{ value: 'light', label: t('settings.themeLight') }, { value: 'dark', label: t('settings.themeDark') }, { value: 'system', label: t('settings.themeSystem') }]} /></div>
          <div><span className="lbl">{t('settings.density')}</span><Segmented label={t('settings.density')} value={prefs.density} onChange={(v) => setPrefs({ density: v })} options={[{ value: 'comfortable', label: t('settings.comfortable') }, { value: 'compact', label: t('settings.compact') }]} /></div>
          <Select label={t('settings.weekStart')} value={String(prefs.weekStart)} onChange={(v) => setPrefs({ weekStart: Number(v) })} options={[{ value: '1', label: weekdayLong(1) }, { value: '0', label: weekdayLong(0) }]} />
          <Select label={t('settings.calendarView')} value={prefs.calendarView} onChange={(v) => setPrefs({ calendarView: v })} options={[{ value: 'day', label: t('cal.day') }, { value: 'week', label: t('cal.week') }, { value: 'month', label: t('cal.month') }]} />
          <Select label={t('settings.language')} value={lang} onChange={setLang} options={languages.map((l) => ({ value: l.code, label: l.label }))} />
        </div>
      </section>

      <form className="card" onSubmit={changePw}>
        <div className="card-head"><h3>{t('settings.account')}</h3></div>
        <h4>{t('settings.changePassword')}</h4>
        <div className="form-grid">
          <label className="field"><span>{t('settings.pw.current')}</span><input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
          <span />
          <label className="field"><span>{t('settings.pw.new')}</span><input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          <label className="field"><span>{t('settings.pw.confirm')}</span><input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
        </div>
        {pwMsg && <p className={pwMsg.ok ? 'form-ok' : 'form-bad'} role="status">{t(pwMsg.k)}</p>}
        <div className="modal-actions"><span className="grow" /><button className="btn">{t('settings.pw.update')}</button></div>
        <h4>{t('settings.demoData')}</h4>
        <p className="muted small-note">{t('settings.resetNote')}</p>
        {confirmReset ? (
          <div className="modal-actions"><span className="bad">{t('settings.resetConfirm')}</span><button type="button" className="btn danger" onClick={resetDemo}>{t('settings.resetYes')}</button><button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</button></div>
        ) : <button type="button" className="btn ghost" onClick={() => setConfirmReset(true)}>{t('settings.reset')}</button>}
      </form>
    </div>
  )
}
