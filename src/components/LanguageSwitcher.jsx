import { Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'

// Compact AZ / EN / RU switcher for the top bar. Each button carries the full language name for screen readers.
export default function LanguageSwitcher() {
  const { lang, setLang, t, languages } = useI18n()
  return (
    <div className="lang-switch" role="group" aria-label={t('lang.switcher')}>
      <Languages size={16} aria-hidden="true" />
      {languages.map((l) => (
        <button key={l.code} type="button" lang={l.code} className={lang === l.code ? 'on' : ''} aria-pressed={lang === l.code}
          title={l.label} aria-label={l.label} onClick={() => setLang(l.code)}>{l.short}</button>
      ))}
    </div>
  )
}
