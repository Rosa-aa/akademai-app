import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Loader2, FileX2 } from 'lucide-react'
import Modal from './Modal'
import Badge from './Badge'
import { useI18n } from '../i18n/I18nProvider'
import { fetchMaterialBlob, downloadMaterial } from '../services/materials'
import { sanitizeHtml } from '../utils/sanitizeHtml'
import { fmtDate, fmtSize } from '../utils/dates'

// ---- PDF: rendered page by page with pdf.js, so it also works on phones that cannot show PDFs inline.
function PdfView({ blob }) {
  const { t } = useI18n()
  const wrap = useRef(null), canvas = useRef(null)
  const [doc, setDoc] = useState(null), [page, setPage] = useState(1), [width, setWidth] = useState(0), [zoom, setZoom] = useState(1), [err, setErr] = useState(false)

  useEffect(() => {
    let dead = false, d
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist/build/pdf')
        pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default
        d = await pdfjs.getDocument({ data: await blob.arrayBuffer(), isEvalSupported: false }).promise
        if (!dead) setDoc(d)
      } catch { if (!dead) setErr(true) }
    })()
    return () => { dead = true; d?.destroy() }
  }, [blob])

  useEffect(() => {
    const el = wrap.current; if (!el) return undefined
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el); setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [doc])

  useEffect(() => {
    if (!doc || !width) return undefined
    let dead = false, task
    doc.getPage(page).then((p) => {
      if (dead || !canvas.current) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2), cssW = Math.max(200, (width - 2) * zoom)
      const vp = p.getViewport({ scale: (cssW / p.getViewport({ scale: 1 }).width) * dpr })
      const c = canvas.current
      c.width = vp.width; c.height = vp.height; c.style.width = `${cssW}px`; c.style.height = `${vp.height / dpr}px`
      task = p.render({ canvasContext: c.getContext('2d'), viewport: vp })
      task.promise.catch(() => {})
    })
    return () => { dead = true; task?.cancel() }
  }, [doc, page, width, zoom])

  const n = doc?.numPages ?? 0
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowLeft') setPage((p) => Math.max(1, p - 1)); if (e.key === 'ArrowRight') setPage((p) => Math.min(n, p + 1)) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [n])

  if (err) return <p className="form-bad" role="alert">{t('materials.preview.error')}</p>
  if (!doc) return <div className="mat-loading"><Loader2 size={20} className="spin" /> {t('materials.preview.loading')}</div>
  return (
    <div>
      <div className="mat-viewbar">
        <button className="icon-btn bordered" onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label={t('materials.preview.prev')}><ChevronLeft size={18} /></button>
        <span className="mat-pageno" aria-live="polite">{t('materials.preview.page', { n: page, total: n })}</span>
        <button className="icon-btn bordered" onClick={() => setPage(page + 1)} disabled={page >= n} aria-label={t('materials.preview.next')}><ChevronRight size={18} /></button>
        <span className="grow" />
        <button className="icon-btn bordered" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} disabled={zoom <= 0.6} aria-label={t('materials.preview.zoomOut')}><ZoomOut size={18} /></button>
        <button className="icon-btn bordered" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.2).toFixed(1)))} disabled={zoom >= 2.2} aria-label={t('materials.preview.zoomIn')}><ZoomIn size={18} /></button>
      </div>
      <div className="mat-canvas" ref={wrap}><canvas ref={canvas} aria-label={t('materials.preview.page', { n: page, total: n })} /></div>
    </div>
  )
}

// ---- DOCX: converted to HTML in the browser (mammoth) and sanitised.
function DocxView({ blob }) {
  const { t } = useI18n()
  const [html, setHtml] = useState(null), [err, setErr] = useState(false)
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const mammoth = (await import('mammoth/mammoth.browser')).default
        const { value } = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() })
        if (!dead) setHtml(sanitizeHtml(value))
      } catch { if (!dead) setErr(true) }
    })()
    return () => { dead = true }
  }, [blob])
  if (err) return <p className="form-bad" role="alert">{t('materials.preview.error')}</p>
  if (html == null) return <div className="mat-loading"><Loader2 size={20} className="spin" /> {t('materials.preview.loading')}</div>
  return <div className="mat-docx" dangerouslySetInnerHTML={{ __html: html || `<p>${t('materials.preview.noText')}</p>` }} />
}

