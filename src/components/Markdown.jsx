// Tiny safe markdown renderer (headings, bold, italic, code, bullet and numbered lists). No HTML injection.
const inline = (t, k) => t.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).map((p, i) => {
  if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={k + i}>{p.slice(2, -2)}</strong>
  if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return <code key={k + i}>{p.slice(1, -1)}</code>
  if (p.startsWith('_') && p.endsWith('_') && p.length > 2) return <em key={k + i}>{p.slice(1, -1)}</em>
  return p
})

export default function Markdown({ text }) {
  const out = []; let list = null
  const flush = () => { if (list) { out.push(list.ord ? <ol key={out.length}>{list.items}</ol> : <ul key={out.length}>{list.items}</ul>); list = null } }
  text.split('\n').forEach((line, i) => {
    const b = line.match(/^\s*[-*]\s+(.*)/), n = line.match(/^\s*\d+[.)]\s+(.*)/), h = line.match(/^(#{1,4})\s+(.*)/)
    if (b || n) {
      const ord = !!n
      if (!list || list.ord !== ord) { flush(); list = { ord, items: [] } }
      list.items.push(<li key={i}>{inline((b ?? n)[1], i)}</li>)
    } else {
      flush()
      if (h) out.push(<h5 key={i}>{inline(h[2], i)}</h5>)
      else if (line.trim()) out.push(<p key={i}>{inline(line, i)}</p>)
    }
  })
  flush()
  return <div className="md">{out}</div>
}
