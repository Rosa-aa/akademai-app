// Core of the translation layer (no React here, so utils and services can use it too).
// Dictionaries live in ./locales and are collected in ./translations.js.
import { translations } from './translations'

export const LANGUAGES = [
  { code: 'az', label: 'Azərbaycan dili', short: 'AZ' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ru', label: 'Русский', short: 'RU' },
]
export const DEFAULT_LANG = 'az'
export const isLang = (l) => LANGUAGES.some((x) => x.code === l)

// The active language. I18nProvider keeps this in sync with its React state, so plain helper
// functions (date formatting, notification text, the offline AI engine) can call translate().
let current = DEFAULT_LANG
export const getLang = () => current
export const setCurrentLang = (l) => { if (isLang(l)) current = l }

const get = (dict, key) => {
  let o = dict
  for (const k of key.split('.')) { if (o == null) return undefined; o = o[k] }
  return o
}
const rules = {}
const pluralCategory = (lang, n) => (rules[lang] ??= new Intl.PluralRules(lang)).select(n)
// A plural entry is an object of forms ({ one, few, many, other }) chosen by params.n.
const isForms = (v) => v && typeof v === 'object' && !Array.isArray(v) && 'other' in v

function fill(v, params, lang) {
  if (isForms(v)) v = v[pluralCategory(lang, Number(params?.n))] ?? v.other
  if (typeof v !== 'string') return v // arrays (month and weekday names) are returned as they are
  return params ? v.replace(/\{(\w+)\}/g, (m, k) => (params[k] == null ? m : String(params[k]))) : v
}

export const has = (key, lang = current) => get(translations[lang], key) != null

// translate('dash.credits', { n: 6 }). Falls back to English, then to the key itself.
export function translate(key, params, lang = current) {
  const v = get(translations[lang], key) ?? get(translations.en, key)
  if (v == null) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing translation key: ${key}`)
    return key
  }
  return fill(v, params, lang)
}
// Like translate(), but uses `fallback` when the key does not exist in any dictionary.
export const tOr = (key, fallback, params, lang = current) => (has(key, lang) || has(key, 'en') ? translate(key, params, lang) : fallback)

// Locale-aware case helpers (Azerbaijani has a dotted and a dotless i).
export const lower = (s, lang = current) => String(s).toLocaleLowerCase(lang)
export const upperFirst = (s, lang = current) => (s ? s.charAt(0).toLocaleUpperCase(lang) + s.slice(1) : s)
