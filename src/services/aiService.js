// Single entry point for the AI Teacher. To use a real LLM, set VITE_AI_API_URL (see .env.example)
// to your backend endpoint. Never put API keys in front-end code: call your own server instead.
//
// Request  (POST JSON): { message, history: [{role:'user'|'assistant', content}], documents: [{name, text}], context }
//   context.language is the interface language ('az' | 'en' | 'ru'): answer in that language.
// Response (JSON):      { reply: "markdown text" }
import { localProvider } from './mockAI'

const API_URL = import.meta.env.VITE_AI_API_URL
export const aiMode = API_URL ? 'api' : 'local'
export const aiLabelKey = API_URL ? 'ai.engineApi' : 'ai.engineLocal' // translated where it is displayed
const MAX_DOC_CHARS = 60000

// Errors carry a translation key so the chat can show them in the language that is active when they are displayed.
const fail = (key, params) => Object.assign(new Error(key), { i18nKey: key, i18nParams: params })

async function apiProvider({ message, history, documents, context }) {
  const res = await fetch(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message, context,
      history: history.slice(-20).map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
      documents: documents.map((d) => ({ name: d.name, text: d.text.slice(0, MAX_DOC_CHARS) })),
    }),
  })
  if (!res.ok) throw fail('ai.err.status', { status: res.status })
  const data = await res.json()
  if (typeof data.reply !== 'string') throw fail('ai.err.unexpected')
  return { text: data.reply, used: documents.map((d) => d.name) }
}

export async function askAI(req) {
  if (API_URL) return { ...(await apiProvider({ ...req, context: { ...req.context, language: req.lang } })), engine: 'api' }
  await new Promise((r) => setTimeout(r, 450)) // small delay so the loading state is visible
  return { ...localProvider(req), engine: 'local' }
}
