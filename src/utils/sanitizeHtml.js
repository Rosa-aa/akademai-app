// Minimal allow-list sanitiser for HTML produced from uploaded DOCX files (mammoth). Everything not listed is removed or unwrapped.
const ALLOWED = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'SUB', 'SUP', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'A', 'IMG', 'BLOCKQUOTE', 'SPAN', 'DIV', 'CODE', 'PRE'])
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'SVG', 'MATH', 'TEXTAREA', 'SELECT', 'BASE'])

export function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (node) => {
    for (const el of [...node.children]) {
      const tag = el.tagName.toUpperCase()
      if (DROP.has(tag)) { el.remove(); continue }
      if (!ALLOWED.has(tag)) { walk(el); el.replaceWith(...el.childNodes); continue }
      for (const a of [...el.attributes]) {
        const n = a.name.toLowerCase(), v = a.value
        const ok = (tag === 'A' && n === 'href' && /^(https?:|mailto:|#)/i.test(v))
          || (tag === 'IMG' && ((n === 'src' && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v)) || n === 'alt'))
          || ((tag === 'TD' || tag === 'TH') && (n === 'colspan' || n === 'rowspan'))
        if (!ok) el.removeAttribute(a.name)
      }
      if (tag === 'A') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer') }
      walk(el)
    }
  }
  walk(doc.body)
  return doc.body.innerHTML
}
