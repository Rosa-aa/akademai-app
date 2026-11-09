// Built-in OFFLINE engine. It is NOT a language model. It works only on text actually extracted from
// the uploaded files, using simple keyword rules, and every answer says so. Replace it with a real LLM
// through services/aiService.js (see .env.example).
// Replies are written in the interface language (texts: i18n/locales/<lang>/ui.js, section `ai.engine`).
// Requests are recognised in Azerbaijani, English and Russian, whichever language the interface uses.
import { translate } from '../i18n'

const STOP = new Set(('the a an and or of to in on for with is are was were be been it this that these those as at by from which what when where who how can could should would will may might not no yes if then than so such also into over under between about their there they them its our your you we he she his her has have had do does did more most other some any each only very just use used using based like one two three '
  + 'bile və ilə bu o bir üçün də da ki olan olaraq kimi daha çox həm belə onun onlar bütün digər görə sonra isə lakin ancaq yalnız hər nə necə '
  + 'это как для что или при его они так все также который которые которая может быть было были будет если только более между после через этого этой этих такой такие чтобы когда где там тут свой своей наших есть нет не на по из от до за под над без про'
).split(' '))
const words = (t) => (t.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? [])
const sentences = (t) => t.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length >= 40 && s.length <= 320 && /\p{L}{3}/u.test(s))
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// What the person is asking for. Each pattern lists English, Azerbaijani and Russian phrasings.
const INTENT = {
  summary: /summar|brief overview|tl;dr|xülasə|ümumiləşdir|qısa məzmun|кратко|резюм|суммир|перескаж|конспект/,
  mcq: /multiple[- ]choice|mcq|quiz|exam(ination)? questions|practice questions|generate .*questions|potential .*questions|test questions|çoxseçimli|test sual|imtahan sual|sual(lar)? (hazırla|yarat|tərtib)|тест|викторин|вариант\S* ответ|экзаменационн\S* вопрос|(составь|сгенерируй|создай) .*вопрос/,
  topics: /important|key (topics|concepts|terms)|main topics|focus on|prepare for|vacib|əsas (mövzu|anlayış)|hazırlaş|важн|ключев|основн\S* (тем|понят)|подготов/,
  plan: /study plan|schedule|revision plan|plan|təhsil planı|cədvəl|план|расписан/,
  check: /check|correct|verify|my answer|is this right|yoxla|düzgün|cavabım|провер|правильн|мой ответ/,
  explain: /explain|difficult|simple|what is|define|how does|why|izah|çətin|sadə|nədir|necə|niyə|объясн|сложн|прост|что такое|определи|как работает|почему/,
}

function keywords(text, n = 10) {
  const f = new Map()
  for (const w of words(text)) if (w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)) f.set(w, (f.get(w) ?? 0) + 1)
  return [...f.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w, c]) => ({ w, c }))
}
function rank(sents, kw) {
  const weight = new Map(kw.map((k) => [k.w, k.c]))
  return sents.map((s, i) => ({ s, i, score: words(s).reduce((a, w) => a + (weight.get(w) ?? 0), 0) / Math.sqrt(words(s).length) })).sort((a, b) => b.score - a.score)
}
const pick = (arr, n) => arr.slice(0, n)
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const names = (docs) => docs.map((d) => d.name).join(', ')

