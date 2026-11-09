import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../store/AuthStore'
import { useI18n } from '../i18n/I18nProvider'
import { Segmented } from './Filters'

// Sign in / create a (student) account with Supabase Auth.
export default function MaterialsAuth() {
  const { t } = useI18n()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ email: '', password: '', name: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { ok, key }
  const set = (p) => setF((x) => ({ ...x, ...p }))

  const errKey = (e) => {
    const m = (e.message || '').toLowerCase()
    if (m.includes('invalid login')) return 'invalid'
    if (m.includes('already') || m.includes('registered')) return 'exists'
    if (m.includes('password')) return 'weak'
    if (m.includes('confirm')) return 'unconfirmed'
    if (m.includes('fetch') || m.includes('network')) return 'network'
    return 'generic'
  }
  const submit = async (e) => {
    e.preventDefault(); setMsg(null)
    if (!f.email.trim() || !f.password || (mode === 'up' && !f.name.trim())) return setMsg({ ok: false, key: 'required' })
    setBusy(true)
    try {
      if (mode === 'in') await signIn(f.email, f.password)
      else { const r = await signUp(f.email, f.password, f.name); if (r.needsConfirm) setMsg({ ok: true, key: 'confirm' }) }
    } catch (er) { setMsg({ ok: false, key: errKey(er) }) } finally { setBusy(false) }
  }
  return (
    <section className="card auth-card">
      <h3>{t('materials.auth.title')}</h3>
      <p className="muted">{t('materials.auth.text')}</p>
      <Segmented value={mode} onChange={(v) => { setMode(v); setMsg(null) }} label={t('materials.auth.title')}
        options={[{ value: 'in', label: t('materials.auth.signIn') }, { value: 'up', label: t('materials.auth.signUp') }]} />
      <form onSubmit={submit} noValidate className="auth-form">
        {mode === 'up' && <label className="field"><span>{t('materials.auth.fullName')}</span><input type="text" autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></label>}
        <label className="field"><span>{t('materials.auth.email')}</span><input type="email" autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></label>
        <label className="field"><span>{t('materials.auth.password')}</span><input type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => set({ password: e.target.value })} /></label>
        {mode === 'up' && <small className="muted">{t('materials.auth.studentNote')}</small>}
        {msg && <p className={msg.ok ? 'form-ok' : 'form-bad'} role="alert">{t(`materials.auth.msg.${msg.key}`)}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : mode === 'in' ? <LogIn size={16} /> : <UserPlus size={16} />}{mode === 'in' ? t('materials.auth.signIn') : t('materials.auth.signUp')}</button>
      </form>
    </section>
  )
}
