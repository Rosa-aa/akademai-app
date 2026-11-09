// npm run check:i18n — every language must define the same keys as English, and every t('literal.key') used in src/ must exist.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { translations } from '../src/i18n/translations.js'

const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) && !('other' in v) ? flat(v, `${p}${k}.`) : [`${p}${k}`]))
const keys = Object.fromEntries(Object.entries(translations).map(([l, d]) => [l, new Set(flat(d))]))
let bad = 0
for (const l of ['az', 'ru']) {
  for (const k of keys.en) if (!keys[l].has(k)) { console.log(`[${l}] missing: ${k}`); bad++ }
  for (const k of keys[l]) if (!keys.en.has(k)) { console.log(`[${l}] extra: ${k}`); bad++ }
}
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (p.includes('locales') ? [] : walk(p)) : /\.(jsx?|mjs)$/.test(f) ? [p] : [] })
for (const f of walk('src')) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\bt\(\s*'([\w.]+)'/g)) if (!keys.en.has(m[1])) { console.log(`${f}: unknown key ${m[1]}`); bad++ }
}
console.log(bad ? `${bad} problem(s)` : 'i18n OK: all languages have the same keys and all used keys exist')
process.exit(bad ? 1 : 0)
