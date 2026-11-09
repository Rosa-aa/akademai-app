import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANG, LANGUAGES, isLang, setCurrentLang, translate } from './index'
import { load, save } from '../utils/storage'

const Ctx = createContext({ lang: DEFAULT_LANG, chosen: true, setLang: () => {}, t: (k, p) => translate(k, p), languages: LANGUAGES })
export const useI18n = () => useContext(Ctx)

// The language is saved in localStorage ('akademai:v2:lang'). Azerbaijani is used until the visitor
// picks a language on the welcome screen; `chosen` tells the app whether that has happened yet.
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => { const s = load('lang', null); return isLang(s) ? s : DEFAULT_LANG })
  const [chosen, setChosen] = useState(() => isLang(load('lang', null)))
  setCurrentLang(lang) // synchronous, so every child rendered below already sees the new language

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate('meta.title', undefined, lang)
  }, [lang])

  const setLang = useCallback((l) => {
    if (!isLang(l)) return
    save('lang', l)
    setCurrentLang(l)
    setLangState(l)
    setChosen(true)
  }, [])
  // A new `t` for every language, so memoised values that depend on it refresh on a switch.
  const t = useCallback((key, params) => translate(key, params, lang), [lang])
  const value = useMemo(() => ({ lang, chosen, setLang, t, languages: LANGUAGES }), [lang, chosen, setLang, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