// ---- PPTX: slide text outline (slides themselves cannot be drawn in the browser).
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
function PptxView({ blob }) {
  const { t } = useI18n()
  const [slides, setSlides] = useState(null), [err, setErr] = useState(false)
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(await blob.arrayBuffer())
        const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => a.match(/(\d+)\.xml/)[1] - b.match(/(\d+)\.xml/)[1])
        const out = []
        for (const n of names) {
          const xml = await zip.files[n].async('string')
          out.push((xml.match(/<a:p[ >][\s\S]*?<\/a:p>/g) ?? []).map((p) => [...p.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decode(m[1])).join('')).filter(Boolean))
        }
        if (!dead) setSlides(out)
      } catch { if (!dead) setErr(true) }
    })()
    return () => { dead = true }
  }, [blob])
  if (err) return <p className="form-bad" role="alert">{t('materials.preview.error')}</p>
  if (!slides) return <div className="mat-loading"><Loader2 size={20} className="spin" /> {t('materials.preview.loading')}</div>
  return (
    <div>
      <p className="small-note" style={{ marginTop: 0 }}>{t('materials.preview.slidesNote')}</p>
      <ol className="mat-slides">
        {slides.map((lines, i) => (
          <li key={i} className="mat-slide"><small>{t('materials.preview.slide', { n: i + 1 })}</small>
            {lines.length ? lines.map((l, j) => <p key={j} className={j === 0 ? 'first' : ''}>{l}</p>) : <p className="muted">{t('materials.preview.noText')}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}

const VIEWS = { pdf: PdfView, docx: DocxView, pptx: PptxView }
export default function MaterialPreview({ material: m, onClose, onError }) {
  const { t } = useI18n()
  const View = VIEWS[m.file_ext]
  const [blob, setBlob] = useState(null), [err, setErr] = useState(null)
  useEffect(() => {
    if (!View) return undefined
    let dead = false
    fetchMaterialBlob(m).then((b) => { if (!dead) setBlob(b) }).catch((e) => { if (!dead) setErr(e) })
    return () => { dead = true }
  }, [m, View])
  const info = [
    [t('materials.info.fileName'), m.file_name], [t('materials.info.type'), (m.file_ext || '—').toUpperCase()], [t('materials.info.size'), fmtSize(m.file_size)],
    [t('materials.info.subject'), m.subjectName], [t('materials.info.faculty'), m.facultyName], [t('materials.info.department'), m.departmentName],
    [t('materials.info.year'), m.academic_year], [t('materials.info.groups'), m.groups.map((g) => g.name).join(', ') || '—'], [t('materials.info.teacher'), m.teacherName],
    [t('materials.info.uploaded'), fmtDate(m.created_at.slice(0, 10))],
  ]
  return (
    <Modal title={m.title} onClose={onClose} xl>
      <div className="detail-top"><Badge tone="violet">{t(`materials.category.${m.category}`)}</Badge>{m.is_sample && <Badge tone="amber">{t('materials.sample')}</Badge>}</div>
      {m.description && <p className="desc">{m.description}</p>}
      <dl className="meta-grid" style={{ margin: '14px 0' }}>{info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div className="modal-actions" style={{ marginTop: 0, marginBottom: 14 }}>
        <button className="btn" onClick={() => downloadMaterial(m).catch((e) => onError?.(e))}><Download size={16} /> {t('materials.card.download')}</button>
      </div>
      {!View && <div className="note-box"><FileX2 size={16} style={{ verticalAlign: '-3px' }} /> {t('materials.preview.unsupported', { ext: (m.file_ext || '').toUpperCase() })}</div>}
      {View && err && <p className="form-bad" role="alert">{t(`materials.err.${err.key ?? 'preview'}`)}</p>}
      {View && !err && !blob && <div className="mat-loading"><Loader2 size={20} className="spin" /> {t('materials.preview.loading')}</div>}
      {View && blob && <View blob={blob} />}
    </Modal>
  )
}
