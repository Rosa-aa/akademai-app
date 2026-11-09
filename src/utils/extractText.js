// Real, in-browser text extraction. Heavy libraries are loaded on demand.
import { extOf } from './fileStore'

export const AI_FORMATS = ['pdf', 'docx', 'doc', 'txt', 'pptx']
const MAX_CHARS = 400000
const clean = (t) => t.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

async function pdf(file) {
  const pdfjs = await import('pdfjs-dist/build/pdf')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent()
    pages.push(c.items.map((x) => x.str).join(' '))
  }
  return pages.join('\n\n')
}
async function docx(file) {
  const mammoth = (await import('mammoth/mammoth.browser')).default
  return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value
}
async function pptx(file) {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/(\d+)\.xml/)[1]) - Number(b.match(/(\d+)\.xml/)[1]))
  const out = []
  for (const n of names) {
    const xml = await zip.files[n].async('string')
    out.push([...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decode(m[1])).join(' '))
  }
  return out.join('\n\n')
}

// Returns { status: 'ok' | 'empty' | 'unsupported' | 'error', text, words, noteKey, noteParams }
// noteKey is a translation key (see ui.js, section `extract`), so the note follows the interface language.
export async function extractText(file) {
  const ext = extOf(file.name)
  try {
    if (ext === 'doc') return { status: 'unsupported', text: '', words: 0, noteKey: 'extract.docLegacy' }
    const raw = ext === 'txt' ? await file.text() : ext === 'pdf' ? await pdf(file) : ext === 'docx' ? await docx(file) : ext === 'pptx' ? await pptx(file) : null
    if (raw == null) return { status: 'unsupported', text: '', words: 0, noteKey: 'extract.unsupportedType' }
    const text = clean(raw).slice(0, MAX_CHARS)
    const words = text ? text.split(/\s+/).length : 0
    if (!words) return { status: 'empty', text: '', words: 0, noteKey: ext === 'pdf' ? 'extract.emptyPdf' : 'extract.empty' }
    return { status: 'ok', text, words }
  } catch (e) {
    return { status: 'error', text: '', words: 0, noteKey: 'extract.error', noteParams: { msg: e.message || '' } }
  }
}
