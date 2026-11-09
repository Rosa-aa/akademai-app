import { fmtWeekdayShort, toISO, toMin } from '../utils/dates'
import { fmtRoom } from '../utils/format'
import { useI18n } from '../i18n/I18nProvider'

const PX = 62 // pixels per hour

// Place overlapping events side by side.
function layout(events) {
  const evs = events.map((e) => ({ e, s: toMin(e.start), f: toMin(e.end), col: 0, cols: 1 }))
  let cluster = [], end = -1
  const flush = () => { const n = Math.max(...cluster.map((c) => c.col), 0) + 1; cluster.forEach((c) => (c.cols = n)); cluster = [] }
  for (const ev of evs) {
    if (ev.s >= end && cluster.length) flush()
    const used = cluster.filter((c) => c.f > ev.s).map((c) => c.col)
    while (used.includes(ev.col)) ev.col++
    cluster.push(ev); end = Math.max(end, ev.f)
  }
  if (cluster.length) flush()
  return evs
}

export function EventChip({ ev, onClick, small }) {
  return (
    <button className={`ev ${ev.cancelled ? 'cancelled' : ''} ${ev.kind === 'exam' ? 'exam' : ''}`} style={{ '--ec': ev.color }} onClick={(e) => { e.stopPropagation(); onClick(ev) }}
      title={`${ev.title} ${ev.start}-${ev.end}`}>
      {small ? <><b>{ev.start}</b> {ev.title}</> : ev.title}
    </button>
  )
}

export default function TimeGrid({ days, eventsFor, today, selected, onSelect, onEvent }) {
  const { t } = useI18n()
  const all = days.flatMap((d) => eventsFor(toISO(d)))
  const h0 = Math.min(8, ...all.map((e) => Math.floor(toMin(e.start) / 60)))
  const h1 = Math.max(17, ...all.map((e) => Math.ceil(toMin(e.end) / 60)))
  const hours = Array.from({ length: h1 - h0 }, (_, i) => h0 + i)
  return (
    <div className="scroll-x">
      <div className="tg" style={{ '--cols': days.length, minWidth: days.length > 1 ? 720 : 0 }}>
        <div className="tg-corner" />
        {days.map((d) => {
          const iso = toISO(d)
          return (
            <button key={iso} className={`tg-head ${iso === today ? 'today' : ''} ${iso === selected ? 'sel' : ''}`} onClick={() => onSelect(iso)}>
              <small>{fmtWeekdayShort(iso)}</small><b>{d.getDate()}</b>
            </button>
          )
        })}
        <div className="tg-times" style={{ height: hours.length * PX }}>{hours.map((h) => <span key={h} style={{ top: (h - h0) * PX }}>{String(h).padStart(2, '0')}:00</span>)}</div>
        {days.map((d) => {
          const iso = toISO(d)
          return (
            <div key={iso} className={`tg-col ${iso === today ? 'today' : ''}`} style={{ height: hours.length * PX, backgroundSize: `100% ${PX}px` }}>
              {layout(eventsFor(iso)).map(({ e, s, f, col, cols }) => (
                <button key={e.id} className={`tg-ev ev ${e.cancelled ? 'cancelled' : ''} ${e.kind === 'exam' ? 'exam' : ''}`}
                  style={{ '--ec': e.color, top: ((s - h0 * 60) * PX) / 60, height: Math.max(((f - s) * PX) / 60 - 2, 22), left: `${(col / cols) * 100}%`, width: `calc(${100 / cols}% - 3px)` }}
                  onClick={() => onEvent(e)}>
                  <b>{e.title}</b>
                  <span>{e.start}–{e.end}</span>
                  {f - s >= 50 && <span>{fmtRoom(e.room)} · {t(`type.${e.type}`)}</span>}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