export function localProvider({ message, documents = [], context = {}, lang }) {
  const T = (k, p) => translate(`ai.engine.${k}`, p, lang)
  const m = message.toLowerCase()
  const text = documents.map((d) => d.text).join('\n\n')
  const has = text.length > 0
  const used = documents.map((d) => d.name)
  const need = T('need')
  const note = `\n\n_${T('note')}_`
  const sents = has ? sentences(text) : []
  const kw = has ? keywords(text, 12) : []
  const wantN = Number((m.match(/\b(\d{1,2})\b/) ?? [])[1]) || 5

  if (INTENT.summary.test(m)) {
    if (!has) return { text: need, used }
    const top = pick(rank(sents, kw), 6).sort((a, b) => a.i - b.i)
    return { used, text: `### ${T('summaryTitle', { names: names(documents) })}\n${T('summaryIntro')}\n\n${top.map((x) => `- ${x.s}`).join('\n')}\n\n**${T('mainTerms')}** ${kw.slice(0, 6).map((k) => k.w).join(', ')}.${note}` }
  }
  if (INTENT.mcq.test(m)) {
    if (!has) return { text: need, used }
    const kwSet = new Set(kw.map((k) => k.w))
    const cands = rank(sents, kw).filter((r) => words(r.s).some((w) => kwSet.has(w)))
    const qs = [], seen = new Set()
    for (const c of cands) {
      const ans = words(c.s).filter((w) => kwSet.has(w)).sort((a, b) => b.length - a.length)[0]
      if (!ans || seen.has(ans) || qs.length >= wantN) continue
      seen.add(ans)
      // Unicode-aware word boundaries: \b does not work for Cyrillic or Azerbaijani letters.
      const blank = c.s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(ans)}(?![\\p{L}\\p{N}])`, 'iu'), '_____')
      const opts = [ans, ...kw.map((k) => k.w).filter((w) => w !== ans).slice(0, 12).sort((a, b) => ((a.length + ans.length) % 5) - ((b.length + ans.length) % 5)).slice(0, 3)]
      const order = opts.map((o, i) => ({ o, i })).sort((a, b) => ((a.i * 7 + qs.length) % 4) - ((b.i * 7 + qs.length) % 4))
      qs.push({ blank, opts: order.map((x) => x.o), key: 'ABCD'[order.findIndex((x) => x.i === 0)] })
    }
    if (!qs.length) return { text: T('qTooShort'), used }
    const short = qs.length < wantN ? `\n\n${T('qShort', { n: qs.length, want: wantN })}` : ''
    return { used, text: `### ${T('qTitle', { n: qs.length })}\n${T('qIntro')}\n\n${qs.map((q, i) => `${i + 1}. ${q.blank}\n${q.opts.map((o, j) => `   ${'ABCD'[j]}) ${o}`).join('\n')}`).join('\n')}\n\n**${T('answerKey')}** ${qs.map((q, i) => `${i + 1}${q.key}`).join(', ')}${short}${note}` }
  }
  if (INTENT.topics.test(m)) {
    if (!has) return { text: need, used }
    const rows = kw.slice(0, 8).map((k) => { const s = sents.find((x) => words(x).includes(k.w)); return `- **${cap(k.w)}** (${T('appears', { n: k.c })})${s ? `: ${s}` : ''}` })
    const ex = context.nextExam ? `\n\n${T('topicsNextExam', { label: context.nextExam.label, date: context.nextExam.date })}` : ''
    return { used, text: `### ${T('topicsTitle', { names: names(documents) })}\n${rows.join('\n')}${ex}${note}` }
  }
  if (INTENT.plan.test(m)) {
    const ne = context.nextExam
    const topics = kw.length ? kw.map((k) => cap(k.w)) : []
    const days = Math.max(2, Math.min(7, ne ? ne.daysLeft : 5))
    const per = topics.length ? Math.ceil(topics.length / days) : 0
    const lines = Array.from({ length: days }, (_, d) => d === days - 1 ? `- ${T('planLast', { n: d + 1 })}`
      : topics.length ? `- ${T('planStudy', { n: d + 1, list: topics.slice(d * per, d * per + per).join(', ') || T('planPrevious') })}` : `- ${T('planNotes', { n: d + 1 })}`)
    return { used, text: `### ${ne ? T('planTitleFor', { n: days, label: ne.label, date: ne.date }) : T('planTitle', { n: days })}\n${lines.join('\n')}\n\n${has ? T('planFromDoc') : T('planNoDoc')}${note}` }
  }
  if (INTENT.check.test(m)) {
    if (!has) return { text: need, used }
    const ans = message.split(/:|\n/).slice(1).join(' ') || message
    const aw = new Set(words(ans).filter((w) => w.length >= 4 && !STOP.has(w)))
    const covered = kw.filter((k) => aw.has(k.w)).map((k) => k.w)
    return { used, text: `${T('checkIntro')}\n\n- ${T('checkFound', { list: covered.length ? covered.join(', ') : T('none') })}\n- ${T('checkMissing', { list: kw.filter((k) => !aw.has(k.w)).slice(0, 6).map((k) => k.w).join(', ') || T('none') })}\n\n${T('checkTip')}${note}` }
  }
  if (has && INTENT.explain.test(m)) {
    const q = new Set(words(message).filter((w) => w.length >= 4 && !STOP.has(w)))
    const hits = rank(sents, [...q].map((w) => ({ w, c: 5 }))).filter((r) => r.score > 0).slice(0, 4)
    const body = hits.length ? hits.map((h) => `- ${h.s}`).join('\n') : rank(sents, kw).slice(0, 4).map((h) => `- ${h.s}`).join('\n')
    return { used, text: `### ${T('explainTitle', { names: names(documents) })}\n${hits.length ? T('explainMatch') : T('explainNoMatch')}\n\n${body}\n\n${T('explainNote')}${note}` }
  }
  if (has) {
    const q = new Set(words(message).filter((w) => w.length >= 4 && !STOP.has(w)))
    const hits = rank(sents, [...q].map((w) => ({ w, c: 5 }))).filter((r) => r.score > 0).slice(0, 3)
    if (hits.length) return { used, text: `### ${T('passagesTitle')}\n${hits.map((h) => `- ${h.s}`).join('\n')}${note}` }
  }
  return { used, text: `${has ? '' : `${T('fbNoDoc')} `}${T('fbIntro')}\n\n${T('fbItems').map((x) => `- ${x}`).join('\n')}\n\n${T('fbOutro')}${note}` }
}
