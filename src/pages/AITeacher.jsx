import { useState, useEffect, useRef, useMemo } from 'react'
import { Send, Plus, Eraser, Trash2, Bot, User, RotateCw, AlertCircle, Loader2, MessageSquare } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FileDropzone from '../components/FileDropzone'
import FileList from '../components/FileList'
import Markdown from '../components/Markdown'
import { useApp } from '../store/AppStore'
import { useI18n } from '../i18n/I18nProvider'
import { load, save } from '../utils/storage'
import { putRecord, getRecord, deleteRecord, newId } from '../utils/fileStore'
import { extractText, AI_FORMATS } from '../utils/extractText'
import { askAI, aiMode, aiLabelKey } from '../services/aiService'
import { fmtDate } from '../utils/dates'

const SUGGESTION_KEYS = ['summary', 'mcq', 'topics', 'explain', 'exam', 'plan', 'simple', 'check'] // texts: ai.suggest.*
// A new conversation has an empty title and is shown as t('ai.newConversation'); older saved chats used the English title.
const mkChat = () => ({ id: newId(), title: '', messages: [], updatedAt: Date.now() })
const isDefaultTitle = (c) => !c.title || c.title === 'New conversation'

export default function AITeacher() {
  const { exams, profile, today } = useApp()
  const { t, lang } = useI18n()
  const SUGGESTIONS = SUGGESTION_KEYS.map((k) => t(`ai.suggest.${k}`))
  const chatTitle = (c) => (isDefaultTitle(c) ? t('ai.newConversation') : c.title)
  const fileNote = (f) => (f.noteKey ? t(f.noteKey, { msg: f.noteParams?.msg || t('extract.unknownError') }) : f.note)
  const statusText = (f) => (f.status === 'processing' ? t('ai.reading') : f.status === 'ok' ? t('ai.extracted', { n: f.words, num: f.words.toLocaleString(lang) }) : fileNote(f))
  const [files, setFiles] = useState(() => load('ai:files', []).map((f) => (f.status === 'processing' ? { ...f, status: 'error', noteKey: 'ai.interrupted' } : f)))
  const [chats, setChats] = useState(() => { const l = load('ai:chats', null); return l?.list?.length ? l : (() => { const c = mkChat(); return { list: [c], active: c.id } })() })
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const end = useRef(null)
  const chat = chats.list.find((c) => c.id === chats.active) ?? chats.list[0]

  useEffect(() => save('ai:files', files), [files])
  useEffect(() => save('ai:chats', { ...chats, list: chats.list.slice(0, 20).map((c) => ({ ...c, messages: c.messages.slice(-60) })) }), [chats])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [chat.messages.length, busy])

  const nextExam = useMemo(() => {
    const e = exams.filter((x) => x.isFuture && x.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date))[0]
    return e ? { label: `${e.courseTitle}: ${e.title}`, date: fmtDate(e.date), daysLeft: e.daysLeft } : null
  }, [exams, lang])

  const patchChat = (id, fn) => setChats((c) => ({ ...c, list: c.list.map((x) => (x.id === id ? { ...fn(x), updatedAt: Date.now() } : x)) }))

  const addFiles = async (list) => {
    for (const f of list) {
      const id = newId()
      const ext = f.name.split('.').pop().toLowerCase()
      setFiles((l) => [...l, { id, name: f.name, size: f.size, ext, status: 'processing', words: 0, note: '', use: true }])
      const r = await extractText(f)
      await putRecord(id, { blob: f, text: r.text })
      setFiles((l) => l.map((x) => (x.id === id ? { ...x, status: r.status, words: r.words, noteKey: r.noteKey, noteParams: r.noteParams, use: r.status === 'ok' } : x)))
    }
  }
  const removeFile = (f) => { deleteRecord(f.id); setFiles((l) => l.filter((x) => x.id !== f.id)) }
  const toggleUse = (id) => setFiles((l) => l.map((x) => (x.id === id ? { ...x, use: !x.use } : x)))
  const sources = files.filter((f) => f.use && f.status === 'ok')

  const run = async (chatId, message, history) => {
    setBusy(true)
    try {
      const documents = []
      for (const f of sources) { const rec = await getRecord(f.id); if (rec?.text) documents.push({ name: f.name, text: rec.text }) }
      const r = await askAI({ message, history, documents, lang, context: { nextExam, student: profile.firstName, today } })
      patchChat(chatId, (c) => ({ ...c, messages: [...c.messages, { id: newId(), role: 'ai', text: r.text, engine: r.engine, used: r.used }] }))
    } catch (e) {
      patchChat(chatId, (c) => ({ ...c, messages: [...c.messages, { id: newId(), role: 'error', errKey: e.i18nKey ?? 'ai.err.generic', errParams: e.i18nParams ?? { detail: e.message ? ` (${e.message})` : '' }, retry: message }] }))
    } finally { setBusy(false) }
  }
  const send = (t) => {
    const v = (t ?? text).trim()
    if (!v || busy) return
    setText('')
    const history = chat.messages.filter((m) => m.role !== 'error')
    patchChat(chat.id, (c) => ({ ...c, title: c.messages.length ? c.title : v.slice(0, 48), messages: [...c.messages, { id: newId(), role: 'user', text: v }] }))
    run(chat.id, v, history)
  }
  const retry = (m) => { patchChat(chat.id, (c) => ({ ...c, messages: c.messages.filter((x) => x.id !== m.id) })); run(chat.id, m.retry, chat.messages.filter((x) => x.role !== 'error')) }
  const newChat = () => { if (chat.messages.length === 0) return; const c = mkChat(); setChats((s) => ({ list: [c, ...s.list], active: c.id })); setText('') }
  const clearChat = () => { patchChat(chat.id, (c) => ({ ...c, title: '', messages: [] })); setConfirmClear(false) }
  const deleteChat = (id) => setChats((s) => { const list = s.list.filter((c) => c.id !== id); if (!list.length) { const c = mkChat(); return { list: [c], active: c.id } } return { list, active: s.active === id ? list[0].id : s.active } })

  return (
    <div className="page">
      <PageHeader title={t('nav.ai')} subtitle={t('ai.subtitle')} />
      <div className="ai-layout">
        <div className="ai-side">
          <section className="card">
            <div className="card-head"><h3>{t('ai.materials')}</h3></div>
            <FileDropzone accept={AI_FORMATS} maxSize={20 * 1048576} onFiles={addFiles} hint={t('ai.formatsHint')} />
            <FileList files={files} onRemove={removeFile}
              renderExtra={(f) => {
                return (<>
                  <small className={f.status === 'ok' ? 'ok' : f.status === 'processing' ? 'muted' : 'bad'}>{f.status === 'processing' && <Loader2 size={11} className="spin" />} {statusText(f)}</small>
                  {f.status === 'ok' && <label className="check mini"><input type="checkbox" checked={f.use} onChange={() => toggleUse(f.id)} /> {t('ai.useAsSource')}</label>}
                </>)
              }} />
            {files.length === 0 && <p className="muted small-note">{t('ai.noFiles')}</p>}
          </section>
          <section className="card">
            <div className="card-head"><h3>{t('ai.conversations')}</h3><button className="btn ghost sm" onClick={newChat} disabled={chat.messages.length === 0}><Plus size={14} /> {t('ai.new')}</button></div>
            <ul className="chat-hist">
              {chats.list.map((c) => (
                <li key={c.id} className={c.id === chat.id ? 'on' : ''}>
                  <button className="grow" onClick={() => setChats((s) => ({ ...s, active: c.id }))}><MessageSquare size={14} /><span>{chatTitle(c)}</span></button>
                  <button className="icon-btn" onClick={() => deleteChat(c.id)} aria-label={t('ai.deleteConversation', { title: chatTitle(c) })}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card chat-card">
          <div className="chat-head">
            <div><h3>{chatTitle(chat)}</h3><small className="muted">{t(aiLabelKey)}. {sources.length ? t('ai.sourcesAttached', { n: sources.length }) : t('ai.noSources')}</small></div>
            <div className="chat-actions">
              <button className="btn ghost sm" onClick={newChat} disabled={chat.messages.length === 0}><Plus size={14} /> {t('ai.newConversation')}</button>
              {confirmClear ? <><button className="btn danger sm" onClick={clearChat}>{t('ai.confirmClear')}</button><button className="btn ghost sm" onClick={() => setConfirmClear(false)}>{t('common.cancel')}</button></>
                : <button className="btn ghost sm" onClick={() => setConfirmClear(true)} disabled={chat.messages.length === 0}><Eraser size={14} /> {t('ai.clearChat')}</button>}
            </div>
          </div>
          <div className="msgs" aria-live="polite">
            {chat.messages.length === 0 && (
              <div className="chat-empty">
                <Bot size={34} />
                <b>{t('ai.hello', { name: profile.firstName })}</b>
                <p>{aiMode === 'local' ? t('ai.demoInfo') : t('ai.apiInfo')}</p>
                <div className="chips">{SUGGESTIONS.map((s) => <button key={s} onClick={() => (s.endsWith(': ') ? setText(s) : send(s))}>{s}</button>)}</div>
              </div>
            )}
            {chat.messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <span className="msg-ico">{m.role === 'user' ? <User size={16} /> : m.role === 'error' ? <AlertCircle size={16} /> : <Bot size={16} />}</span>
                <div className="bubble">
                  {m.role === 'ai' ? <Markdown text={m.text} /> : <p>{m.role === 'error' ? (m.errKey ? t(m.errKey, m.errParams) : m.text || t('ai.err.generic', { detail: '' })) : m.text}</p>}
                  {m.role === 'ai' && m.used?.length > 0 && <small className="muted">{t('ai.sources', { list: m.used.join(', ') })}</small>}
                  {m.role === 'error' && <button className="btn ghost sm" onClick={() => retry(m)}><RotateCw size={13} /> {t('ai.tryAgain')}</button>}
                </div>
              </div>
            ))}
            {busy && <div className="msg ai"><span className="msg-ico"><Bot size={16} /></span><div className="bubble typing" aria-label={t('ai.typing')}><i /><i /><i /></div></div>}
            <span ref={end} />
          </div>
          {chat.messages.length > 0 && <div className="chips inline">{SUGGESTIONS.slice(0, 4).map((s) => <button key={s} onClick={() => send(s)} disabled={busy}>{s}</button>)}</div>}
          <form className="composer-lg" onSubmit={(e) => { e.preventDefault(); send() }}>
            <textarea value={text} rows={3} onChange={(e) => setText(e.target.value)} placeholder={t('ai.placeholder')} aria-label={t('ai.yourQuestion')}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }} />
            <button className="btn" disabled={!text.trim() || busy}><Send size={16} /> {t('ai.send')}</button>
          </form>
        </section>
      </div>
    </div>
  )
}
