import { useEffect, useRef } from 'react'
import { GraduationCap } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'

// First-run screen: the visitor picks the interface language. The choice is saved, so this screen is shown only once.
export default function Welcome() {
  const { lang, setLang, t, languages } = useI18n()
  const first = useRef(null)
  useEffect(() => { first.current?.focus() }, [])
  return (
    <main className="lang-gate">
      <div className="lang-card">
        <div className="lang-brand">
          <GraduationCap size={44} strokeWidth={1.7} />
          <span><b>Akadem<i>AI</i></b><small>{t('brand.tagline')}</small></span>
        </div>
        <h1>{t('welcome.title')}</h1>
        <p>{t('welcome.subtitle')}</p>
        <p className="lang-multi">{t('welcome.multi')}</p>
        <div className="lang-grid" role="group" aria-label={t('lang.switcher')}>
          {languages.map((l, i) => (
            <button key={l.code} ref={i === 0 ? first : null} type="button" lang={l.code} className={`lang-opt ${lang === l.code ? 'default' : ''}`} onClick={() => setLang(l.code)}>
              <span className="lang-code">{l.short}</span>
              <b>{l.label}</b>
            </button>
          ))}
        </div>
        <small className="muted">{t('welcome.hint')}</small>
      </div>
    </main>
  )
}
